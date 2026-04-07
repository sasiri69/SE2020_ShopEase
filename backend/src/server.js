const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dns = require("dns");
const config = require("./config/env.config");

const { connectDb } = require("./config/db");
const { notFoundHandler, errorHandler } = require("./middleware/error");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const reviewRoutes = require("./routes/review.routes");
const savedCardRoutes = require("./routes/savedCard.routes");

if (config.DNS_SERVERS) {
  const servers = config.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean);
  if (servers.length) dns.setServers(servers);
}

const app = express();

app.use(
  cors({
    origin: config.CORS_ORIGIN === "*" ? "*" : config.CORS_ORIGIN.split(","),
    credentials: false,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Local uploads fallback (served as static files when CLOUDINARY not used)
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, service: "shopease-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/saved-cards", savedCardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDb(config.MONGODB_URI);
  app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${config.PORT} (mode: ${config.NODE_ENV})`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
