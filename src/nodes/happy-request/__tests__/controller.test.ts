import { HttpClient } from 'urllib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { handleRequestMock, resolveRequestInformationMock } = vi.hoisted(() => ({
  handleRequestMock: vi.fn(),
  resolveRequestInformationMock: vi.fn(),
}));

vi.mock('urllib', () => ({ HttpClient: vi.fn() }));
vi.mock('@keload/node-red-dxp/utils', () => ({ isUrl: (url: string) => /^https?:\/\//.test(url) }));
vi.mock('@keload/node-red-dxp/utils/controller', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getREDNode: vi.fn(() => null),
  splitBooleanOutputs: (isSuccess: boolean, msg: unknown) => (isSuccess ? [msg, null] : [null, msg]),
}));
vi.mock('../../../common/controller/reqInfo', () => ({ resolveRequestInformation: resolveRequestInformationMock }));
vi.mock('../../../common/httpClient', () => ({ handleRequest: handleRequestMock }));

import controller from '../controller';

type InputHandler = (msg: Record<string, unknown>) => Promise<void>;

function setup(config: Record<string, unknown> = {}) {
  let onInput: InputHandler = async () => {};
  const node = {
    credentials: {},
    status: vi.fn(),
    error: vi.fn(),
    send: vi.fn(),
    on: vi.fn((event: string, handler: InputHandler) => {
      if (event === 'input') onInput = handler;
    }),
  };

  (globalThis as unknown as { RED: unknown }).RED = { nodes: { createNode: vi.fn() } };
  (controller as unknown as (this: unknown, config: unknown) => void).call(node, config);

  return { node, input: (msg: Record<string, unknown> = {}) => onInput(msg) };
}

describe('happy-request controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveRequestInformationMock.mockResolvedValue({
      request: {
        url: 'https://api.test/items',
        method: 'POST',
        headers: { a: '1' },
        queryParams: { q: 'x' },
        body: { b: 1 },
        bodyContentType: 'json',
      },
      connection: { timeout: 1000, keepAlive: 1000, rejectUnauthorized: true },
      auth: undefined,
    });
    handleRequestMock.mockResolvedValue([undefined, { ok: true }, { ok: true, response: { status: 200 } }]);
  });

  describe('before-request script', () => {
    it('should send the resolved request untouched when no script is set', async () => {
      const { input } = setup();
      await input();

      expect(handleRequestMock).toHaveBeenCalledOnce();
      const params = handleRequestMock.mock.calls[0][0];
      expect(params.url).toBe('https://api.test/items');
      expect(params.queryParams).toEqual({ q: 'x' });
      expect(params.reqOptions.method).toBe('POST');
      expect(params.reqOptions.data).toEqual({ b: 1 });
    });

    it('should apply the fields returned by the script', async () => {
      const { input } = setup({
        beforeRequestScript: 'return { url: "https://other.test/x", method: "PUT", headers: { h: "2" } };',
      });
      await input();

      const params = handleRequestMock.mock.calls[0][0];
      expect(params.url).toBe('https://other.test/x');
      expect(params.reqOptions.method).toBe('PUT');
      expect(params.reqOptions.headers).toEqual({ h: '2' });
      expect(params.queryParams).toEqual({ q: 'x' });
    });

    it('should expose request, msg and node to the script', async () => {
      const { input } = setup({
        beforeRequestScript: 'return { url: request.url + "/" + msg.id, body: { n: typeof node.send } };',
      });
      await input({ id: 7 });

      const params = handleRequestMock.mock.calls[0][0];
      expect(params.url).toBe('https://api.test/items/7');
      expect(params.reqOptions.data).toEqual({ n: 'function' });
    });

    it('should apply in-place mutations of request when the script returns nothing', async () => {
      const { input } = setup({ beforeRequestScript: 'request.url = "https://mutated.test";' });
      await input();

      expect(handleRequestMock.mock.calls[0][0].url).toBe('https://mutated.test');
    });

    it('should keep the request as is when the script does nothing', async () => {
      const { input } = setup({ beforeRequestScript: 'const unused = 1;' });
      await input();

      expect(handleRequestMock.mock.calls[0][0].url).toBe('https://api.test/items');
    });

    it('should not send a body for GET after the script changes the method', async () => {
      const { input } = setup({ beforeRequestScript: 'return { method: "GET" };' });
      await input();

      const { reqOptions } = handleRequestMock.mock.calls[0][0];
      expect(reqOptions.method).toBe('GET');
      expect(reqOptions).not.toHaveProperty('data');
    });

    it('should report the error and not send when the script throws', async () => {
      const { input, node } = setup({ beforeRequestScript: 'throw new Error("bad");' });
      await input();

      expect(node.error).toHaveBeenCalledOnce();
      expect(node.status).toHaveBeenLastCalledWith(
        expect.objectContaining({ fill: 'red', text: expect.stringContaining('Before-request script error') }),
      );
      expect(handleRequestMock).not.toHaveBeenCalled();
      expect(node.send).not.toHaveBeenCalled();
    });

    it('should reject an invalid URL returned by the script', async () => {
      const { input, node } = setup({ beforeRequestScript: 'return { url: "not-a-url" };' });
      await input();

      expect(node.error).toHaveBeenCalledWith('Invalid URL: not-a-url');
      expect(handleRequestMock).not.toHaveBeenCalled();
    });
  });

  describe('after-response script', () => {
    it('should send the msg returned by the script', async () => {
      const { input, node } = setup({ afterResponseScript: 'msg.payload = { wrapped: msg.payload }; return msg;' });
      await input({ topic: 't' });

      expect(node.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: 't', payload: { wrapped: { ok: true } } }),
      );
    });

    it('should report an error when the script does not return the msg', async () => {
      const { input, node } = setup({ afterResponseScript: 'const x = 1;' });
      await input();

      expect(node.error).toHaveBeenCalledOnce();
      expect(node.status).toHaveBeenLastCalledWith(
        expect.objectContaining({ fill: 'red', text: expect.stringContaining('Response script error') }),
      );
      expect(node.send).not.toHaveBeenCalled();
    });

    it('should report an error and not send when the script throws', async () => {
      const { input, node } = setup({ afterResponseScript: 'throw new Error("oops");' });
      await input();

      expect(node.error).toHaveBeenCalledOnce();
      expect(node.send).not.toHaveBeenCalled();
    });
  });

  describe('outputs', () => {
    it('should send the msg with happyRequest and payload', async () => {
      const { input, node } = setup();
      await input({ topic: 't' });

      expect(node.send).toHaveBeenCalledWith({
        topic: 't',
        happyRequest: { ok: true, response: { status: 200 } },
        payload: { ok: true },
      });
      expect(node.status).toHaveBeenLastCalledWith(expect.objectContaining({ fill: 'green' }));
    });

    it('should route to the error output when splitBooleanOutputs is on and the request fails', async () => {
      handleRequestMock.mockResolvedValue([new Error('fail'), undefined, { ok: false, response: { status: 500 } }]);
      const { input, node } = setup({ splitBooleanOutputs: true });
      await input();

      const [success, failure] = node.send.mock.calls[0][0];
      expect(success).toBeNull();
      expect(failure).toEqual(expect.objectContaining({ happyRequest: { ok: false, response: { status: 500 } } }));
    });

    it('should raise a node error on failure when throwErrorOnError is on', async () => {
      handleRequestMock.mockResolvedValue([new Error('fail'), undefined, { ok: false, response: { status: 500 } }]);
      const { input, node } = setup({ throwErrorOnError: true });
      await input();

      expect(node.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'fail' }));
      expect(node.status).toHaveBeenCalledWith(
        expect.objectContaining({ fill: 'red', text: expect.stringContaining('Error 500') }),
      );
    });
  });

  describe('request', () => {
    it('should configure the http client with the resolved connection settings', async () => {
      resolveRequestInformationMock.mockResolvedValue({
        ...(await resolveRequestInformationMock()),
        connection: { timeout: '3000', keepAlive: '1500', rejectUnauthorized: false },
      });
      const { input } = setup();
      await input();

      expect(HttpClient).toHaveBeenCalledWith({ connect: { timeout: 3000, rejectUnauthorized: false } });
      expect(handleRequestMock.mock.calls[0][0].reqOptions.keepAliveTimeout).toBe(1500);
    });

    it('should pass the response format and the body content type', async () => {
      const { input } = setup({ responseFormat: 'text' });
      await input();

      const { reqOptions } = handleRequestMock.mock.calls[0][0];
      expect(reqOptions.dataType).toBe('text');
      expect(reqOptions.contentType).toBe('json');
    });

    it('should not send a body with a GET request', async () => {
      resolveRequestInformationMock.mockResolvedValue({
        ...(await resolveRequestInformationMock()),
        request: { ...(await resolveRequestInformationMock()).request, method: 'GET' },
      });
      const { input } = setup();
      await input();

      expect(handleRequestMock.mock.calls[0][0].reqOptions).not.toHaveProperty('data');
    });

    it('should send neither a body nor a content type when there is none', async () => {
      resolveRequestInformationMock.mockResolvedValue({
        ...(await resolveRequestInformationMock()),
        request: { ...(await resolveRequestInformationMock()).request, body: undefined },
      });
      const { input } = setup();
      await input();

      const { reqOptions } = handleRequestMock.mock.calls[0][0];
      expect(reqOptions).not.toHaveProperty('data');
      expect(reqOptions).not.toHaveProperty('contentType');
    });

    it.each([
      ['basic', 'auth'],
      ['digest', 'digestAuth'],
    ])('should send the %s credentials as `%s`', async (kind, option) => {
      resolveRequestInformationMock.mockResolvedValue({
        ...(await resolveRequestInformationMock()),
        auth: { kind, username: 'bob', password: 'pwd' },
      });
      const { input } = setup();
      await input();

      const { reqOptions } = handleRequestMock.mock.calls[0][0];
      expect(reqOptions[option]).toBe('bob:pwd');
      expect(reqOptions[option === 'auth' ? 'digestAuth' : 'auth']).toBeUndefined();
    });

    it('should send no credentials without auth', async () => {
      const { input } = setup();
      await input();

      const { reqOptions } = handleRequestMock.mock.calls[0][0];
      expect(reqOptions).not.toHaveProperty('auth');
      expect(reqOptions).not.toHaveProperty('digestAuth');
    });
  });

  describe('status', () => {
    it('should reset the status when a message arrives', async () => {
      const { input, node } = setup();
      await input();

      expect(node.status).toHaveBeenNthCalledWith(1, {});
      expect(node.status).toHaveBeenNthCalledWith(2, {});
    });

    it('should mention the time of the success', async () => {
      const { input, node } = setup();
      await input();

      expect(node.status).toHaveBeenLastCalledWith({ fill: 'green', text: expect.stringMatching(/^Success at /) });
    });

    it('should report a request failure without crashing when there is no response', async () => {
      handleRequestMock.mockResolvedValue([new Error('ECONNREFUSED'), undefined, { ok: false }]);
      const { input, node } = setup({ throwErrorOnError: true });
      await input();

      expect(node.error).toHaveBeenCalledWith({ message: 'ECONNREFUSED', response: undefined });
      expect(node.send).toHaveBeenCalledOnce();
    });

    it('should show the status of an answer that could not be parsed', async () => {
      handleRequestMock.mockResolvedValue([new Error('bad json'), undefined, { ok: false, response: { status: 400 } }]);
      const { input, node } = setup({ throwErrorOnError: true });
      await input();

      expect(node.status).toHaveBeenCalledWith({ fill: 'red', text: expect.stringMatching(/^Error 400 at /) });
    });

    it('should still send the msg on failure when errors are not thrown', async () => {
      handleRequestMock.mockResolvedValue([new Error('fail'), undefined, { ok: false, response: { status: 404 } }]);
      const { input, node } = setup({ throwErrorOnError: false });
      await input();

      expect(node.error).not.toHaveBeenCalled();
      expect(node.send).toHaveBeenCalledOnce();
    });
  });
});
