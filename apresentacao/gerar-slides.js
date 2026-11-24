// Gera os slides do pitch do ConFin (5 min) com a biblioteca pptxgenjs.
// Uso: cd apresentacao && npm install && npm run gerar
// Saída: ../ConFin-Pitch.pptx e ROTEIRO.md (falas e tempos de cada slide).
// Os prints em ./prints foram tirados do app real com os dados da demo (Família Souza).

import pptxgen from 'pptxgenjs';
import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PRINT = (nome) => path.join(AQUI, 'prints', nome);
const URL_APP = 'https://confin-qetu.onrender.com';
const SAIDA = path.join(AQUI, '..', 'ConFin-Pitch.pptx');

// Identidade visual (mesmas cores do app)
const C = {
  verde: '059669', verdeEsc: '064E3B', verdeClaro: 'D1FAE5', verdeFundo: 'ECFDF5', verdeVivo: '34D399',
  tinta: '0F172A', texto: '334155', suave: '64748B', borda: 'E2E8F0', fundo: 'F8FAFC',
  noite: '0B1120', noite2: '1E293B', ambar: 'F59E0B', branco: 'FFFFFF',
};
const FONTE = 'Segoe UI';
const TOTAL = 10;

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13,33 x 7,5 pol (16:9)
pptx.title = 'ConFin — Pitch Projeto Integrador II';
pptx.author = 'Israel, Gabriel, Luis Felipe e Mateus';
pptx.company = 'FATEC';

const roteiro = []; // { n, titulo, tempo, quem, fala }

// ---------- Componentes reutilizáveis ----------
function txt(slide, text, o) {
  slide.addText(text, { fontFace: FONTE, color: C.tinta, margin: 0, valign: 'top', ...o });
}

function cabecalho(slide, kicker, titulo, w = 12.1) {
  txt(slide, kicker.toUpperCase(), { x: 0.6, y: 0.42, w, h: 0.3, fontSize: 12, bold: true, color: C.verde, charSpacing: 2 });
  txt(slide, titulo, { x: 0.6, y: 0.75, w, h: 0.95, fontSize: 30, bold: true, valign: 'top' });
}

function rodape(slide, n) {
  txt(slide, 'ConFin · Projeto Integrador II · FATEC', { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: '94A3B8' });
  txt(slide, `${n} / ${TOTAL}`, { x: 11.7, y: 7.0, w: 1.03, h: 0.3, fontSize: 10, color: '94A3B8', align: 'right' });
}

function slideClaro(n) {
  const s = pptx.addSlide();
  s.background = { color: C.fundo };
  rodape(s, n);
  return s;
}

function slideEscuro() {
  const s = pptx.addSlide();
  s.background = { color: C.noite };
  return s;
}

// Print de celular dentro de uma "moldura" de aparelho
const PROP_CEL = 780 / 1688;
function celular(slide, arquivo, x, y, h, escuro = false) {
  const w = h * PROP_CEL;
  const p = 0.09;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x - p, y: y - p, w: w + 2 * p, h: h + 2 * p, rectRadius: 0.28,
    fill: { color: escuro ? '1E293B' : C.tinta }, line: { color: escuro ? '334155' : C.tinta, width: 1 },
    shadow: { type: 'outer', color: '000000', opacity: 0.25, blur: 12, offset: 4, angle: 90 },
  });
  slide.addImage({ path: PRINT(arquivo), x, y, w, h });
  return w;
}

// Print de computador dentro de uma "janela de navegador"
function navegador(slide, arquivo, x, y, w) {
  const barra = 0.28;
  const h = w / 1.6;
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h: h + barra, fill: { color: 'E2E8F0' }, line: { color: 'CBD5E1', width: 1 },
    shadow: { type: 'outer', color: '000000', opacity: 0.2, blur: 12, offset: 4, angle: 90 },
  });
  ['FF5F57', 'FEBC2E', '28C840'].forEach((cor, i) =>
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.14 + i * 0.17, y: y + 0.09, w: 0.1, h: 0.1, fill: { color: cor }, line: { color: cor } }));
  txt(slide, 'confin-qetu.onrender.com', { x: x + 0.8, y: y + 0.05, w: w - 1.6, h: 0.18, fontSize: 8, color: C.suave, align: 'center' });
  slide.addImage({ path: PRINT(arquivo), x, y: y + barra, w, h });
  return h + barra;
}

