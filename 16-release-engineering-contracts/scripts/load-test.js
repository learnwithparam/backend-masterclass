import http from 'http';

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3160';
const CONCURRENCY = parseInt(process.env.LOAD_CONCURRENCY || '20', 10);
const REQUESTS = parseInt(process.env.LOAD_REQUESTS || '60', 10);

function request(path) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http.get(`${SERVER_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({
        status: res.statusCode,
        ms: Date.now() - start,
        body: data,
      }));
    }).on('error', reject);
  });
}

async function run() {
  const paths = Array.from({ length: REQUESTS }, () => '/api/v1/books?limit=2');
  const queue = [...paths];
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const path = queue.shift();
      if (!path) break;
      results.push(await request(path));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const failures = results.filter((r) => r.status !== 200);
  const avgMs = results.reduce((sum, r) => sum + r.ms, 0) / results.length;

  console.log(`load-test: ${results.length} requests, avg=${avgMs.toFixed(1)}ms, failures=${failures.length}`);

  if (failures.length > 0) {
    throw new Error(`Load test failed: ${failures.length} non-200 responses`);
  }

  if (avgMs > 750) {
    throw new Error(`Load test too slow: avg ${avgMs.toFixed(1)}ms`);
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
