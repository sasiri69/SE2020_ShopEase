const config = require("./env.config");
const cloudinary = require("cloudinary").v2;

function isCloudinaryEnabled() {
  return Boolean(
    config.CLOUDINARY_CLOUD_NAME &&
      config.CLOUDINARY_API_KEY &&
      config.CLOUDINARY_API_SECRET,
  );
}

function initCloudinary() {
  if (!isCloudinaryEnabled()) return;

  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
  });
}

module.exports = { cloudinary, isCloudinaryEnabled, initCloudinary };

