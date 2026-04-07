const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function getEnv(key, defaultValue = undefined) {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

module.exports = {
  PORT: parseInt(getEnv("PORT", "5000"), 10),
  MONGODB_URI: getEnv("MONGODB_URI"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  CORS_ORIGIN: getEnv("CORS_ORIGIN", "*"),
  DNS_SERVERS: getEnv("DNS_SERVERS", ""),
  PUBLIC_BASE_URL: getEnv("PUBLIC_BASE_URL", "http://localhost:5000"),
  CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY"),
};
