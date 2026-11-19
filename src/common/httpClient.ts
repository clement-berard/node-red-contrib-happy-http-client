import type { HttpClient, HttpMethod, RequestOptions } from 'urllib';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];
export const REQUEST_RESPONSE_FORMAT = ['json', 'text', 'html', 'buffer', 'stream'] as const satisfies NonNullable<
  RequestOptions['dataType']
>[];

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
  const structuredUrl = new URL(params.url);

  const combinedSearchParams = new URLSearchParams({
    ...Object.fromEntries(structuredUrl.searchParams),
    ...params?.queryParams,
  });

  structuredUrl.search = combinedSearchParams.toString();

  const fullUrl = structuredUrl.toString();

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
    // `error.res` is set when the server answered but the body could not be read (a html page asked as json, for
    // instance): report what happened to the request rather than the parsing error, and keep the status reachable
    // at the same place as for any response
    const status: number | undefined = error.res?.status;
    const failure =
      typeof status !== 'number'
        ? error
        : status >= 200 && status < 300
          ? new Error(`Invalid ${reqOptions.dataType ?? 'json'} response (status ${status}): ${error.message}`, {
              cause: error,
            })
          : new Error(`Request failed with status ${status} (${fullUrl})`, { cause: error });

    return [
      failure as Error,
      undefined,
      { ok: false, request: { url: fullUrl, reqOptions }, ...error.res, response: error.res },
    ] as const;
  }
}

export function resolveUrlWithBase(baseUrl: string, pathName: string) {
  const realEndpoint = pathName.startsWith('/') ? pathName.substring(1) : pathName;
  const realBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${realBaseUrl}/${realEndpoint}`;
}
