# node-red-contrib-happy-http-client

A highly flexible and customizable Node-RED node designed to simplify your HTTP requests.
Create and manage clients, parameterize everything, and handle errors effortlessly. 🛠️

<br/>
<p align="center">
  <a href="https://www.npmjs.com/package/@keload/node-red-dxp" aria-label="Build with node-red-dxp">
    <img src="https://img.shields.io/badge/Build%20with-node--red--dxp-blue?style=for-the-badge" alt="Build with node-red-dxp">
  </a>
</p>
<p align="center">
    <a href="https://github.com/clement-berard/node-red-contrib-happy-http-client/graphs/contributors">
        <img src="https://img.shields.io/github/contributors/clement-berard/node-red-contrib-happy-http-client.svg?style=for-the-badge" alt="Contributors">
    </a>
    <a href="https://github.com/clement-berard/node-red-contrib-happy-http-client/network/members">
        <img src="https://img.shields.io/github/forks/clement-berard/node-red-contrib-happy-http-client.svg?style=for-the-badge" alt="Forks">
    </a>
    <a href="https://github.com/clement-berard/node-red-contrib-happy-http-client/stargazers">
        <img src="https://img.shields.io/github/stars/clement-berard/node-red-contrib-happy-http-client.svg?style=for-the-badge" alt="Stargazers">
    </a>
    <a href="https://github.com/clement-berard/node-red-contrib-happy-http-client/issues">
        <img src="https://img.shields.io/github/issues/clement-berard/node-red-contrib-happy-http-client.svg?style=for-the-badge" alt="Issues">
    </a>
</p>
<p align="center">
  <a aria-label="NPM Version" href="https://www.npmjs.com/package/@keload/node-red-contrib-happy-http-client">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/@keload/node-red-contrib-happy-http-client.svg?label=NPM&logo=npm&style=for-the-badge&color=0470FF&logoColor=white">
  </a>
  <a aria-label="NPM Download Count" href="https://www.npmjs.com/package/@keload/node-red-contrib-happy-http-client">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dt/@keload/node-red-contrib-happy-http-client?label=Downloads&style=for-the-badge&color=67ACF3">
  </a>
</p>

## 📦 Installation

```bash
npm install @keload/node-red-contrib-happy-http-client
```

Or from the Node-RED editor: **Menu → Manage palette → Install**, then search for `@keload/node-red-contrib-happy-http-client`.

## ⚡ Quick Start

1. Drop a **Happy Config** node on the canvas (optional) and set a `Base URL`, e.g. `https://api.example.com/v1`.
2. Drop a **Happy Request** node, pick that config as its `Client`, and set `Endpoint` to `/users/42`.
3. Deploy and send it a message — the node makes the request and returns:

```js
msg.payload                        // response body
msg.happyRequest.ok                // true for 2xx responses
msg.happyRequest.response.status   // HTTP status code
```

No config node required — set a full URL directly as the `Endpoint` for one-off requests.

## Features

### Flexible Client Management

Create reusable HTTP clients (`Happy Config` nodes) to store a base URL, default headers, auth, and timeouts once, then reuse them across as many `Happy Request` nodes as needed — or skip the client entirely for ad-hoc calls.

![Client configuration](docs/screenshot-client.png)

### Full Parameterization

URL, headers, query params, and body all accept a static value, a `msg`/`flow`/`global` property, an environment variable, or a JSONata expression.

![Typed input options](docs/screenshot-parameterization.png)

### 🧩 Scripting: Before Request & Transform Response

Add optional JavaScript directly in the node, with a full code editor (syntax highlighting, expandable to full screen) — the same editor Node-RED's core Function node uses.

- **Before Request** (Request tab): runs just before the call is made. Receives `(request, msg, node)` and can mutate or return `{ url, method, headers, queryParams, body, bodyContentType }` to override the resolved request.
- **Transform Response** (Response tab): runs after the response is built. Receives `(msg, node)` and must return the `msg` to send onward — reshape the payload, add fields, whatever you need.

Both are optional — leave them empty and the node behaves exactly as before. Either one can return a `Promise`. If a script throws, the node reports an error and nothing is sent, so failures never pass silently.

<p align="center">
  <img src="docs/screenshot-scripting-request.png" width="45%" alt="Before Request scripting" />
  <img src="docs/screenshot-scripting-response.png" width="45%" alt="Transform Response scripting" />
</p>

### Authentication

Basic, Bearer, or Digest — configure once on the client and inherit it everywhere, or override it per request.

![Auth configuration](docs/screenshot-auth.png)

### Advanced Error Handling & Dual Outputs

Choose whether the node throws on non-2xx responses, and optionally split successes and errors into two separate outputs for explicit branching in your flow.

![Dual outputs](docs/screenshot-outputs.png)

### TLS

Toggle certificate verification (`rejectUnauthorized`) per client or per request.

### Built with `urllib`

Powered by [urllib](https://www.npmjs.com/package/urllib) for reliable, high-performance HTTP under the hood.

## Contributing & Developer Experience

This package is built with [node-red-dxp](https://www.npmjs.com/package/@keload/node-red-dxp) and written in TypeScript, keeping the codebase structured and easy to extend.

Issues, pull requests, and ideas are welcome — see [CHANGELOG.md](CHANGELOG.md) for recent changes.

## License

MIT
