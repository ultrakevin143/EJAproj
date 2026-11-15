const crypto = require('crypto');
const { query } = require('../db/neon');

async function appendAuditEvent(user, action, entityType, entityId = '', details = '', execute = query) {
  await execute(
    `INSERT INTO audit_events (id, actor_id, actor_role, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      crypto.randomUUID(),
      user?.id || 'system',
      user?.role || 'SYSTEM',
      action,
      entityType,
      String(entityId || ''),
      String(details || '').slice(0, 500)
    ]
  );
}

module.exports = { appendAuditEvent };
