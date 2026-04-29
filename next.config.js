/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.naver.net' },
      { protocol: 'https', hostname: '**.pstatic.net' },
      { protocol: 'https', hostname: '**.29cm.co.kr' },
      { protocol: 'https', hostname: '**.msscdn.net' },
      { protocol: 'https', hostname: '**.kidikidi.net' },
    ],
  },
}

module.exports = nextConfig
