import { useControllerNode } from '@keload/node-red-dxp/utils/controller';
import type { Node, NodeMessage } from 'node-red';
import { assign, isEmpty } from 'radash';
import { resolveUrlWithBase } from '../httpClient';
import type { NodeHappyConfigAllProps, NodeHappyRequestAllProps } from '../nodeTypes';
import { getComputedClientInstance } from './configInstance';
import { getComputedNodeInstance } from './nodeInstance';
import { evaluatePipeline } from './utils/pipeline';
import { REQUEST_SCHEMA } from './utils/requestSchema';

type ResolveRequestInformationParams = {
  node: Node;
  msg: NodeMessage;
  currentNode: NodeHappyRequestAllProps;
  clientInstance: NodeHappyConfigAllProps | null;
};

export async function resolveRequestInformation(params: ResolveRequestInformationParams) {
  const { quickNodePropertyEval } = useControllerNode(params.node, params.msg);

  const [configInstance, nodeInstance] = await Promise.all([
    getComputedClientInstance({
      node: params.node,
      msg: params.msg,
      clientInstance: params.clientInstance,
    }),
    getComputedNodeInstance({
      node: params.node,
      msg: params.msg,
      currentNode: params.currentNode,
    }),
  ]);

  const rawFlags = (nodeInstance.isFromClient || {}) as unknown as Record<string, boolean>;
  const targetNode = (nodeInstance.currentNodeInstance || {}) as unknown as Record<string, unknown>;
  const targetClient = (configInstance.currentClientInstance || {}) as unknown as Record<string, unknown>;

  const results = await evaluatePipeline({
    schema: REQUEST_SCHEMA,
    evaluator: quickNodePropertyEval,
    clientTarget: targetClient,
    nodeTarget: targetNode,
    inheritFlags: rawFlags,
  });

  const realAuthKind =
    results.requestAuthKind.nodeVal === 'from_client_or_none'
      ? results.requestAuthKind.clientVal
      : results.requestAuthKind.nodeVal;

  const hasAuthKind = realAuthKind !== undefined && realAuthKind !== 'none';

  const shouldInheritUsername = rawFlags.requestAuthUsername && results.requestAuthKind.clientVal !== 'none';
  const resolvedRequestAuthUsername =
    shouldInheritUsername && results.requestAuthUsername.clientVal !== undefined
      ? results.requestAuthUsername.clientVal
      : results.requestAuthUsername.nodeVal;

  const resolvedRequestAuthPasswordSecret =
    nodeInstance?.credentials?.requestAuthPasswordSecret ||
    configInstance?.credentials?.requestAuthPasswordSecret ||
    '';

  const resolvedRequestAuthBearerToken = results.requestAuthBearerToken.finalValue as string | undefined;

  const requestHeaders: Record<string, string> = {
    ...assign(
      (results.defaultArgsHeaders.clientVal as Record<string, string>) || {},
      (results.defaultArgsHeaders.nodeVal as Record<string, string>) || {},
    ),
    ...(resolvedRequestAuthBearerToken && {
      authorization: `Bearer ${resolvedRequestAuthBearerToken}`,
    }),
  };

  const urlToFetch = !isEmpty(configInstance?.clientInstanceBaseUrl)
    ? resolveUrlWithBase(configInstance.clientInstanceBaseUrl as string, nodeInstance.resolvedNodeEndpoint as string)
    : nodeInstance.resolvedNodeEndpoint;

  return {
    resolvedRequestHeaders: requestHeaders,
    resolvedRequestQueryParams: assign(
      (results.defaultArgsQueryParams.clientVal as Record<string, string>) || {},
      (results.defaultArgsQueryParams.nodeVal as Record<string, string>) || {},
    ),
    resolvedRequestMethod: nodeInstance.nodeInstanceMethod,
    resolvedRequestBody: nodeInstance.nodeInstanceBody,
    resolvedRequestBodyContentType: nodeInstance.nodeInstanceBodyContentType,
    urlToFetch,
    resolvedConnectionTimeout: results.connectionTimeout.finalValue,
    resolvedConnectionKeepAlive: results.connectionKeepAlive.finalValue,
    resolvedCaRejectUnauthorized: results.caRejectUnauthorized.finalValue,
    resolvedRequestAuthBearerToken,
    resolvedRequestAuth: {
      hasAuth: hasAuthKind,
      authKind: realAuthKind as 'basic' | 'digest',
      username: resolvedRequestAuthUsername,
      password: resolvedRequestAuthPasswordSecret,
    },
  };
}
