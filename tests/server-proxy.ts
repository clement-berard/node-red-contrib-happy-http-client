import http from 'http';
import httpProxy from 'http-proxy';

const PORT = 3002;
const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  console.log(`Proxy received: ${req.method} ${req.url}`);

  // Proxy simple vers le host réel indiqué dans le header Host
  const target = `${req.headers['x-target-proxy-host'] || req.headers.host}`;

  if (!target) {
    res.writeHead(400);
    res.end('No target host specified in x-target-proxy-host header or Host header');
    return;
  }

  proxy.web(req, res, { target: `http://${target}`, changeOrigin: true }, (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end('Proxy error');
  });
});

server.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
});
