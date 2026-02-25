import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling @supabase/supabase-js on the server;
  // it is imported at runtime from node_modules instead.
  serverExternalPackages: ["@supabase/supabase-js"],
};

export default nextConfig;
