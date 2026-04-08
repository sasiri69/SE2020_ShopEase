const { z } = require("zod");
const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const { asyncHandler } = require("../utils/asyncHandler");
const { fileToUrl } = require("../middleware/upload");

const statusSchema = z.object({
  status: z.enum(["Pending", "InTransit", "Delivered", "Failed"]),
});

const failureSchema = z.object({
  reason: z.string().min(3, "Please provide a reason (at least 3 characters)."),
});

// List deliveries – admins see all, drivers see their own + unassigned
const listDeliveries = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === "driver") {
    // Drivers see deliveries assigned to them OR unassigned (so they can claim)
    // ONLY IF the order status is NOT "Pending" (approved)
    const activeOrders = await Order.find({ status: { $ne: "Pending" } }).select("_id");
    const activeOrderIds = activeOrders.map((o) => o._id);
    
    filter = {
      orderId: { $in: activeOrderIds },
      status: { $ne: "Delivered" }, // Drivers cannot see or pick up already-delivered orders
      $or: [{ driverId: req.user._id }, { driverId: null }],
    };
  }

  const deliveries = await Delivery.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: "orderId",
      populate: [
        { path: "userId", select: "name email" },
        { path: "items.productId", select: "name price images" },
      ],
    })
    .populate("driverId", "name email");

  res.status(200).json(deliveries);
});

// Get single delivery with full order details
const getDelivery = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id)
    .populate({
      path: "orderId",
      populate: [
        { path: "userId", select: "name email" },
        { path: "items.productId", select: "name price images" },
      ],
    })
    .populate("driverId", "name email");

  if (!delivery) return res.status(404).json({ message: "Delivery not found" });

  const order = delivery.orderId;
  if (!order) return res.status(404).json({ message: "Order not found for this delivery" });

  // Check access: owner, admin, or assigned driver
  const isOwner = String(order.userId?._id || order.userId) === String(req.user._id);
  const isAssignedDriver =
    delivery.driverId && String(delivery.driverId._id || delivery.driverId) === String(req.user._id);

  if (!isOwner && req.user.role !== "admin" && req.user.role !== "delivery" && !isAssignedDriver) {
    // Allow drivers to view unassigned deliveries too
    if (req.user.role !== "driver") {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  res.status(200).json(delivery);
});

// Driver claims an unassigned delivery
const claimDelivery = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });

  // Cannot claim a delivery that is already completed
  if (delivery.status === "Delivered") {
    return res.status(400).json({ message: "This delivery has already been completed and cannot be claimed." });
  }

  if (delivery.driverId && String(delivery.driverId) !== String(req.user._id)) {
    return res.status(409).json({ message: "This delivery is already assigned to another driver" });
  }

  const order = await Order.findById(delivery.orderId);
  if (!order || order.status === "Pending") {
    return res.status(400).json({ message: "This order is waiting for admin approval." });
  }

  delivery.driverId = req.user._id;
  await delivery.save();

  // Re-fetch with population
  const populated = await Delivery.findById(delivery._id)
    .populate({
      path: "orderId",
      populate: [
        { path: "userId", select: "name email" },
        { path: "items.productId", select: "name price images" },
      ],
    })
    .populate("driverId", "name email");

  res.status(200).json(populated);
});

// Update delivery status
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const data = statusSchema.parse(req.body);
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });

  // Admins and assigned drivers can update delivery status
  if (req.user.role === "driver") {
    if (!delivery.driverId || String(delivery.driverId) !== String(req.user._id)) {
      return res.status(403).json({ message: "You must claim this delivery first" });
    }
  } else if (req.user.role !== "admin" && req.user.role !== "delivery") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const order = await Order.findById(delivery.orderId);
  if (!order || order.status === "Pending") {
    return res.status(400).json({ message: "Cannot update delivery for unapproved orders." });
  }

  // Prevent rolling back from a terminal state — once delivered or failed it's final
  if (delivery.status === "Delivered") {
    return res.status(400).json({ message: "Delivery is already marked as Delivered and cannot be changed." });
  }
  if (delivery.status === "Failed") {
    return res.status(400).json({ message: "Delivery is already marked as Failed. Contact admin to reassign." });
  }

  delivery.status = data.status;
  if (data.status === "Delivered") {
    delivery.deliveredAt = new Date();
  }
  await delivery.save();

  if (order && data.status === "Delivered") {
    order.status = "Delivered";
    await order.save();
  } else if (order && data.status === "InTransit") {
    order.status = "Shipped";
    await order.save();
  }

  // Return populated delivery
  const populated = await Delivery.findById(delivery._id)
    .populate({
      path: "orderId",
      populate: [
        { path: "userId", select: "name email" },
        { path: "items.productId", select: "name price images" },
      ],
    })
    .populate("driverId", "name email");

  res.status(200).json(populated);
});

// Upload delivery proof image
const uploadDeliveryProof = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });

  // Only assigned drivers can upload proof
  if (req.user.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can upload proof images" });
  }
  if (!delivery.driverId || String(delivery.driverId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You must claim this delivery first" });
  }

  if (delivery.status !== "Delivered") {
    return res.status(400).json({ message: "Confirmation image can be uploaded only after status is Delivered" });
  }

  const url = fileToUrl(req, req.file);
  if (!url) return res.status(400).json({ message: "No image uploaded" });

  delivery.proofImage = url;
  await delivery.save();

  const populated = await Delivery.findById(delivery._id)
    .populate({
      path: "orderId",
      populate: [
        { path: "userId", select: "name email" },
        { path: "items.productId", select: "name price images" },
      ],
    })
    .populate("driverId", "name email");

  res.status(200).json(populated);
});

// Delete delivery record (only when Delivered)
const deleteDelivery = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });

  if (delivery.status !== "Delivered") {
    return res.status(400).json({ message: "Only delivered records can be deleted" });
  }

  // Only admins can delete delivery records.
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Delivery.deleteOne({ _id: delivery._id });
  res.status(200).json({ message: "Delivery record deleted" });
});

// Driver reports a delivery failure with a reason
const reportDeliveryFailed = asyncHandler(async (req, res) => {
  const data = failureSchema.parse(req.body);
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ message: "Delivery not found" });

  // Only the assigned driver can report failure
  if (req.user.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can report delivery failure" });
  }
  if (!delivery.driverId || String(delivery.driverId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You must be the assigned driver to report failure" });
  }

  if (delivery.status === "Delivered") {
    return res.status(400).json({ message: "Cannot mark a delivered delivery as failed." });
  }
  if (delivery.status === "Failed") {
    return res.status(400).json({ message: "Delivery is already marked as Failed." });
  }

  delivery.status = "Failed";
  delivery.failureReason = data.reason;
  await delivery.save();

  const populated = await Delivery.findById(delivery._id)
    .populate({
      path: "orderId",
      populate: [
        { path: "userId", select: "name email" },
        { path: "items.productId", select: "name price images" },
      ],
    })
    .populate("driverId", "name email");

  res.status(200).json(populated);
});

module.exports = { listDeliveries, getDelivery, claimDelivery, updateDeliveryStatus, uploadDeliveryProof, deleteDelivery, reportDeliveryFailed };
