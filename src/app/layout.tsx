import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '아동 MD 대시보드 | 이랜드리테일',
  description: '경쟁사 현황 및 아동 시장 트렌드 대시보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
