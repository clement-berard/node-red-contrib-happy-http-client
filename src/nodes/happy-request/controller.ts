import type { NodeControllerConfig, NodeControllerInst } from '@keload/node-red-dxp/editor';
import { isUrl } from '@keload/node-red-dxp/utils';
import { getREDNode, splitBooleanOutputs } from '@keload/node-red-dxp/utils/controller';
import type { NodeMessage } from 'node-red';
import { HttpClient } from 'urllib';
import { resolveRequestInformation } from '../../common/controller/reqInfo';
import { runUserScript } from '../../common/controller/utils/userScript';
import { handleRequest } from '../../common/httpClient';
import type { NodeHappyConfigAllProps, NodeHappyRequestAllProps } from '../../common/nodeTypes';

export const credentials = {
  requestAuthPasswordSecret: { type: 'text' },
};

export default function (
  this: NodeControllerInst<NodeHappyRequestAllProps>,
  config: NodeControllerConfig<NodeHappyRequestAllProps>,
) {
  RED.nodes.createNode(this, config);
  this.status({});

  const clientHttpOptions = {};

  const clientInstance = getREDNode<NodeHappyConfigAllProps>(config.clientInstance);

  const { throwErrorOnError, splitBooleanOutputs: nodeSplitBooleanOutputs } = config;

  this.on('input', async (msg) => {
    this.status({});
    const resolvedRequestInfo = await resolveRequestInformation({
      node: this,
      msg,
      currentNode: { ...config, credentials: this.credentials },
      clientInstance,
    });

    let {
      resolvedRequestHeaders,
      resolvedRequestQueryParams,
      resolvedRequestMethod,
      resolvedRequestBody,
      resolvedRequestBodyContentType,
      urlToFetch,
    } = resolvedRequestInfo;

    const {
      resolvedConnectionTimeout,
      resolvedConnectionKeepAlive,
      resolvedCaRejectUnauthorized,
      resolvedRequestAuth,
    } = resolvedRequestInfo;

    const dateNow = new Date().toLocaleString();

    if (config.beforeRequestScript) {
      const requestForScript = {
        url: urlToFetch,
        method: resolvedRequestMethod,
        headers: resolvedRequestHeaders,
        queryParams: resolvedRequestQueryParams,
        body: resolvedRequestBody,
        bodyContentType: resolvedRequestBodyContentType,
      };

      try {
        const overrides = await runUserScript<Partial<typeof requestForScript> | undefined>(
          config.beforeRequestScript,
          ['request', 'msg', 'node'],
          [requestForScript, msg, this],
        );

        const resolvedOverrides = overrides && typeof overrides === 'object' ? overrides : requestForScript;

        if (resolvedOverrides.url !== undefined) urlToFetch = resolvedOverrides.url;
        if (resolvedOverrides.method !== undefined) resolvedRequestMethod = resolvedOverrides.method;
        if (resolvedOverrides.headers !== undefined) resolvedRequestHeaders = resolvedOverrides.headers;
        if (resolvedOverrides.queryParams !== undefined) resolvedRequestQueryParams = resolvedOverrides.queryParams;
        if (resolvedOverrides.body !== undefined) resolvedRequestBody = resolvedOverrides.body;
        if (resolvedOverrides.bodyContentType !== undefined)
          resolvedRequestBodyContentType = resolvedOverrides.bodyContentType;
      } catch (scriptErr: any) {
        this.error(scriptErr, msg);
        this.status({
          fill: 'red',
          text: `Before-request script error at ${dateNow}`,
        });
        return;
      }
    }

    const isValidUrl = isUrl(urlToFetch);

    if (!isValidUrl) {
      this.error(`Invalid URL: ${urlToFetch}`);
      this.status({
        fill: 'red',
        text: `Invalid URL at ${dateNow}`,
      });

      return;
    }

    const currentHttpClient = new HttpClient({
      ...clientHttpOptions,
      connect: {
        timeout: Number(resolvedConnectionTimeout),
        rejectUnauthorized: Boolean(resolvedCaRejectUnauthorized),
      },
    });

    const [err, data, res] = await handleRequest({
      url: urlToFetch,
      client: currentHttpClient,
      queryParams: resolvedRequestQueryParams,
      reqOptions: {
        method: resolvedRequestMethod,
        headers: resolvedRequestHeaders,
        ...(resolvedRequestMethod !== 'GET' && {
          data: resolvedRequestBody,
          contentType: resolvedRequestBodyContentType,
        }),
        dataType: config.responseFormat,
        keepAliveTimeout: Number(resolvedConnectionKeepAlive),
        ...(resolvedRequestAuth.hasAuth &&
          resolvedRequestAuth.authKind === 'basic' && {
            auth: `${resolvedRequestAuth.username}:${resolvedRequestAuth.password}`,
          }),
        ...(resolvedRequestAuth.hasAuth &&
          resolvedRequestAuth.authKind === 'digest' && {
            digestAuth: `${resolvedRequestAuth.username}:${resolvedRequestAuth.password}`,
          }),
      },
    });

    if (throwErrorOnError && err) {
      this.error({
        message: err.message,
        response: res?.response,
      });
      this.status({
        fill: 'red',
        text: `Error ${res.response.status} at ${dateNow}`,
      });
    }

    let msgResponse = {
      ...msg,
      happyRequest: res,
      payload: data,
    };

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
        this.status({
          fill: 'red',
          text: `Response script error at ${dateNow}`,
        });
        return;
      }
    }

    if (res.ok) {
      this.status({
        fill: 'green',
        text: `Success at ${dateNow}`,
      });
    }

    if (nodeSplitBooleanOutputs) {
      const isSuccess = err === undefined;
      const outputs = splitBooleanOutputs(isSuccess, msgResponse) as Array<NodeMessage | NodeMessage[] | null>;
      this.send(outputs);
    } else {
      this.send(msgResponse);
    }
  });
}
