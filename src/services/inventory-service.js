async function getInventoryBalance(tx, productId, storeLocationId) {
  const balance = await tx.get(
    `SELECT *
     FROM inventory_balances
     WHERE product_id = ? AND store_location_id = ?`,
    [productId, storeLocationId]
  );

  if (balance) {
    return tx.get(
      `SELECT *
       FROM inventory_balances
       WHERE id = ?
       FOR UPDATE`,
      [balance.id]
    );
  }

  await tx.exec(
    `INSERT INTO inventory_balances (product_id, store_location_id, quantity_on_hand, stock_value)
     VALUES (?, ?, 0, 0)
     ON CONFLICT (product_id, store_location_id) DO NOTHING`,
    [productId, storeLocationId]
  );

  return tx.get(
    `SELECT *
     FROM inventory_balances
     WHERE product_id = ? AND store_location_id = ?
     FOR UPDATE`,
    [productId, storeLocationId]
  );
}

async function updateInventoryBalance(tx, productId, storeLocationId, quantityDelta, valueDelta) {
  const current = await getInventoryBalance(tx, productId, storeLocationId);
  const nextQuantity = Number(current.quantity_on_hand || 0) + Number(quantityDelta || 0);
  const nextValue = Number(current.stock_value || 0) + Number(valueDelta || 0);

  if (nextQuantity < -0.0001) {
    const error = new Error("Insufficient stock for this operation.");
    error.status = 400;
    throw error;
  }

  const result = await tx.exec(
    `UPDATE inventory_balances
     SET quantity_on_hand = ?, stock_value = ?, updated_at = NOW()
     WHERE id = ?
     RETURNING *`,
    [Math.max(nextQuantity, 0), Math.max(nextValue, 0), current.id]
  );
  return result.rows[0];
}

async function recordStockMovement(tx, payload) {
  const {
    productId,
    storeLocationId,
    stockBatchId = null,
    movementType,
    referenceType,
    referenceId = null,
    quantityIn = 0,
    quantityOut = 0,
    unitCost = 0,
    movementDate,
    notes = null,
    createdBy = null,
  } = payload;

  const quantityDelta = Number(quantityIn || 0) - Number(quantityOut || 0);
  const valueDelta = Number(quantityIn || 0) * Number(unitCost || 0) - Number(quantityOut || 0) * Number(unitCost || 0);
  const balance = await updateInventoryBalance(tx, productId, storeLocationId, quantityDelta, valueDelta);

  const result = await tx.exec(
    `INSERT INTO stock_movements
       (product_id, store_location_id, stock_batch_id, movement_type, reference_type, reference_id, quantity_in, quantity_out, unit_cost, balance_after, movement_date, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      productId,
      storeLocationId,
      stockBatchId,
      movementType,
      referenceType,
      referenceId,
      quantityIn,
      quantityOut,
      unitCost,
      balance.quantity_on_hand,
      movementDate,
      notes,
      createdBy,
    ]
  );

  return {
    movement: result.rows[0],
    balance,
  };
}

async function createStockBatch(tx, payload) {
  const result = await tx.exec(
    `INSERT INTO stock_batches
       (product_id, store_location_id, supplier_id, goods_received_note_id, batch_number, expiry_date, quantity_received, quantity_remaining, unit_cost, received_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      payload.productId,
      payload.storeLocationId,
      payload.supplierId || null,
      payload.goodsReceivedNoteId || null,
      payload.batchNumber,
      payload.expiryDate || null,
      payload.quantityReceived,
      payload.quantityReceived,
      payload.unitCost || 0,
      payload.receivedAt,
    ]
  );
  return result.rows[0];
}

async function allocateFromBatches(tx, payload) {
  const { productId, storeLocationId, quantityNeeded } = payload;
  let remaining = Number(quantityNeeded || 0);
  const allocations = [];

  const batches = await tx.all(
    `SELECT *
     FROM stock_batches
     WHERE product_id = ? AND store_location_id = ? AND quantity_remaining > 0
     ORDER BY expiry_date NULLS LAST, created_at ASC
     FOR UPDATE`,
    [productId, storeLocationId]
  );

  for (const batch of batches) {
    if (remaining <= 0) {
      break;
    }

    const available = Number(batch.quantity_remaining || 0);
    if (available <= 0) {
      continue;
    }

    const quantityUsed = Math.min(available, remaining);
    remaining -= quantityUsed;

    await tx.exec(
      `UPDATE stock_batches
       SET quantity_remaining = ?
       WHERE id = ?`,
      [available - quantityUsed, batch.id]
    );

    allocations.push({
      batchId: batch.id,
      quantity: quantityUsed,
      unitCost: Number(batch.unit_cost || 0),
      batchNumber: batch.batch_number,
    });
  }

  if (remaining > 0.0001) {
    const error = new Error("Not enough batch stock available for this issue.");
    error.status = 400;
    throw error;
  }

  return allocations;
}

async function receiveGoodsIntoInventory(tx, payload) {
  const stockBatch = await createStockBatch(tx, {
    productId: payload.productId,
    storeLocationId: payload.storeLocationId,
    supplierId: payload.supplierId,
    goodsReceivedNoteId: payload.goodsReceivedNoteId,
    batchNumber: payload.batchNumber,
    expiryDate: payload.expiryDate,
    quantityReceived: payload.quantityReceived,
    unitCost: payload.unitCost,
    receivedAt: payload.receivedAt,
  });

  await recordStockMovement(tx, {
    productId: payload.productId,
    storeLocationId: payload.storeLocationId,
    stockBatchId: stockBatch.id,
    movementType: "Goods Received",
    referenceType: "GoodsReceivedNote",
    referenceId: payload.goodsReceivedNoteId,
    quantityIn: payload.quantityReceived,
    quantityOut: 0,
    unitCost: payload.unitCost,
    movementDate: payload.receivedAt,
    notes: payload.notes,
    createdBy: payload.createdBy,
  });

  return stockBatch;
}

