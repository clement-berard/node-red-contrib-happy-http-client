import { describe, expect, it } from 'vitest';
import { COMMON_FIELD_KEYS, COMMON_FIELDS, getCommonDefaultFields } from '../commonFields';

describe('commonFields', () => {
  describe('getCommonDefaultFields', () => {
    it('should default the value of every shared field', () => {
      const defaults = getCommonDefaultFields();

      expect(defaults.connectionKeepAlive).toEqual({ value: 4000 });
      expect(defaults.connectionTimeout).toEqual({ value: 5000 });
      expect(defaults.caRejectUnauthorized).toEqual({ value: true });
      expect(defaults.defaultArgsHeaders).toEqual({ value: '' });
    });

    it('should make a request node inherit what its client can give', () => {
      const defaults = getCommonDefaultFields({ forConfig: false });

      expect(defaults.connectionTimeoutType).toEqual({ value: 'from_client' });
      expect(defaults.requestAuthBearerTokenType).toEqual({ value: 'from_client' });
      expect(defaults.requestAuthUsernameType).toEqual({ value: 'from_client' });
      expect(defaults.requestAuthKind).toEqual({ value: 'from_client_or_none' });
    });

    it('should give the client real types, it has nothing to inherit', () => {
      const defaults = getCommonDefaultFields({ forConfig: true });

      expect(defaults.connectionTimeoutType).toEqual({ value: 'num' });
      expect(defaults.caRejectUnauthorizedType).toEqual({ value: 'bool' });
      expect(defaults.requestAuthBearerTokenType).toEqual({ value: 'str' });
      expect(defaults.requestAuthKind).toEqual({ value: 'none' });
    });

    it('should not make headers and params inheritable (they are merged)', () => {
      const defaults = getCommonDefaultFields({ forConfig: false });

      expect(defaults.defaultArgsHeadersType).toEqual({ value: 'json' });
      expect(defaults.defaultArgsQueryParamsType).toEqual({ value: 'json' });
    });

    it('should require the name only when asked', () => {
      expect(getCommonDefaultFields().name).toEqual({ value: '', required: false });
      expect(getCommonDefaultFields({ nameRequired: true }).name).toEqual({ value: '', required: true });
    });

    it('should not use `type`, which means "config node" in Node-RED', () => {
      for (const field of Object.values(getCommonDefaultFields())) {
        expect(field).not.toHaveProperty('type');
      }
    });
  });

  describe('COMMON_FIELD_KEYS', () => {
    it('should be exactly the properties of the defaults', () => {
      expect([...COMMON_FIELD_KEYS].sort()).toEqual(Object.keys(getCommonDefaultFields()).sort());
    });

    it('should hold the value and the type of each field', () => {
      for (const key of Object.keys(COMMON_FIELDS)) {
        expect(COMMON_FIELD_KEYS).toContain(key);
        expect(COMMON_FIELD_KEYS).toContain(`${key}Type`);
      }
    });
  });
});
