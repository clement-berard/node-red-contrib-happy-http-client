import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from 'urllib';
import {
  HTTP_METHODS,
  REQUEST_BODY_CONTENT_TYPES,
  REQUEST_RESPONSE_FORMAT,
  handleRequest,
  resolveUrlWithBase,
} from './httpClient';

describe('httpClient', () => {
  describe('Constants', () => {
    it('should export HTTP_METHODS array', () => {
      expect(HTTP_METHODS).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']);
    });

    it('should export REQUEST_RESPONSE_FORMAT array', () => {
      expect(REQUEST_RESPONSE_FORMAT).toEqual(['json', 'text', 'html', 'buffer', 'stream']);
    });

    it('should export REQUEST_BODY_CONTENT_TYPES array', () => {
      expect(REQUEST_BODY_CONTENT_TYPES).toHaveLength(4);
      expect(REQUEST_BODY_CONTENT_TYPES[0]).toEqual({ label: 'json', value: 'application/json' });
    });
  });

  describe('resolveUrlWithBase', () => {
    it('should combine base URL and path correctly', () => {
      expect(resolveUrlWithBase('https://api.example.com', 'users')).toBe('https://api.example.com/users');
    });

    it('should handle base URL with trailing slash', () => {
      expect(resolveUrlWithBase('https://api.example.com/', 'users')).toBe('https://api.example.com/users');
    });

    it('should handle path with leading slash', () => {
      expect(resolveUrlWithBase('https://api.example.com', '/users')).toBe('https://api.example.com/users');
    });

    it('should handle both trailing and leading slashes', () => {
      expect(resolveUrlWithBase('https://api.example.com/', '/users')).toBe('https://api.example.com/users');
    });
  });

  describe('handleRequest', () => {
    it('should handle successful request', async () => {
      const mockClient: HttpClient = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          url: 'https://api.example.com/users',
          data: { success: true },
        }),
      } as any;

      const [error, data, response] = await handleRequest({
        url: 'https://api.example.com/users',
        client: mockClient,
      });

      expect(error).toBeUndefined();
      expect(data).toEqual({ success: true });
      expect(response.ok).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith('https://api.example.com/users', {});
    });

    it('should handle request with query params', async () => {
      const mockClient: HttpClient = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          url: 'https://api.example.com/users?page=1&limit=10',
          data: [],
        }),
      } as any;

      await handleRequest({
        url: 'https://api.example.com/users',
        client: mockClient,
        queryParams: { page: '1', limit: '10' },
      });

      expect(mockClient.request).toHaveBeenCalledWith('https://api.example.com/users?page=1&limit=10', {});
    });

    it('should handle failed request (4xx status)', async () => {
      const mockClient: HttpClient = {
        request: vi.fn().mockResolvedValue({
          status: 404,
          url: 'https://api.example.com/notfound',
          data: null,
        }),
      } as any;

      const [error, data, response] = await handleRequest({
        url: 'https://api.example.com/notfound',
        client: mockClient,
      });

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Request failed with status 404');
      expect(data).toBeUndefined();
      expect(response.ok).toBe(false);
    });

    it('should handle network error', async () => {
      const mockError = new Error('Network error');
      const mockClient: HttpClient = {
        request: vi.fn().mockRejectedValue(mockError),
      } as any;

      const [error, data, response] = await handleRequest({
        url: 'https://api.example.com/users',
        client: mockClient,
      });

      expect(error).toBe(mockError);
      expect(data).toBeUndefined();
      expect(response.ok).toBe(false);
    });

    it('should pass request options to client', async () => {
      const mockClient: HttpClient = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          url: 'https://api.example.com/users',
          data: {},
        }),
      } as any;

      const reqOptions = {
        method: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        data: { name: 'Test' },
      };

      await handleRequest({
        url: 'https://api.example.com/users',
        client: mockClient,
        reqOptions,
      });

      expect(mockClient.request).toHaveBeenCalledWith('https://api.example.com/users', reqOptions);
    });
  });
});
