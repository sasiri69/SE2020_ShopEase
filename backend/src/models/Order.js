const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtTime: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery" },
    cartProofImage: { type: String },   // Cart proof image uploaded by user before checkout
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", OrderSchema);

