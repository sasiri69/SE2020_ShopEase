function notFoundHandler(req, res, next) {
  res.status(404).json({ message: "Route not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isZod =
    err &&
    (err.name === "ZodError" || (typeof err.issues !== "undefined" && Array.isArray(err.issues)));

  const status =
    isZod
      ? 400
      : err.statusCode && Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;

  const message = isZod ? "Validation error" : err.message || "Server error";

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    message,
    ...(isZod ? { issues: err.issues } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };

