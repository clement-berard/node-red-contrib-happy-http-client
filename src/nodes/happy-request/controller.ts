import type { NodeControllerConfig, NodeControllerInst } from '@keload/node-red-dxp/editor';
import { isUrl } from '@keload/node-red-dxp/utils';
import { getREDNode, splitBooleanOutputs } from '@keload/node-red-dxp/utils/controller';
import { HttpClient } from 'urllib';
import { resolveRequestInformation } from '../../common/controller/reqInfo';
import { handleRequest } from '../../common/httpClient';
import type { NodeHappyConfigProps, NodeHappyRequestProps } from '../../common/nodeTypes';

export default function (
  this: NodeControllerInst<NodeHappyRequestProps>,
  config: NodeControllerConfig<NodeHappyRequestProps>,
) {
  RED.nodes.createNode(this, config);
  this.status({});

  const clientHttpOptions = {};

  const clientInstance = getREDNode<NodeHappyConfigProps>(config.clientInstance);

  const { throwErrorOnError, splitBooleanOutputs: nodeSplitBooleanOutputs } = config;

  this.on('input', async (msg) => {
    const {
      resolvedRequestHeaders,
      resolvedRequestQueryParams,
      resolvedRequestMethod,
      resolvedRequestBody,
      resolvedConnectionTimeout,
      resolvedConnectionKeepAlive,
      resolvedCaRejectUnauthorized,
      urlToFetch,
    } = await resolveRequestInformation({
      node: this,
      msg,
      currentNode: config,
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
        timeout: resolvedConnectionTimeout,
        rejectUnauthorized: resolvedCaRejectUnauthorized,
      },
    });

    const [err, data, res] = await handleRequest({
      url: urlToFetch,
      client: currentHttpClient,
      queryParams: resolvedRequestQueryParams,
      reqOptions: {
        method: resolvedRequestMethod,
        headers: resolvedRequestHeaders,
        data: resolvedRequestBody,
        dataType: config.responseFormat,
        keepAliveTimeout: resolvedConnectionKeepAlive,
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
      // @ts-ignore
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
