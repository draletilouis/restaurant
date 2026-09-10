async function logAudit(db, userId, action, entityType, entityId, details = {}, status = "Success") {
  await db.exec(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, status, details)
     VALUES (?, ?, ?, ?, ?, ?::jsonb)`,
    [userId || null, action, entityType, entityId || null, status, JSON.stringify(details || {})]
  );
}

module.exports = {
  logAudit,
  AuditLogService: {
    log: logAudit,
  },
};
