// Teste rápido de ponta a ponta da API. Uso: npm run test:smoke (com a API rodando)
import assert from 'node:assert/strict';

const BASE = process.env.API_URL || 'http://localhost:3333/api';

async function api(metodo, rota, corpo, token) {
  const res = await fetch(BASE + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = res.status === 204 ? null : await res.json();
  return { status: res.status, dados };
}

const ok = (msg) => console.log('  ✔', msg);

const login = await api('POST', '/auth/login', { email: 'ana@confin.app', senha: '123456' });
assert.equal(login.status, 200);
const tokenAna = login.dados.token;
ok('login do administrador');

assert.equal((await api('POST', '/auth/login', { email: 'ana@confin.app', senha: 'errada' })).status, 401);
ok('senha incorreta é recusada');

const resumo = await api('GET', '/despesas/resumo', null, tokenAna);
assert.equal(resumo.status, 200);
assert.equal(resumo.dados.historico.length, 6);
ok(`resumo: gasto R$ ${resumo.dados.total} de R$ ${resumo.dados.limite} (${resumo.dados.percentual}%, ${resumo.dados.alerta})`);

const neg = await api('POST', '/despesas', { valor: -10, categoria: 'MERCADO', meio_pagamento: 'PIX' }, tokenAna);
assert.equal(neg.status, 400);
ok('RN002: valor negativo recusado');

const nova = await api(
  'POST',
  '/despesas',
  { valor: 49.9, categoria: 'SAUDE', meio_pagamento: 'PIX', descricao: 'Teste smoke' },
  tokenAna,
);
assert.equal(nova.status, 201);
assert.ok(Math.abs(nova.dados.saldo.total - (resumo.dados.total + 49.9)) < 0.01);
ok(`UC002: despesa registrada, novo saldo R$ ${nova.dados.saldo.saldo}`);

const dup = await api('POST', '/auth/register', { nome: 'Ana', email: 'ANA@confin.app', senha: '123456' });
assert.equal(dup.status, 409);
ok('RN001: e-mail duplicado recusado');

const carlos = (await api('POST', '/auth/login', { email: 'carlos@confin.app', senha: '123456' })).dados.token;
assert.equal((await api('DELETE', `/despesas/${nova.dados.despesa.id}`, null, carlos)).status, 403);
ok('membro não exclui despesa de outro membro');
assert.equal((await api('PATCH', '/familias/minha', { limite_mensal: 1 }, carlos)).status, 403);
ok('membro não altera o limite');

assert.equal((await api('DELETE', `/despesas/${nova.dados.despesa.id}`, null, tokenAna)).status, 204);
ok('administrador exclui a despesa de teste');

const email = `teste${Date.now()}@confin.app`;
const reg = await api('POST', '/auth/register', { nome: 'Pessoa Teste', email, senha: '123456' });
assert.equal(reg.status, 201);
assert.equal(reg.dados.usuario.familia_id, null);
const fam = await api('POST', '/familias', { nome: 'Família Teste', limite_mensal: 1000 }, reg.dados.token);
assert.equal(fam.status, 201);
ok('cadastro + criação de família');

console.log('\nTodos os testes passaram.');