function cartao(slide, x, y, w, h, o = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.16, fill: { color: o.fill ?? C.branco }, line: { color: o.line ?? C.borda, width: o.lineW ?? 1 },
  });
}

function logo(slide, x, y, t = 0.7) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: t, h: t, rectRadius: t * 0.28, fill: { color: C.verde }, line: { color: C.verde } });
  txt(slide, 'C', { x, y, w: t, h: t, fontSize: t * 40, bold: true, color: C.branco, align: 'center', valign: 'middle' });
}

// Fileira de etapas ligadas por setas (pipeline)
function etapas(slide, itens, y, h, { x0 = 0.6, largura = 12.13, destaque = -1 } = {}) {
  const gap = 0.3;
  const w = (largura - gap * (itens.length - 1)) / itens.length;
  itens.forEach((t, i) => {
    const x = x0 + i * (w + gap);
    const ativo = i === destaque;
    cartao(slide, x, y, w, h, { fill: ativo ? C.verde : C.branco, line: ativo ? C.verde : C.borda });
    txt(slide, t, { x: x + 0.1, y, w: w - 0.2, h, fontSize: 12.5, align: 'center', valign: 'middle', color: ativo ? C.branco : C.texto, bold: ativo });
    if (i < itens.length - 1) txt(slide, '→', { x: x + w, y, w: gap, h, fontSize: 16, color: C.verde, bold: true, align: 'center', valign: 'middle' });
  });
}

function notas(slide, n, titulo, tempo, quem, fala) {
  slide.addNotes(`[${tempo}] ${fala}`);
  roteiro.push({ n, titulo, tempo, quem, fala });
}

// ---------- 1. Capa ----------
{
  const s = slideEscuro();
  logo(s, 0.7, 0.75, 0.62);
  txt(s, 'ConFin', { x: 1.5, y: 0.75, w: 3, h: 0.62, fontSize: 26, bold: true, color: C.branco, valign: 'middle' });
  txt(s, [
    { text: 'O orçamento da família, ' },
    { text: 'ao vivo', options: { color: C.verdeVivo } },
    { text: ', no bolso de todos.' },
  ], { x: 0.7, y: 1.9, w: 6.2, h: 2.0, fontSize: 38, bold: true, color: C.branco });
  txt(s, 'Sistema de controle financeiro familiar colaborativo', { x: 0.7, y: 4.0, w: 6, h: 0.5, fontSize: 18, color: '94A3B8' });
  txt(s, 'Israel Batista de Faria  ·  Gabriel Piva Garcia Coral\nLuis Felipe Pereira  ·  Mateus Rogério de Souza',
    { x: 0.7, y: 5.25, w: 6.3, h: 0.7, fontSize: 13, color: 'CBD5E1', lineSpacingMultiple: 1.2 });
  txt(s, 'Projeto Integrador II · ADS · FATEC · 2026\nProf.ª Natalie Rodrigues Alves Ferreira de Andrade',
    { x: 0.7, y: 6.15, w: 6.3, h: 0.6, fontSize: 11, color: C.suave, lineSpacingMultiple: 1.15 });
  navegador(s, 'p7-dashboard-desktop.png', 7.25, 0.85, 5.6);
  celular(s, 'p8-dashboard-escuro.png', 6.55, 3.05, 3.95, true);
  txt(s, URL_APP.replace('https://', ''), { x: 8.9, y: 6.75, w: 3.95, h: 0.3, fontSize: 13, bold: true, color: C.verdeVivo, align: 'right' });
  notas(s, 1, 'Capa', '0:15', 'Apresentador 1',
    'Boa noite! Somos [nomes] e vamos apresentar o ConFin: um sistema de controle financeiro em que a família inteira registra os gastos e acompanha o orçamento do mês em tempo real.');
}

