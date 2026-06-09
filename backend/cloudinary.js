const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const docDir = path.join(uploadDir, 'documents');
const achievementDir = path.join(uploadDir, 'achievements');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(docDir)) fs.mkdirSync(docDir);
if (!fs.existsSync(achievementDir)) fs.mkdirSync(achievementDir);

// Configure local disk storage
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, docDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const achievementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, achievementDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure Multer upload instances with 2MB file limit
const uploadDoc = multer({ 
  storage: docStorage, 
  limits: { fileSize: 2 * 1024 * 1024 } 
});

const uploadAchievement = multer({ 
  storage: achievementStorage, 
  limits: { fileSize: 2 * 1024 * 1024 } 
});

// Mock Cloudinary object for route compatibility
const cloudinary = {
  uploader: {
    destroy: async (publicId, options) => {
      // Deletions will be handled natively inside the routes
      return { result: 'ok' };
    }
  }
};

module.exports = { cloudinary, uploadDoc, uploadAchievement };
