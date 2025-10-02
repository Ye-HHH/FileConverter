const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = process.env.PORT ? Number(process.env.PORT) : 3210;

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.map', 'application/json'],
]);

function send404(res) {
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const filePath = path.join(root, urlPath.replace(/^\//, ''));

    if (!filePath.startsWith(root)) return send404(res);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send404(res);

    const ext = path.extname(filePath).toLowerCase();
    const type = types.get(ext) || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(String(e));
  }
});

server.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}`);
});

