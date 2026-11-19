import type { NodeControllerConfig, NodeControllerInst } from '@keload/node-red-dxp/editor';
import { isUrl } from '@keload/node-red-dxp/utils';
import { getREDNode, runUserScript, splitBooleanOutputs, useNodeStatus } from '@keload/node-red-dxp/utils/controller';
import type { NodeMessage } from 'node-red';
import { HttpClient } from 'urllib';
import { resolveRequestInformation } from '../../common/controller/reqInfo';
import { handleRequest } from '../../common/httpClient';
import type { NodeHappyConfigAllProps, NodeHappyRequestAllProps } from '../../common/nodeTypes';

export const credentials = {
  requestAuthPasswordSecret: { type: 'text' },
};

const REQUEST_KEYS = ['url', 'method', 'headers', 'queryParams', 'body', 'bodyContentType'] as const;

/** The fields of the object returned by the before-request script that are set. */
function definedFields(overrides: unknown) {
  if (!overrides || typeof overrides !== 'object') return {};
  return Object.fromEntries(
    REQUEST_KEYS.map((key) => [key, (overrides as Record<string, unknown>)[key]]).filter(
      ([, value]) => value !== undefined,
    ),
  );
}

export default function (
  this: NodeControllerInst<NodeHappyRequestAllProps>,
  config: NodeControllerConfig<NodeHappyRequestAllProps>,
) {
  RED.nodes.createNode(this, config);
  const status = useNodeStatus(this);
  status.reset();

  const clientInstance = getREDNode<NodeHappyConfigAllProps>(config.clientInstance);

  this.on('input', async (msg) => {
    status.reset();
    const resolved = await resolveRequestInformation({
      node: this,
      msg,
      currentNode: { ...config, credentials: this.credentials },
      clientInstance,
    });
    let { request } = resolved;

    if (config.beforeRequestScript) {
      try {
        // the script can mutate `request` or return the fields to override
        const overrides = await runUserScript(
          config.beforeRequestScript,
          ['request', 'msg', 'node'],
          [request, msg, this],
        );
        request = { ...request, ...definedFields(overrides) };
      } catch (scriptErr: any) {
        this.error(scriptErr, msg);
        status.error('Before-request script error');
        return;
      }
    }

    if (!isUrl(request.url)) {
      this.error(`Invalid URL: ${request.url}`);
      status.error('Invalid URL');
      return;
    }

    const { auth, connection } = resolved;
    const [err, data, res] = await handleRequest({
      url: request.url,
      client: new HttpClient({
        connect: { timeout: Number(connection.timeout), rejectUnauthorized: Boolean(connection.rejectUnauthorized) },
      }),
      queryParams: request.queryParams,
      reqOptions: {
        method: request.method,
        headers: request.headers,
        ...(request.method !== 'GET' &&
          request.body !== undefined && { data: request.body, contentType: request.bodyContentType }),
        dataType: config.responseFormat,
        keepAliveTimeout: Number(connection.keepAlive),
        ...(auth && { [auth.kind === 'digest' ? 'digestAuth' : 'auth']: `${auth.username}:${auth.password}` }),
      },
    });

    if (config.throwErrorOnError && err) {
      this.error({ message: err.message, response: res?.response });
      status.error(`Error ${res?.response?.status ?? (err as any).code ?? 'request failed'}`);
    }

    let msgResponse = { ...msg, happyRequest: res, payload: data };

    if (config.afterResponseScript) {
      try {
        const transformed = await runUserScript<typeof msgResponse | undefined>(
          config.afterResponseScript,
          ['msg', 'node'],
          [msgResponse, this],
        );
        if (!transformed || typeof transformed !== 'object') {
          throw new Error('Transform response script must return the msg object');
        }
        msgResponse = transformed;
      } catch (scriptErr: any) {
        this.error(scriptErr, msg);
        status.error('Response script error');
        return;
      }
    }

    if (res.ok) status.success('Success');

    if (config.splitBooleanOutputs) {
      this.send(splitBooleanOutputs(err === undefined, msgResponse) as Array<NodeMessage | NodeMessage[] | null>);
    } else {
      this.send(msgResponse);
    }
  });
}
