async function resolveLookupByIdOrName(db, tableName, idValue, nameValue, nameColumn = "name") {
  if (idValue) {
    const row = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [idValue]);
    if (row) {
      return row;
    }
  }

  if (nameValue) {
    return db.get(`SELECT * FROM ${tableName} WHERE LOWER(${nameColumn}) = LOWER(?)`, [nameValue]);
  }

  return null;
}

async function resolvePaymentTerm(db, paymentTermId, paymentTerms) {
  return resolveLookupByIdOrName(db, "payment_terms", paymentTermId, paymentTerms);
}

async function resolveDepartment(db, departmentId, departmentName) {
  return resolveLookupByIdOrName(db, "departments", departmentId, departmentName);
}

async function resolveDeliveryType(db, deliveryTypeId, deliveryTypeNameOrCode) {
  if (deliveryTypeId) {
    const row = await db.get("SELECT * FROM delivery_types WHERE id = ?", [deliveryTypeId]);
    if (row) {
      return row;
    }
  }

  if (deliveryTypeNameOrCode) {
    return (
      (await db.get("SELECT * FROM delivery_types WHERE LOWER(code) = LOWER(?)", [deliveryTypeNameOrCode])) ||
      (await db.get("SELECT * FROM delivery_types WHERE LOWER(name) = LOWER(?)", [deliveryTypeNameOrCode]))
    );
  }

  return null;
}

module.exports = {
  resolveDeliveryType,
  resolveDepartment,
  resolveLookupByIdOrName,
  resolvePaymentTerm,
};
