const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema(
  {
    proofImage: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    address: { type: String, required: true },
    trackingNumber: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "InTransit", "Delivered", "Failed"], default: "Pending" },
    estimatedDate: { type: Date },
    deliveredAt: { type: Date },
    failureReason: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Delivery", DeliverySchema);

