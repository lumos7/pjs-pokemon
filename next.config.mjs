/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    // Make the composite route's public/ file reads explicit for Vercel's
    // bundler — otherwise a refactor to dynamic paths breaks prod silently.
    outputFileTracingIncludes: {
      '/api/composite': ['./public/images/**', './public/fonts/**'],
    },
  },
}

export default nextConfig
