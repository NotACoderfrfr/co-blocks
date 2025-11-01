/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['localhost', '127.0.0.1', '*.168.*'],
  },
}

module.exports = nextConfig
