/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-wallets"
  ],
  webpack: (config) => {
    // Explicit injection of Buffer for zero-copy memory parsing in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: false, 
    };
    
    config.plugins.push(
      new config.webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );

    return config;
  },
};

export default nextConfig;