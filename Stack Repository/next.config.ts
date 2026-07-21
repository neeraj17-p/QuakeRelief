/** @type { import('next') } */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
    pathsToIgnore: [
      './node_modules/react-markdown/**',
      './src/components/quake-relief/shared/analytics-charts/**',
    ],
  },
  compiler: {
    memoryLimit: 256, // 256MB for compiler
  },
}

module.exports = nextConfig
