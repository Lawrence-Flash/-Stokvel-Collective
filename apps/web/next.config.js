/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stokvel/types'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:4000/auth/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
