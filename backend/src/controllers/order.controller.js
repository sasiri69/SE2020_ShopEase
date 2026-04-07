const { z } = require("zod");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { asyncHandler } = require("../utils/asyncHandler");

const createSchema = z.object({
  fromCart: z.boolean().optional().default(true),
});

const statusSchema = z.object({
  status: z.enum(["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"]),
});

const createOrder = asyncHandler(async (req, res) => {
  createSchema.parse(req.body || {});

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  const session = await mongoose.startSession();
  let created;
  await session.withTransaction(async () => {
    // Re-check stock, update stock, and create order atomically
    for (const it of cart.items) {
      const product = await Product.findById(it.productId).session(session);
      if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });
      if (product.stockQuantity < it.quantity) {
        throw Object.assign(new Error("Insufficient stock"), { statusCode: 400 });
      }
      product.stockQuantity -= it.quantity;
      await product.save({ session });
    }

    const order = await Order.create(
      [
        {
          userId: req.user._id,
          items: cart.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            priceAtTime: it.priceAtTime,
          })),
          totalAmount: cart.totalAmount,
          status: "Pending",
          cartProofImage: cart.proofImage || undefined,
        },
      ],
      { session },
    );
    created = order[0];

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save({ session });
  });
  await session.endSession();

  res.status(201).json(created);
});

const listOrders = asyncHandler(async (req, res) => {
  // Admins should see ALL orders with customer details.
  if (req.user.role === "admin") {
    const orders = await Order.find({})
      .populate("userId", "name email role")
      .populate("items.productId", "name images")
      .sort({ createdAt: -1 });
    return res.status(200).json(orders);
  }

  // Regular users only see their own orders.
  const orders = await Order.find({ userId: req.user._id })
    .populate("items.productId", "name images")
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("items.productId")
    .populate("paymentId")
    .populate("deliveryId");
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isOwner = String(order.userId) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  res.status(200).json(order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const data = statusSchema.parse(req.body);
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = data.status;
  await order.save();
  res.status(200).json(order);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  
  if (String(order.userId) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await order.deleteOne();
  res.status(200).json({ message: "Order deleted successfully" });
});

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus, cancelOrder };

