#!/usr/bin/env node
/**
 * Aguarda o MySQL ficar pronto antes de iniciar a aplicação.
 * Conecta via TCP para verificar se a porta 3306 está acessível.
 */
const net = require('net');

const host = process.env.MYSQL_HOST || 'mysql';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
const maxAttempts = 60;
const intervalMs = 2000;

function check() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  for (let i = 0; i < maxAttempts; i++) {
    if (await check()) {
      console.log('MySQL is ready');
      process.exit(0);
    }
    console.log(`Waiting for MySQL at ${host}:${port}... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.error('MySQL did not become ready in time');
  process.exit(1);
}

main();
