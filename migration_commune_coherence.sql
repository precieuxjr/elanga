-- Migration : verification de coherence entre la commune declaree par le
-- citoyen et sa position GPS reelle.
--
-- A executer sur la base "elanga" (apres le dump du 2026-07-13) :
--   mysql -u root -p elanga < backend/database/migration_commune_coherence.sql

-- 1) Chaque commune recoit sa frontiere administrative au format GeoJSON
--    (un objet Polygon ou MultiPolygon, cf. section "Comment obtenir les
--    polygones" plus bas). NULL tant qu'aucune frontiere n'a ete importee.
ALTER TABLE `communes`
  ADD COLUMN `polygone` JSON NULL
  COMMENT 'Frontiere de la commune, GeoJSON (Polygon/MultiPolygon)';

-- 2) Chaque signalement garde la trace du resultat de la verification :
--      NULL = non verifie (ex: commune sans polygone importe)
--      1    = position GPS a l'interieur de la commune declaree
--      0    = incoherence detectee -> a prioriser cote admin
ALTER TABLE `signalements`
  ADD COLUMN `commune_coherente` TINYINT(1) NULL DEFAULT NULL
  COMMENT 'NULL=non verifie, 1=coherent, 0=incoherent (commune declaree vs GPS)';

-- 3) Index pour que l'admin puisse facilement lister/filtrer les
--    signalements incoherents en priorite.
ALTER TABLE `signalements`
  ADD INDEX `idx_commune_coherente` (`commune_coherente`);
