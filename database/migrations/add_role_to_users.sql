-- Níveis de usuário: admin (vê tudo) | geral (vê apenas seus dados)
ALTER TABLE users ADD COLUMN role ENUM('admin','geral') DEFAULT 'geral' AFTER name;

-- Tornar o primeiro usuário existente como admin
UPDATE users SET role = 'admin' ORDER BY id LIMIT 1;
