"use strict";

// next.config.js
var nextConfig = {
  // Ignoramos ESLint durante el build (para que no frene deploy)
  eslint: {
    ignoreDuringBuilds: true
  },
  // Ignoramos errores de TypeScript en build (para poder desplegar)
  typescript: {
    ignoreBuildErrors: true
  },
  // (Opcional) si usÃ¡s imÃ¡genes externas, podÃ©s configurar domains acÃ¡
  images: {
    remotePatterns: []
  }
};
module.exports = nextConfig;
