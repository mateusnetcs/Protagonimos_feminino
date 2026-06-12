import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 120,
  serverExternalPackages: ['puppeteer-core', 'archiver', 'qrcode'],
  experimental: {
    // Evita bug "React Client Manifest" / global-error no dev (Next 15)
    devtoolSegmentExplorer: false,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  outputFileTracingIncludes: {
    '/': [
      './node_modules/mysql2/**/*',
      './node_modules/sql-escaper/**/*',
      './node_modules/bcryptjs/**/*',
    ],
    '/api/admin/certificates': ['./node_modules/puppeteer-core/**/*'],
    '/api/admin/certificates/[userId]': [
      './node_modules/puppeteer-core/**/*',
      './node_modules/qrcode/**/*',
    ],
    '/api/admin/certificates/bulk': [
      './node_modules/puppeteer-core/**/*',
      './node_modules/archiver/**/*',
      './node_modules/qrcode/**/*',
    ],
    '/api/certificado/verificar': [],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify: file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    } else if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
