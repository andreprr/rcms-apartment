import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Gunakan fungsi createClient yang sama
  const supabase = await createClient()

  // Ambil sesi user yang login
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ambil data profile dari tabel users kita
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Selamat Datang, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-slate-600">
          Anda login dengan hak akses: <span className="font-bold text-blue-600">{profile?.role}</span>
        </p>
      </div>
    </div>
  )
}