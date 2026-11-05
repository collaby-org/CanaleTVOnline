/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'cache-control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'x-frame-options', value: 'SAMEORIGIN' },
          { key: 'x-content-type-options', value: 'nosniff' },
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
