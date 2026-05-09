/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/nabidka",
        destination: "/vozy",
        permanent: true,
      },
      {
        source: "/ucet",
        destination: "/",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn1.gstatic.com"
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn2.gstatic.com"
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn3.gstatic.com"
      },
      {
        protocol: "https",
        hostname: "www.hyundai.com"
      },
      {
        protocol: "https",
        hostname: "stimg.cardekho.com"
      },
      {
        protocol: "https",
        hostname: "img.tipcars.com"
      }
    ]
  }
};

export default nextConfig;

