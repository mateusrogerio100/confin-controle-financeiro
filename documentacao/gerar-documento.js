// Gera a documentação final do Projeto Integrador II em .docx, no padrão ABNT (NBR 14724, 6024, 6027, 6023, 6028).
// Uso: cd documentacao && npm install && node renderizar-figuras.js && node gerar-documento.js
// Depois: o script finalizar-word.ps1 abre o arquivo no Word, atualiza sumário/listas e exporta o PDF.
//
// Marcação simples usada nos textos:  **negrito**   _itálico_   [[campo a preencher]] (fica destacado em amarelo)

import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, Packer, PageNumber,
  Paragraph, SectionType, SequentialIdentifier, ShadingType, Table, TableCell, TableOfContents, TableRow, TabStopType,
  TextRun, VerticalAlign, WidthType, NumberFormat,
} from 'docx';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FIG = (n) => path.join(AQUI, 'figuras', n);
const SAIDA = path.join(AQUI, '..', 'Projeto Integrador II - Documentação de Software V3.docx');

// ---------------------------------------------------------------- medidas (DXA: 1 cm = 567)
const CM = 567;
const LARGURA_TEXTO = 16 * CM; // 21 cm - 3 cm (esq.) - 2 cm (dir.)
const FONTE = 'Arial';

// ---------------------------------------------------------------- texto com marcação
function runs(texto, base = {}) {
  const partes = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_|\[\[[^\]]+\]\])/g;
  let i = 0;
  for (const m of texto.matchAll(re)) {
    if (m.index > i) partes.push(new TextRun({ text: texto.slice(i, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) partes.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('[[')) partes.push(new TextRun({ text: t.slice(2, -2), highlight: 'yellow', ...base }));
    else partes.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    i = m.index + t.length;
  }
  if (i < texto.length) partes.push(new TextRun({ text: texto.slice(i), ...base }));
  return partes;
}

// Parágrafo do texto: justificado, recuo de 1,25 cm na primeira linha, espaçamento 1,5
const P = (texto, o = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  indent: o.semRecuo ? undefined : { firstLine: 709 },
  spacing: { line: 360, before: 0, after: 0 },
  keepNext: o.keepNext,
  children: runs(texto, o.run),
});

// Alíneas (NBR 6024): a), b), c)...
let instanciaAlinea = 0;
function alineas(itens) {
  instanciaAlinea += 1;
  return itens.map((t) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference: 'alinea', level: 0, instance: instanciaAlinea },
    spacing: { line: 360 },
    children: runs(t),
  }));
}
function subalineas(itens) {
  return itens.map((t) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    numbering: { reference: 'alinea', level: 1, instance: instanciaAlinea },
    spacing: { line: 360 },
    children: runs(t),
  }));
}

// Títulos (NBR 6024): seção primária em página nova
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H1c = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
// Títulos pré-textuais (sem número, centralizados, fora do sumário)
const TituloPre = (t, quebra = true) => new Paragraph({ style: 'TituloPre', pageBreakBefore: quebra, children: [new TextRun(t)] });

const vazio = (n = 1) => Array.from({ length: n }, () => new Paragraph({ spacing: { line: 360 }, children: [] }));

// ---------------------------------------------------------------- ilustrações (NBR 14724, 5.8)
const legenda = (rotulo, titulo) => new Paragraph({
  style: 'Legenda',
  keepNext: true,
  spacing: { before: 240, after: 80, line: 240 },
  children: [new TextRun(`${rotulo} `), new SequentialIdentifier(rotulo), new TextRun(` – ${titulo}`)],
});
const fonte = (t = 'Elaborado pelos autores (2026).') => new Paragraph({
  style: 'Legenda',
  alignment: AlignmentType.LEFT,
  spacing: { before: 80, after: 240, line: 240 },
  children: [new TextRun({ text: 'Fonte: ', bold: false }), ...runs(t)],
});

function tamanhoPng(arq) {
  const b = readFileSync(arq);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function figura(arquivo, titulo, larguraCm = 16, fonteTxt) {
  const { w, h } = tamanhoPng(FIG(arquivo));
  const larguraPx = Math.round((larguraCm / 2.54) * 96);
  const alturaPx = Math.round(larguraPx * (h / w));
  return [
    legenda('Figura', titulo),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { line: 240 },
      children: [new ImageRun({ type: 'png', data: readFileSync(FIG(arquivo)), transformation: { width: larguraPx, height: alturaPx } })],
    }),
    fonte(fonteTxt),
  ];
}

// Quadros: dados textuais, com todas as bordas
const borda = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };
function celula(conteudo, largura, { cabecalho = false, mono = false, centro = false } = {}) {
  const linhas = Array.isArray(conteudo) ? conteudo : [conteudo];
  return new TableCell({
    width: { size: largura, type: WidthType.DXA },
    borders: bordas,
    verticalAlign: VerticalAlign.CENTER,
    shading: cabecalho ? { type: ShadingType.CLEAR, color: 'auto', fill: 'D9D9D9' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: linhas.map((l) => new Paragraph({
      alignment: cabecalho || centro ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 240 },
      keepNext: true, // mantém o quadro inteiro na mesma página quando couber
      // Em código (mono) o texto vai literal: "_" faz parte dos nomes (id_familia), não é itálico
      children: mono
        ? [new TextRun({ text: l, size: 18, font: 'Courier New' })]
        : runs(l, { size: 20, bold: cabecalho || undefined, font: FONTE }),
    })),
  });
}
function quadro(titulo, colunasCm, cabecalho, linhas, o = {}) {
  const larguras = colunasCm.map((c) => Math.round(c * CM));
  const total = larguras.reduce((a, b) => a + b, 0);
  const rows = [];
  if (cabecalho) rows.push(new TableRow({ tableHeader: true, cantSplit: true, children: cabecalho.map((c, i) => celula(c, larguras[i], { cabecalho: true })) }));
  for (const l of linhas) {
    rows.push(new TableRow({ cantSplit: !o.permitirQuebra, children: l.map((c, i) => celula(c, larguras[i], { mono: o.mono, centro: o.centro?.includes(i) })) }));
  }
  return [
    legenda('Quadro', titulo),
    new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: larguras, alignment: AlignmentType.CENTER, rows }),
    fonte(o.fonte),
  ];
}

// ================================================================ ELEMENTOS PRÉ-TEXTUAIS
const EQUIPE = ['ISRAEL BATISTA DE FARIA', 'GABRIEL PIVA GARCIA CORAL', 'LUIS FELIPE PEREIRA', 'MATEUS ROGÉRIO DE SOUZA'];
const centro = (t, o = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { line: 360, before: o.antes ?? 0, after: 0 },
  children: runs(t, { bold: o.negrito, size: o.tamanho }),
});

const capa = [
  centro('FACULDADE DE TECNOLOGIA DE FRANCA', { negrito: true }),
  centro('CURSO SUPERIOR DE TECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS', { negrito: true }),
  centro(EQUIPE[0], { antes: 2400 }),
  ...EQUIPE.slice(1).map((n) => centro(n)),
  centro('SISTEMA DE CONTROLE FINANCEIRO FAMILIAR – CONFIN', { negrito: true, antes: 3000 }),
  centro('Documentação de Software'),
  centro('FRANCA', { antes: 3500 }),
  centro('2026'),
];

const folhaDeRosto = [
  ...EQUIPE.map((n) => centro(n)),
  centro('SISTEMA DE CONTROLE FINANCEIRO FAMILIAR – CONFIN', { negrito: true, antes: 3300 }),
  centro('Documentação de Software'),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 8 * CM },
    spacing: { before: 1400, line: 240 },
    children: runs('Documentação de software apresentada à disciplina Projeto Integrador II do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas da Faculdade de Tecnologia de Franca, como requisito parcial para aprovação.', { size: 20 }),
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 8 * CM },
    spacing: { before: 240, line: 240 },
    children: runs('Orientadora: Prof.ª Natalie Rodrigues Alves Ferreira de Andrade.', { size: 20 }),
  }),
  centro('FRANCA', { antes: 3000 }),
  centro('2026'),
];

