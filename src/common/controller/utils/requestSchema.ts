import { DEFAULT_VALUES } from '../../defaultValues';

export type ResolutionRule<T> = {
  defaultValue: T;
  inheritFlagKey?: string;
};

export type RequestSchemaProps = {
  connectionTimeout: ResolutionRule<number>;
  connectionKeepAlive: ResolutionRule<number>;
  caRejectUnauthorized: ResolutionRule<boolean>;
  requestAuthBearerToken: ResolutionRule<string>;
  requestAuthKind: ResolutionRule<string>;
  requestAuthUsername: ResolutionRule<string>;
  defaultArgsHeaders: ResolutionRule<Record<string, unknown>>;
  defaultArgsQueryParams: ResolutionRule<Record<string, unknown>>;
};

export const REQUEST_SCHEMA: RequestSchemaProps = {
  connectionTimeout: { defaultValue: DEFAULT_VALUES.CONNECTION_TIMEOUT, inheritFlagKey: 'connectionTimeout' },
  connectionKeepAlive: { defaultValue: DEFAULT_VALUES.CONNECTION_KEEP_ALIVE, inheritFlagKey: 'connectionKeepAlive' },
  caRejectUnauthorized: { defaultValue: DEFAULT_VALUES.CA_REJECT_UNAUTHORIZED, inheritFlagKey: 'caRejectUnauthorized' },
  requestAuthBearerToken: { defaultValue: '', inheritFlagKey: 'requestAuthBearerToken' },
  requestAuthKind: { defaultValue: '' },
  requestAuthUsername: { defaultValue: '', inheritFlagKey: 'requestAuthUsername' },
  defaultArgsHeaders: { defaultValue: {} },
  defaultArgsQueryParams: { defaultValue: {} },
};
