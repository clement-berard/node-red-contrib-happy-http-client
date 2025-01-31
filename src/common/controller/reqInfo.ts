import type { Node, NodeMessage } from 'node-red';
import { assign, isEmpty } from 'radash';
import { resolveUrlWithBase } from '../httpClient';
import type { CommonNodeFields, NodeHappyConfigProps, NodeHappyRequestProps } from '../nodeTypes';
import { getComputedNodeInstance } from './nodeInstance';

import { useControllerNode } from '@keload/node-red-dxp/utils/controller';
import { DEFAULT_VALUES } from '../defaultValues';
import { getComputedClientInstance } from './configInstance';

type ResolveRequestInformationParams = {
  node: Node;
  msg: NodeMessage;
  currentNode: NodeHappyRequestProps;
  clientInstance: NodeHappyConfigProps;
};

function resolveWithInheritClient(clientValue: any, nodeValue: any, inherit: boolean) {
  if (!inherit) {
    return nodeValue;
  }

  return clientValue !== undefined ? clientValue : nodeValue;
}

async function getTwoNodes(params: ResolveRequestInformationParams) {
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

  const { quickNodePropertyEval } = useControllerNode(params.node, params.msg);

  async function resolveEachNodes(key: keyof CommonNodeFields, opts?: { defaultValue?: any; withInherit?: boolean }) {
    const { defaultValue, withInherit = false } = opts || {};
    const [resNode, resConfig] = await Promise.all([
      quickNodePropertyEval(nodeInstance.currentNodeInstance, key, {
        strictDefaultValue: defaultValue,
      }),
      quickNodePropertyEval(configInstance.currentClientInstance, key, {
        strictDefaultValue: defaultValue,
      }),
    ]);

    const resolvedInherit = resolveWithInheritClient(resConfig, resNode, withInherit);

    return [resConfig, resNode, resolvedInherit] as const;
  }

  return {
    configInstance,
    nodeInstance,
    resolveEachNodes,
  };
}

export async function resolveRequestInformation(params: ResolveRequestInformationParams) {
  const { configInstance, nodeInstance, resolveEachNodes } = await getTwoNodes(params);

  const { isFromClient } = nodeInstance;

  const [, , resolvedConnectionTimeout] = await resolveEachNodes('connectionTimeout', {
    defaultValue: DEFAULT_VALUES.CONNECTION_TIMEOUT,
    withInherit: isFromClient.connectionTimeout,
  });

  const [, , resolvedConnectionKeepAlive] = await resolveEachNodes('connectionKeepAlive', {
    defaultValue: DEFAULT_VALUES.CONNECTION_KEEP_ALIVE,
    withInherit: isFromClient.connectionKeepAlive,
  });

  const [, , resolvedCaRejectUnauthorized] = await resolveEachNodes('caRejectUnauthorized', {
    defaultValue: DEFAULT_VALUES.CA_REJECT_UNAUTHORIZED,
    withInherit: isFromClient.caRejectUnauthorized,
  });

  const [clientInstanceHeaders, nodeInstanceHeaders] = await resolveEachNodes('defaultArgsHeaders');
  const [clientInstanceQueryParams, nodeInstanceQueryParams] = await resolveEachNodes('defaultArgsQueryParams');

  const urlToFetch = !isEmpty(configInstance?.clientInstanceBaseUrl)
    ? resolveUrlWithBase(configInstance.clientInstanceBaseUrl, nodeInstance.resolvedNodeEndpoint)
    : nodeInstance.resolvedNodeEndpoint;

  return {
    resolvedRequestHeaders: assign(clientInstanceHeaders, nodeInstanceHeaders),
    resolvedRequestQueryParams: assign(clientInstanceQueryParams, nodeInstanceQueryParams),
    resolvedRequestMethod: nodeInstance.nodeInstanceMethod,
    resolvedRequestBody: nodeInstance.nodeInstanceBody,
    urlToFetch,
    resolvedConnectionTimeout,
    resolvedConnectionKeepAlive,
    resolvedCaRejectUnauthorized,
  };
}
