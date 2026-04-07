const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const config = require("../config/env.config");

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = await User.findById(payload.sub).select("_id name email role");
  if (!user) return res.status(401).json({ message: "User not found" });

  req.user = user;
  next();
});

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

module.exports = { requireAuth, requireRole };

