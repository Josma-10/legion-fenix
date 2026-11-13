const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'legion_fenix_uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'mp4', 'mov', 'webm', 'm4v', 'webp'],
      resource_type: 'auto',
    },
  });
} else {
  // Respaldo automático en disco local para entorno de desarrollo sin llaves Cloudinary
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const cleanExt = path.extname(file.originalname) || '.bin';
      cb(null, `fenix-${uniqueSuffix}${cleanExt.toLowerCase()}`);
    },
  });
}

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mov', '.webm', '.m4v', '.webp']);

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const uploadCloud = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB máximo (videos móviles/comprobantes)
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowedExtensions.has(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Formato no permitido. Usa JPG, PNG, WEBP, PDF, MP4, MOV o WEBM.'));
  },
});

const getUploadedFileUrl = (req, file) => {
  if (!file) return null;
  if (hasCloudinaryCredentials && file.path) {
    return file.path;
  }
  const host = req.get('host');
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}/uploads/${file.filename}`;
};

const safeRemoveLocalUpload = (file) => {
  try {
    if (!hasCloudinaryCredentials && file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch {
    // Ignorar error de limpieza no bloqueante
  }
};

module.exports = {
  cloudinary,
  uploadCloud,
  hasCloudinaryCredentials,
  getUploadedFileUrl,
  safeRemoveLocalUpload,
  uploadsDir,
};
