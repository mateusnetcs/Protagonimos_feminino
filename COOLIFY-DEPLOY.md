# Deploy no Coolify – Passo a Passo

## 1. Criar novo recurso no Coolify

1. Acesse o Coolify e clique em **+ New Resource**
2. Escolha **Docker Compose**
3. **Nome:** Protagonismo Feminino (ou outro)
4. **Git Repository:** `https://github.com/mateusnetcs/Protagonimos_feminino`
5. **Branch:** `main`
6. **Docker Compose Location:** `docker-compose.yaml` (ou `docker-compose.yml`)

---

## 2. Variáveis de ambiente (IMPORTANTE)

Na aba **Configuration** → **Environment Variables**, adicione **apenas** estas variáveis:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `MYSQL_PASSWORD` | `20220015779Ma@` (ou outra senha forte) | ✅ |
| `MYSQL_DATABASE` | `jornada_produtor` | ✅ |
| `NEXTAUTH_SECRET` | `jornada-produtor-inovacao-imperatriz-2024` | ✅ |
| `NEXTAUTH_URL` | `http://SEU-DOMINIO.sslip.io` (ex: `http://ckt3uc50odpx9lhxea9pxxwg.76.13.173.229.sslip.io`) | ✅ |
| `APP_URL` | **Mesma URL do NEXTAUTH_URL** | ✅ |

### ⚠️ NÃO adicione MYSQL_USER

- Deixe em branco. O compose usa o usuário `jornada` por padrão (o MySQL não aceita `root` nessa variável).

### Opcionais (deixe vazio se não usar)

- `OPENAI_API_KEY`
- `USEAPI_TOKEN`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_APP_ID`
- `MERCADOPAGO_APP_SECRET`

---

## 3. Domínio/URL

1. Em **Configuration** → **Domains**, configure o domínio que o Coolify gerar (ex: `xxx.76.13.173.229.sslip.io`)
2. Use essa **URL completa** em `NEXTAUTH_URL` e `APP_URL`

---

## 4. Primeiro deploy

1. Clique em **Deploy** ou **Redeploy**
2. Aguarde o build (pode levar 3–5 min)
3. Se falhar em "Collecting page data", o servidor pode estar com pouca memória (ideal: 4GB+)

---

## 5. Acesso após deploy

- **URL:** `http://seu-dominio.sslip.io`
- **Login admin:** `admin@adm` / `123123`

---

## Resumo das variáveis (copie e cole no Coolify)

```
MYSQL_PASSWORD=20220015779Ma@
MYSQL_DATABASE=jornada_produtor
NEXTAUTH_SECRET=jornada-produtor-inovacao-imperatriz-2024
NEXTAUTH_URL=http://SEU-DOMINIO-AQUI.sslip.io
APP_URL=http://SEU-DOMINIO-AQUI.sslip.io
```

**Troque `SEU-DOMINIO-AQUI` pela URL que o Coolify mostrar após criar o recurso.**