// ---------- 2. Problema ----------
{
  const s = slideClaro(2);
  cabecalho(s, 'O problema', 'As finanças da família estão espalhadas');
  const cards = [
    ['1', 'Cada um paga de um jeito', 'Crédito, débito, PIX… cada membro usa o seu meio de pagamento.'],
    ['2', 'Contas fixas em uma só pessoa', 'Água, luz e internet ficam com um único membro, e o resto da família não vê.'],
    ['3', 'Descobre tarde demais', 'O estouro do orçamento só aparece quando a fatura do cartão fecha.'],
  ];
  cards.forEach(([num, tit, desc], i) => {
    const x = 0.6 + i * 4.14;
    cartao(s, x, 1.85, 3.85, 2.85);
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.35, y: 2.15, w: 0.6, h: 0.6, fill: { color: C.verdeClaro }, line: { color: C.verdeClaro } });
    txt(s, num, { x: x + 0.35, y: 2.15, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: C.verde, align: 'center', valign: 'middle' });
    txt(s, tit, { x: x + 0.35, y: 2.9, w: 3.15, h: 0.75, fontSize: 19, bold: true, valign: 'bottom' });
    txt(s, desc, { x: x + 0.35, y: 3.75, w: 3.15, h: 0.85, fontSize: 14.5, color: C.suave });
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 4.95, w: 12.13, h: 1.6, fill: { color: C.verdeFundo }, line: { color: C.verdeFundo } });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 4.95, w: 0.09, h: 1.6, fill: { color: C.verde }, line: { color: C.verde } });
  txt(s, '“Só descobrimos que gastamos demais quando as faturas chegam fechadas nos aplicativos dos bancos, o que já é tarde demais.”',
    { x: 1.0, y: 5.15, w: 11.4, h: 0.85, fontSize: 19, italic: true, color: C.tinta });
  txt(s, '— família entrevistada no levantamento de requisitos (questionário com 15 famílias)',
    { x: 1.0, y: 6.05, w: 11.4, h: 0.35, fontSize: 12.5, color: C.suave });
  notas(s, 2, 'O problema', '0:30', 'Apresentador 1',
    'No levantamento de requisitos, aplicamos um questionário a 15 famílias e encontramos três dores: cada pessoa paga de um jeito, as contas fixas ficam concentradas em uma só pessoa, e ninguém sabe se o orçamento estourou até a fatura chegar. Uma das famílias resumiu bem: [ler a citação].');
}

// ---------- 3. Solução ----------
{
  const s = slideClaro(3);
  cabecalho(s, 'A solução', 'Todos registram, todos acompanham', 8.6);
  const itens = [
    ['Registro em 2 toques', 'Cada membro lança a despesa na hora da compra.', 'RF002'],
    ['Tempo real para a família toda', 'O saldo atualiza no celular de todos, sem recarregar.', 'RF004'],
    ['Alertas de limite', 'Aviso automático ao atingir 80% e 100% do orçamento.', 'RN004'],
    ['Grupo familiar com papéis', 'O admin convida por código ou e-mail e define o limite.', 'RF003'],
    ['Instala como aplicativo', 'PWA: Android, iPhone e computador, sem loja de apps.', 'RNF002'],
  ];
  itens.forEach(([tit, desc, id], i) => {
    const y = 1.95 + i * 0.97;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.6, y: y + 0.03, w: 0.46, h: 0.46, fill: { color: C.verde }, line: { color: C.verde } });
    txt(s, '✓', { x: 0.6, y: y + 0.03, w: 0.46, h: 0.46, fontSize: 15, bold: true, color: C.branco, align: 'center', valign: 'middle' });
    txt(s, [
      { text: tit, options: { bold: true, fontSize: 18, color: C.tinta } },
      { text: `   ${id}`, options: { fontSize: 11, color: C.verde, bold: true } },
    ], { x: 1.3, y: y - 0.02, w: 7.4, h: 0.4 });
    txt(s, desc, { x: 1.3, y: y + 0.38, w: 7.4, h: 0.4, fontSize: 14.5, color: C.suave });
  });
  celular(s, 'p2-dashboard-antes.png', 9.75, 1.0, 5.75);
  notas(s, 3, 'A solução', '0:30', 'Apresentador 1',
    'O ConFin resolve isso: cada membro registra a despesa no celular na hora da compra, em dois toques, e o saldo atualiza na tela de todo mundo em tempo real. Quando o mês chega a 80% do limite, todos recebem um alerta. É um PWA: instala como aplicativo no Android, iPhone ou computador, sem precisar de loja.');
}

