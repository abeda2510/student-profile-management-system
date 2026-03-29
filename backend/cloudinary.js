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
  params: (req) => ({
    folder: `student-management/documents/${req.user.regNumber}`,
    resource_type: 'auto',
    public_id: `${Date.now()}-${req.file?.originalname?.replace(/\s+/g, '_') || 'file'}`,
  }),
});

const achievementStorage = new CloudinaryStorage({
  cloudinary,
  params: (req) => ({
    folder: `student-management/achievements/${req.user.regNumber}`,
    resource_type: 'auto',
    public_id: `${Date.now()}-${req.file?.originalname?.replace(/\s+/g, '_') || 'file'}`,
  }),
});

const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadAchievement = multer({ storage: achievementStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadDoc, uploadAchievement };
