/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://13.209.18.148:8080/:path*",
      },
    ];
  },
};

module.exports = nextConfig;