async function issueStockFromInventory(tx, payload) {
  const allocations = await allocateFromBatches(tx, {
    productId: payload.productId,
    storeLocationId: payload.storeLocationId,
    quantityNeeded: payload.quantity,
  });

  for (const allocation of allocations) {
    await recordStockMovement(tx, {
      productId: payload.productId,
      storeLocationId: payload.storeLocationId,
      stockBatchId: allocation.batchId,
      movementType: payload.movementType || "Store Issue",
      referenceType: payload.referenceType,
      referenceId: payload.referenceId,
      quantityIn: 0,
      quantityOut: allocation.quantity,
      unitCost: allocation.unitCost,
      movementDate: payload.movementDate,
      notes: payload.notes,
      createdBy: payload.createdBy,
    });
  }

  return allocations;
}

async function returnStockToInventory(tx, payload) {
  const stockBatch = await createStockBatch(tx, {
    productId: payload.productId,
    storeLocationId: payload.storeLocationId,
    supplierId: null,
    goodsReceivedNoteId: null,
    batchNumber: payload.batchNumber,
    expiryDate: payload.expiryDate,
    quantityReceived: payload.quantity,
    unitCost: payload.unitCost,
    receivedAt: payload.returnDate,
  });

  await recordStockMovement(tx, {
    productId: payload.productId,
    storeLocationId: payload.storeLocationId,
    stockBatchId: stockBatch.id,
    movementType: payload.movementType || "Return to Store",
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    quantityIn: payload.quantity,
    quantityOut: 0,
    unitCost: payload.unitCost,
    movementDate: payload.returnDate,
    notes: payload.notes,
    createdBy: payload.createdBy,
  });

  return stockBatch;
}

async function applyStockAdjustment(tx, payload) {
  const quantityDelta = Number(payload.quantityDelta || 0);
  if (quantityDelta >= 0) {
    await returnStockToInventory(tx, {
      productId: payload.productId,
      storeLocationId: payload.storeLocationId,
      quantity: quantityDelta,
      unitCost: payload.unitCost,
      batchNumber: payload.batchNumber,
      expiryDate: payload.expiryDate || null,
      returnDate: payload.adjustmentDate,
      referenceType: "StockAdjustment",
      referenceId: payload.referenceId,
      movementType: "Stock Adjustment",
      notes: payload.notes,
      createdBy: payload.createdBy,
    });
    return;
  }

  await issueStockFromInventory(tx, {
    productId: payload.productId,
    storeLocationId: payload.storeLocationId,
    quantity: Math.abs(quantityDelta),
    referenceType: "StockAdjustment",
    referenceId: payload.referenceId,
    movementType: "Stock Adjustment",
    movementDate: payload.adjustmentDate,
    notes: payload.notes,
    createdBy: payload.createdBy,
  });
}

async function transferStockBetweenStores(tx, payload) {
  const sourceStoreLocationId = Number(payload.sourceStoreLocationId);
  const destinationStoreLocationId = Number(payload.destinationStoreLocationId);
  const quantity = Number(payload.quantity || 0);

  if (!sourceStoreLocationId || !destinationStoreLocationId || sourceStoreLocationId === destinationStoreLocationId) {
    const error = new Error("Source and destination stores must be different.");
    error.status = 400;
    throw error;
  }

  if (!(quantity > 0)) {
    const error = new Error("Transfer quantity must be greater than zero.");
    error.status = 400;
    throw error;
  }

  const allocations = await allocateFromBatches(tx, {
    productId: payload.productId,
    storeLocationId: sourceStoreLocationId,
    quantityNeeded: quantity,
  });

  for (const allocation of allocations) {
    await recordStockMovement(tx, {
      productId: payload.productId,
      storeLocationId: sourceStoreLocationId,
      stockBatchId: allocation.batchId,
      movementType: payload.movementType || "Transfer",
      referenceType: payload.referenceType || "StoreIssue",
      referenceId: payload.referenceId,
      quantityIn: 0,
      quantityOut: allocation.quantity,
      unitCost: allocation.unitCost,
      movementDate: payload.movementDate,
      notes: payload.notes,
      createdBy: payload.createdBy,
    });

    const destinationBatch = await createStockBatch(tx, {
      productId: payload.productId,
      storeLocationId: destinationStoreLocationId,
      supplierId: null,
      goodsReceivedNoteId: null,
      batchNumber: `${allocation.batchNumber || "TRANSFER"}-${payload.referenceId || Date.now()}`,
      expiryDate: payload.expiryDate || null,
      quantityReceived: allocation.quantity,
      unitCost: allocation.unitCost,
      receivedAt: payload.movementDate,
    });

    await recordStockMovement(tx, {
      productId: payload.productId,
      storeLocationId: destinationStoreLocationId,
      stockBatchId: destinationBatch.id,
      movementType: payload.movementType || "Transfer",
      referenceType: payload.referenceType || "StoreIssue",
      referenceId: payload.referenceId,
      quantityIn: allocation.quantity,
      quantityOut: 0,
      unitCost: allocation.unitCost,
      movementDate: payload.movementDate,
      notes: payload.notes,
      createdBy: payload.createdBy,
    });
  }

  return allocations;
}

module.exports = {
  applyStockAdjustment,
  getInventoryBalance,
  issueStockFromInventory,
  receiveGoodsIntoInventory,
  recordStockMovement,
  returnStockToInventory,
  transferStockBetweenStores,
};
