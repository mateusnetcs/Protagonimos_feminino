-- Opção "Mostra no catálogo": 1 = aparece no catálogo, 0 = não aparece
-- Execute: mysql -u usuario -p jornada_produtor < add_show_in_catalog_to_products.sql

ALTER TABLE products ADD COLUMN show_in_catalog TINYINT(1) DEFAULT 1;
UPDATE products SET show_in_catalog = 1 WHERE show_in_catalog IS NULL;
