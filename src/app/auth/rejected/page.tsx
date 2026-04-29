'use client'

import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function RejectedPage() {
  const router = useRouter()

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      alert('로그아웃 실패')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fee2e2] to-[#fecaca]">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="mb-6">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto text-[#ef4444]">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2" />
            <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#1a2a3a] mb-2">접근 거부</h1>
        <p className="text-[#6a8098] mb-6">
          죄송합니다. 관리자가 귀하의 계정에 대한 접근을 거부했습니다.
          <br />
          <br />
          문의사항이 있으시면 관리자에게 연락주세요.
        </p>

        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 bg-[#f0f7ff] text-[#2a6a9a] border border-[#aad4f0] rounded-lg font-medium hover:bg-[#e0f0ff] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
