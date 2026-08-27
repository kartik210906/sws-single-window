const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create the upload directory path
const uploadDir = path.join(__dirname, '../../uploads');

// Synchronously ensure the uploads directory exists on boot
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a secure unique filename to prevent collisions and overwrite attacks
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
  }
});

// Configure Multer limits and filters
const upload = multer({
  storage: storage,
  limits: {
    // 15MB global size limit per file as a protective barrier
    fileSize: 15 * 1024 * 1024 
  }
});

module.exports = upload;
