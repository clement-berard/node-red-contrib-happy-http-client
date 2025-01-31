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


## 🚧 Beta Version Notice

Happy HTTP Client is currently in beta. While it already offers powerful features, some functionalities are still under development.
Expect updates soon, and feel free to share feedback or report issues to help improve the node! 🚀✨

## Features

### 🛠️ Flexible Client Management

Create reusable HTTP clients to save and manage configurations, or make ad-hoc requests without a client.

### 🌐 Full Parameterization

All parameters (URL, headers, query params, body, etc.) are fully dynamic and can use msg, flow, global, environment variables...

### ⚠️ Advanced Error Handling

Choose whether the node should throw errors or not. Separate outputs for success ✅ and error ❌ cases give you full control over your flow.

### 🎨 Customizable and Extensible

Designed for ultimate flexibility, making it adaptable to any HTTP use case.

### ⏩︎ TLS / Proxy

- _coming soon_...

### 🔐 Auth

- Basic Auth (_coming soon_...)
- Digest Auth (_coming soon_...)
- Bearer Token (_coming soon_...)

### 🚀 Built with `urllib`

Leverages the powerful [urllib](https://www.npmjs.com/package/urllib) library for reliability and performance.

## Contributing & Developer Experience
This package is built using [node-red-dxp](https://www.npmjs.com/package/@keload/node-red-dxp), offering a blazing-fast and seamless way to develop Node-RED packages. 

Written in **TypeScript**, the codebase is cleanly structured, ensuring maintainability and effortless scalability.

We’re committed to keeping this node alive and thriving, making it a joy to evolve and improve over time. Whether it's refining existing features or adding new capabilities, contributing should always be an enjoyable experience.

Feel free to join the journey—create issues, submit pull requests, or share your ideas. Let’s build something incredible together!

## License

MIT
