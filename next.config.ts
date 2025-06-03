import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const getHostnameFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error(`Invalid URL for SUPABASE_URL: ${url}`, error);
    return null;
  }
};

const supabaseHostname = getHostnameFromUrl(process.env.SUPABASE_URL);

const remotePatternsConfig: RemotePattern[] = [];
if (supabaseHostname) {
  remotePatternsConfig.push({
    protocol: 'https',
    hostname: supabaseHostname,
    port: '',
    pathname: '/storage/v1/object/public/**',
  });
}

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: remotePatternsConfig,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // replace this your actual origin
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
