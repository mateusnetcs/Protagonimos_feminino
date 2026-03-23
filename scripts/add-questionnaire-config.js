/**
 * Migração: adiciona config_json em questionnaires e answers_json em survey_responses
 * Execute: node scripts/add-questionnaire-config.js
 */
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'jornada_produtor',
  });

  try {
    await conn.query('ALTER TABLE questionnaires ADD COLUMN config_json JSON DEFAULT NULL');
    console.log('Coluna config_json adicionada em questionnaires.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('Coluna config_json já existe.');
    else throw err;
  }

  try {
    await conn.query('ALTER TABLE survey_responses ADD COLUMN answers_json JSON DEFAULT NULL');
    console.log('Coluna answers_json adicionada em survey_responses.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') console.log('Coluna answers_json já existe.');
    else throw err;
  }

  const configPath = path.join(__dirname, '..', 'lib', 'default-questionnaire-config.json');
  let defaultConfigJson;
  try {
    defaultConfigJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.warn('Não foi possível ler config padrão, usando fallback.');
    defaultConfigJson = {
    headerTitle: 'Perfil de Mulheres',
    headerBadge: 'BEM-VINDA!',
    headerImage: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070&auto=format&fit=crop',
    steps: [
      { id: 'step1', title: 'Feirinha da Prefs', questions: [{ key: 'primeira_vez', text: 'Esta é a primeira vez que participa da Feirinha?', type: 'radio_binary', options: [{ value: 'SIM', label: 'SIM' }, { value: 'NÃO', label: 'NÃO' }] }, { key: 'idade', text: 'Qual a sua idade?', type: 'radio_list', options: [{ value: 'MENOS DE 25 ANOS', label: 'Menos de 25 anos' }, { value: '25-34', label: '25 - 34 anos' }, { value: '35-44', label: '35 - 44 anos' }, { value: '45-54', label: '45 - 54 anos' }, { value: '55 anos ou mais', label: '55 anos ou mais' }] }] },
      { id: 'step2', title: 'Sua Jornada', subtitle: 'Quase lá! 🚜', questions: [{ key: 'tempo_atuacao', text: 'Há quanto tempo atua nesta área?', type: 'radio_list_detail', options: [{ value: 'MENOS DE 1 ANO', label: 'Menos de 1 ano', description: 'Iniciando agora!', emoji: '🌱' }, { value: '1 A 3 ANOS', label: '1 a 3 anos', description: 'Ganhando experiência', emoji: '🌿' }, { value: '4 A 6 ANOS', label: '4 a 6 anos', description: 'Já tem estrada', emoji: '🌳' }, { value: 'MAIS DE 6 ANOS', label: 'Mais de 6 anos', description: 'Mestre do campo', emoji: '👑' }] }, { key: 'renda_agricultura', text: 'A agricultura é a sua principal fonte de renda?', type: 'radio_binary', options: [{ value: 'SIM', label: 'SIM' }, { value: 'NÃO', label: 'NÃO' }] }] },
      { id: 'step3', title: 'Seus Produtos', subtitle: 'O que vende 🛒', questions: [{ key: 'produtos', text: 'Quais produtos comercializa?', type: 'textarea', placeholder: 'Ex: Hortaliças, doces caseiros, artesanato...' }, { key: 'locais_venda', text: 'Onde vende os seus produtos?', type: 'checkbox', options: [{ value: 'Feirinha local', label: 'Feirinha local', emoji: '🎪' }, { value: 'Encomendas', label: 'Encomendas', emoji: '📦' }, { value: 'Redes sociais', label: 'Redes sociais', emoji: '📱' }, { value: 'Para mercados', label: 'Para mercados', emoji: '🛒' }] }] },
      { id: 'step4', title: 'O Dia a Dia', subtitle: 'Rotina 📊', questions: [{ key: 'divulga_redes', text: 'Divulga os seus produtos nas redes sociais?', type: 'radio_binary', options: [{ value: 'SIM', label: 'SIM' }, { value: 'NÃO', label: 'NÃO' }] }, { key: 'controla_financas', text: 'Controla os seus ganhos e despesas?', type: 'radio_binary', options: [{ value: 'SIM', label: 'SIM' }, { value: 'NÃO', label: 'NÃO' }] }, { key: 'dificuldades', text: 'Quais são as suas maiores dificuldades hoje?', type: 'checkbox', options: [{ value: 'Falta de clientes', label: 'Falta de clientes', emoji: '🤷‍♀️' }, { value: 'Preço baixo dos produtos', label: 'Preço baixo dos produtos', emoji: '📉' }, { value: 'Falta de divulgação', label: 'Falta de divulgação', emoji: '🤫' }, { value: 'Organização financeira', label: 'Organização financeira', emoji: '🧾' }, { value: 'Acesso a crédito', label: 'Acesso a crédito', emoji: '🏦' }, { value: 'Transporte', label: 'Transporte', emoji: '🚚' }] }] },
      { id: 'step5', title: 'O Futuro', subtitle: 'A finalizar ✨', questions: [{ key: 'conciliar_familia', text: 'Sente dificuldade em conciliar trabalho e família?', type: 'radio_binary', options: [{ value: 'SIM', label: 'SIM' }, { value: 'NÃO', label: 'NÃO' }] }, { key: 'temas_aprender', text: 'Sobre quais temas gostaria de aprender mais?', type: 'checkbox', options: [{ value: 'Como aumentar as vendas', label: 'Como aumentar as vendas', emoji: '🚀' }, { value: 'Divulgar Instagram e WhatsApp', label: 'Divulgar (Insta/WhatsApp)', emoji: '💬' }, { value: 'Organização financeira', label: 'Organização financeira', emoji: '📈' }, { value: 'Precificação correta', label: 'Precificação correta', emoji: '🏷️' }, { value: 'Empreendedorismo feminino', label: 'Empreendedorismo feminino', emoji: '💪' }] }, { key: 'sugestao', text: 'Qual a sua sugestão para tornarmos a próxima feirinha ainda melhor?', type: 'textarea', placeholder: 'Deixe aqui a sua opinião...' }] },
    ],
    };
  }

  await conn.query(
    'UPDATE questionnaires SET config_json = ? WHERE id = 1',
    [JSON.stringify(defaultConfigJson)]
  );
  console.log('Questionário inicial atualizado com config.');

  await conn.end();
  console.log('Migração concluída.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
