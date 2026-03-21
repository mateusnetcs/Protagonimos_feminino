#!/bin/sh
# Inicializa banco (nao bloqueia - falha nao impede app de subir)
HOST="${MYSQL_HOST:-mysql}"
USER="${MYSQL_USER:-root}"
PASS="${MYSQL_PASSWORD:-changeme}"
DB="${MYSQL_DATABASE:-jornada_produtor}"

echo "Aguardando MySQL..."
i=0
while [ $i -lt 60 ]; do
  if mysql -h "$HOST" -u "$USER" -p"$PASS" -e "SELECT 1" 2>/dev/null; then
    echo "MySQL OK"
    break
  fi
  i=$((i+1))
  [ $i -eq 60 ] && echo "AVISO: MySQL timeout, continuando..." && exit 0
  sleep 2
done

echo "Aplicando schema..."
mysql -h "$HOST" -u "$USER" -p"$PASS" < /app/database/schema.sql 2>/dev/null || true

for f in /app/database/migrations/*.sql; do
  [ -f "$f" ] && mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" < "$f" 2>/dev/null || true
done

echo "Criando admin..."
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "INSERT INTO users (email, password_hash, name, role) VALUES ('admin@adm', '\$2b\$10\$PaxLSUaVZTQEWX0.2nbI6ORsC.4DcpzY3GfBPw5tBJuevWILzvjAW', 'Admin Inovacao', 'admin') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role='admin';" 2>/dev/null || true

echo "Init OK"
exit 0
