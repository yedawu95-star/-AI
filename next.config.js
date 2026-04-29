/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.naver.net' },
      { protocol: 'https', hostname: '**.29cm.co.kr' },
      { protocol: 'https', hostname: '**.kidikidi.net' },
      { protocol: 'https', hostname: '**.wconcept.co.kr' },
    ],
  },
}

module.exports = nextConfig
