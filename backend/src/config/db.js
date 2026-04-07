const mongoose = require("mongoose");

async function connectDb(mongoUri) {
  if (!mongoUri) {
    throw Object.assign(new Error("Missing MONGODB_URI"), { statusCode: 500 });
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
}

module.exports = { connectDb };

