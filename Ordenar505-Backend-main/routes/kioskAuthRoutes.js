const express = require("express");
const router = express.Router();
const db = require("../config/database");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

// Lista de perfiles SOLO meseros visibles (kiosk_enabled=1)
router.get("/kiosk/waiters", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, name, role, avatar_url
         FROM users
        WHERE kiosk_enabled = 1 AND role IN ('waiter','mesero')
        ORDER BY name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// Login 1-tap (sin PIN)
router.post("/kiosk/waiter-login", async (req, res, next) => {
  try {
    console.log("[kiosk-login] body:", JSON.stringify(req.body));
    console.log("[kiosk-login] jwtSecret set:", !!config.jwtSecret);
    const { user_id } = req.body;
    console.log("[kiosk-login] user_id:", user_id, typeof user_id);

    const [rows] = await db.execute(
      `SELECT id, name, role, kiosk_enabled
         FROM users
        WHERE id = ? AND role IN ('waiter','mesero')
        LIMIT 1`,
      [user_id]
    );
    const u = rows[0];
    console.log("[kiosk-login] user found:", JSON.stringify(u));
    if (!u || !u.kiosk_enabled) {
      return res.status(403).json({ success:false, message:"No permitido" });
    }

    const token = jwt.sign(
      { id: u.id, role: u.role, kiosk: true },
      config.jwtSecret, // o config.accessTokenSecret si así lo dejaste
      { expiresIn: "12h" }
    );

    console.log("[kiosk-login] token generated OK");

    // 👇 Update tolerante
    try {
      await db.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [u.id]);
    } catch (e) {
      console.log("[kiosk-login] UPDATE error code:", e?.code, e?.message);
      if (e && e.code !== "ER_BAD_FIELD_ERROR") throw e;
    }

    console.log("[kiosk-login] sending success response");
    res.json({ success:true, data:{ token, user:{ id:u.id, name:u.name, role:u.role } }});
  } catch (e) { next(e); }
});


module.exports = router;
