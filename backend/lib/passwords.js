const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 1024) {
    return null;
  }

  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function parsePasswordHash(value) {
  if (typeof value !== 'string') return null;
  const parts = value.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return null;
  try {
    const salt = Buffer.from(parts[1], 'base64url');
    const hash = Buffer.from(parts[2], 'base64url');
    if (salt.length !== 16 || hash.length !== KEY_LENGTH) return null;
    return { salt, hash };
  } catch (error) {
    return null;
  }
}

function verifyPassword(password, encodedHash) {
  const passwordRecord = parsePasswordHash(encodedHash);
  if (typeof password !== 'string' || !passwordRecord) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, passwordRecord.salt, passwordRecord.hash.length, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(crypto.timingSafeEqual(passwordRecord.hash, derivedKey));
    });
  });
}

module.exports = { hashPassword, parsePasswordHash, verifyPassword };
