/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
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
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/(.*)\\.(jpg|jpeg|png|webp|avif|gif|svg|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  /*
   * Optimalizátor obrázků se používá co nejméně.
   *
   * Vercel má na transformace měsíční kvótu a po jejím vyčerpání vrací
   * `/_next/image` chybu 402 – s hlavičkou `max-age=31536000, immutable`.
   * Rozbitý obrázek se tak zacachuje na rok. Přesně tohle se 6. 9. 2026 dělo
   * v produkci (`X-Vercel-Error: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`).
   *
   * Proto: fotky vozů jdou přímo z CDN Tipcars ve třech hotových velikostech
   * (src/lib/vehicle-images.ts), vlajky a loga jsou předzmenšené soubory
   * s `unoptimized`, a jediné, co přes optimalizátor ještě jde, jsou bannery
   * z CMS – ty mají v SafeImage záchranu na přímý soubor.
   */
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
