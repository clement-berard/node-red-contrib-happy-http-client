import axios from 'axios';
import basicAuth from 'basic-auth';
import express, { type NextFunction, type Request, type Response } from 'express';

// import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3002;
// const BEARER_SECRET = 'your-secret-key'; // Change this secret to a secure one

// Middleware for Basic Auth
const basicAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = basicAuth(req);
  const _authHeader = req.headers.authorization;

  if (user && user.name === 'admin' && user.pass === 'password') {
    // Change username and password
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="example"');
  return res.status(401).send('Access denied.');
};

// Middleware for Bearer Token Auth
const bearerAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('authHeader', authHeader);
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log('token', token);
    try {
      // jwt.verify(token, BEARER_SECRET);
      if (token === 'tonton') return next();
    } catch (_err) {
      return res.status(403).send('Invalid token.');
    }
  }
  return res.status(401).send('Token missing or malformed.');
};

// Public route used as a proxy
app.get('/proxy', async (req: Request, res: Response) => {
  const { url } = req.query;
  console.log('REEEE', req);
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing or invalid URL parameter.');
  }

  try {
    const response = await axios.get(url);
    res.status(response.status).send(response.data);
  } catch (_error) {
    res.status(500).send('Failed to fetch data from the external API.');
  }
});

// Protected route with Basic Auth
app.get('/protected-basic', basicAuthMiddleware, (_req: Request, res: Response) => {
  res.send('This is a protected route using Basic Auth.');
});

// Protected route with Bearer Token
app.get('/protected-bearer', bearerAuthMiddleware, (_req: Request, res: Response) => {
  res.json({ ok: 'This is a protected route using Bearer Token Auth.' });
});

app.get('/', bearerAuthMiddleware, (req: Request, res: Response) => {
  const { url } = req.query;
  console.log('REEEE', req, url);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Routes:');
  console.log(`- Public Proxy: http://localhost:${PORT}/proxy?url=<external-api-url>`);
  console.log(`- Basic Auth Protected: http://localhost:${PORT}/protected-basic`);
  console.log(`- Bearer Token Protected: http://localhost:${PORT}/protected-bearer`);
});
