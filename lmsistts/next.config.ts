const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com', // Izinkan domain Blob
        port: '',
      }, 
    ],
  },
};

module.exports = nextConfig;