const resumo = [
  TituloPre('RESUMO'),
  ...vazio(),
  P('O controle financeiro familiar é frequentemente prejudicado pela dispersão das despesas entre diferentes membros e meios de pagamento, o que dificulta o acompanhamento do orçamento mensal e retarda a percepção de que o limite de gastos foi atingido. Este trabalho apresenta a documentação e o desenvolvimento do ConFin, um sistema web colaborativo de controle financeiro familiar, no qual os membros de uma família registram suas despesas e acompanham, em tempo real, o saldo do orçamento compartilhado. Os requisitos foram levantados por meio de questionários aplicados a 15 famílias e de entrevistas, e especificados em requisitos funcionais, requisitos não funcionais e regras de negócio, modelados com diagramas UML e BPMN. O Produto Mínimo Viável foi implementado como Progressive Web App, com front-end em React, back-end em Node.js com Express, comunicação em tempo real por WebSocket (Socket.io) e banco de dados relacional PostgreSQL, e publicado em nuvem no modelo de Plataforma como Serviço, com custo zero. O sistema permite cadastrar usuários, criar grupos familiares, registrar e categorizar despesas e visualizar um painel com o saldo do mês, gráficos e alertas automáticos ao atingir 80% e 100% do limite definido. Conclui-se que a solução atende aos requisitos propostos e contribui para a transparência e a organização financeira das famílias.', { semRecuo: true }),
  ...vazio(),
  P('**Palavras-chave:** controle financeiro familiar; aplicação web progressiva; tempo real; engenharia de software.', { semRecuo: true }),
];

const abstract = [
  TituloPre('ABSTRACT'),
  ...vazio(),
  P('Household financial control is often hindered by expenses being spread across different family members and payment methods, which makes it difficult to track the monthly budget and delays the perception that the spending limit has been reached. This work presents the documentation and development of ConFin, a collaborative web system for household financial control, in which family members record their expenses and follow, in real time, the balance of the shared budget. Requirements were gathered through questionnaires applied to 15 families and interviews, and specified as functional requirements, non-functional requirements and business rules, modeled with UML and BPMN diagrams. The Minimum Viable Product was implemented as a Progressive Web App, with a React front-end, a Node.js and Express back-end, real-time communication through WebSocket (Socket.io) and a PostgreSQL relational database, and was deployed to the cloud under the Platform as a Service model, at no cost. The system allows users to register, create family groups, record and categorize expenses and view a dashboard with the monthly balance, charts and automatic alerts when 80% and 100% of the defined limit are reached. It is concluded that the solution meets the proposed requirements and contributes to the transparency and financial organization of families.', { semRecuo: true, run: { italics: false } }),
  ...vazio(),
  P('**Keywords:** household financial control; progressive web app; real time; software engineering.', { semRecuo: true }),
];

const marcador = (t) => new Paragraph({ children: [new TextRun(t)] });

const listaIlustracoes = [TituloPre('LISTA DE ILUSTRAÇÕES'), ...vazio(), marcador('{{LISTA_FIGURAS}}')];
const listaQuadros = [TituloPre('LISTA DE QUADROS'), ...vazio(), marcador('{{LISTA_QUADROS}}')];

const SIGLAS = [
  ['ABNT', 'Associação Brasileira de Normas Técnicas'], ['API', 'Application Programming Interface (Interface de Programação de Aplicações)'],
  ['BPMN', 'Business Process Model and Notation'], ['CSS', 'Cascading Style Sheets'], ['EAP', 'Estrutura Analítica do Projeto'],
  ['FK', 'Foreign Key (chave estrangeira)'], ['HTML', 'HyperText Markup Language'], ['HTTP', 'HyperText Transfer Protocol'],
  ['HTTPS', 'HyperText Transfer Protocol Secure'], ['IaaS', 'Infrastructure as a Service (Infraestrutura como Serviço)'],
  ['JSON', 'JavaScript Object Notation'], ['JWT', 'JSON Web Token'], ['MVP', 'Minimum Viable Product (Produto Mínimo Viável)'],
  ['PaaS', 'Platform as a Service (Plataforma como Serviço)'], ['PK', 'Primary Key (chave primária)'], ['PWA', 'Progressive Web App'],
  ['REST', 'Representational State Transfer'], ['RF', 'Requisito Funcional'], ['RLS', 'Row Level Security'], ['RN', 'Regra de Negócio'],
  ['RNF', 'Requisito Não Funcional'], ['SQL', 'Structured Query Language'], ['SSL', 'Secure Sockets Layer'],
  ['SWOT', 'Strengths, Weaknesses, Opportunities and Threats'], ['TAP', 'Termo de Abertura do Projeto'], ['UC', 'Use Case (Caso de Uso)'],
  ['UML', 'Unified Modeling Language'],
];
const listaSiglas = [
  TituloPre('LISTA DE ABREVIATURAS E SIGLAS'),
  ...vazio(),
  ...SIGLAS.map(([s, d]) => new Paragraph({
    tabStops: [{ type: TabStopType.LEFT, position: 2 * CM }],
    spacing: { line: 360 },
    children: [new TextRun(s), new TextRun('\t' + d)],
  })),
];

const sumario = [
  TituloPre('SUMÁRIO'),
  ...vazio(),
  new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-3' }),
];

// ================================================================ ELEMENTOS TEXTUAIS
const textual = [];
const add = (...xs) => textual.push(...xs.flat());

// ---------------------------------------------------------------- 1 INTRODUÇÃO
add(
  H1('1 INTRODUÇÃO'),
  H2('1.1 CONTEXTO DO PROBLEMA'),
  P('O controle financeiro familiar consiste em uma prática fundamental para assegurar a estabilidade econômica e promover uma organização eficiente das despesas domésticas (CERBASI, 2004). No cenário contemporâneo, observa-se que diversas famílias encontram obstáculos substanciais na administração conjunta de seus recursos. Essa dificuldade é agravada pela pluralidade de métodos de pagamento adotados individualmente por cada membro, tais como cartões de crédito, débito e transações via PIX. Adicionalmente, as despesas fixas inerentes à manutenção da residência, exemplificadas pelos custos com água, energia elétrica e provedores de internet, frequentemente recaem sob a responsabilidade de um único indivíduo, o que fragmenta as informações e inviabiliza a consolidação de uma visão holística e transparente acerca dos dispêndios mensais do núcleo familiar.'),
  H2('1.2 JUSTIFICATIVA'),
  P('A relevância deste estudo fundamenta-se na demanda progressiva por educação e controle financeiro aplicados ao contexto doméstico. Nota-se que uma parcela significativa das famílias carece de ferramentas tecnológicas e metodológicas apropriadas para o monitoramento rigoroso de seus gastos, um fator que, segundo a literatura especializada, atua como catalisador para o superendividamento e severas crises financeiras (MULLAINATHAN; SHAFIR, 2013). Desse modo, o desenvolvimento do sistema proposto visa mitigar essa lacuna, contribuindo ativamente para uma gestão financeira mais otimizada e eficiente. O intuito é fomentar a transparência das movimentações, aprimorar o planejamento estratégico e instigar uma maior conscientização dos usuários quanto ao comportamento de consumo.'),
  H2('1.3 OBJETIVO DO SISTEMA'),
  P('Este trabalho tem como propósito central propor a concepção e o desenvolvimento de um sistema de controle financeiro familiar. O objetivo primordial é prover suporte às famílias no gerenciamento de suas despesas e no monitoramento do orçamento doméstico, por meio de uma interface intuitiva, de fácil usabilidade e com recursos colaborativos. Funcionalmente, o software possibilita o registro sistemático de despesas, a categorização analítica dos gastos, a estruturação de grupos familiares e o acompanhamento dinâmico e em tempo real do fluxo de caixa.'),
  P('Por conseguinte, o projeto almeja entregar uma solução tecnológica que viabilize a gestão financeira coletiva, democratizando o acesso às informações sobre os gastos para todos os membros da família e estimulando a colaboração na governança do orçamento mensal. Com essa abordagem, espera-se promover um nível superior de organização financeira, mitigar desperdícios de capital e aprimorar o planejamento econômico a longo prazo do núcleo familiar.'),
  H2('1.4 METODOLOGIA'),
  P('Para a condução e execução do presente projeto, adotou-se uma metodologia de desenvolvimento de software pautada nos processos de levantamento e análise de requisitos, em consonância com as diretrizes da Engenharia de Software (SOMMERVILLE, 2019; PRESSMAN; MAXIM, 2021). A coleta de dados operou-se mediante a aplicação de técnicas consagradas de elicitação de requisitos, notadamente a aplicação de questionários e a realização de entrevistas semiestruturadas com diferentes arranjos familiares. Tais instrumentos permitiram o mapeamento empírico dos principais óbices enfrentados no cotidiano da gestão financeira doméstica. A partir das evidências empíricas coletadas, procedeu-se à especificação rigorosa dos requisitos sistêmicos, os quais foram estruturados em épicos, funcionalidades, histórias de usuário e critérios de aceite. Essa sistematização metodológica garantiu a construção de um Produto Mínimo Viável (MVP, do inglês _Minimum Viable Product_) estritamente alinhado às demandas reais e às expectativas dos usuários finais.'),
  P('O desenvolvimento foi organizado em ciclos curtos (_sprints_), com entregas incrementais: levantamento de requisitos, prototipação das interfaces, modelagem do sistema e do banco de dados, implementação do MVP e, por fim, implantação em ambiente de nuvem.'),
);

