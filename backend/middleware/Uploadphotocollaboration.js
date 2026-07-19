// backend/middleware/uploadPhotoCollaboration.js
//
// Usage : uploadPhotoCollaboration('photo_avant') ou ('photo_apres'),
// en middleware de route. Le fichier est disponible ensuite dans req.file.
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dossier = path.join(__dirname, '../uploads/collaborations');
fs.mkdirSync(dossier, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dossier),
  filename: (req, file, cb) => {
    const suffixe = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${suffixe}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptees.'));
    }
    cb(null, true);
  }
});

module.exports = function uploadPhotoCollaboration(nomChamp) {
  return upload.single(nomChamp);
};