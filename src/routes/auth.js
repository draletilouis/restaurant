const express = require("express");
const bcrypt = require("bcrypt");

const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("../services/audit-service");
const { getUserWithAccess } = require("../services/system-service");

async function validateRoles(db, roleCodes) {
  if (!Array.isArray(roleCodes) || !roleCodes.length || roleCodes.some((code) => typeof code !== "string" || !code.trim())) {
    const error = new Error("Select at least one valid role.");
    error.status = 400;
    throw error;
  }
  const codes = [...new Set(roleCodes.map((code) => code.trim()))];
  const roles = await db.all("SELECT id, code FROM roles WHERE code = ANY(?::varchar[])", [codes]);
  if (roles.length !== codes.length) {
    const error = new Error("One or more selected roles do not exist.");
    error.status = 400;
    throw error;
  }
  return roles;
}

function createAuthRoutes(db) {
  const router = express.Router();

  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const user = await db.get("SELECT * FROM users WHERE username = ? AND is_active = TRUE", [username]);
      if (!user) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
      }

      const isValid = await bcrypt.compare(password || "", user.password_hash);
      if (!isValid) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
      }

      const sessionUser = await getUserWithAccess(db, user.id);
      req.session.user = sessionUser;
      await logAudit(db, user.id, "login", "session", user.id, { username: user.username });
      res.json({ success: true, user: sessionUser });
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", requireAuth, async (req, res, next) => {
    const actorId = req.session?.user?.id || null;
    req.session.destroy(async (error) => {
      if (error) {
        next(error);
        return;
      }

      try {
        await logAudit(db, actorId, "logout", "session", actorId, {});
        res.json({ success: true });
      } catch (auditError) {
        next(auditError);
      }
    });
  });

  router.get("/me", (req, res) => {
    res.json({ success: true, user: req.session.user || null });
  });

  router.get("/roles", requireAuth, async (req, res, next) => {
    try {
      const roles = await db.all(
        `SELECT r.*, COALESCE(COUNT(ur.id), 0)::int AS user_count
         FROM roles r
         LEFT JOIN user_roles ur ON ur.role_id = r.id
         GROUP BY r.id
         ORDER BY r.name`
      );
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  });

  router.get("/permissions", requireAuth, async (req, res, next) => {
    try {
      const permissions = await db.all("SELECT * FROM permissions ORDER BY module_name, name");
      res.json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  });

  router.get("/users", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const users = await db.all(
        `SELECT u.id, u.full_name, u.username, u.email, u.is_active, u.created_at,
                COALESCE(ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), ARRAY[]::VARCHAR[]) AS roles
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         GROUP BY u.id
         ORDER BY u.full_name`
      );
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  });

  router.post("/users", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { fullName, username, email, password, roleCodes = [] } = req.body;
      if (!fullName || !username || !password) {
        res.status(400).json({ success: false, message: "Full name, username, and password are required." });
        return;
      }

      const createdUser = await db.transaction(async (tx) => {
        const roles = await validateRoles(tx, roleCodes);
        const passwordHash = await bcrypt.hash(password, 10);
        const insertResult = await tx.exec(
          `INSERT INTO users (full_name, username, email, password_hash)
           VALUES (?, ?, ?, ?)
           RETURNING id`,
          [fullName, username, email || null, passwordHash]
        );

        for (const role of roles) {
          await tx.exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [insertResult.rows[0].id, role.id]);
        }
        await logAudit(tx, req.session.user.id, "create", "user", insertResult.rows[0].id, {
          username, roleCodes: roles.map((role) => role.code),
        });
        return insertResult.rows[0];
      });

      const responseUser = await getUserWithAccess(db, createdUser.id);
      res.status(201).json({ success: true, data: responseUser });
    } catch (error) {
      next(error);
    }
  });

  router.put("/users/:id/roles", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(400).json({ success: false, message: "Invalid user ID." });
      }
      const user = await db.transaction(async (tx) => {
        const roles = await validateRoles(tx, req.body.roleCodes);
        await tx.exec("LOCK TABLE user_roles IN SHARE ROW EXCLUSIVE MODE");
        const previous = await getUserWithAccess(tx, userId);
        if (!previous) {
          const error = new Error("User not found.");
          error.status = 404;
          throw error;
        }
        const codes = roles.map((role) => role.code);
        if (previous.isActive && previous.roles.includes("admin") && !codes.includes("admin")) {
          const otherAdmin = await tx.get(
            "SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE u.is_active = TRUE AND r.code = 'admin' AND u.id <> ? LIMIT 1", [userId]
          );
          if (!otherAdmin) {
            const error = new Error("Keep at least one active Admin user.");
            error.status = 400;
            throw error;
          }
        }
        await tx.exec("DELETE FROM user_roles WHERE user_id = ?", [userId]);
        for (const role of roles) {
          await tx.exec("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [userId, role.id]);
        }
        await logAudit(tx, req.session.user.id, "update", "user", userId, {
          previousRoleCodes: previous.roles, roleCodes: codes,
        });
        return getUserWithAccess(tx, userId);
      });
      if (req.session.user.id === userId) req.session.user = user;
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  });

  return router;
}

module.exports = createAuthRoutes;