// ---------- 4. Demonstração (tempo real) ----------
{
  const s = slideClaro(4);
  cabecalho(s, 'Demonstração', 'Uma compra, e a família inteira fica sabendo na hora');
  const h = 4.3;
  const w = h * PROP_CEL;
  const gap = 1.6;
  const x0 = (13.333 - (3 * w + 2 * gap)) / 2;
  const passos = [
    ['p2-dashboard-antes.png', '1', 'Mês em 72% do limite', 'Celular da Ana'],
    ['p3-nova-despesa.png', '2', 'Carlos registra R$ 420,90', 'Celular do Carlos'],
    ['p4-ana-tempo-real.png', '3', 'Ana vê na hora + alerta 80%', 'Celular da Ana, sem recarregar'],
  ];
  passos.forEach(([img, num, tit, sub], i) => {
    const x = x0 + i * (w + gap);
    celular(s, img, x, 1.8, h);
    const cx = x + w / 2;
    s.addShape(pptx.ShapeType.ellipse, { x: cx - 1.55, y: 6.42, w: 0.36, h: 0.36, fill: { color: i === 2 ? C.ambar : C.verde }, line: { color: i === 2 ? C.ambar : C.verde } });
    txt(s, num, { x: cx - 1.55, y: 6.42, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.branco, align: 'center', valign: 'middle' });
    txt(s, [
      { text: tit, options: { bold: true, fontSize: 13.5, color: C.tinta, breakLine: true } },
      { text: sub, options: { fontSize: 11, color: C.suave } },
    ], { x: cx - 1.1, y: 6.38, w: 2.75, h: 0.6 });
    if (i < 2) {
      s.addShape(pptx.ShapeType.rightArrow, { x: x + w + 0.42, y: 3.7, w: 0.76, h: 0.5, fill: { color: C.verde }, line: { color: C.verde } });
    }
  });
  notas(s, 4, 'Demonstração (tempo real)', '1:00', 'Apresentador 2',
    'SE A INTERNET FUNCIONAR: faça a demo ao vivo com dois celulares (Ana e Carlos) e pule para o slide 6. SE NÃO: "Aqui é a família Souza. A Ana está no celular dela: o mês está em 72% do limite de R$ 4.500. O Carlos vai ao mercado e registra R$ 420,90: valor, categoria, meio de pagamento, e o app já mostra quanto vai sobrar. Ele toca em Salvar e, na mesma hora, sem recarregar nada, o celular da Ana mostra quem gastou, o saldo novo e o alerta amarelo de que a família passou de 80% do orçamento."');
}

// ---------- 5. Outras telas ----------
{
  const s = slideClaro(5);
  cabecalho(s, 'O aplicativo', 'Tudo o que a família precisa, em um só lugar');
  const hNav = navegador(s, 'p7-dashboard-desktop.png', 0.6, 1.8, 6.9);
  txt(s, [{ text: 'Dashboard  ', options: { bold: true, color: C.tinta } }, { text: 'categorias, últimos 6 meses, quem gastou e saldo por dia' }],
    { x: 0.6, y: 1.8 + hNav + 0.12, w: 6.9, h: 0.3, fontSize: 12, color: C.suave });
  const hc = 4.4;
  const wc = hc * PROP_CEL;
  const xc = 8.25;
  celular(s, 'p5-familia.png', xc, 1.9, hc);
  celular(s, 'p6-historico.png', xc + wc + 0.45, 1.9, hc);
  txt(s, [{ text: 'Família', options: { bold: true, breakLine: true, color: C.tinta } }, { text: 'Limite, convite e membros' }],
    { x: xc - 0.3, y: 6.42, w: wc + 0.6, h: 0.5, fontSize: 11.5, color: C.suave, align: 'center' });
  txt(s, [{ text: 'Histórico', options: { bold: true, breakLine: true, color: C.tinta } }, { text: 'Filtros e busca' }],
    { x: xc + wc + 0.15, y: 6.42, w: wc + 0.6, h: 0.5, fontSize: 11.5, color: C.suave, align: 'center' });
  notas(s, 5, 'Outras telas', '0:20', 'Apresentador 2',
    'Além disso, o dashboard mostra os gastos por categoria, a comparação dos últimos 6 meses com o limite e quanto a família ainda pode gastar por dia. Na tela Família, o administrador define o limite e convida pessoas por código ou e-mail. E o histórico tem filtros por mês, categoria e membro.');
}

