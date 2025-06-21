/** @type {import('next').NextConfig} */
const nextConfig = {
  // Full workspace configuration for employee application
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  
  // Include all pages and components
  output: 'standalone',
  
  // Environment-specific settings
  env: {
    DEPLOYMENT_TYPE: 'workspace',
    SERVICE_NAME: 'employee-workspace',
  },
  
  // Workspace-specific redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },
  
  // Security headers for workspace
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 