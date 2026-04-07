const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/order.controller");

const router = express.Router();

router.use(requireAuth);

router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.delete("/:id", cancelOrder);

router.put("/:id/status", requireRole("admin"), updateOrderStatus);

module.exports = router;

