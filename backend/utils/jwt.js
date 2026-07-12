const jwt = require('jsonwebtoken');
require('dotenv').config();

function genererToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function verifierToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { genererToken, verifierToken };