// ---------------------------------------------------------------- 2 DOCUMENTO DE VISÃO
add(
  H1('2 DOCUMENTO DE VISÃO'),
  H2('2.1 DESCRIÇÃO DO PROBLEMA'),
  P('A gestão financeira familiar frequentemente esbarra na falta de centralização e na comunicação ineficiente sobre as despesas do cotidiano. A multiplicidade de meios de pagamento utilizados individualmente por cada membro, como cartões de crédito, débito e transferências via PIX, fragmenta o acompanhamento do orçamento. Somado a isso, a centralização do pagamento de contas fixas essenciais (como água, energia elétrica e provedores de internet) em um único indivíduo obscurece a visão global dos gastos. Esse cenário dificulta o planejamento financeiro conjunto, limitando a visualização completa das finanças e potencializando o risco de descontrole econômico no ambiente doméstico.'),
  H2('2.2 PÚBLICO-ALVO'),
  P('O sistema destina-se a famílias que buscam aprimorar o controle de suas finanças, casais que compartilham despesas domésticas e indivíduos interessados em estabelecer um planejamento financeiro familiar colaborativo e transparente.'),
  H2('2.3 OBJETIVOS DO SISTEMA'),
  P('O objetivo central consiste em fornecer uma solução tecnológica acessível que viabilize o controle financeiro coletivo. O sistema deve permitir que todos os membros do grupo familiar registrem despesas, categorizem gastos, criem grupos e acompanhem as movimentações financeiras em tempo real. Dessa forma, busca-se democratizar o acesso à informação e fomentar a participação ativa de todos os integrantes na administração e na tomada de decisão sobre o orçamento mensal.'),
  H2('2.4 BENEFÍCIOS ESPERADOS'),
  P('Espera-se que a adoção do sistema proporcione uma organização financeira superior, culminando na redução significativa de desperdícios e na otimização do planejamento econômico familiar. Além disso, a ferramenta visa promover a transparência nas relações financeiras, facilitar o acompanhamento do fluxo de caixa e elevar a conscientização e a educação financeira dos usuários sobre seus hábitos de consumo.'),
  H2('2.5 MISSÃO, VISÃO E VALORES'),
  P('Com base na proposta de valor e nos fundamentos do projeto, estabelecem-se as seguintes diretrizes institucionais:'),
  alineas([
    '**missão:** oferecer às famílias uma plataforma tecnológica prática, intuitiva e colaborativa para o controle de despesas domésticas, promovendo a organização, a transparência e a saúde financeira;',
    '**visão:** consolidar-se como a principal ferramenta tecnológica de gestão financeira familiar, transformando a relação das famílias com o orçamento por meio da conscientização e do planejamento econômico integrado;',
    '**valores:**',
  ]),
  subalineas([
    '**colaboração:** fomentar a participação de todos os membros da família na gestão dos recursos compartilhados;',
    '**transparência:** garantir clareza e visibilidade total das informações financeiras para o grupo;',
    '**conscientização:** estimular a educação financeira e a mitigação do endividamento;',
    '**acessibilidade:** prover uma interface simples e atualizações em tempo real para facilitar o uso no cotidiano.',
  ]),
);

// ---------------------------------------------------------------- 3 PLANEJAMENTO
add(
  H1('3 PLANEJAMENTO E VIABILIDADE DO PROJETO'),
  H2('3.1 TAP – TERMO DE ABERTURA DO PROJETO'),
  P('O Termo de Abertura do Projeto (TAP) formaliza o início do desenvolvimento do sistema de controle financeiro familiar, estabelecendo suas diretrizes fundamentais e alinhando as expectativas entre todas as partes interessadas:'),
  alineas([
    '**objetivo:** desenvolver um sistema computacional focado no controle financeiro familiar, projetado para facilitar o gerenciamento colaborativo de despesas e o acompanhamento assertivo do orçamento doméstico;',
    '**escopo inicial:** o projeto contempla a construção de um Produto Mínimo Viável (MVP) provido das seguintes funcionalidades essenciais: registro de despesas, categorização de gastos, criação de grupos familiares e painel de acompanhamento do saldo em tempo real;',
    '**partes interessadas (_stakeholders_):** a equipe de desenvolvimento (estudantes do curso), professores e orientadores avaliadores do projeto integrador, além do público-alvo constituído por famílias e casais;',
    '**restrições:** o desenvolvimento está condicionado ao calendário acadêmico de 2026. Além disso, há restrição orçamentária, exigindo o emprego de _frameworks_ de código aberto (_open source_) e serviços de hospedagem gratuitos ou educacionais;',
    '**premissas:** assume-se que os usuários finais disporão de dispositivos conectados à internet (smartphones ou computadores) e que demonstrarão engajamento colaborativo para a inserção frequente dos dados financeiros na plataforma.',
  ]),
  H2('3.2 EAP – ESTRUTURA ANALÍTICA DO PROJETO'),
  P('A Estrutura Analítica do Projeto (EAP) decompõe o trabalho em pacotes menores e gerenciáveis, organizados cronologicamente e por área de atuação, a fim de facilitar o monitoramento do progresso:'),
  alineas([
    '**iniciação e planejamento:** elaboração do TAP e do Documento de Visão; levantamento, elicitação e análise de requisitos;',
    '**design e modelagem:** criação de diagramas UML; prototipação de interfaces de usuário (UI/UX); modelagem estrutural do banco de dados;',
    '**desenvolvimento:** implementação do back-end e das APIs; implementação do front-end (interface web e mobile); integração do sistema com o banco de dados;',
    '**testes e validação:** execução de testes de integração; homologação baseada nos critérios de aceite;',
    '**encerramento:** implantação do software em nuvem (_deploy_); entrega da documentação acadêmica final e apresentação.',
  ]),
  H2('3.3 MATRIZ SWOT'),
  P('O Quadro 1 apresenta a análise dos fatores internos (forças e fraquezas) e externos (oportunidades e ameaças) do projeto.', { keepNext: true }),
  quadro('Matriz SWOT do projeto', [8, 8], ['Fatores internos', 'Fatores externos'], [
    [['**Forças (_Strengths_)**', '– Interface intuitiva focada na colaboração familiar.', '– Atualização do orçamento em tempo real para todo o grupo.', '– Centralização de múltiplas origens de despesas (cartões, PIX, contas fixas).'],
     ['**Oportunidades (_Opportunities_)**', '– Crescente demanda social por educação financeira doméstica.', '– Lacuna no mercado para planejamento verdadeiramente compartilhado.', '– Possibilidade de futura integração com APIs bancárias (Open Finance).']],
    [['**Fraquezas (_Weaknesses_)**', '– Dependência da rotina dos usuários para inserção manual contínua.', '– Restrições técnicas e de tempo de um projeto acadêmico.', '– Ausência de orçamento para infraestrutura premium.'],
     ['**Ameaças (_Threats_)**', '– Presença consolidada de grandes aplicativos (ex.: Mobills, Organizze).', '– Resistência das famílias em modernizar métodos empíricos.', '– Preocupações dos usuários com a segurança de dados.']],
  ]),
  H2('3.4 MATRIZ 5W2H'),
  P('O Quadro 2 sintetiza o planejamento do projeto segundo a ferramenta 5W2H.', { keepNext: true }),
  quadro('Matriz 5W2H do projeto', [3.4, 12.6], ['Diretriz', 'Descrição / aplicação no projeto'], [
    ['**What** (o quê)', 'Desenvolvimento e documentação de um sistema web/mobile para controle e gestão financeira familiar colaborativa (entrega de MVP).'],
    ['**Why** (por quê)', 'Para solucionar a fragmentação no acompanhamento de despesas conjuntas e promover a educação e a transparência financeira.'],
    ['**Where** (onde)', 'Desenvolvimento em ambiente acadêmico, com hospedagem em nuvem nas plataformas Render (aplicação) e Supabase (banco de dados).'],
    ['**When** (quando)', 'Ao longo do ano letivo de 2026, respeitando o cronograma acadêmico.'],
    ['**Who** (quem)', 'Equipe de acadêmicos do curso de Tecnologia em Análise e Desenvolvimento de Sistemas.'],
    ['**How** (como)', 'Por meio de metodologias ágeis, levantamento de requisitos, modelagem e codificação em JavaScript (React no front-end e Node.js no back-end).'],
    ['**How much** (quanto)', 'Impacto financeiro nulo (uso de planos gratuitos e de software de código aberto). O investimento primário são as horas de desenvolvimento da equipe.'],
  ]),
);

