import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpClient } from 'urllib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { handleRequest } from '../httpClient';
import { createTestServer } from './server';

let server: Server;
let baseUrl: string;
const client = new HttpClient();

beforeAll(async () => {
  server = createTestServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe('handleRequest against the local test server', () => {
  it('should succeed with valid basic auth', async () => {
    const [err, data, res] = await handleRequest({
      url: `${baseUrl}/protected-basic`,
      client,
      reqOptions: { auth: 'admin:password', dataType: 'text' },
    });

    expect(err).toBeUndefined();
    expect(data).toBe('This is a protected route using Basic Auth.');
    expect(res.ok).toBe(true);
  });

  it('should fail with wrong basic auth', async () => {
    const [err, data, res] = await handleRequest({
      url: `${baseUrl}/protected-basic`,
      client,
      reqOptions: { auth: 'admin:wrong', dataType: 'text' },
    });

    expect(err?.message).toContain('401');
    expect(data).toBeUndefined();
    expect(res.ok).toBe(false);
  });

  it('should succeed with a valid bearer token and parse json', async () => {
    const [err, data] = await handleRequest({
      url: `${baseUrl}/protected-bearer`,
      client,
      reqOptions: { headers: { authorization: 'Bearer tonton' }, dataType: 'json' },
    });

    expect(err).toBeUndefined();
    expect(data).toEqual({ ok: 'This is a protected route using Bearer Token Auth.' });
  });

  it('should fail with a missing bearer token', async () => {
    const [err] = await handleRequest({ url: `${baseUrl}/protected-bearer`, client });

    expect(err?.message).toContain('401');
  });

  it('should forward query params through the proxy route', async () => {
    const [err, data, res] = await handleRequest({
      url: `${baseUrl}/proxy`,
      client,
      queryParams: { url: `${baseUrl}/protected-basic` },
      reqOptions: { dataType: 'text' },
    });

    expect(res.request?.url).toContain('url=');
    expect(err?.message).toContain('401');
    expect(data).toBeUndefined();
  });

  it('should return a 400 from the proxy route without url param', async () => {
    const [err] = await handleRequest({ url: `${baseUrl}/proxy`, client });

    expect(err?.message).toContain('400');
  });

  it('should return a 404 on an unknown route', async () => {
    const [err] = await handleRequest({ url: `${baseUrl}/nope`, client });

    expect(err?.message).toContain('404');
  });
});
