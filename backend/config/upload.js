const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'signalements');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const suffixe = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${suffixe}${path.extname(file.originalname)}`);
  }
});

function filtrerImages(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Seules les images sont autorisees.'));
  }
  cb(null, true);
}

const uploadPhotoSignalement = multer({
  storage,
  fileFilter: filtrerImages,
  limits: { fileSize: 8 * 1024 * 1024 } // 8 Mo
});

module.exports = { uploadPhotoSignalement, UPLOAD_DIR };