// ---------- 6. Arquitetura ----------
{
  const s = slideClaro(6);
  cabecalho(s, 'Como foi construído', 'Arquitetura: três partes conversando pela internet');
  const y = 1.9;
  const h = 2.75;
  const caixa = (x, w, kicker, titulo, corpo, destaque) => {
    cartao(s, x, y, w, h, destaque ? { fill: C.verdeFundo, line: C.verde, lineW: 2 } : {});
    txt(s, kicker, { x: x + 0.25, y: y + 0.22, w: w - 0.5, h: 0.3, fontSize: 11, bold: true, color: C.verde, charSpacing: 1.5 });
    txt(s, titulo, { x: x + 0.25, y: y + 0.52, w: w - 0.5, h: 0.5, fontSize: 20, bold: true });
    txt(s, corpo.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < corpo.length - 1 } })),
      { x: x + 0.25, y: y + 1.1, w: w - 0.45, h: h - 1.25, fontSize: 13, color: C.texto, paraSpaceAfter: 4 });
  };
  caixa(0.6, 3.05, 'CLIENTE', 'Celular ou PC', ['React + Vite + Tailwind', 'Gráficos com Recharts', 'Instalável (PWA)']);
  caixa(5.2, 3.65, 'RENDER · SERVIDOR', 'Node.js + Express', ['API REST (/api/…)', 'Socket.io: uma sala por família', 'Login com bcrypt + JWT', 'Entrega o front compilado'], true);
  caixa(10.0, 2.73, 'SUPABASE · BANCO', 'PostgreSQL', ['família, usuário, despesa, convite', 'Regras no banco (UNIQUE, CHECK)']);
  // conexões
  const seta = (x, w, cima, baixo) => {
    s.addShape(pptx.ShapeType.line, { x, y: y + h / 2, w, h: 0, line: { color: C.verde, width: 2.5, beginArrowType: 'triangle', endArrowType: 'triangle' } });
    txt(s, cima, { x: x - 0.1, y: y + h / 2 - 0.55, w: w + 0.2, h: 0.45, fontSize: 10.5, bold: true, color: C.texto, align: 'center', valign: 'bottom' });
    txt(s, baixo, { x: x - 0.1, y: y + h / 2 + 0.1, w: w + 0.2, h: 0.45, fontSize: 10.5, color: C.suave, align: 'center' });
  };
  seta(3.75, 1.35, 'HTTPS', 'REST + WebSocket');
  seta(8.95, 0.95, 'SQL', 'com SSL');
  txt(s, 'Caminho de uma despesa', { x: 0.6, y: 4.95, w: 6, h: 0.35, fontSize: 14, bold: true });
  etapas(s, ['Carlos toca em Salvar', 'POST /api/despesas', 'Valida valor > 0 (RN002)', 'Grava no PostgreSQL', 'Socket.io avisa a família', 'Tela da Ana atualiza'], 5.4, 1.05, { destaque: 4 });
  notas(s, 6, 'Arquitetura', '0:40', 'Apresentador 3',
    'Por dentro, são três partes. O front-end, feito em React, roda no celular ou no navegador. Ele conversa por HTTPS com o nosso servidor em Node.js com Express, que expõe uma API REST e usa Socket.io para o tempo real: cada família é uma "sala". O servidor guarda os dados num banco PostgreSQL. O caminho de uma despesa: o app envia para a API, a API valida (o valor tem que ser positivo, RN002), grava no banco e avisa pelo Socket.io todos os membros daquela família, cuja tela atualiza na hora.');
}

