/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamic port configuration for Render
  env: {
    PORT: process.env.PORT || '3000',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` 
        : 'http://localhost:3000')
  },
  
  // Development server configuration
  async rewrites() {
    return []
  },
  
  // External packages for PostgreSQL client
  serverExternalPackages: ['pg', 'pg-pool'],
  
  // Webpack configuration to handle PostgreSQL and Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle PostgreSQL and Node.js specific modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        pg: false,
        'pg-pool': false,
        'pg-connection-string': false,
      }
      
      // Add externals to prevent bundling on client side
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('pg', 'pg-pool', 'pg-connection-string')
      } else {
        config.externals = {
          ...config.externals,
          pg: 'pg',
          'pg-pool': 'pg-pool',
          'pg-connection-string': 'pg-connection-string'
        }
      }
    }
    return config
  },

  // Output configuration for production
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined
}

export default nextConfig
