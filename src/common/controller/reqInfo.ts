import { useControllerNode } from '@keload/node-red-dxp/utils/controller';
import type { Node, NodeMessage } from 'node-red';
import { assign, isEmpty } from 'radash';
import type { HttpMethod } from 'urllib';
import { CONSTANTS } from '../constants';
import { COMMON_FIELDS } from '../editor/commonFields';
import { HTTP_METHODS, resolveUrlWithBase } from '../httpClient';
import type { NodeHappyConfigAllProps, NodeHappyRequestAllProps } from '../nodeTypes';

type ResolveRequestInformationParams = {
  node: Node;
  msg: NodeMessage;
  currentNode: NodeHappyRequestAllProps;
  clientInstance: NodeHappyConfigAllProps | null;
};

type Dict = Record<string, string>;

// the settings the request node can inherit from its client, with their default value
const INHERITABLE_FIELDS = Object.fromEntries(
  Object.entries(COMMON_FIELDS)
    .filter(([, field]) => field.inherit)
    .map(([key, field]) => [key, field.value]),
);
const OBJECT_FIELDS = { defaultArgsHeaders: {}, defaultArgsQueryParams: {} };

export async function resolveRequestInformation(params: ResolveRequestInformationParams) {
  const { node, msg, currentNode, clientInstance } = params;
  const { quickNodePropertyEval, evalProps, resolveInherited } = useControllerNode(node, msg);
  const client = clientInstance ?? {};

  const [own, method, inherited, ownObjects, clientObjects] = await Promise.all([
    evalProps(currentNode, { endpoint: undefined, body: undefined, bodyContentType: undefined }),
    HTTP_METHODS.includes(currentNode.methodType)
      ? currentNode.methodType
      : quickNodePropertyEval(currentNode, 'method'),
    resolveInherited({
      node: currentNode,
      parent: clientInstance,
      inheritType: CONSTANTS.INHERIT_CLIENT_TERM,
      fields: INHERITABLE_FIELDS,
    }),
    evalProps(currentNode, OBJECT_FIELDS),
    evalProps(client, OBJECT_FIELDS),
  ]);
  const merged = (key: keyof typeof OBJECT_FIELDS) =>
    assign((clientObjects[key] as Dict) || {}, (ownObjects[key] as Dict) || {});

  // the kind has no typedInput: the node can only ask for the one of its client (`from_client_or_none`)
  const kind =
    currentNode.requestAuthKind === `${CONSTANTS.INHERIT_CLIENT_TERM}_or_none`
      ? clientInstance?.requestAuthKind
      : currentNode.requestAuthKind;
  const inheritsUsername =
    currentNode.requestAuthUsernameType === CONSTANTS.INHERIT_CLIENT_TERM && clientInstance?.requestAuthKind !== 'none';

  const hasAuth = Boolean(kind) && kind !== 'none';
  const bearer = inherited.requestAuthBearerToken.value as string | undefined;
  const baseUrl = clientInstance?.baseUrl;
  const endpoint = own.endpoint as string;

  return {
    request: {
      url: isEmpty(baseUrl) ? endpoint : resolveUrlWithBase(baseUrl as string, endpoint),
      method: method as HttpMethod,
      headers: { ...merged('defaultArgsHeaders'), ...(bearer && { authorization: `Bearer ${bearer}` }) },
      queryParams: merged('defaultArgsQueryParams'),
      // undefined when the field is empty or evaluates to nothing: no body is sent
      body: own.body === '' ? undefined : own.body,
      bodyContentType: own.bodyContentType as string | undefined,
    },
    connection: {
      timeout: inherited.connectionTimeout.value,
      keepAlive: inherited.connectionKeepAlive.value,
      rejectUnauthorized: inherited.caRejectUnauthorized.value,
    },
    /** `undefined` when the request is not authenticated. */
    auth: hasAuth
      ? {
          kind: kind as 'basic' | 'digest',
          username: inheritsUsername ? inherited.requestAuthUsername.value : inherited.requestAuthUsername.own,
          password:
            currentNode.credentials?.requestAuthPasswordSecret ||
            clientInstance?.credentials?.requestAuthPasswordSecret ||
            '',
        }
      : undefined,
  };
}
