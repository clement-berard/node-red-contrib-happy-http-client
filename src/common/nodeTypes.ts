import type { RequestOptions } from 'urllib';

export interface CommonNodeFields {
  name: string;
  defaultArgsHeaders: string;
  defaultArgsHeadersType: string;
  defaultArgsQueryParams: string;
  defaultArgsQueryParamsType: string;
  connectionKeepAlive: number;
  connectionKeepAliveType: string;
  connectionTimeout: number;
  connectionTimeoutType: string;
  caRejectUnauthorized: boolean;
  caRejectUnauthorizedType: string;
  requestAuthBearerToken: string;
  requestAuthBearerTokenType: string;
  requestAuthKind: string;
  requestAuthUsername: string;
  requestAuthUsernameType: string;
  requestAuthPassword: string;
  requestAuthPasswordType: string;
}

export interface NodeHappyConfigProps extends CommonNodeFields {
  baseUrl: string;
}

export interface NodeHappyRequestProps extends CommonNodeFields {
  clientInstance: string;
  endpoint: string;
  endpointType: string;
  method: string;
  methodType: string;
  body: string;
  bodyContentType: string;
  bodyType: string;
  throwErrorOnError: boolean;
  splitBooleanOutputs: boolean;
  outputs: number;
  responseFormat: RequestOptions['dataType'];
}
