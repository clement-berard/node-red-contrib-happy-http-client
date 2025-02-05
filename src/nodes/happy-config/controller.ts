import type { NodeControllerConfig, NodeControllerInst } from '@keload/node-red-dxp/editor';

import type { NodeHappyConfigProps } from '../../common/nodeTypes';

export const credentials = {};

export default function (
  this: NodeControllerInst<NodeHappyConfigProps>,
  config: NodeControllerConfig<NodeHappyConfigProps>,
) {
  RED.nodes.createNode(this, config);

  this.name = config.name;
  this.baseUrl = config.baseUrl;
  this.defaultArgsHeaders = config.defaultArgsHeaders;
  this.defaultArgsHeadersType = config.defaultArgsHeadersType;
  this.defaultArgsQueryParams = config.defaultArgsQueryParams;
  this.defaultArgsQueryParamsType = config.defaultArgsQueryParamsType;
  this.connectionKeepAlive = config.connectionKeepAlive;
  this.connectionKeepAliveType = config.connectionKeepAliveType;
  this.connectionTimeout = config.connectionTimeout;
  this.connectionTimeoutType = config.connectionTimeoutType;
  this.caRejectUnauthorized = config.caRejectUnauthorized;
  this.caRejectUnauthorizedType = config.caRejectUnauthorizedType;
  this.requestAuthBearerToken = config.requestAuthBearerToken;
  this.requestAuthBearerTokenType = config.requestAuthBearerTokenType;
  this.requestAuthKind = config.requestAuthKind;
  this.requestAuthUsername = config.requestAuthUsername;
  this.requestAuthUsernameType = config.requestAuthUsernameType;
  this.requestAuthPassword = config.requestAuthPassword;
  this.requestAuthPasswordType = config.requestAuthPasswordType;
}
