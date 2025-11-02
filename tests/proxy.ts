import { ProxyAgent, request } from 'urllib';

async function main() {
  const proxyAgent = new ProxyAgent('http://localhost:3002');

  const response = await request('http://jsonplaceholder.typicode.com/todos/1', {
    dispatcher: proxyAgent,
    headers: {
      'x-target-proxy-host': 'jsonplaceholder.typicode.com',
    },
  });

  console.log('Status:', response.status);
  console.log('Data:', response.data.toString());
}

main().catch(console.error);
