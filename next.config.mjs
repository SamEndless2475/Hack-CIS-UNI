/** @type {import('next').NextConfig} */
const nextConfig = {
  // Antes esto estaba en `true` y el build pasaba aunque hubiera errores de
  // tipos: escondia 16 errores reales. Ya estan corregidos, asi que el build
  // vuelve a verificar. Si algo falla, se arregla el error, no se apaga esto.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
