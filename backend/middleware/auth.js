const crypto = require('crypto');

const COOKIE_NAME = 'fitquality_session';
const sessions = new Map();
let nextSessionSweepAt = 0;
const configuredSessionTtlHours = Number(process.env.SESSION_TTL_HOURS || 12);
const sessionTtlHours = Number.isFinite(configuredSessionTtlHours)
  ? configuredSessionTtlHours
  : 12;
const sessionTtlMs = Math.min(Math.max(sessionTtlHours, 1), 24) * 60 * 60 * 1000;

function getCookieValue(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const prefix = `${name}=`;
  const item = cookieHeader.split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!item) return null;
  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch (error) {
    return null;
  }
}

function removeExpiredSessions(force = false) {
  const now = Date.now();
  if (!force && now < nextSessionSweepAt) return;
  nextSessionSweepAt = now + 60 * 1000;
  for (const [key, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(key);
  }
}

function createSession(user) {
  removeExpiredSessions();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + sessionTtlMs;

  sessions.set(tokenHash, {
    user,
    expiresAt
  });

  return { token, expiresAt };
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = Math.floor(sessionTtlMs / 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
  );
}

function clearSession(req, res) {
  const token = getCookieValue(req, COOKIE_NAME);
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    sessions.delete(tokenHash);
  }

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function getSessionUser(req) {
  removeExpiredSessions();
  const token = getCookieValue(req, COOKIE_NAME);
  if (!token) return null;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = sessions.get(tokenHash);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(tokenHash);
    return null;
  }

  return session.user;
}

function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Sign in is required.' });
  }

  req.authUser = user;
  return next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, error: 'Sign in is required.' });
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({ success: false, error: 'Your account cannot use this feature.' });
    }
    return next();
  };
}

function createRateLimiter({ windowMs, max, message }) {
  const requests = new Map();
  let nextCleanupAt = 0;

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (now >= nextCleanupAt) {
      for (const [address, entry] of requests) {
        if (entry.resetAt <= now) requests.delete(address);
      }
      nextCleanupAt = now + Math.min(windowMs, 60 * 1000);
    }
    const entry = requests.get(key);

    if (!entry || entry.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: message });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
  clearSession,
  createSession,
  getSessionUser,
  requireAuth,
  requireRole,
  setSessionCookie
};
