'use strict';
// Dependency-free local preview. Deliberately never serves arbitrary repo files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const handler = require('../../api/fitness-foods.js');
const port = Number(process.env.FITNESS_PORT || 4174);
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png' };
const allowed = new Set(['/index.html','/kid-fun-data.js','/manifest.json','/favicon-32.png','/icons/apple-touch-icon.png','/icons/icon-192.png','/icons/icon-512.png','/fitness/index.html','/fitness/nutrition.js','/fitness/manifest.json','/fitness/icon.svg','/fitness/icon-192.png','/fitness/icon-512.png','/fitness/sw.js','/firebase-config.js','/sw.js']);
http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api/fitness-foods') {
    let body = '', tooLarge = false;
    for await (const chunk of req) { body += chunk; if (body.length > 16000) { tooLarge = true; break; } }
    if (tooLarge) { res.writeHead(413); res.end('Request too large.'); return; }
    req.body = body; await handler(req,res); return;
  }
  if (url.pathname === '/fitness') { res.writeHead(302,{Location:'/fitness/'});res.end();return; }
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname === '/fitness/' ? '/fitness/index.html' : url.pathname;
  if (!allowed.has(pathname) || !['GET','HEAD'].includes(req.method)) { res.writeHead(404);res.end('Not found.');return; }
  try { const content = fs.readFileSync(path.join(root, pathname)); res.writeHead(200,{'Content-Type':types[path.extname(pathname)] || 'application/octet-stream','Cache-Control':'no-store'});res.end(req.method === 'HEAD' ? '' : content); }
  catch { res.writeHead(404);res.end('Not found.'); }
}).listen(port,'127.0.0.1',() => console.log('Family Hub preview: http://127.0.0.1:'+port+'/\nSteady preview: http://127.0.0.1:'+port+'/fitness/'));
