import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';

const DEFAULT_PORT = 3002;

function send(res: ServerResponse, status: number, body: string, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain', ...headers });
  res.end(body);
}

function isBasicAuthOk(req: IncomingMessage) {
  const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  return Buffer.from(encoded, 'base64').toString() === 'admin:password';
}

function isBearerAuthOk(req: IncomingMessage) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && token === 'tonton';
}

export function createTestServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    // Public route used as a proxy
    if (req.method === 'GET' && url.pathname === '/proxy') {
      const target = url.searchParams.get('url');
      if (!target) return send(res, 400, 'Missing or invalid URL parameter.');

      try {
        const response = await fetch(target);
        return send(res, response.status, await response.text());
      } catch (_error) {
        return send(res, 500, 'Failed to fetch data from the external API.');
      }
    }

    // Protected route with Basic Auth
    if (req.method === 'GET' && url.pathname === '/protected-basic') {
      if (!isBasicAuthOk(req)) {
        return send(res, 401, 'Access denied.', { 'WWW-Authenticate': 'Basic realm="example"' });
      }
      return send(res, 200, 'This is a protected route using Basic Auth.');
    }

    // Protected route with Bearer Token
    if (req.method === 'GET' && url.pathname === '/protected-bearer') {
      if (!isBearerAuthOk(req)) return send(res, 401, 'Token missing or malformed.');
      return send(res, 200, JSON.stringify({ ok: 'This is a protected route using Bearer Token Auth.' }), {
        'Content-Type': 'application/json',
      });
    }

    return send(res, 404, 'Not found.');
  });
}

// Run standalone: `tsx tests/server.ts`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createTestServer().listen(DEFAULT_PORT, () => {
    console.log(`Server is running on http://localhost:${DEFAULT_PORT}`);
    console.log('Routes:');
    console.log(`- Public Proxy: http://localhost:${DEFAULT_PORT}/proxy?url=<external-api-url>`);
    console.log(`- Basic Auth Protected: http://localhost:${DEFAULT_PORT}/protected-basic`);
    console.log(`- Bearer Token Protected: http://localhost:${DEFAULT_PORT}/protected-bearer`);
  });
}
