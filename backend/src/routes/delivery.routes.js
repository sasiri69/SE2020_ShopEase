const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getUpload } = require("../middleware/upload");
const {
  listDeliveries,
  getDelivery,
  claimDelivery,
  updateDeliveryStatus,
  uploadDeliveryProof,
  deleteDelivery,
  reportDeliveryFailed,
} = require("../controllers/delivery.controller");

const router = express.Router();
const upload = getUpload();

router.use(requireAuth);

router.get("/", requireRole("admin", "delivery", "driver"), listDeliveries);
router.get("/:id", getDelivery);
router.post("/:id/claim", requireRole("driver"), claimDelivery);
router.put("/:id/status", requireRole("admin", "delivery", "driver"), updateDeliveryStatus);
router.post("/:id/fail", requireRole("driver"), reportDeliveryFailed);
router.post("/:id/proof-image", requireRole("admin", "delivery", "driver"), upload.single("proofImage"), uploadDeliveryProof);
router.delete("/:id", requireRole("admin"), deleteDelivery);

module.exports = router;
