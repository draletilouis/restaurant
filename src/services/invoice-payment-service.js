const INVOICE_PAYMENT_METHODS = Object.freeze([
  "Cash",
  "Credit",
  "Bank Transfer",
  "Mobile Money",
]);

function httpError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function resolveInvoicePaymentDetails(paymentMethodInput, dueDateInput) {
  const rawMethod = String(paymentMethodInput || "").trim();
  const paymentMethod = rawMethod
    ? INVOICE_PAYMENT_METHODS.find(
        (option) => option.toLowerCase() === rawMethod.toLowerCase(),
      )
    : "Credit";

  if (!paymentMethod) {
    throw httpError(
      `Invoice payment method must be one of: ${INVOICE_PAYMENT_METHODS.join(", ")}.`,
    );
  }

  const dueDate = dueDateInput ? String(dueDateInput).trim() : null;
  if (rawMethod && paymentMethod === "Credit" && !dueDate) {
    throw httpError("A due date is required for credit invoices.");
  }

  return { paymentMethod, dueDate };
}

module.exports = {
  INVOICE_PAYMENT_METHODS,
  resolveInvoicePaymentDetails,
};
