const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Shared params builder — PDFs stored as raw with fl_inline for browser viewing
const makeParams = (folder) => async (req, file) => ({
  folder,
  resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
  allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  // fl_inline makes Cloudinary serve PDF with Content-Disposition: inline
  ...(file.mimetype === 'application/pdf' ? { flags: 'inline' } : {}),
});

const docStorage = new CloudinaryStorage({
  cloudinary,
  params: makeParams(`student-management/documents/${'{req.user.regNumber || req.user.id}'}`),
});

// Override with dynamic folder
const docStorageDynamic = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `student-management/documents/${req.user.regNumber || req.user.id}`,
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...(file.mimetype === 'application/pdf' ? { flags: 'inline' } : {}),
  }),
});

const achievementStorageDynamic = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `student-management/achievements/${req.user.regNumber || req.user.id}`,
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...(file.mimetype === 'application/pdf' ? { flags: 'inline' } : {}),
  }),
});

const uploadDoc = multer({ storage: docStorageDynamic, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadAchievement = multer({ storage: achievementStorageDynamic, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { cloudinary, uploadDoc, uploadAchievement };
