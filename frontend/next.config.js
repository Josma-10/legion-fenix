/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://legion-fenix-fc.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
