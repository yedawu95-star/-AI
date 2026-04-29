'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

type UserApproval = Database['public']['Tables']['user_approvals']['Row']

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('user_approvals')
      .select('*')
      .order('created_at', { ascending: false })

    setUsers(data || [])
    setLoading(false)
  }

  async function handleApprove(userId: string) {
    setProcessing(userId)
    const { error } = await supabase
      .from('user_approvals')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      alert('승인 실패: ' + error.message)
    } else {
      await fetchUsers()
    }
    setProcessing(null)
  }

  async function handleReject(userId: string) {
    const reason = prompt('거부 사유를 입력하세요:')
    if (!reason) return

    setProcessing(userId)
    const { error } = await supabase
      .from('user_approvals')
      .update({ status: 'rejected', reason })
      .eq('user_id', userId)

    if (error) {
      alert('거부 실패: ' + error.message)
    } else {
      await fetchUsers()
    }
    setProcessing(null)
  }

  async function handleLogout() {
    await signOut()
    router.push('/auth/login')
  }

  const pending = users.filter(u => u.status === 'pending')
  const approved = users.filter(u => u.status === 'approved')
  const rejected = users.filter(u => u.status === 'rejected')

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#e8edf2] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1a2a3a]">관리자 대시보드</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-[#e8edf2]">
            <p className="text-[#6a8098] text-sm font-medium">대기 중</p>
            <p className="text-3xl font-bold text-[#f59e0b]">{pending.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#e8edf2]">
            <p className="text-[#6a8098] text-sm font-medium">승인됨</p>
            <p className="text-3xl font-bold text-[#10b981]">{approved.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-[#e8edf2]">
            <p className="text-[#6a8098] text-sm font-medium">거부됨</p>
            <p className="text-3xl font-bold text-[#ef4444]">{rejected.length}</p>
          </div>
        </div>

        {/* 대기 중인 사용자 */}
        {pending.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e8edf2] mb-8 overflow-hidden">
            <div className="bg-[#fff7ed] border-b border-[#e8edf2] px-6 py-4">
              <h2 className="font-semibold text-[#1a2a3a]">
                승인 대기 중 ({pending.length})
              </h2>
            </div>
            <div className="divide-y divide-[#e8edf2]">
              {pending.map(user => (
                <div
                  key={user.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#f7f9fc]"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[#1a2a3a]">{user.display_name}</p>
                    <p className="text-sm text-[#6a8098]">{user.email}</p>
                    <p className="text-xs text-[#9ab4d0] mt-1">
                      가입: {new Date(user.created_at!).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(user.user_id)}
                      disabled={processing === user.user_id}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {processing === user.user_id ? '처리 중...' : '승인'}
                    </button>
                    <button
                      onClick={() => handleReject(user.user_id)}
                      disabled={processing === user.user_id}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      거부
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 승인된 사용자 */}
        {approved.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e8edf2] mb-8 overflow-hidden">
            <div className="bg-[#f0fdf4] border-b border-[#e8edf2] px-6 py-4">
              <h2 className="font-semibold text-[#1a2a3a]">
                승인됨 ({approved.length})
              </h2>
            </div>
            <div className="divide-y divide-[#e8edf2]">
              {approved.map(user => (
                <div
                  key={user.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#f7f9fc]"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[#1a2a3a]">{user.display_name}</p>
                    <p className="text-sm text-[#6a8098]">{user.email}</p>
                    <p className="text-xs text-[#9ab4d0] mt-1">
                      승인: {new Date(user.approved_at!).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    활성
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 거부된 사용자 */}
        {rejected.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e8edf2] overflow-hidden">
            <div className="bg-[#fef2f2] border-b border-[#e8edf2] px-6 py-4">
              <h2 className="font-semibold text-[#1a2a3a]">
                거부됨 ({rejected.length})
              </h2>
            </div>
            <div className="divide-y divide-[#e8edf2]">
              {rejected.map(user => (
                <div
                  key={user.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#f7f9fc]"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[#1a2a3a]">{user.display_name}</p>
                    <p className="text-sm text-[#6a8098]">{user.email}</p>
                    {user.reason && (
                      <p className="text-xs text-[#ef4444] mt-1">거부 사유: {user.reason}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    거부
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-[#6a8098]">로딩 중...</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e8edf2] p-12 text-center">
            <p className="text-[#6a8098]">승인 대기 중인 사용자가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
