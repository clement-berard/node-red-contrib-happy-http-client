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
  urlProxy: string;
  urlProxyType: string;
  requestAuthBearerToken: string;
  requestAuthBearerTokenType: string;
  requestAuthKind: string;
  requestAuthUsername: string;
  requestAuthUsernameType: string;
}

export interface NodeHappyConfigProps extends CommonNodeFields {
  baseUrl: string;
}

export interface NodeHappyConfigCredentials {
  requestAuthPasswordSecret: string;
}

export type NodeHappyConfigAllProps = NodeHappyConfigProps & { credentials: NodeHappyConfigCredentials };

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

export interface NodeHappyRequestPropsCredentials {
  requestAuthPasswordSecret: string;
}

export type NodeHappyRequestAllProps = NodeHappyRequestProps & { credentials: NodeHappyRequestPropsCredentials };
