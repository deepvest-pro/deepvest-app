/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Disable static optimization entirely
  output: 'standalone',
  // Disable static generation checking
  experimental: {
    // Skip static generation during build
    skipTrailingSlashRedirect: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    // Add a dummy Civic client ID for build time
    NEXT_PUBLIC_CIVIC_CLIENT_ID: 'dummy-id-for-build',
  },
}

module.exports = nextConfig
