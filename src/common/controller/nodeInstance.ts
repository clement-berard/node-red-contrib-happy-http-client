import { useControllerNode } from '@keload/node-red-dxp/utils/controller';
import type { Node, NodeMessage } from 'node-red';
import { CONSTANTS } from '../constants';
import type { NodeHappyRequestProps } from '../nodeTypes';

const checkIsFromClient = (term: string) => term === CONSTANTS.INHERIT_CLIENT_TERM;

export async function getComputedNodeInstance(params: {
  node: Node;
  msg: NodeMessage;
  currentNode: NodeHappyRequestProps;
}) {
  const { node, msg, currentNode } = params;

  const { quickNodePropertyEval } = useControllerNode(node, msg);

  const resolvedNodeEndpoint = await quickNodePropertyEval(currentNode, 'endpoint');
  const nodeInstanceBody = await quickNodePropertyEval(currentNode, 'body');
  const nodeInstanceMethod = await quickNodePropertyEval(currentNode, 'method');

  const isFromClient = {
    connectionKeepAlive: checkIsFromClient(currentNode?.connectionKeepAliveType),
    connectionTimeout: checkIsFromClient(currentNode?.connectionTimeoutType),
    caRejectUnauthorized: checkIsFromClient(currentNode?.caRejectUnauthorizedType),
    requestAuthBearerToken: checkIsFromClient(currentNode?.requestAuthBearerTokenType),
  };

  return {
    nodeInstanceMethod,
    nodeInstanceBody: nodeInstanceBody || {},
    resolvedNodeEndpoint,
    isFromClient,
    currentNodeInstance: currentNode,
  };
}
