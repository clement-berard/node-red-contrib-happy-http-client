A highly flexible and customizable Node-RED node designed to simplify your HTTP requests.
Create and manage clients, parameterize everything, and handle errors effortlessly. 🛠️

### Inputs

: payload (any) : sent as the body of the request by default (`msg.payload`). Not sent with `GET`.
: *(any property)* : every field of the node (endpoint, method, body, headers, params...) can read its value from the message.

### Outputs

1. Standard output
: payload (any) : the body of the response, read as the chosen **Format** (`json`, `text`, `html`, `buffer`, `stream`).
: happyRequest (object) : details of the call. Holds `ok` (`true` for a 2xx response), `request` (`{ url, reqOptions }` as sent) and `response` (`status`, `headers`, `data`...).

2. Error output *(only with **Split out**)*
: payload (any) : the same message as the standard output, for a request that failed (non-2xx, network error, unreadable body). The standard output then only gets the successes.

### Details

#### Client

Select a **Happy Config** node as the **Client**, or leave it empty for a one-off call.

- With a client, the endpoint is joined to its **Base URL**: `https://api.test/v1` + `/users` gives `https://api.test/v1/users`.
- Without a client, the **Endpoint** must be the full URL.

#### Typed fields

Most fields accept a **string**, a **JSON** value, a `msg`, `flow` or `global` property, an environment variable or a
JSONata expression. Pick the type on the left of the field.

#### Request tab

- **Headers** and **Params** (query string) are merged with the ones of the client: the node wins on a conflict.
- **Body** is sent for every method but `GET`. Leave it empty to send no body.
- **Body Type** is the `content-type` of the body (`json`, `xml`, `text`, `sparql`).
- **Keep-Alive** and **Timeout** are in milliseconds. Choose *Inherit from client* to use the ones of the client.

#### Scripting

Two optional JavaScript snippets, edited in the same code editor as the Function node (they can `await` and `return`
a Promise).

- **Before Request** receives `request`, `msg` and `node`. Mutate `request`, or return an object with some of
  `{ url, method, headers, queryParams, body, bodyContentType }` to override them.
- **Transform Response** (Response tab) receives `msg` and `node` and **must return the message** to send.

If a script throws, the error is reported and **nothing is sent**.

#### Response tab

- **Throw Error** raises a node error (visible in the debug sidebar, catchable with a *catch* node) when the status is
  not 2xx. The message is still sent.
- **Format** is how the body is read. An answer that does not match (an HTML page read as `json`) is reported as an
  error with its HTTP status.
- **Split out** adds a second output for the errors.

#### Auth tab

- **Type**: *From client or none* (default), *None*, *Basic* or *Digest*. *Basic* and *Digest* need a username and a
  password; the password is the one of the node, otherwise the one of the client.
- **Bearer Token** adds an `Authorization: Bearer ...` header. *Inherit from client* uses the token of the client.

#### Advanced tab

- **Reject** verifies the TLS certificate of the server. Turn it off for a self-signed certificate.

#### Status

The status under the node shows the result and the time: `Success`, `Error <status>`, `Invalid URL`, or the failing
script.

### Example

```js
// Before Request: add a header and a query parameter
request.headers['x-trace'] = msg._msgid;
request.queryParams.page = 2;
```

```js
// Transform Response: keep only the items
msg.payload = msg.payload.items;
return msg;
```

### References

- [GitHub](https://github.com/clement-berard/node-red-contrib-happy-http-client) - sources and issues
- [urllib](https://www.npmjs.com/package/urllib) - the HTTP client used under the hood
