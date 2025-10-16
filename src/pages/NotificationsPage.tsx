import BackHomeButton from '../components/BackHomeButton'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useGlobalUiStore } from '../store/globalUiStore'
import { Menu, Home, Package, Crown, BarChart2, Settings, ChevronLeft, ChevronRight, LogOut, Bell } from 'lucide-react'

export default function NotificationsPage() {
  const { clearCredentials } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const notifications = useGlobalUiStore((s) => s.notifications)

  const handleLogout = () => {
    try { clearCredentials() } catch {}
    location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5b9fdb]/10 to-[#ff6040]/10">
      <button
        onClick={() => {
          setIsSidebarCollapsed(false);
          setIsSidebarOpen(true);
        }}
        className={`fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isSidebarCollapsed ? 'block' : 'hidden'}`}
      >
        <Menu size={24} />
      </button>

      <aside className={`fixed top-0 right-0 h-full bg-white/80 backdrop-blur-md shadow-lg transform transition-all duration-300 ease-in-out z-40 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} ${isSidebarCollapsed ? 'w-0' : 'w-64'}`}>
        <div className={`p-6 h-full flex flex-col ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <div className="mb-8 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] bg-clip-text text-transparent">
                میکسین سلام
              </h2>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              {isSidebarCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            <a href="/home" className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Home size={20} />
              {!isSidebarCollapsed && <span>داشبورد</span>}
            </a>
            <a href="/migration" className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Package size={20} />
              {!isSidebarCollapsed && <span>انتقال گروهی محصولات</span>}
            </a>
            <a href="/pricing" className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Crown size={20} />
              {!isSidebarCollapsed && <span>وضعیت پلن</span>}
            </a>
            <a href="/usage" className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <BarChart2 size={20} />
              {!isSidebarCollapsed && <span>آمار و گزارشات</span>}
            </a>
            <a href="/settings" className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Settings size={20} />
              {!isSidebarCollapsed && <span>تنظیمات</span>}
            </a>
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] text-white rounded-lg hover:from-[#ff6040]/90 hover:to-[#5b9fdb]/90 transition-all duration-200 shadow-md hover:shadow-lg ${isSidebarCollapsed ? 'px-3' : ''}`}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>خروج</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${isSidebarOpen ? (isSidebarCollapsed ? 'lg:mr-0' : 'lg:mr-64') : 'mr-0'}`}>
        <header className="sticky top-0 bg-white/60 backdrop-blur-md shadow-lg z-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4 relative">
            <div className="flex items-center justify-between">
              <BackHomeButton />
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#30cfb7] to-[#ffa454] bg-clip-text text-transparent">
                  اعلان ها
                </h1>
                <p className="text-gray-600 mt-1">مرکز پیام‌ها و هشدارها</p>
              </div>
              <div className="w-20"></div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8" dir="rtl">
          <section className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-[#30cfb7]/10 to-[#ffa454]/20 rounded-lg"><Bell className="w-6 h-6 text-[#ffa454]" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">۱۰ اعلان اخیر</h2>
                <p className="text-sm text-gray-600">پیام‌های سیستمی و هشدارها در اینجا نمایش داده می‌شوند.</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden shadow">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full text-right">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600">زمان</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600">عنوان</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(notifications || []).slice(0, 10).map((n) => (
                      <tr key={n.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(n.ts).toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{n.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{n.message}</td>
                      </tr>
                    ))}
                    {(!notifications || notifications.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">اعلانی ثبت نشده است</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}