// ---------------------------------------------------------------- 4 REQUISITOS
add(
  H1('4 REQUISITOS'),
  H2('4.1 ELICITAÇÃO DE REQUISITOS'),
  P('As técnicas de elicitação empregadas consistiram em questionários online aplicados a um grupo de 15 famílias, bem como em entrevistas simuladas com perfis de “chefe de família” e “dependentes”. Além disso, realizou-se a observação indireta do uso de planilhas financeiras (Microsoft Excel) habitualmente adotadas pelos usuários, para identificar as deficiências no modelo atual (falta de colaboração simultânea). As perguntas e respostas mais representativas estão no Apêndice A.'),
  H2('4.2 REQUISITOS FUNCIONAIS'),
  P('Os requisitos funcionais descrevem os serviços que o sistema deve oferecer e estão relacionados no Quadro 3, com as regras de negócio associadas a cada um.', { keepNext: true }),
  quadro('Requisitos funcionais', [1.6, 2.6, 6.4, 1.9, 2.0, 1.5], ['ID', 'Nome', 'Descrição', 'Categoria', 'Prioridade', 'RN'], [
    ['RF001', 'Cadastrar usuário', 'O sistema deve permitir o cadastro de um usuário informando nome, e-mail e senha, sendo a senha armazenada de forma segura (_hash_).', 'Evidente', 'Essencial', 'RN001'],
    ['RF002', 'Registrar despesa', 'O sistema deve permitir o registro de despesas contendo valor, data, categoria e meio de pagamento, com descrição opcional.', 'Evidente', 'Essencial', 'RN002'],
    ['RF003', 'Criar grupo familiar', 'O usuário criador do grupo (Administrador) pode convidar novos membros, por e-mail ou por código de convite, para compor o mesmo orçamento (família).', 'Evidente', 'Essencial', 'RN003'],
    ['RF004', 'Dashboard de saldo', 'O sistema deve exibir o total gasto em relação ao limite do orçamento no mês atual, atualizado em tempo real para todos os membros.', 'Oculto', 'Importante', 'RN004'],
  ], { centro: [0, 3, 4, 5] }),
  H2('4.3 REGRAS DE NEGÓCIO'),
  P('As regras de negócio estabelecem restrições e políticas que o sistema deve respeitar. Na versão anterior deste documento, as regras RN003 e RN004 eram citadas nos requisitos funcionais, mas não estavam definidas; o Quadro 4 apresenta todas as regras, com a forma como foram implementadas.', { keepNext: true }),
  quadro('Regras de negócio', [1.6, 8.4, 6.0], ['ID', 'Regra', 'Implementação'], [
    ['RN001', 'Um e-mail só pode ser cadastrado uma única vez no sistema.', 'Restrição UNIQUE no banco de dados e verificação na API.'],
    ['RN002', 'O valor de uma despesa deve ser maior que zero.', 'Restrição CHECK (valor > 0) no banco, validação na API e no formulário.'],
    ['RN003', 'Apenas o Administrador do grupo pode convidar ou remover membros e alterar o nome e o limite mensal da família. O usuário que cria o grupo torna-se seu Administrador.', 'Verificação de permissão na API e ocultação dos controles para membros comuns.'],
    ['RN004', 'O sistema deve alertar visualmente todos os membros quando os gastos do mês atingirem 80% (atenção) e 100% (limite estourado) do limite mensal.', 'Cálculo do nível de alerta no back-end, enviado em tempo real aos membros.'],
  ], { centro: [0] }),
  H2('4.4 REQUISITOS NÃO FUNCIONAIS'),
  P('Os requisitos não funcionais definem qualidades e restrições do sistema e estão listados no Quadro 5. Em relação à versão anterior, o RNF003 foi atualizado: o algoritmo SHA-256, por ser rápido, facilita ataques de força bruta e não é indicado para o armazenamento de senhas, sendo substituído pelo bcrypt, que é deliberadamente lento e incorpora _salt_ aleatório (OWASP FOUNDATION, 2026). Também foram acrescentados os requisitos RNF004 a RNF006, já atendidos pela implementação.', { keepNext: true }),
  quadro('Requisitos não funcionais', [1.8, 9.2, 2.5, 2.5], ['ID', 'Descrição', 'Tipo', 'Permanência'], [
    ['RNF001', 'O sistema deve responder a requisições de cadastro e de inclusão de gasto em no máximo 2 segundos.', 'Obrigatório', 'Permanente'],
    ['RNF002', 'A interface deve ser totalmente responsiva, projetada primeiro para dispositivos móveis (_Mobile First_).', 'Obrigatório', 'Permanente'],
    ['RNF003', 'As senhas devem ser armazenadas exclusivamente na forma de _hash_ gerado pelo algoritmo bcrypt (fator de custo 10), que incorpora _salt_ aleatório; nenhuma senha é armazenada em texto puro.', 'Obrigatório', 'Permanente'],
    ['RNF004', 'A comunicação entre cliente e servidor deve ocorrer exclusivamente por HTTPS.', 'Obrigatório', 'Permanente'],
    ['RNF005', 'O acesso às funcionalidades protegidas exige autenticação por token JWT com validade de 7 dias.', 'Obrigatório', 'Permanente'],
    ['RNF006', 'As alterações no orçamento devem ser propagadas aos demais membros conectados em até 2 segundos.', 'Desejável', 'Permanente'],
  ], { centro: [0, 2, 3] }),
  H2('4.5 BPMN'),
  P('O mapeamento do processo atual (AS-IS) revelou que, atualmente, os membros da família executam compras (supermercado, farmácia, lazer) de forma individual. O registro dessas transações geralmente é enviado por mensagens de texto em aplicativos (WhatsApp). Ao final do mês, um membro centralizador (frequentemente um dos pais) coleta as notas e as conversas para inserir manualmente em uma planilha local. Esse processo resulta em gargalos de comunicação, atrasos no reconhecimento de que o limite do orçamento foi atingido e alta taxa de esquecimento de pequenos gastos.'),
  P('O processo futuro (TO-BE), apoiado pelo sistema, elimina a necessidade da planilha manual. Cada membro registra a despesa diretamente no celular, por meio do aplicativo (PWA), no exato momento da compra, consolidando o saldo familiar quase instantaneamente e notificando os demais membros.'),
);

