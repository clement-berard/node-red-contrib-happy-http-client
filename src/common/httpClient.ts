import { isEmpty } from 'radash';
import type { HttpClient, HttpMethod, RequestOptions } from 'urllib';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];
export const REQUEST_RESPONSE_FORMAT: RequestOptions['dataType'][] = ['json', 'text', 'html', 'buffer', 'stream'];

export const REQUEST_BODY_CONTENT_TYPES = [
  {
    label: 'json',
    value: 'application/json',
  },
  {
    label: 'xml',
    value: 'text/xml',
  },
  {
    label: 'text',
    value: ' text/plain',
  },
  {
    label: 'sparql',
    value: 'application/sparql-query',
  },
];

type HandleRequestParams = {
  url: string;
  client: HttpClient;
  queryParams?: Record<string, string>;
  reqOptions?: RequestOptions;
};

export async function handleRequest(params: HandleRequestParams) {
  const urlSearchParamsString = new URLSearchParams(params?.queryParams || {}).toString();

  const fullUrl = `${params.url}${!isEmpty(urlSearchParamsString) ? `?${urlSearchParamsString}` : ''}`;
  const reqOptions = params?.reqOptions || {};

  try {
    const resp = await params.client.request(fullUrl, {
      ...reqOptions,
    });

    const ok = resp.status >= 200 && resp.status < 300;

    const commonResponse = {
      ok,
      request: {
        url: fullUrl,
        reqOptions,
      },
      response: resp,
    };

    if (!ok) {
      return [new Error(`Request failed with status ${resp.status} (${resp.url})`), undefined, commonResponse] as const;
    }

    return [undefined, resp.data, commonResponse] as const;
  } catch (error: any) {
    return [error as Error, undefined, { ok: false, ...error.res }] as const;
  }
}

export function resolveUrlWithBase(baseUrl: string, pathName: string) {
  const realEndpoint = pathName.startsWith('/') ? pathName.substring(1) : pathName;
  const realBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${realBaseUrl}/${realEndpoint}`;
}
