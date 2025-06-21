/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only configuration for WhatsApp automation service
  experimental: {
    outputFileTracingIncludes: {
      '/api/**': ['./app/api/**/*'],
    },
  },
  
  // Disable static generation for API-only service
  output: 'standalone',
  
  // Only include API routes in build
  pageExtensions: ['api.js', 'api.ts'],
  
  // Environment-specific settings
  env: {
    DEPLOYMENT_TYPE: 'api-only',
    SERVICE_NAME: 'whatsapp-api',
  },
  
  // Redirect all non-API routes to API documentation
  async redirects() {
    return [
      {
        source: '/((?!api).*)',
        destination: '/api/health',
        permanent: false,
      },
    ];
  },
  
  // API-specific headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 