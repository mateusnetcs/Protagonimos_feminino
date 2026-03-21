-- Adiciona campos de perfil e endereço ao cliente (execute cada linha separadamente se alguma coluna já existir)
ALTER TABLE customers ADD COLUMN photo_url TEXT DEFAULT NULL;
ALTER TABLE customers ADD COLUMN cidade VARCHAR(255) DEFAULT NULL;
ALTER TABLE customers ADD COLUMN bairro VARCHAR(255) DEFAULT NULL;
ALTER TABLE customers ADD COLUMN rua VARCHAR(255) DEFAULT NULL;
ALTER TABLE customers ADD COLUMN numero VARCHAR(50) DEFAULT NULL;
ALTER TABLE customers ADD COLUMN cep VARCHAR(20) DEFAULT NULL;
ALTER TABLE customers ADD COLUMN complemento VARCHAR(500) DEFAULT NULL;
