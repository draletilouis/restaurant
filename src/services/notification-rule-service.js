async function listActiveNotificationRules(db) {
  return db.all(
    `SELECT *
     FROM notification_rules
     WHERE is_active = TRUE
     ORDER BY rule_name ASC`
  );
}

module.exports = {
  listActiveNotificationRules,
};