// ---------------------------------------------------------------- 5 GLOSSÁRIO
add(
  H1('5 GLOSSÁRIO (INGLÊS I)'),
  P('O Quadro 6 reúne termos técnicos em inglês empregados no projeto, com sua tradução e definição.', { keepNext: true }),
  quadro('Glossário de termos técnicos', [3.6, 3.8, 8.6], ['Termo', 'Tradução', 'Definição'], [
    ['API', 'Interface de Programação de Aplicações', 'Conjunto de regras que define como um programa se comunica com outro; no ConFin, é por meio dela que o aplicativo conversa com o servidor.'],
    ['Cloud Computing', 'Computação em Nuvem', 'Entrega de serviços de computação (servidores, armazenamento, bancos de dados, redes) pela internet.'],
    ['Dashboard', 'Painel de Controle', 'Interface gráfica que consolida informações e métricas vitais para a tomada de decisão rápida.'],
    ['Database', 'Banco de Dados', 'Conjunto estruturado de dados armazenados de forma eletrônica em um sistema de computador.'],
    ['Deploy', 'Implantação', 'Ato de disponibilizar o software construído em um ambiente de produção para os usuários finais.'],
    ['Framework', 'Estrutura de Trabalho', 'Conjunto de códigos e bibliotecas prontas que facilitam e aceleram o desenvolvimento de um software.'],
    ['Hash', 'Resumo criptográfico', 'Transformação de mão única de um dado em um código de tamanho fixo, usada para armazenar senhas sem guardá-las em texto puro.'],
    ['Platform as a Service (PaaS)', 'Plataforma como Serviço', 'Modelo de nuvem em que o provedor entrega um ambiente pronto para executar aplicações, sem necessidade de administrar servidores.'],
    ['Progressive Web App (PWA)', 'Aplicativo Web Progressivo', 'Site que pode ser instalado no dispositivo como um aplicativo, com ícone próprio e execução em tela cheia.'],
    ['WebSocket', 'Soquete web', 'Protocolo que mantém uma conexão aberta e bidirecional entre navegador e servidor, permitindo atualizações em tempo real.'],
  ]),
);

// ---------------------------------------------------------------- 6 PROTÓTIPO
add(
  H1('6 PROTÓTIPO DO SISTEMA E DESENVOLVIMENTO DA PÁGINA WEB'),
  H2('6.1 IMAGENS DAS TELAS'),
  P('A interface foi concebida em etapas. A etapa de rabiscoframe (baixa fidelidade) foi fundamental para validar a disposição inicial dos elementos estruturais do sistema antes da transição para a prototipação digital de alta fidelidade (_Family Financial Control Prototype_ – Figma Make), cujas telas foram validadas junto à docente no decorrer da Sprint 2.'),
  P('As Figuras 1 a 3 apresentam as telas do sistema implementado (MVP), capturadas com os dados de demonstração de uma família fictícia (Família Souza).', { keepNext: true }),
  figura('telas-1.png', 'Telas de login, dashboard e registro de despesa (celular)', 15.5),
  figura('telas-2.png', 'Telas de atualização em tempo real, grupo familiar e histórico (celular)', 15.5),
  figura('telas-desktop.png', 'Dashboard exibido em computador', 16),
  H2('6.2 DESCRIÇÃO DE CADA TELA'),
  P('A concepção da interface seguiu princípios de usabilidade e objetividade para atender ao público-alvo. A seguir, detalha-se o comportamento de cada tela principal:'),
  alineas([
    '**tela de login e cadastro** (Figura 1a): autentica o usuário no sistema ou permite o registro de um novo membro. Apresenta campos para e-mail e senha, um botão de ação primária “Entrar” e a opção “Criar conta”. O link “Esqueci a senha” está previsto para uma versão futura. Após a autenticação, o usuário é redirecionado ao painel principal;',
    '**tela de boas-vindas (_onboarding_)**: exibida no primeiro acesso, permite ao usuário criar uma nova família, tornando-se seu Administrador, ou entrar em uma família existente por meio de um código de convite;',
    '**dashboard – tela principal** (Figuras 1b e 3): atua como o centro de informações do aplicativo. Apresenta o saldo disponível no mês, o percentual consumido do limite com alertas em 80% e 100% (RN004), quanto ainda pode ser gasto por dia até o fim do mês, os gastos por membro (“Quem gastou”), um gráfico de despesas por categoria, a comparação dos últimos seis meses com o limite e as últimas transações. O indicador “Ao vivo” mostra que a tela recebe atualizações em tempo real;',
    '**tela de registro de despesas** (Figura 1c): formulário com campo de valor (com máscara de moeda), seleção de categoria (Contas da casa, Mercado, Alimentação, Transporte, Lazer, Saúde, Educação e Outros), meio de pagamento (Crédito, Débito, PIX e Dinheiro), data e descrição opcional. Antes de salvar, exibe uma prévia do impacto da despesa no saldo. Os botões “Salvar” e “Cancelar” comandam a submissão dos dados, que, uma vez validados, atualizam imediatamente o saldo de todos os membros (Figura 2a);',
    '**tela de gerenciamento do grupo familiar** (Figura 2b): permite ao Administrador alterar o limite mensal, convidar integrantes por e-mail ou pelo código de convite (que pode ser renovado) e remover membros. Os membros comuns visualizam o grupo e podem sair da família;',
    '**tela de histórico** (Figura 2c): lista as despesas do mês, com filtros por categoria e por membro e busca por descrição. As despesas podem ser editadas ou excluídas pelo próprio autor ou pelo Administrador.',
  ]),
  H2('6.3 FERRAMENTAS UTILIZADAS'),
  P('Para a confecção das interfaces na fase de ideação (rabiscoframe), foram empregados materiais analógicos convencionais, visando agilidade na materialização das ideias: papel sulfite tamanho A4, lápis grafite, borracha e régua para alinhar os componentes de navegação e os blocos de texto. Posteriormente, consolidando a identidade visual e as interações do projeto, a equipe migrou o escopo visual para o meio digital por meio da plataforma de design colaborativo Figma, desenvolvendo a versão de alta fidelidade que guiou a codificação.'),
  P('Na implementação, as telas foram construídas com a biblioteca React, o empacotador Vite e o _framework_ de estilos Tailwind CSS; os gráficos utilizam a biblioteca Recharts. O código-fonte foi versionado com Git e hospedado no GitHub.'),
);

// ---------------------------------------------------------------- 7 FLUXO DE NAVEGAÇÃO
add(
  H1('7 FLUXO DE NAVEGAÇÃO'),
  H2('7.1 FLUXOGRAMA DE TELAS'),
  P('O percurso lógico inicia pela página de autenticação (login/cadastro). No primeiro acesso, após o cadastro, o usuário passa pela tela de boas-vindas, onde cria uma família ou entra em uma existente por código de convite. Após a confirmação das credenciais, ocorre o redirecionamento para o Dashboard (Início). A partir dele, um menu de navegação inferior (_bottom navigation bar_) direciona o usuário para as rotas principais: Início, Histórico, Nova despesa (botão central “+”) e Família. Em computadores, o mesmo menu é exibido na lateral esquerda.'),
  H2('7.2 EXPLICAÇÃO DO FLUXO'),
  P('O fluxo foi estruturado visando a menor quantidade de interações (cliques ou toques) para a execução da tarefa mais repetitiva do sistema: o lançamento de uma despesa. Posicionar o botão principal de registro no centro do menu inferior, disponível em todas as telas, garante que o usuário consiga iniciar o registro de uma despesa em, no máximo, dois toques a partir do carregamento do aplicativo, garantindo eficiência na experiência de uso (UX).'),
);

