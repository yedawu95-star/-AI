'use client'

import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f0] to-[#ffe8e0]">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="mb-6">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mx-auto text-[#f59e0b]">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#1a2a3a] mb-2">승인 대기 중</h1>
        <p className="text-[#6a8098] mb-6">
          관리자가 귀하의 계정을 검토하고 있습니다.
          <br />
          승인되면 즉시 접근 가능합니다.
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
