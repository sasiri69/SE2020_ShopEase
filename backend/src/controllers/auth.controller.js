const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const config = require("../config/env.config");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["user", "admin", "delivery", "driver"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional(),
});

const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: data.email });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role || "user",
  });

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: String(user._id), role: user.role },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.status(200).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const data = updateMeSchema.parse(req.body);
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ email: data.email });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(409).json({ message: "Email already registered" });
    }
    user.email = data.email;
  }

  if (data.name) user.name = data.name;

  if (data.newPassword) {
    if (!data.currentPassword) {
      return res.status(400).json({ message: "currentPassword is required to change password" });
    }
    const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });
    user.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  await user.save();
  res.status(200).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

module.exports = { register, login, getMe, updateMe };

