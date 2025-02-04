import type { Node, NodeMessage } from 'node-red';
import type { NodeHappyConfigProps } from '../nodeTypes';

export async function getComputedClientInstance(params: {
  clientInstance: NodeHappyConfigProps;
  node: Node;
  msg: NodeMessage;
}) {
  const { clientInstance } = params;

  return {
    clientInstanceBaseUrl: clientInstance?.baseUrl,
    currentClientInstance: clientInstance,
  };
}
