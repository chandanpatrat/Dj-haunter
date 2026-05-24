/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Allowing the placeholder image
      },
      // You can add your Supabase storage URL here later
    ],
  },
};

export default nextConfig;