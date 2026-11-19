import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRequestInformation } from '../reqInfo';

// Same behaviour as RED.util.evaluateNodeProperty for the types used by the nodes
const evaluate = (value: any, type: string | undefined, _node: unknown, msg: any, done: (e: any, r?: any) => void) => {
  if (type === 'num') return done(null, Number(value));
  if (type === 'bool') return done(null, value === true || value === 'true');
  if (type === 'json') return done(null, JSON.parse(value));
  if (type === 'msg') return done(null, msg[value]);
  return done(null, value);
};

(globalThis as any).RED = { util: { evaluateNodeProperty: vi.fn(evaluate) } };

const baseNode = {
  endpoint: '/items',
  endpointType: 'str',
  method: 'GET',
  methodType: 'GET',
  body: 'payload',
  bodyType: 'msg',
  bodyContentType: 'application/json',
  defaultArgsHeaders: '',
  defaultArgsHeadersType: 'json',
  defaultArgsQueryParams: '',
  defaultArgsQueryParamsType: 'json',
  connectionKeepAlive: '',
  connectionKeepAliveType: 'from_client',
  connectionTimeout: '',
  connectionTimeoutType: 'from_client',
  caRejectUnauthorized: '',
  caRejectUnauthorizedType: 'from_client',
  requestAuthBearerToken: '',
  requestAuthBearerTokenType: 'from_client',
  requestAuthKind: 'from_client_or_none',
  requestAuthUsername: '',
  requestAuthUsernameType: 'from_client',
  credentials: {},
};

const baseClient = {
  baseUrl: 'https://api.test/',
  defaultArgsHeaders: '{"a":"1","b":"1"}',
  defaultArgsHeadersType: 'json',
  defaultArgsQueryParams: '{"q":"1"}',
  defaultArgsQueryParamsType: 'json',
  connectionKeepAlive: '1000',
  connectionKeepAliveType: 'num',
  connectionTimeout: '2000',
  connectionTimeoutType: 'num',
  caRejectUnauthorized: 'false',
  caRejectUnauthorizedType: 'bool',
  requestAuthBearerToken: 'tok',
  requestAuthBearerTokenType: 'str',
  requestAuthKind: 'basic',
  requestAuthUsername: 'bob',
  requestAuthUsernameType: 'str',
  credentials: { requestAuthPasswordSecret: 'pwd' },
};

const resolve = (node: object = {}, client: object | null = baseClient, msg: object = { payload: { x: 1 } }) =>
  resolveRequestInformation({
    node: {} as any,
    msg: msg as any,
    currentNode: { ...baseNode, ...node } as any,
    clientInstance: client as any,
  });

