function requireAuth(req, res, next) {
  if (!req.session?.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.session?.user?.roles || [];
    if (!roles.some((role) => allowedRoles.includes(role))) {
      res.status(403).json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
}

function requirePermission(...allowedPermissions) {
  return (req, res, next) => {
    const user = req.session?.user;
    const permissions = user?.permissions || [];
    const isAdmin = (user?.roles || []).includes("admin");
    if (isAdmin || allowedPermissions.some((permission) => permissions.includes(permission))) {
      next();
      return;
    }
    res.status(403).json({ success: false, message: "Insufficient permissions" });
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
};
