# Configuração Dreamina para geração de posts

Este guia explica como configurar o Dreamina (via UseAPI) para o recurso **Gerar post com IA**, que usa a **foto real do produto** para criar designs de marketing.

---

## Passo 1: Assinatura do UseAPI

1. Acesse **[useapi.net](https://useapi.net)**
2. Clique em **Subscribe** ou acesse a página de [assinaturas](https://useapi.net/docs/subscription)
3. Escolha um plano e conclua o pagamento
4. Use um **e-mail válido** — o token será enviado para ele

---

## Passo 2: Obter o token UseAPI

1. Após a assinatura, você receberá um **e-mail de boas-vindas**
2. Clique no **link de verificação** para ativar a conta
3. Na página ativada, você verá o seu **API token** (ex: `useapi_xxxx...`)
4. **Copie e guarde** o token em local seguro

---

## Passo 3: Criar conta Dreamina (CapCut)

O Dreamina é o serviço de IA de imagens. É necessário uma conta para usá-lo via UseAPI.

1. Baixe e instale o navegador **[Opera](https://www.opera.com/)** (tem VPN grátis)
2. Abra o Opera e **ative a VPN** (ícone na barra de endereço)
3. Configure a região da VPN para **Américas**
4. Acesse **[dreamina.capcut.com](https://dreamina.capcut.com/)**
5. Clique em **Sign in** (canto inferior esquerdo)
6. Escolha **Continue with email**
7. Clique em **Sign up** e crie uma conta com:
   - E-mail (preferencialmente **novo**, não pessoal)
   - Senha
8. Confirme o e-mail se solicitado

---

## Passo 4: Adicionar conta Dreamina no UseAPI

1. Acesse o guia de configuração: **[Setup Dreamina](https://useapi.net/docs/start-here/setup-dreamina)**
2. Na seção **Verify and add account**, preencha:
   - **API Token:** cole o token do Passo 2
   - **Dreamina email:** o e-mail da conta Dreamina criada no Passo 3
   - **Dreamina password:** a senha da conta Dreamina
3. Clique em **Verify** para testar as credenciais
4. Se der certo (status 200), clique em **Add Account** para concluir

---

## Passo 5: Configurar no projeto

1. Abra o arquivo **`.env.local`** na raiz do projeto (na pasta `jornada-do-produtor`)
2. Adicione a linha:

```
USEAPI_TOKEN=seu_token_useapi_aqui
```

Substitua `seu_token_useapi_aqui` pelo token copiado no Passo 2.

3. Salve o arquivo
4. **Reinicie o servidor** do Next.js (`npm run dev`) para carregar a variável

---

## Passo 6: Testar no sistema

1. Faça login no painel admin (Gestão)
2. Vá na aba **Post**
3. Selecione um **produto que tenha foto cadastrada**
4. Clique em **Gerar post com IA**
5. Aguarde alguns segundos a 2 minutos — a imagem será gerada usando a foto real do produto

---

## Resumo das variáveis (.env.local)

| Variável        | Obrigatória | Descrição                                      |
|-----------------|-------------|------------------------------------------------|
| `USEAPI_TOKEN`  | Sim (imagem)| Token do UseAPI para Dreamina                  |
| `OPENAI_API_KEY`| Sim (legenda)| Chave da OpenAI para gerar a legenda do post |

---

## Problemas comuns

### "Nenhuma conta Dreamina configurada"
- Verifique se fez o **Passo 4** (Add Account) no UseAPI
- Confirme que o e-mail e senha da Dreamina estão corretos

### "Não foi possível carregar a foto do produto"
- O produto precisa ter uma **imagem cadastrada** na aba Produtos
- A URL da imagem deve ser acessível pela internet

### "Dreamina não configurado" / timeout
- Confirme que `USEAPI_TOKEN` está no `.env.local`
- Reinicie o servidor após alterar o `.env.local`
- A geração pode levar até 2 minutos — aguarde o polling

### Erro 401 ou Unauthorized
- Verifique se o token UseAPI está correto e sem espaços extras
- Confira se a assinatura do UseAPI está ativa

---

## Custos aproximados

- **UseAPI:** consulte os planos em [useapi.net/docs/subscription](https://useapi.net/docs/subscription)
- **Dreamina:** assinatura Advanced (~US$ 40/mês ou US$ 335/ano) inclui créditos mensais; há também gerações gratuitas diárias no modelo Seedream 4.0
