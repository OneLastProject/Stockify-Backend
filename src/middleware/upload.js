const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Image upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/image");
  },
  filename: (req, file, cb) => {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    cb(null, `${Date.now()}-${originalName}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg, jpg, png, and webp images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

fs.mkdirSync("uploads/image", { recursive: true });

// CSV upload config
fs.mkdirSync("uploads/csv", { recursive: true });

const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/csv/");
  },
  filename: (_req, file, cb) => {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    cb(null, `${Date.now()}-${originalName}${path.extname(file.originalname)}`);
  },
});

const csvFileFilter = (_req, file, cb) => {
  const isValid = path.extname(file.originalname).toLowerCase() === ".csv";
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"));
  }
};

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { upload, uploadCSV };
