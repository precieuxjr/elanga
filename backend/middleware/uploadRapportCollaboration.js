// backend/middleware/uploadRapportCollaboration.js
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
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo par photo
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptees.'));
    }
    cb(null, true);
  }
});

// Deux champs distincts : photo_avant et photo_apres, un seul fichier chacun.
module.exports = upload.fields([
  { name: 'photo_avant', maxCount: 1 },
  { name: 'photo_apres', maxCount: 1 }
]);