// ---------------------------------------------------------------- 8 UML
add(
  H1('8 DIAGRAMAS UML E RASTREABILIDADE'),
  H2('8.1 DIAGRAMA DE CASO DE USO'),
  P('Foram mapeados dois atores principais: o Administrador da Família, capaz de convidar e remover membros e alterar o limite do orçamento, e o Membro Familiar, capaz de registrar gastos próprios e visualizar o resumo. Como mostra a Figura 4, o Administrador é uma especialização do Membro Familiar e herda todos os seus casos de uso.', { keepNext: true }),
  figura('caso-de-uso.png', 'Diagrama de casos de uso do ConFin', 15),
  H2('8.2 DOCUMENTAÇÃO DE CASO DE USO'),
  P('O Quadro 7 documenta o caso de uso UC002 – Registrar despesa, o mais frequente do sistema.', { keepNext: true }),
  quadro('Documentação do caso de uso UC002 – Registrar despesa', [3.6, 12.4], ['Campo', 'Descrição'], [
    ['**ID**', 'UC002'],
    ['**Descrição**', 'Este caso de uso tem por objetivo registrar uma nova despesa financeira na conta familiar.'],
    ['**Ator primário**', 'Membro Familiar (ou Administrador).'],
    ['**Pré-condição**', 'Usuário autenticado e inserido em um grupo familiar ativo.'],
    ['**Cenário principal**', ['1. O usuário aciona “Nova despesa”.', '2. O sistema exibe o formulário.', '3. O usuário preenche valor, categoria, meio de pagamento e data e salva.', '4. O sistema valida os dados (RN002), registra a despesa, recalcula o saldo do mês e atualiza o Dashboard de todos os membros em tempo real.']],
    ['**Pós-condição**', 'Despesa registrada e saldo consolidado com sucesso.'],
    ['**Cenário alternativo**', 'Se o valor inserido ultrapassar o limite pré-estabelecido do mês, o sistema dispara um alerta visual (RN004), mas permite a conclusão, gerando saldo negativo.'],
    ['**Cenário de exceção**', 'Se o valor for menor ou igual a zero ou faltar um campo obrigatório, o sistema exibe uma mensagem de erro e não registra a despesa (RN002).'],
  ]),
  H2('8.3 DIAGRAMA DE ATIVIDADES'),
  P('A atividade de lançamento de uma despesa, representada na Figura 5, desenrola-se da seguinte maneira: início, preenchimento dos dados, validação no back-end (dados válidos e valor positivo?). Em caso de erro, o sistema retorna um aviso e o usuário corrige os dados; em caso de sucesso, a despesa é persistida no banco de dados, o saldo do mês é recalculado e, se os gastos atingirem 80% do limite, é exibido um alerta. Por fim, a família é notificada em tempo real e a interface é atualizada.', { keepNext: true }),
  figura('atividades.png', 'Diagrama de atividades do registro de despesa', 11),
  H2('8.4 DIAGRAMA DE SEQUÊNCIA'),
  P('O fluxo síncrono acontece entre o navegador (cliente), que envia uma requisição POST para a API (servidor Node.js); a API verifica o token JWT, encaminha a instrução SQL para o PostgreSQL (banco de dados), aguarda o retorno positivo e devolve o status HTTP 201 (_Created_) ao cliente.'),
  P('Após a confirmação da gravação, o servidor emite o evento “familia:mudou” por WebSocket (Socket.io) para a sala da família. Os navegadores dos demais membros conectados recebem o evento, solicitam o resumo atualizado e redesenham o painel, sem necessidade de recarregar a página. A Figura 6 representa essa interação.', { keepNext: true }),
  figura('sequencia.png', 'Diagrama de sequência do registro de despesa com atualização em tempo real', 16),
  H2('8.5 MODELO DE DADOS'),
  P('O modelo relacional, apresentado na Figura 7, possui quatro entidades: **familia** (nome, limite mensal e código de convite), **usuario** (nome, e-mail único, _hash_ da senha, papel ADMIN ou MEMBRO e chave estrangeira para a família), **despesa** (valor positivo, data, categoria, meio de pagamento, descrição e chaves estrangeiras para usuário e família) e **convite** (e-mail convidado e família). A entidade familia é central: o saldo é calculado a partir do limite da família menos a soma das despesas do mês de todos os seus membros. Os valores monetários utilizam o tipo NUMERIC(12,2), que armazena números decimais exatos, evitando erros de arredondamento.', { keepNext: true }),
  figura('modelo-dados.png', 'Modelo entidade-relacionamento do ConFin', 16),
  H2('8.6 MATRIZ DE RASTREABILIDADE'),
  P('A matriz de rastreabilidade (Quadro 8) relaciona cada requisito funcional às regras de negócio e ao ponto da aplicação em que foi implementado, permitindo verificar que todos os requisitos foram atendidos.', { keepNext: true }),
  quadro('Matriz de rastreabilidade: requisitos × regras de negócio', [3.4, 6.6, 6.0], ['Requisito', 'Regra de negócio', 'Implementação'], [
    ['RF001 – Cadastro', 'RN001 – Um e-mail só pode ser cadastrado uma única vez.', 'Rota de cadastro e restrição UNIQUE.'],
    ['RF002 – Despesa', 'RN002 – Despesas não podem ter valores negativos ou nulos.', 'Rota de despesas e restrição CHECK.'],
    ['RF003 – Grupo familiar', 'RN003 – Apenas o Administrador gerencia membros e limite.', 'Rotas de família com verificação de papel.'],
    ['RF004 – Dashboard', 'RN004 – Alertas em 80% e 100% do limite.', 'Cálculo do resumo e notificação em tempo real.'],
  ]),
);

// ---------------------------------------------------------------- 9 INFRAESTRUTURA
add(
  H1('9 INFRAESTRUTURA E PORTABILIDADE'),
  H2('9.1 AMBIENTE DE EXECUÇÃO (HARDWARE)'),
  P('Na versão anterior deste documento, previa-se a hospedagem em uma instância AWS EC2 (modelo IaaS – Infraestrutura como Serviço). Na implementação, optou-se pelo modelo PaaS (Plataforma como Serviço), que dispensa a administração direta de servidores. O Quadro 9 descreve o ambiente adotado.', { keepNext: true }),
  quadro('Ambiente de execução em nuvem', [4.6, 4.4, 7.0], ['Componente', 'Serviço', 'Recursos (plano gratuito)'], [
    ['Aplicação (API Node.js e front-end)', 'Render – Web Service', '0,1 vCPU compartilhada e 512 MB de RAM; região Virgínia (EUA).'],
    ['Banco de dados', 'Supabase – PostgreSQL gerenciado', '500 MB de armazenamento; região us-east-1 (EUA).'],
    ['Código-fonte', 'GitHub', 'Repositório Git com implantação automática a cada atualização.'],
  ]),
  P('**Justificativa técnica:** no modelo IaaS, a equipe precisaria instalar e manter o sistema operacional, o ambiente Node.js, o servidor web, o certificado SSL e o gerenciador de processos. O modelo PaaS elimina essas tarefas, o que é compatível com o prazo acadêmico e com a restrição orçamentária definida no TAP (custo zero). A aplicação e o banco de dados ficam na mesma região geográfica para reduzir a latência, contribuindo para o RNF001. A migração para IaaS (AWS EC2) permanece como evolução futura, caso o volume de usuários exija maior controle e capacidade.'),
  H2('9.2 SISTEMA OPERACIONAL E SEGURANÇA'),
  alineas([
    '**sistema operacional:** os contêineres do Render e do Supabase executam Linux, mantido e atualizado pelos próprios provedores; o ambiente de execução da aplicação é o Node.js, versão 22 ou superior;',
    '**controle de acesso:** não há acesso SSH ao servidor; a administração ocorre pelos painéis web dos provedores, com autenticação da conta da equipe. As credenciais (conexão com o banco e segredo do JWT) são armazenadas como variáveis de ambiente no Render, nunca no código-fonte;',
    '**banco de dados:** a conexão é criptografada (SSL) e realizada por meio do _connection pooler_ do Supabase. O recurso _Row Level Security_ (RLS) está habilitado em todas as tabelas, bloqueando o acesso direto pela API pública do Supabase, de modo que os dados são acessíveis somente pela API do ConFin;',
    '**implantação contínua:** cada alteração enviada ao ramo principal (_main_) do repositório gera automaticamente uma nova versão no Render, que só substitui a anterior após passar na verificação de saúde da aplicação.',
  ]),
  H2('9.3 PORTABILIDADE'),
  P('O sistema adota uma arquitetura em _Progressive Web App_ (PWA) no front-end. Isso assegura portabilidade universal, sendo compatível com computadores (Google Chrome, Firefox, Microsoft Edge e Safari) e dispositivos móveis (Android e iOS), sem necessidade de publicação nas lojas de aplicativos (App Store e Play Store), economizando custos do projeto. O aplicativo está disponível publicamente em https://confin-qetu.onrender.com e pode ser instalado na tela inicial do celular.'),
  H2('9.4 ARQUITETURA DA SOLUÇÃO'),
  P('A Figura 8 apresenta a arquitetura em três camadas do sistema: a camada de apresentação, executada no navegador do usuário; a camada de aplicação, em Node.js, hospedada no Render, que expõe a API REST, aplica as regras de negócio e gerencia a comunicação em tempo real; e a camada de dados, com o banco PostgreSQL hospedado no Supabase. O servidor também entrega os arquivos do front-end, de modo que todo o sistema funciona em um único endereço.', { keepNext: true }),
  figura('arquitetura.png', 'Arquitetura da solução e fluxo de implantação', 16),
);

