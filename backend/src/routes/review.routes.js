const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getUpload } = require("../middleware/upload");
const {
  createReview,
  listReviewsByProduct,
  listMyReviews,
  deleteMyReview,
  updateMyReview,
} = require("../controllers/review.controller");

const router = express.Router();
const upload = getUpload();

router.get("/product/:productId", listReviewsByProduct);

router.use(requireAuth);
router.get("/user", listMyReviews);
router.post("/", upload.array("images", 3), createReview);
router.put("/:id", upload.array("images", 3), updateMyReview);
router.delete("/:id", deleteMyReview);

module.exports = router;

