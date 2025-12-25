/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // This repo has multiple lockfiles at different levels; Next may infer the wrong root.
  // Setting this removes the warning and keeps tracing scoped to the frontend package.
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Required for SharedArrayBuffer / wasm threads
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
}

module.exports = nextConfig