// ---------------------------------------------------------------- 10 LÓGICA
const PSEUDO = [
  'FUNCAO RegistrarGasto(valor, categoria, meio, data, id_usuario, id_familia)',
  'INICIO',
  '    SE valor <= 0 ENTAO',
  '        RETORNAR "Erro: o valor deve ser maior que zero"   // RN002',
  '    FIM SE',
  '',
  '    INSERIR EM despesa (valor, categoria, meio, data, id_usuario, id_familia)',
  '',
  '    limite      <- BUSCAR limite_mensal EM familia ONDE id = id_familia',
  '    soma_gastos <- SOMA(valor) EM despesa',
  '                   ONDE id_familia = id_familia E mes(data) = mes_atual',
  '    saldo       <- limite - soma_gastos',
  '    percentual  <- (soma_gastos / limite) * 100',
  '',
  '    SE percentual >= 100 ENTAO alerta <- "ESTOURADO"           // RN004',
  '    SENAO SE percentual >= 80 ENTAO alerta <- "ATENCAO"',
  '    SENAO alerta <- "NORMAL"',
  '    FIM SE',
  '',
  '    NOTIFICAR membros da familia (tempo real)               // RF004',
  '    RETORNAR saldo, percentual, alerta',
  'FIM',
];
add(
  H1('10 LÓGICA DO SISTEMA'),
  H2('10.1 DESCRIÇÃO DA LÓGICA'),
  P('A lógica central da aplicação concentra-se no cálculo do orçamento mensal disponível. Toda vez que uma despesa é validada e registrada por um dos membros, uma função no back-end é acionada para buscar o limite mensal definido pelo Administrador do grupo, subtrair as despesas acumuladas no mês (incluindo a nova) e retornar o saldo restante, o percentual consumido do limite e o nível de alerta (RN004), que são enviados em tempo real a todos os membros para atualizar os gráficos do painel.'),
  H2('10.2 REGRAS DE CÁLCULO'),
  alineas([
    '**percentual consumido** = (soma das despesas do mês ÷ limite mensal) × 100;',
    '**nível de alerta (RN004):** abaixo de 80%, normal; de 80% a 99%, atenção; 100% ou mais, limite estourado;',
    '**saldo restante** = limite mensal − soma das despesas do mês, podendo ficar negativo, conforme o cenário alternativo do UC002;',
    '**disponível por dia** = saldo restante ÷ dias que faltam para o fim do mês, exibido apenas no mês corrente;',
    'o “mês atual” considera o fuso horário de Brasília (America/Sao_Paulo), para que despesas registradas à noite não sejam atribuídas ao dia ou ao mês seguinte.',
  ]),
  H2('10.3 PSEUDOCÓDIGO'),
  P('O Quadro 10 apresenta o pseudocódigo da função de registro de gasto.', { keepNext: true }),
  quadro('Pseudocódigo do registro de gasto', [16], null, [[PSEUDO]], { mono: true }),
);

// ---------------------------------------------------------------- 11 FLUXO DE USUÁRIO
add(
  H1('11 FLUXO DE USUÁRIO'),
  H2('11.1 HISTÓRIA DE USUÁRIO'),
  P('“Como pai de família, eu desejo registrar os gastos com supermercado e farmácia de forma rápida e pelo celular, para que eu saiba exatamente quanto dinheiro sobra para o lazer sem precisar esperar o fechamento da fatura do cartão.”'),
  P('**Critérios de aceite:** a despesa pode ser registrada em até dois toques a partir da tela inicial; o saldo disponível é atualizado imediatamente após o registro, para todos os membros; o sistema informa quanto ainda pode ser gasto por dia até o fim do mês.'),
);

// ---------------------------------------------------------------- 12 DIÁRIO DE BORDO
add(
  H1('12 DIÁRIO DE BORDO'),
  H2('12.1 REUNIÕES SEMANAIS'),
  P('Foram conduzidas reuniões remotas via Google Meet e comunicação assíncrona pelo Discord ao longo das Sprints de desenvolvimento.'),
  H2('12.2 DECISÕES'),
  P('Na Sprint 2, definiu-se a adoção de tecnologias puras da web (HTML, CSS e JavaScript) no front-end, para evitar a curva de aprendizado de bibliotecas complexas e garantir a entrega do protótipo no prazo.'),
  P('Na fase de desenvolvimento do MVP, a equipe decidiu migrar o front-end para React, Vite e Tailwind CSS. A componentização do React reduziu a repetição de código entre as telas, e o ecossistema ofereceu bibliotecas prontas para gráficos (Recharts) e para transformar a aplicação em PWA. Também se decidiu utilizar JavaScript tanto no front-end quanto no back-end, para que a equipe trabalhasse com uma única linguagem, e substituir a hospedagem prevista na AWS EC2 pelas plataformas Render e Supabase (ver seção 9). O Quadro 11 resume as tecnologias adotadas.', { keepNext: true }),
  quadro('Tecnologias utilizadas no MVP', [3.2, 5.0, 7.8], ['Camada', 'Tecnologia', 'Finalidade'], [
    ['Linguagem', 'JavaScript', 'Linguagem única no front-end (navegador) e no back-end (Node.js).'],
    ['Front-end', 'React, Vite e Tailwind CSS', 'Construção das telas em componentes reutilizáveis, com estilo responsivo (Mobile First).'],
    ['Gráficos', 'Recharts', 'Gráficos de categorias e do histórico de seis meses no Dashboard.'],
    ['Back-end', 'Node.js e Express', 'API REST, validações, regras de negócio e permissões.'],
    ['Tempo real', 'Socket.io (WebSocket)', 'Notificação instantânea dos membros da família a cada alteração.'],
    ['Banco de dados', 'PostgreSQL', 'Armazenamento relacional com integridade referencial e restrições (UNIQUE, CHECK).'],
    ['Segurança', 'bcrypt, JWT e HTTPS', 'Armazenamento seguro de senhas, autenticação e criptografia do tráfego.'],
    ['Hospedagem', 'Render, Supabase e GitHub', 'Execução da aplicação, banco de dados gerenciado e versionamento com implantação automática.'],
  ]),
  H2('12.3 PROBLEMAS ENCONTRADOS E SOLUÇÕES'),
  alineas([
    '**problema:** dificuldade em modelar como dois usuários diferentes teriam acesso ao mesmo saldo (relacionamento SQL). **Solução:** após mentoria com a professora, foi criada a entidade central “familia”, à qual as entidades “usuario” se vinculam por chave estrangeira, centralizando os cálculos orçamentários;',
    '**problema:** o computador de trabalho de um integrante bloqueava o Docker, ferramenta prevista para executar o PostgreSQL localmente. **Solução:** uso de um PostgreSQL embutido (pacote _embedded-postgres_), executado com um único comando e sem instalação;',
    '**problema:** na primeira implantação, a aplicação não se conectava ao banco de dados (erro de autenticação 28P01). **Solução:** pela leitura dos registros (_logs_) do Render, identificou-se que a URI de conexão continha caracteres de exemplo junto à senha; após a correção da variável de ambiente, a implantação foi concluída com sucesso.',
  ]),
);

