/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/PokeAPI/**" }
    ]
  }
};

export default nextConfig;
