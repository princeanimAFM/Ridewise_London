/** Loads an app TypeScript module in Node (images stubbed), for build scripts. */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = {};
let assetId = 0;

function load(file) {
  const abs = path.resolve(file);
  if (cache[abs]) return cache[abs].exports;
  const src = fs.readFileSync(abs, 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
  const mod = { exports: {} };
  cache[abs] = mod;
  const req = (id) => {
    if (/\.(png|jpe?g)$/.test(id)) return ++assetId; // like Metro: a unique number per image
    if (id === 'react-native') return { Platform: { OS: 'node' } };
    const base = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(abs), id);
    for (const ext of ['.ts', '.tsx', '/index.ts']) if (fs.existsSync(base + ext)) return load(base + ext);
    return require(id);
  };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, req);
  return mod.exports;
}

module.exports = { load, root };
