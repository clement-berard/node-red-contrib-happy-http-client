import { useControllerNode } from '@keload/node-red-dxp/utils/controller';
import type { Node, NodeMessage } from 'node-red';
import type { HttpMethod } from 'urllib';
import { CONSTANTS } from '../constants';
import { HTTP_METHODS } from '../httpClient';
import type { NodeHappyRequestAllProps } from '../nodeTypes';

const checkIsFromClient = (term: string) => term === CONSTANTS.INHERIT_CLIENT_TERM;

export async function getComputedNodeInstance(params: {
  node: Node;
  msg: NodeMessage;
  currentNode: NodeHappyRequestAllProps;
}) {
  const { node, msg, currentNode } = params;

  const { quickNodePropertyEval } = useControllerNode(node, msg);

  const [resolvedNodeEndpoint, nodeInstanceBody, nodeInstanceBodyContentType, evaluatedMethod] = await Promise.all([
    quickNodePropertyEval(currentNode, 'endpoint'),
    quickNodePropertyEval(currentNode, 'body'),
    quickNodePropertyEval(currentNode, 'bodyContentType'),
    HTTP_METHODS.includes(currentNode.methodType)
      ? Promise.resolve(currentNode.methodType)
      : quickNodePropertyEval(currentNode, 'method'),
  ]);

  const nodeInstanceMethod: HttpMethod = HTTP_METHODS.includes(currentNode.methodType)
    ? currentNode.methodType
    : (evaluatedMethod as HttpMethod);

  const isFromClient = {
    connectionKeepAlive: checkIsFromClient(currentNode?.connectionKeepAliveType),
    connectionTimeout: checkIsFromClient(currentNode?.connectionTimeoutType),
    caRejectUnauthorized: checkIsFromClient(currentNode?.caRejectUnauthorizedType),
    requestAuthBearerToken: checkIsFromClient(currentNode?.requestAuthBearerTokenType),
    requestAuthKind: checkIsFromClient(currentNode?.requestAuthKind),
    requestAuthUsername: checkIsFromClient(currentNode?.requestAuthUsernameType),
  };

  return {
    nodeInstanceMethod,
    nodeInstanceBody: nodeInstanceBody || {},
    nodeInstanceBodyContentType,
    resolvedNodeEndpoint,
    isFromClient,
    currentNodeInstance: currentNode,
    credentials: currentNode.credentials,
  };
}
