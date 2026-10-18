import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist/angular-github-actions/browser');
const prefix = '/angular-github-actions/cit/';
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/' || pathname === prefix.slice(0, -1)) {
      response.writeHead(302, { Location: prefix });
      response.end();
      return;
    }
    if (!pathname.startsWith(prefix)) throw new Error('Unknown mount path');
    let file = resolve(root, decodeURIComponent(pathname.slice(prefix.length)) || '.');
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) {
      // Match GitHub Pages directory redirects so relative base paths resolve correctly.
      if (!pathname.endsWith('/')) {
        response.writeHead(301, { Location: pathname + '/' });
        response.end();
        return;
      }
      file = resolve(file, 'index.html');
    }
    await stat(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(4400, '127.0.0.1', () => {
  console.log(`Pages preview: http://127.0.0.1:4400${prefix}`);
});
