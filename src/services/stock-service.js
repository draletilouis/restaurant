async function upsertBalance(db, itemId, storeId, quantityDelta) {
  await db.exec(
    `INSERT INTO stock_balances (item_id, store_id, quantity, updated_at)
     VALUES (?, ?, ?, NOW())
     ON CONFLICT (item_id, store_id)
     DO UPDATE SET quantity = stock_balances.quantity + EXCLUDED.quantity,
                   updated_at = NOW()`,
    [itemId, storeId, quantityDelta]
  );
}

async function recordStockMovement(
  db,
  {
    itemId,
    storeId,
    movementType,
    referenceType,
    referenceId,
    quantityIn = 0,
    quantityOut = 0,
    unitCost = 0,
    movementDate,
    notes = null,
  }
) {
  const netQuantity = Number(quantityIn) - Number(quantityOut);
  await db.exec(
    `INSERT INTO stock_ledger (
       item_id, store_id, movement_type, reference_type, reference_id,
       quantity_in, quantity_out, unit_cost, movement_date, notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemId,
      storeId,
      movementType,
      referenceType,
      referenceId || null,
      quantityIn,
      quantityOut,
      unitCost,
      movementDate,
      notes,
    ]
  );
  await upsertBalance(db, itemId, storeId, netQuantity);
}

module.exports = {
  recordStockMovement,
};
