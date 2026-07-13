const mysql = require('mysql2/promise');
require('dotenv').config();

// Détermine s'il faut activer SSL (explicite via DB_SSL ou si l'hôte est un proxy Railway)
const isSSLRequired = process.env.DB_SSL === 'true' 
  || process.env.DB_HOST?.includes('proxy.rlwy.net')
  || process.env.DB_HOST?.includes('railway');

// Construction des options de connexion
const poolOptions = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

// Ajout de SSL si nécessaire
if (isSSLRequired) {
  poolOptions.ssl = {
    rejectUnauthorized: false, // Accepte les certificats auto-signés de Railway
  };
}

const pool = mysql.createPool(poolOptions);

module.exports = pool;