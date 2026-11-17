import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sistema interno com dados financeiros: todas as telas são renderizadas a cada
  // requisição (sem Cache Components), para nunca mostrar valor desatualizado.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
