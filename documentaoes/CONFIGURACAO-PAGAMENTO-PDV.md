# Configuração de Pagamento no PDV

Este documento descreve as variáveis de ambiente necessárias para automatizar pagamentos no PDV (PIX e maquininha de cartão).

---

## Integrar Mercado Pago (PIX com QR Code — estilo TudoNet)

Cada operador pode conectar a própria conta Mercado Pago para gerar QR Code PIX diretamente na tela do PDV, sem depender de chave fixa.

### Passo a passo

1. **Crie uma aplicação no Mercado Pago**
   - Acesse [Suas integrações](https://www.mercadopago.com.br/developers/panel/app)
   - Clique em "Criar aplicação"
   - Anote o **Application ID** (client_id) e o **Client Secret** (client_secret)

2. **Configure a Redirect URI**
   - Nas configurações da aplicação, adicione a URL de redirecionamento:
   - Produção: `https://SEU_DOMINIO/api/pdv/mercadopago/callback`
   - Desenvolvimento: `http://localhost:3000/api/pdv/mercadopago/callback`

3. **Adicione no `.env.local`**
   ```env
   MERCADOPAGO_APP_ID=seu_application_id
   MERCADOPAGO_APP_SECRET=seu_client_secret
   APP_URL=https://seu-dominio.com  # ou http://localhost:3000 em dev
   ```

4. **No PDV**: Configurações → Configurar pagamento → "Conectar conta Mercado Pago"
   - O operador autoriza a integração na tela do Mercado Pago
   - Após conectar, ao escolher PIX na venda, o QR Code será gerado via API do Mercado Pago

---

## Chaves necessárias (alternativas)

Adicione as variáveis abaixo no arquivo `.env.local` (copie do `.env.example` e preencha os valores):

### PIX (Cobrança instantânea)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `PDV_PIX_CHAVE` | Sim | Sua chave PIX (CPF, CNPJ, e-mail ou telefone). Ex: `12345678900` ou `email@exemplo.com` |
| `PDV_PIX_NOME_RECEBEDOR` | Não | Nome exibido ao cliente na cobrança PIX |
| `NEXT_PUBLIC_PDV_PIX_CHAVE` | Sim | Mesma chave para exibição no frontend (QR Code / copia e cola) |

**Onde obter:** Use a mesma chave cadastrada no seu banco ou aplicativo PIX (ex.: Banco do Brasil, Nubank, Mercado Pago).

### Maquininha de cartão

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `PDV_MAQUINA_PROVIDER` | Não | Provedor da maquininha: `pagseguro`, `stone`, `getnet`, `cielo` |
| `PDV_MAQUINA_TOKEN` | Sim* | Token de integração (fornecido pelo provedor) |
| `PDV_MAQUINA_SECRET` | Sim* | Chave secreta para autenticação |

\* Obrigatório apenas se `PDV_MAQUINA_PROVIDER` estiver configurado.

**Onde obter:** Acesse o painel do seu provedor (PagSeguro, Stone, Getnet, Cielo) e gere credenciais de API para PDV/integração.

---

## Exemplo de `.env.local`

```env
# PIX - PDV
PDV_PIX_CHAVE=seu_email@exemplo.com
PDV_PIX_NOME_RECEBEDOR=Minha Feira
NEXT_PUBLIC_PDV_PIX_CHAVE=seu_email@exemplo.com

# Maquininha (opcional)
PDV_MAQUINA_PROVIDER=pagseguro
PDV_MAQUINA_TOKEN=seu_token_aqui
PDV_MAQUINA_SECRET=sua_chave_secreta
```

---

## Integração no PDV

- **PIX:** Ao escolher PIX na finalização da venda, o sistema exibe sua chave PIX para o cliente copiar/colar ou escanear via QR Code.
- **Maquininha:** Quando configurada, o PDV envia o valor da venda para a maquininha e aguarda a confirmação do pagamento com cartão.

---

## Segurança

- **Nunca** commite `.env.local` ou chaves no repositório.
- Use `NEXT_PUBLIC_*` apenas para valores que podem ser expostos no navegador (ex.: chave PIX para exibição ao cliente).
- Mantenha `PDV_MAQUINA_TOKEN` e `PDV_MAQUINA_SECRET` apenas em variáveis sem o prefixo `NEXT_PUBLIC_`.