// ---------- 7. Tecnologias ----------
{
  const s = slideClaro(7);
  cabecalho(s, 'Como foi construído', 'Tecnologias escolhidas, e por quê');
  const cards = [
    ['LINGUAGEM', 'JavaScript', 'Uma só linguagem no front-end e no back-end: aprendemos uma vez e usamos nos dois lados.'],
    ['FRONT-END', 'React + Vite + Tailwind', 'Telas em componentes reutilizáveis, mobile first, gráficos com Recharts.'],
    ['BACK-END', 'Node.js + Express', 'API REST leve; consultas SQL escritas por nós (biblioteca pg).'],
    ['TEMPO REAL', 'Socket.io (WebSocket)', 'Conexão sempre aberta: o servidor avisa o celular, sem ficar recarregando.'],
    ['BANCO DE DADOS', 'PostgreSQL', 'Relacional e gratuito. Regras garantidas no próprio banco: e-mail único (RN001) e valor > 0 (RN002).'],
    ['SEGURANÇA', 'bcrypt + JWT + HTTPS', 'A senha nunca é guardada, só o hash (RNF003). Token de login válido por 7 dias.'],
  ];
  cards.forEach(([k, nome, porque], i) => {
    const x = 0.6 + (i % 3) * 4.14;
    const y = 1.9 + Math.floor(i / 3) * 2.5;
    cartao(s, x, y, 3.85, 2.25);
    txt(s, k, { x: x + 0.3, y: y + 0.25, w: 3.3, h: 0.3, fontSize: 11, bold: true, color: C.verde, charSpacing: 1.5 });
    txt(s, nome, { x: x + 0.3, y: y + 0.55, w: 3.3, h: 0.5, fontSize: 20, bold: true });
    txt(s, porque, { x: x + 0.3, y: y + 1.12, w: 3.3, h: 1.0, fontSize: 13.5, color: C.suave });
  });
  notas(s, 7, 'Tecnologias', '0:35', 'Apresentador 3',
    'Escolhemos JavaScript nos dois lados: React no front-end e Node.js com Express no back-end. Assim a equipe usa uma só linguagem. O tempo real é feito com Socket.io, que mantém uma conexão aberta com o celular. O banco é o PostgreSQL, relacional, e algumas regras de negócio ficam garantidas no próprio banco, como o e-mail único e o valor positivo. As senhas são guardadas com hash bcrypt, nunca em texto, e o login usa token JWT.');
}

// ---------- 8. Hospedagem e deploy ----------
{
  const s = slideClaro(8);
  cabecalho(s, 'Onde está hospedado', 'Na nuvem, com custo zero e deploy automático');
  const servico = (y, kicker, nome, desc) => {
    cartao(s, 0.6, y, 5.6, 1.5);
    txt(s, kicker, { x: 0.9, y: y + 0.2, w: 5, h: 0.3, fontSize: 11, bold: true, color: C.verde, charSpacing: 1.5 });
    txt(s, nome, { x: 0.9, y: y + 0.48, w: 5, h: 0.45, fontSize: 20, bold: true });
    txt(s, desc, { x: 0.9, y: y + 0.95, w: 5.1, h: 0.45, fontSize: 13, color: C.suave });
  };
  servico(1.9, 'APLICAÇÃO', 'Render', 'Roda o Node.js e dá HTTPS e uma URL pública. Plano gratuito.');
  servico(3.55, 'BANCO DE DADOS', 'Supabase', 'PostgreSQL gerenciado na nuvem, com SSL e backup. Plano gratuito.');
  // IaaS x PaaS
  const cab = { bold: true, color: C.branco, fill: { color: C.tinta }, fontSize: 12.5 };
  const cabV = { ...cab, fill: { color: C.verde } };
  const l = { fontSize: 12.5, color: C.texto };
  const lb = { ...l, bold: true, color: C.tinta };
  s.addTable([
    [{ text: '', options: cab }, { text: 'IaaS (ex.: AWS EC2)', options: cab }, { text: 'PaaS (Render) ✓', options: cabV }],
    [{ text: 'Servidor', options: lb }, { text: 'Nós instalamos e atualizamos', options: l }, { text: 'Pronto para usar', options: l }],
    [{ text: 'HTTPS', options: lb }, { text: 'Configurar certificado', options: l }, { text: 'Automático', options: l }],
    [{ text: 'Deploy', options: lb }, { text: 'Manual, via SSH', options: l }, { text: 'Automático a cada git push', options: l }],
    [{ text: 'Custo', options: lb }, { text: 'Grátis só por 12 meses', options: l }, { text: 'R$ 0', options: l }],
  ], { x: 6.55, y: 1.9, w: 6.18, colW: [1.3, 2.44, 2.44], rowH: 0.62, fontFace: FONTE, border: { type: 'solid', color: C.borda, pt: 1 }, fill: { color: C.branco }, valign: 'middle', margin: 0.08 });
  txt(s, 'Deploy contínuo (CD): cada alteração no GitHub vai para o ar sozinha', { x: 0.6, y: 5.3, w: 12, h: 0.35, fontSize: 14, bold: true });
  etapas(s, ['git push no GitHub', 'Render baixa o código', 'npm run build', 'Teste de saúde /api/health', 'No ar ✓'], 5.75, 0.9, { destaque: 4 });
  notas(s, 8, 'Hospedagem e deploy', '0:30', 'Apresentador 4',
    'O sistema está no ar. O servidor roda no Render e o banco no Supabase, os dois em plano gratuito, o que atende à restrição de orçamento do nosso TAP. Usamos o modelo PaaS (plataforma como serviço): diferente de uma máquina virtual na AWS, em que teríamos que instalar sistema, servidor e certificado, aqui entregamos só o código. E temos deploy contínuo: cada git push no GitHub gera uma nova versão sozinha, que só entra no ar depois de passar no teste de saúde.');
}

