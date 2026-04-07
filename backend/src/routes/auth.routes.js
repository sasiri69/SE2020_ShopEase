const express = require("express");
const { register, login, getMe, updateMe } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);

module.exports = router;

