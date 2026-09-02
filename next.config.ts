import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "172.26.161.50",
    "10.255.255.254",
    "localhost",
    "127.0.0.1",
    "172.26.161.50:3000",
    "10.255.255.254:3000",
    "localhost:3000",
  ],
};

export default nextConfig;