// ---------------------------------------------------------------- 13 CONCLUSÃO
add(
  H1('13 CONCLUSÃO'),
  H2('13.1 O QUE APRENDERAM'),
  P('O desenvolvimento deste Projeto Integrador consolidou não apenas a capacidade técnica de aplicar a teoria de Engenharia de Software no mapeamento e na documentação rigorosa de requisitos, mas também competências interpessoais cruciais, como o trabalho em equipe, a autogestão, o cumprimento de prazos em Sprints e a comunicação eficiente.'),
  P('Além da documentação, a equipe implementou e publicou o MVP, o que permitiu aplicar na prática conceitos de arquitetura cliente-servidor, APIs REST, bancos de dados relacionais, comunicação em tempo real, segurança da informação e implantação em nuvem. Todos os requisitos funcionais (RF001 a RF004) e regras de negócio (RN001 a RN004) especificados foram implementados e estão disponíveis no sistema publicado.'),
  H2('13.2 DIFICULDADES'),
  P('As maiores barreiras consistiram no gerenciamento de tempo da equipe acadêmica, conciliando o projeto com as demais disciplinas e compromissos externos, além de absorver os padrões de notação UML e BPMN exigidos na documentação oficial.'),
  H2('13.3 MELHORIAS FUTURAS'),
  P('Prevê-se como evolução do sistema a integração nativa com protocolos de Open Finance, permitindo que a importação de despesas dos cartões de crédito seja automatizada, mitigando o esforço de digitação e o esquecimento dos usuários. Outras melhorias previstas são:'),
  alineas([
    'recuperação de senha por e-mail;',
    'exportação de relatórios em PDF e planilha;',
    'notificações _push_ no celular ao atingir 80% do limite;',
    'limites de gasto por categoria;',
    'registro de receitas, para acompanhar o saldo real da família;',
    'migração para infraestrutura IaaS (AWS EC2), caso a base de usuários cresça.',
  ]),
);

// ================================================================ ELEMENTOS PÓS-TEXTUAIS
const ref = (t) => new Paragraph({ alignment: AlignmentType.LEFT, spacing: { line: 240, after: 240 }, children: runs(t) });
const posTextual = [
  H1c('REFERÊNCIAS'),
  ref('CERBASI, G. **Casais inteligentes enriquecem juntos**. São Paulo: Gente, 2004.'),
  ref('MULLAINATHAN, S.; SHAFIR, E. **Escassez**: uma nova forma de pensar a falta de recursos e como ela afeta as nossas vidas. Rio de Janeiro: Alta Books, 2013.'),
  ref('OWASP FOUNDATION. **Password Storage Cheat Sheet**. [_S. l._]: OWASP, 2026. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html. Acesso em: 9 nov. 2026.'),
  ref('PRESSMAN, R. S.; MAXIM, B. R. **Engenharia de software**: uma abordagem profissional. 9. ed. Porto Alegre: AMGH, 2021.'),
  ref('SOMMERVILLE, I. **Engenharia de software**. 10. ed. São Paulo: Pearson Education do Brasil, 2019.'),

  H1c('APÊNDICE A – PERGUNTAS E RESPOSTAS DA ELICITAÇÃO DE REQUISITOS'),
  P('**Pergunta 1:** Como sua família consolida os gastos atualmente?', { semRecuo: true }),
  P('**Resposta:** Anotamos em um caderno, mas muitas vezes esquecemos de colocar valores pequenos de padaria ou lanches.', { semRecuo: true }),
  ...vazio(),
  P('**Pergunta 2:** Vocês sentem dificuldade de saber se já gastaram todo o orçamento do mês antes do dia 30?', { semRecuo: true }),
  P('**Resposta:** Sim, só descobrimos que gastamos demais quando as faturas chegam fechadas nos aplicativos dos bancos, o que já é tarde demais.', { semRecuo: true }),
  ...vazio(),
  P('**Pergunta 3:** Como um aplicativo facilitaria a rotina de vocês?', { semRecuo: true }),
  P('**Resposta:** Sendo fácil de usar no celular, logo no momento em que passamos o cartão, mostrando na hora para o meu marido e para mim quanto sobrou.', { semRecuo: true }),

  H1c('APÊNDICE B – DOCUMENTO DE MISSÃO, VISÃO E VALORES (VERSÃO COMPLETA)'),
  P('A iniciativa transcende o aspecto puramente contábil; fundamenta-se em restaurar a paz e o alinhamento de expectativas no núcleo familiar, muitas vezes abalado pelo estresse provocado pelo desconhecimento do fluxo de caixa doméstico e pela falta de educação financeira sistêmica no Brasil.'),
];

// ================================================================ DOCUMENTO
const margens = { top: 3 * CM, left: 3 * CM, bottom: 2 * CM, right: 2 * CM, header: 2 * CM - 284, footer: 708 };
const cabecalhoPagina = new Header({
  children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })],
});
const semCabecalho = new Header({ children: [new Paragraph({ children: [] })] });

const doc = new Document({
  creator: 'Israel Batista de Faria; Gabriel Piva Garcia Coral; Luis Felipe Pereira; Mateus Rogério de Souza',
  title: 'Sistema de Controle Financeiro Familiar – ConFin: documentação de software',
  description: 'Projeto Integrador II – Análise e Desenvolvimento de Sistemas – FATEC – 2026',
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: FONTE, size: 24 }, paragraph: { spacing: { line: 360 } } },
      heading1: { run: { font: FONTE, size: 24, bold: true, color: '000000' }, paragraph: { spacing: { before: 0, after: 360, line: 360 }, keepNext: true, keepLines: true, pageBreakBefore: true } },
      heading2: { run: { font: FONTE, size: 24, bold: false, color: '000000' }, paragraph: { spacing: { before: 360, after: 360, line: 360 }, keepNext: true, keepLines: true } },
      heading3: { run: { font: FONTE, size: 24, bold: true, color: '000000' }, paragraph: { spacing: { before: 360, after: 360, line: 360 }, keepNext: true, keepLines: true } },
    },
    paragraphStyles: [
      { id: 'TituloPre', name: 'Título pré-textual', basedOn: 'Normal', run: { font: FONTE, size: 24, bold: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { line: 360, before: 0, after: 0 } } },
      { id: 'Legenda', name: 'Legenda ABNT', basedOn: 'Normal', run: { font: FONTE, size: 20 }, paragraph: { alignment: AlignmentType.CENTER, spacing: { line: 240 } } },
      { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', run: { font: FONTE, size: 24, bold: true }, paragraph: { spacing: { line: 360, before: 0, after: 0 } } },
      { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', run: { font: FONTE, size: 24 }, paragraph: { spacing: { line: 360, before: 0, after: 0 } } },
      { id: 'TOC3', name: 'toc 3', basedOn: 'Normal', next: 'Normal', run: { font: FONTE, size: 24 }, paragraph: { spacing: { line: 360, before: 0, after: 0 } } },
      { id: 'TableofFigures', name: 'table of figures', basedOn: 'Normal', next: 'Normal', run: { font: FONTE, size: 24 }, paragraph: { spacing: { line: 360, before: 0, after: 0 } } },
    ],
  },
  numbering: {
    config: [{
      reference: 'alinea',
      levels: [
        { level: 0, format: LevelFormat.LOWER_LETTER, text: '%1)', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1134, hanging: 425 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1559, hanging: 425 } } } },
      ],
    }],
  },
  sections: [
    // Capa: não é contada nem numerada
    { properties: { page: { margin: margens } }, headers: { default: semCabecalho }, children: capa },
    // Pré-textuais: contadas a partir da folha de rosto, sem número visível
    {
      properties: { type: SectionType.NEXT_PAGE, page: { margin: margens, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      headers: { default: semCabecalho },
      children: [...folhaDeRosto, ...resumo, ...abstract, ...listaIlustracoes, ...listaQuadros, ...listaSiglas, ...sumario],
    },
    // Textuais e pós-textuais: número no canto superior direito
    {
      properties: { type: SectionType.NEXT_PAGE, page: { margin: margens } },
      headers: { default: cabecalhoPagina },
      children: [...textual, ...posTextual],
    },
  ],
});

writeFileSync(SAIDA, await Packer.toBuffer(doc));
console.log('✔ Documento gerado:', SAIDA);
