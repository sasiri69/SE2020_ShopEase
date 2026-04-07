const mongoose = require("mongoose");
const { z } = require("zod");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { asyncHandler } = require("../utils/asyncHandler");
const { fileToUrl } = require("../middleware/upload");

const createSchema = z.object({
  productId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

async function recalcProductRating(productId) {
  const agg = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = agg.length ? agg[0].avg : 0;
  const count = agg.length ? agg[0].count : 0;
  await Product.findByIdAndUpdate(productId, { averageRating: avg, numReviews: count });
}

const createReview = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);

  const order = await Order.findById(data.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (String(order.userId) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
  if (order.status !== "Delivered") return res.status(400).json({ message: "Reviews allowed only after Delivered" });

  const ordered = order.items.some((it) => String(it.productId) === String(data.productId));
  if (!ordered) return res.status(400).json({ message: "Product not found in this order" });

  const existing = await Review.findOne({ userId: req.user._id, productId: data.productId, orderId: data.orderId });
  if (existing) return res.status(409).json({ message: "You have already reviewed this product for this order." });

  const files = Array.isArray(req.files) ? req.files : [];
  const imageUrls = files.map((f) => fileToUrl(req, f)).filter(Boolean);

  const review = await Review.create({
    productId: data.productId,
    orderId: data.orderId,
    userId: req.user._id,
    rating: data.rating,
    comment: data.comment || "",
    images: imageUrls,
  });

  await recalcProductRating(review.productId);
  res.status(201).json(review);
});

const listReviewsByProduct = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
  res.status(200).json(reviews);
});

const updateMyReview = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  if (String(review.userId) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

  const files = Array.isArray(req.files) ? req.files : [];
  const imageUrls = files.map((f) => fileToUrl(req, f)).filter(Boolean);

  if (imageUrls.length > 0) {
    review.images = imageUrls;
  }
  review.rating = data.rating;
  if (data.comment !== undefined) {
    review.comment = data.comment;
  }
  await review.save();

  await recalcProductRating(review.productId);
  res.status(200).json(review);
});

const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(reviews);
});

const deleteMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found" });
  if (String(review.userId) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const productId = review.productId;
  await review.deleteOne();
  await recalcProductRating(productId);
  res.status(200).json({ ok: true });
});

module.exports = { createReview, listReviewsByProduct, listMyReviews, deleteMyReview, updateMyReview };

