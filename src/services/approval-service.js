function assertNotSelfApproval(req, record, actorFieldNames = ["requested_by", "created_by", "generated_by"]) {
  const user = req.session?.user;
  if (!user) {
    throw new Error("Authentication required");
  }

  if ((user.roles || []).includes("admin")) {
    return;
  }

  for (const fieldName of actorFieldNames) {
    if (record?.[fieldName] && Number(record[fieldName]) === Number(user.id)) {
      const error = new Error("Users cannot approve their own requests unless they are Admin.");
      error.status = 403;
      throw error;
    }
  }
}

module.exports = {
  assertNotSelfApproval,
};