// ---------- 9. Processo e requisitos ----------
{
  const s = slideClaro(9);
  cabecalho(s, 'Como foi feito', 'Do levantamento de requisitos ao sistema no ar');
  const passos = [
    ['Requisitos', 'Questionário com 15 famílias e entrevistas'],
    ['Protótipo', 'Rabiscoframe no papel → Figma'],
    ['Modelagem', 'UML, BPMN e banco relacional'],
    ['Desenvolvimento', 'API, telas, tempo real e teste automático'],
    ['Deploy', 'GitHub → Render + Supabase'],
  ];
  const w = 2.25;
  const passo = (12.13 - w) / 4;
  s.addShape(pptx.ShapeType.line, { x: 0.6 + w / 2, y: 2.25, w: 12.13 - w, h: 0, line: { color: C.verdeClaro, width: 3 } });
  passos.forEach(([tit, desc], i) => {
    const x = 0.6 + i * passo;
    s.addShape(pptx.ShapeType.ellipse, { x: x + w / 2 - 0.3, y: 1.95, w: 0.6, h: 0.6, fill: { color: C.verde }, line: { color: C.fundo, width: 3 } });
    txt(s, String(i + 1), { x: x + w / 2 - 0.3, y: 1.95, w: 0.6, h: 0.6, fontSize: 17, bold: true, color: C.branco, align: 'center', valign: 'middle' });
    txt(s, tit, { x, y: 2.7, w, h: 0.4, fontSize: 16, bold: true, align: 'center' });
    txt(s, desc, { x, y: 3.1, w, h: 0.75, fontSize: 12.5, color: C.suave, align: 'center' });
  });
  txt(s, 'Requisitos da documentação, implementados e rastreáveis no código', { x: 0.6, y: 4.2, w: 12, h: 0.35, fontSize: 14, bold: true });
  const reqs = [
    ['RF001', 'Cadastro de usuário'], ['RF002', 'Registro de despesa'], ['RF003', 'Grupo familiar'], ['RF004', 'Dashboard ao vivo'],
    ['RN001', 'E-mail único'], ['RN002', 'Valor maior que zero'], ['RN003', 'Só o admin gerencia'], ['RN004', 'Alertas 80% e 100%'],
  ];
  reqs.forEach(([id, nome], i) => {
    const x = 0.6 + (i % 4) * 3.07;
    const y = 4.7 + Math.floor(i / 4) * 0.95;
    cartao(s, x, y, 2.88, 0.78, { fill: C.verdeFundo, line: C.verdeClaro });
    txt(s, [
      { text: '✓  ', options: { color: C.verde, bold: true } },
      { text: `${id}  `, options: { color: C.verde, bold: true } },
      { text: nome, options: { color: C.tinta } },
    ], { x: x + 0.2, y, w: 2.6, h: 0.78, fontSize: 13, valign: 'middle' });
  });
  notas(s, 9, 'Processo e requisitos', '0:25', 'Apresentador 4',
    'Seguimos as etapas da Engenharia de Software: levantamos os requisitos com as famílias, prototipamos no papel e no Figma, modelamos com UML, BPMN e o banco relacional, desenvolvemos o MVP com um teste automatizado de ponta a ponta e fizemos o deploy. Todos os requisitos funcionais e regras de negócio da documentação foram implementados, e cada um está identificado no código pelo seu ID.');
}

