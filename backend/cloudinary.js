const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const docStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `student-management/documents/${req.user.regNumber || req.user.id}`,
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }),
});

const achievementStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `student-management/achievements/${req.user.regNumber || req.user.id}`,
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }),
});

const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadAchievement = multer({ storage: achievementStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadDoc, uploadAchievement };
