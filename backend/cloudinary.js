const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store everything as image — Cloudinary auto-converts PDF to image (first page preview)
// This avoids all CORS issues with raw files
const docStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `student-management/documents/${req.user.regNumber || req.user.id}`,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    format: file.mimetype === 'application/pdf' ? 'jpg' : undefined,
  }),
});

const achievementStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `student-management/achievements/${req.user.regNumber || req.user.id}`,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    format: file.mimetype === 'application/pdf' ? 'jpg' : undefined,
  }),
});

const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadAchievement = multer({ storage: achievementStorage, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { cloudinary, uploadDoc, uploadAchievement };
