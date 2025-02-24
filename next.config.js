/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, 
    images: {
      domains: ["registry.npmmirror.com", "res.cloudinary.com", "example.com"],
    },// Enable React strict mode
    swcMinify: true, // Use SWC for faster builds
    webpack: (config, { isServer }) => {
      // Enable layers experiment
      config.experiments = {
        asyncWebAssembly: true,
        layers: true, // Enable layers experiment
      };
  
      if (!isServer) {
        config.resolve.fallback = {
          fs: false, // Prevent filesystem module issues in client-side code
          path: false, // Prevent path module issues in client-side code
        };
      }
  
      return config;
    },
  };
  
  module.exports = nextConfig;