describe('resolveRequestInformation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should join the client base url and the endpoint', async () => {
    expect((await resolve()).request.url).toBe('https://api.test/items');
  });

  it('should use the endpoint alone without client', async () => {
    const result = await resolve({ endpoint: 'https://other.test/x' }, null);
    expect(result.request.url).toBe('https://other.test/x');
  });

  it('should evaluate the method, the body and its content type', async () => {
    const result = await resolve({ method: 'x', methodType: 'str' });
    expect(result.request.method).toBe('x');
    expect((await resolve({ methodType: 'POST' })).request.method).toBe('POST');
    expect(result.request.body).toEqual({ x: 1 });
    expect(result.request.bodyContentType).toBe('application/json');
    expect((await resolve({}, baseClient, {})).request.body).toBeUndefined();
  });

  it('should inherit the connection settings from the client', async () => {
    const result = await resolve();
    expect(result.connection.keepAlive).toBe(1000);
    expect(result.connection.timeout).toBe(2000);
    expect(result.connection.rejectUnauthorized).toBe(false);
  });

  it('should keep its own settings and fall back to the defaults', async () => {
    const own = await resolve({
      connectionTimeout: '7',
      connectionTimeoutType: 'num',
      caRejectUnauthorized: 'true',
      caRejectUnauthorizedType: 'bool',
    });
    expect(own.connection.timeout).toBe(7);
    expect(own.connection.rejectUnauthorized).toBe(true);

    const none = await resolve({}, null);
    expect(none.connection.timeout).toBe(5000);
  });

  it('should merge the client headers and params with the ones of the node', async () => {
    const result = await resolve({
      defaultArgsHeaders: '{"b":"2","c":"3"}',
      defaultArgsQueryParams: '{"r":"2"}',
    });
    expect(result.request.headers).toEqual({ a: '1', b: '2', c: '3', authorization: 'Bearer tok' });
    expect(result.request.queryParams).toEqual({ q: '1', r: '2' });
  });

  it('should send the bearer of the node when it does not inherit', async () => {
    const result = await resolve({
      requestAuthBearerToken: 'mine',
      requestAuthBearerTokenType: 'str',
    });
    expect(result.request.headers.authorization).toBe('Bearer mine');
  });

  describe('auth', () => {
    it('should inherit the kind, the username and the password of the client', async () => {
      expect((await resolve()).auth).toEqual({
        kind: 'basic',
        username: 'bob',
        password: 'pwd',
      });
    });

    it('should use the kind and the credentials of the node', async () => {
      const result = await resolve({
        requestAuthKind: 'digest',
        requestAuthUsername: 'me',
        requestAuthUsernameType: 'str',
        credentials: { requestAuthPasswordSecret: 'mine' },
      });
      expect(result.auth).toEqual({ kind: 'digest', username: 'me', password: 'mine' });
    });

    it('should have no auth when the client has none', async () => {
      const result = await resolve({}, { ...baseClient, requestAuthKind: 'none' });
      expect(result.auth).toBeUndefined();
    });

    it('should have no auth without client', async () => {
      expect((await resolve({}, null)).auth).toBeUndefined();
    });
  });

  describe('inheritance', () => {
    it('should keep the own value of a setting that is inherited but missing on the client', async () => {
      const client = { ...baseClient, connectionTimeout: undefined, connectionTimeoutType: undefined };
      const result = await resolve({ connectionTimeout: '9', connectionTimeoutType: 'from_client' }, client);

      expect(result.connection.timeout).toBe('9');
    });

    it('should fall back to the default of an empty untyped setting', async () => {
      const client = { ...baseClient, connectionKeepAlive: '', connectionKeepAliveType: 'str' };

      expect((await resolve({}, client)).connection.keepAlive).toBe(4000);
    });

    it('should not inherit the headers: it merges them', async () => {
      const result = await resolve({ defaultArgsHeaders: '{"a":"own"}' }, baseClient);

      expect(result.request.headers).toMatchObject({ a: 'own', b: '1' });
    });

    it('should evaluate typed properties against the message', async () => {
      const result = await resolve({ body: 'data', bodyType: 'msg' }, baseClient, { data: { id: 5 } });

      expect(result.request.body).toEqual({ id: 5 });
    });

    it('should send no authorization header without bearer', async () => {
      const result = await resolve({}, { ...baseClient, requestAuthBearerToken: '' });

      expect(result.request.headers).not.toHaveProperty('authorization');
    });

    it('should have no auth when the node asks for none', async () => {
      expect((await resolve({ requestAuthKind: 'none' })).auth).toBeUndefined();
    });

    it('should use the password of the client when the node has none', async () => {
      const result = await resolve({ requestAuthKind: 'basic', credentials: {} });

      expect(result.auth?.password).toBe('pwd');
    });

    it('should send no body when the field is empty', async () => {
      const result = await resolve({ body: '', bodyType: 'json' });

      expect(result.request.body).toBeUndefined();
    });

    it('should keep the endpoint alone when the client has no base url', async () => {
      const result = await resolve({}, { ...baseClient, baseUrl: '' });

      expect(result.request.url).toBe('/items');
    });
  });
});
