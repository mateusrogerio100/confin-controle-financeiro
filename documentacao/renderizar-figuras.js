// Converte os diagramas SVG (figuras/src) e monta as figuras de telas do app em PNG (figuras/).
// Usa o Google Chrome instalado no computador (puppeteer-core).
// Uso: node renderizar-figuras.js
import puppeteer from 'puppeteer-core';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(AQUI, 'figuras', 'src');
const OUT = path.join(AQUI, 'figuras');
const PRINTS = path.join(AQUI, '..', 'apresentacao', 'prints');

// Imagem embutida como base64 (páginas criadas com setContent não podem ler file://)
const dataUri = (arq) => `data:image/png;base64,${readFileSync(path.join(PRINTS, arq)).toString('base64')}`;

const CHROME =['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

// 1) Diagramas SVG -> PNG em alta resolução
for (const arq of readdirSync(SRC).filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(path.join(SRC, arq), 'utf8');
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 2.5 });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: path.join(OUT, arq.replace('.svg', '.png')), clip: { x: 0, y: 0, width: +w, height: +h } });
  console.log('✔', arq);
}

// 2) Figuras compostas com prints de celular
const telas = (nome, itens) => ({ nome, itens });
const composicoes = [
  telas('telas-1', [['p1-login.png', '(a) Login e cadastro'], ['p2-dashboard-antes.png', '(b) Dashboard'], ['p3-nova-despesa.png', '(c) Registro de despesa']]),
  telas('telas-2', [['p4-ana-tempo-real.png', '(a) Atualização em tempo real'], ['p5-familia.png', '(b) Grupo familiar'], ['p6-historico.png', '(c) Histórico']]),
];
for (const { nome, itens } of composicoes) {
  const html = `<html><body style="margin:0;background:#fff;font-family:Arial">
    <div id="c" style="display:flex;gap:28px;padding:10px 14px;width:max-content">
      ${itens.map(([img, leg]) => `<figure style="margin:0;text-align:center">
        <img src="${dataUri(img)}" style="width:250px;border:1.5px solid #9ca3af;border-radius:14px;display:block">
        <figcaption style="font-size:15px;margin-top:8px;color:#111">${leg}</figcaption></figure>`).join('')}
    </div></body></html>`;
  await page.setViewport({ width: 900, height: 800, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  const el = await page.$('#c');
  await el.screenshot({ path: path.join(OUT, `${nome}.png`) });
  console.log('✔', nome);
}

// 3) Dashboard no computador (borda fina)
{
  const html = `<html><body style="margin:0;background:#fff"><div id="c" style="padding:6px;width:max-content">
    <img src="${dataUri('p7-dashboard-desktop.png')}" style="width:1100px;border:1.5px solid #9ca3af;display:block"></div></body></html>`;
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1.6 });
  await page.setContent(html, { waitUntil: 'load' });
  await (await page.$('#c')).screenshot({ path: path.join(OUT, 'telas-desktop.png') });
  console.log('✔ telas-desktop');
}

await browser.close();
