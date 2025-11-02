import { useControllerNode } from '@keload/node-red-dxp/utils/controller';
import type { Node, NodeMessage } from 'node-red';
import { assign, isEmpty } from 'radash';
import { DEFAULT_VALUES } from '../defaultValues';
import { resolveUrlWithBase } from '../httpClient';
import type { CommonNodeFields, NodeHappyConfigAllProps, NodeHappyRequestAllProps } from '../nodeTypes';
import { getComputedClientInstance } from './configInstance';
import { getComputedNodeInstance } from './nodeInstance';

type ResolveRequestInformationParams = {
  node: Node;
  msg: NodeMessage;
  currentNode: NodeHappyRequestAllProps;
  clientInstance: NodeHappyConfigAllProps;
};

function resolveWithInheritClient(clientValue: unknown, nodeValue: unknown, inherit: boolean) {
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

  async function resolveEachNodes(
    key: keyof CommonNodeFields,
    opts?: { defaultValue?: unknown; withInherit?: boolean },
  ) {
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

  const [, , resolvedRequestAuthBearerToken] = await resolveEachNodes('requestAuthBearerToken', {
    defaultValue: '',
    withInherit: isFromClient.requestAuthBearerToken,
  });

  const [clientInstanceRequestAuthKind, nodeInstanceRequestAuthKind] = await resolveEachNodes('requestAuthKind', {
    defaultValue: '',
  });

  const realAuthKind =
    nodeInstanceRequestAuthKind === 'from_client_or_none' ? clientInstanceRequestAuthKind : nodeInstanceRequestAuthKind;

  const hasAuthKind = realAuthKind !== undefined && realAuthKind !== 'none';

  const [, , resolvedRequestAuthUsername] = await resolveEachNodes('requestAuthUsername', {
    defaultValue: '',
    withInherit: isFromClient.requestAuthUsername && clientInstanceRequestAuthKind !== 'none',
  });

  const resolvedRequestAuthPasswordSecret = () => {
    if (nodeInstance?.credentials?.requestAuthPasswordSecret) {
      return nodeInstance.credentials.requestAuthPasswordSecret;
    }
    if (configInstance?.credentials?.requestAuthPasswordSecret) {
      return configInstance.credentials.requestAuthPasswordSecret;
    }

    return '';
  };

  const [clientInstanceHeaders, nodeInstanceHeaders] = await resolveEachNodes('defaultArgsHeaders');
  const [clientInstanceQueryParams, nodeInstanceQueryParams] = await resolveEachNodes('defaultArgsQueryParams');

  const requestHeaders = {
    ...assign(clientInstanceHeaders, nodeInstanceHeaders),
    ...(resolvedRequestAuthBearerToken && {
      authorization: `Bearer ${resolvedRequestAuthBearerToken}`,
    }),
  };

  const urlToFetch = !isEmpty(configInstance?.clientInstanceBaseUrl)
    ? resolveUrlWithBase(configInstance.clientInstanceBaseUrl, nodeInstance.resolvedNodeEndpoint)
    : nodeInstance.resolvedNodeEndpoint;

  return {
    resolvedRequestHeaders: requestHeaders,
    resolvedRequestQueryParams: assign(clientInstanceQueryParams, nodeInstanceQueryParams),
    resolvedRequestMethod: nodeInstance.nodeInstanceMethod,
    resolvedRequestBody: nodeInstance.nodeInstanceBody,
    resolvedRequestBodyContentType: nodeInstance.nodeInstanceBodyContentType,
    urlToFetch,
    resolvedConnectionTimeout,
    resolvedConnectionKeepAlive,
    resolvedCaRejectUnauthorized,
    resolvedRequestAuthBearerToken,
    resolvedRequestAuth: {
      hasAuth: hasAuthKind,
      authKind: realAuthKind as 'basic' | 'digest',
      username: resolvedRequestAuthUsername,
      password: resolvedRequestAuthPasswordSecret(),
    },
  };
}
