import type { Node, NodeMessage } from 'node-red';
import type { NodeHappyConfigAllProps } from '../nodeTypes';

export async function getComputedClientInstance(params: {
  clientInstance: NodeHappyConfigAllProps;
  node: Node;
  msg: NodeMessage;
}) {
  const { clientInstance } = params;

  return {
    clientInstanceBaseUrl: clientInstance?.baseUrl,
    credentials: clientInstance?.credentials,
    currentClientInstance: clientInstance,
  };
}
