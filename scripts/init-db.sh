#!/bin/sh
# Aguarda MySQL e inicializa o banco (usa cliente mysql, sem Node)
set -e
HOST="${MYSQL_HOST:-mysql}"
USER="${MYSQL_USER:-root}"
PASS="$MYSQL_PASSWORD"
DB="${MYSQL_DATABASE:-jornada_produtor}"

if [ -z "$PASS" ]; then
  echo "Erro: MYSQL_PASSWORD nao definido"
  exit 1
fi

echo "Aguardando MySQL..."
for i in $(seq 1 60); do
  if mysql -h "$HOST" -u "$USER" -p"$PASS" -e "SELECT 1" 2>/dev/null; then
    echo "MySQL pronto."
    break
  fi
  [ $i -eq 60 ] && (echo "MySQL nao disponivel apos 60 tentativas"; exit 1)
  sleep 2
done

echo "Aplicando schema..."
mysql -h "$HOST" -u "$USER" -p"$PASS" < /app/database/schema.sql

echo "Aplicando migracoes..."
for f in /app/database/migrations/*.sql; do
  [ -f "$f" ] && mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" < "$f" 2>/dev/null || true
done

echo "Criando usuario admin..."
mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" -e "
  INSERT INTO users (email, password_hash, name, role) 
  VALUES ('admin@adm', '\$2b\$10\$PaxLSUaVZTQEWX0.2nbI6ORsC.4DcpzY3GfBPw5tBJuevWILzvjAW', 'Admin Inovacao', 'admin')
  ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), name=VALUES(name), role='admin';
"

echo "Banco inicializado."
