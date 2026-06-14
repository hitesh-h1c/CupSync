/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mongoose ships server-only code; keep it external to the server bundle.
  serverExternalPackages: ["mongoose", "bcryptjs", "@react-pdf/renderer"],
};

export default nextConfig;
