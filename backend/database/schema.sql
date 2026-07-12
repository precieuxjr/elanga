-- ============================================================
-- EcoKin - Schema MySQL genere depuis le diagramme de classe
-- (Pays -> Province -> Ville -> Commune -> Coordonnees, Utilisateur
--  -> Contributeur/Administrateur, Signalement, TypeSignalement, Photo)
-- ============================================================

CREATE DATABASE IF NOT EXISTS elanga CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elanga;

-- Hierarchie geographique (relation "etre" 1,1 - 0..*)
CREATE TABLE pays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  pays_id INT NOT NULL,
  FOREIGN KEY (pays_id) REFERENCES pays(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE villes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  province_id INT NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE communes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  ville_id INT NOT NULL,
  FOREIGN KEY (ville_id) REFERENCES villes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Coordonnees (relation "contenir" 1..* Coordonnees - 1..1 Commune)
CREATE TABLE coordonnees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  longitude DECIMAL(10,7) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  commune_id INT NOT NULL,
  FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Utilisateur (classe mere, heritage table unique avec discriminant "role")
CREATE TABLE utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  postnom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  sexe CHAR(1) NOT NULL,               -- 'M' ou 'F'
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,  -- hash bcrypt
  role ENUM('CONTRIBUTEUR','ADMINISTRATEUR') NOT NULL DEFAULT 'CONTRIBUTEUR',
  pseudo VARCHAR(100) NULL,            -- attribut "nom" specifique a Contributeur dans le diagramme
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TypeSignalement (depot sauvage, inondation, erosion, pollution, ...)
CREATE TABLE types_signalement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- Signalement
CREATE TABLE signalements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_signale DATE NOT NULL,
  heure_signale TIME NOT NULL,
  date_analyse DATE NULL,
  heure_analyse TIME NULL,
  statut ENUM('EN_COURS','VALIDE','INVALIDE') NOT NULL DEFAULT 'EN_COURS',
  description TEXT NULL,
  type_signalement_id INT NOT NULL,
  utilisateur_id INT NOT NULL,         -- relation "poster" 1..1 Contributeur - 1..* Signalement
  administrateur_id INT NULL,          -- relation "analyser" 0..* Signalement - 1..1 Administrateur
  coordonnee_id INT NOT NULL,          -- relation "localiser" 1..1 - 1..1
  FOREIGN KEY (type_signalement_id) REFERENCES types_signalement(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (administrateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  FOREIGN KEY (coordonnee_id) REFERENCES coordonnees(id)
) ENGINE=InnoDB;

-- Photo (relation "contenir" 1..* Photo - 1..1 Signalement)
CREATE TABLE photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  lien VARCHAR(255) NOT NULL,
  size INT NOT NULL,
  signalement_id INT NOT NULL,
  FOREIGN KEY (signalement_id) REFERENCES signalements(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Quelques types de signalement par defaut
INSERT INTO types_signalement (nom) VALUES
  ('Depotdes dechets'), ('Inondation'), ('Erosion'), ('Pollution des eaux');
