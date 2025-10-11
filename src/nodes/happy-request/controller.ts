import type { NodeControllerConfig, NodeControllerInst } from '@keload/node-red-dxp/editor';
import { isUrl } from '@keload/node-red-dxp/utils';
import { getREDNode, splitBooleanOutputs } from '@keload/node-red-dxp/utils/controller';
import { HttpClient } from 'urllib';
import { resolveRequestInformation } from '../../common/controller/reqInfo';
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
    const {
      resolvedRequestHeaders,
      resolvedRequestQueryParams,
      resolvedRequestMethod,
      resolvedRequestBody,
      resolvedRequestBodyContentType,
      resolvedConnectionTimeout,
      resolvedConnectionKeepAlive,
      resolvedCaRejectUnauthorized,
      urlToFetch,
      resolvedRequestAuth,
    } = await resolveRequestInformation({
      node: this,
      msg,
      currentNode: { ...config, credentials: this.credentials },
      clientInstance,
    });

    const isValidUrl = isUrl(urlToFetch);

    if (!isValidUrl) {
      this.error(`Invalid URL: ${urlToFetch}`);
      this.status({
        fill: 'red',
        text: 'Invalid URL',
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
        text: 'error',
      });
    }

    const msgResponse = {
      ...msg,
      happyRequest: res,
      payload: data,
    };

    if (nodeSplitBooleanOutputs) {
      const isSuccess = err === undefined;
      const outputs = splitBooleanOutputs(isSuccess, msgResponse);
      this.send(outputs);
    } else {
      this.send(msgResponse);
    }
  });
}