// ---------- 10. Encerramento ----------
{
  const s = slideEscuro();
  logo(s, 0.7, 0.75, 0.62);
  txt(s, 'ConFin', { x: 1.5, y: 0.75, w: 3, h: 0.62, fontSize: 26, bold: true, color: C.branco, valign: 'middle' });
  txt(s, 'Obrigado!', { x: 0.7, y: 1.75, w: 7, h: 1.0, fontSize: 54, bold: true, color: C.branco });
  txt(s, 'Perguntas?', { x: 0.7, y: 2.75, w: 7, h: 0.6, fontSize: 24, color: '94A3B8' });
  txt(s, 'Experimente agora no celular:', { x: 0.7, y: 3.75, w: 7, h: 0.4, fontSize: 16, color: 'CBD5E1' });
  txt(s, URL_APP.replace('https://', ''), { x: 0.7, y: 4.15, w: 7.5, h: 0.6, fontSize: 28, bold: true, color: C.verdeVivo });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 5.1, w: 7.2, h: 1.15, rectRadius: 0.14, fill: { color: C.noite2 }, line: { color: '334155' } });
  txt(s, 'PRÓXIMOS PASSOS', { x: 0.95, y: 5.25, w: 6.8, h: 0.3, fontSize: 11, bold: true, color: C.verdeVivo, charSpacing: 1.5 });
  txt(s, 'Open Finance (importar gastos do banco) · Notificações push · Recuperação de senha · Limite por categoria',
    { x: 0.95, y: 5.55, w: 6.8, h: 0.6, fontSize: 13.5, color: C.branco });
  txt(s, 'Israel Batista de Faria · Gabriel Piva Garcia Coral · Luis Felipe Pereira · Mateus Rogério de Souza',
    { x: 0.7, y: 6.65, w: 12, h: 0.35, fontSize: 12, color: C.suave });
  const qr = await QRCode.toDataURL(URL_APP, { margin: 1, width: 800, errorCorrectionLevel: 'M', color: { dark: '#0F172A', light: '#FFFFFF' } });
  s.addShape(pptx.ShapeType.roundRect, { x: 8.95, y: 1.45, w: 3.6, h: 3.6, rectRadius: 0.22, fill: { color: C.branco }, line: { color: C.branco } });
  s.addImage({ data: qr.replace(/^data:/, ''), x: 9.2, y: 1.7, w: 3.1, h: 3.1 });
  txt(s, 'Aponte a câmera do celular', { x: 8.95, y: 5.2, w: 3.6, h: 0.4, fontSize: 14, color: 'CBD5E1', align: 'center' });
  notas(s, 10, 'Encerramento', '0:15', 'Apresentador 4',
    'O ConFin está no ar: quem quiser pode apontar a câmera para o QR code, criar uma conta e testar agora. Como próximos passos, queremos integrar com o Open Finance para importar os gastos direto do banco. Obrigado! Ficamos à disposição para perguntas.');
}

await pptx.writeFile({ fileName: SAIDA });
console.log('✔ Slides gerados em', SAIDA);

// ---------- Roteiro para ensaio ----------
const md = [
  '# Roteiro do pitch — ConFin (5 min)',
  '',
  '> Gerado automaticamente por `gerar-slides.js`. As mesmas falas estão nas **anotações do apresentador** de cada slide (no PowerPoint: Apresentação de Slides → Modo de Exibição do Apresentador).',
  '> A divisão "Apresentador 1–4" é uma sugestão. Troquem pelos nomes de quem vai falar cada parte.',
  '',
  '| # | Slide | Tempo | Quem |',
  '|---|---|---|---|',
  ...roteiro.map((r) => `| ${r.n} | ${r.titulo} | ${r.tempo} | ${r.quem} |`),
  '',
  ...roteiro.flatMap((r) => [`## ${r.n}. ${r.titulo} (${r.tempo}, ${r.quem})`, '', r.fala, '']),
].join('\n');
writeFileSync(path.join(AQUI, 'ROTEIRO.md'), md, 'utf8');
console.log('✔ Roteiro gerado em', path.join(AQUI, 'ROTEIRO.md'));
