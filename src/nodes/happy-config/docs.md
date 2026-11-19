A reusable HTTP client for the **Happy Request** nodes: set the base URL, the default headers, the authentication and
the timeouts once, and share them between as many requests as you need.

### Details

A Happy Request node picks this client in its **Client** field. For most settings it can either use the one of the
client (*Inherit from client*) or define its own.

#### Endpoint tab

- **Base URL** is joined to the endpoint of the request: `https://api.test/v1` + `/users` gives
  `https://api.test/v1/users`. It must be a valid URL, or empty.
- **Headers** and **Params** (query string) are sent with every request. A request adds its own and wins on a conflict.
- **Keep-Alive** and **Timeout** are in milliseconds (`0` turns the keep-alive off).

Headers, params, keep-alive and timeout accept a string, a JSON value, a `flow` or `global` property, an environment
variable or a JSONata expression, like the fields of a request.

#### Auth tab

- **Type**: *None*, *Basic* or *Digest*. *Basic* and *Digest* need a username and a password.
- **Bearer Token** adds an `Authorization: Bearer ...` header to every request.

The password is saved apart from the flow: it is not exported with it.

#### Advanced tab

- **Reject** verifies the TLS certificate of the server. Turn it off for a self-signed certificate.

### References

- [GitHub](https://github.com/clement-berard/node-red-contrib-happy-http-client) - sources and issues
