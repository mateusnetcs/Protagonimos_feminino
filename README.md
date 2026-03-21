<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8fb86949-0852-4871-bf3a-5e869baae503

## Run Locally

**Prerequisites:** Node.js + MySQL

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e configure as variáveis (MySQL, NextAuth, etc.)
3. Configure o banco: `npm run db:setup` (se necessário)
4. Execute: `npm run dev`

## Deploy com Docker (Coolify/VPS)

O projeto inclui `Dockerfile` e `docker-compose.yml` prontos para deploy no Coolify ou qualquer VPS.

1. No Coolify: crie um novo recurso, conecte o repositório Git e escolha **Docker Compose** como build pack
2. Configure as variáveis de ambiente (veja `.env.example`) na interface do Coolify
3. Defina `NEXTAUTH_URL` e `APP_URL` com o domínio da sua aplicação
4. O MySQL será criado automaticamente junto com a aplicação

**Variáveis obrigatórias:**
- `MYSQL_PASSWORD` – senha do MySQL
- `NEXTAUTH_SECRET` – chave secreta para NextAuth
- `NEXTAUTH_URL` – URL pública (ex: https://seu-dominio.com)
- `APP_URL` – mesma URL para callbacks OAuth
