const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const config = require("../config/env.config");
const { cloudinary, initCloudinary, isCloudinaryEnabled } = require("../config/cloudinary");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(Object.assign(new Error("Only JPG/PNG images are allowed"), { statusCode: 400 }));
  }
  cb(null, true);
}

function makeLocalUpload(destFolder) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destFolder),
    filename: (req, file, cb) => {
      const safeExt = path.extname(file.originalname).toLowerCase() || ".jpg";
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}${safeExt}`);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });
}

function makeCloudinaryUpload(folder) {
  initCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder,
      resource_type: "image",
      format: "jpg",
    }),
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });
}

function getUpload() {
  if (isCloudinaryEnabled()) {
    return makeCloudinaryUpload("shopease");
  }
  return makeLocalUpload("uploads");
}

function fileToUrl(req, file) {
  if (!file) return null;
  if (file.path && typeof file.path === "string" && file.path.startsWith("http")) {
    return file.path; // cloudinary
  }
  const base = config.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${file.filename}`;
}

module.exports = { getUpload, fileToUrl };

