/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/caldera/:path*',
        destination: 'https://claim.caldera.foundation/api/:path*',
      },
    ];
  },
};

export default nextConfig;
