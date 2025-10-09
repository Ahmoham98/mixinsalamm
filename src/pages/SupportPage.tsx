import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Menu, Home, Package, Crown, BarChart2, Settings, ChevronLeft, ChevronRight, LogOut, Link2 } from 'lucide-react'
import BackHomeButton from '../components/BackHomeButton'

export default function SupportPage() {
  const navigate = useNavigate()
  const clearCredentials = useAuthStore((s) => s.clearCredentials)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    try { clearCredentials() } catch {}
    navigate('/login')
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
            <button onClick={() => navigate('/home')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Home size={20} />
              {!isSidebarCollapsed && <span>داشبورد</span>}
            </button>

            <button onClick={() => navigate('/migration')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Package size={20} />
              {!isSidebarCollapsed && <span>انتقال گروهی محصولات</span>}
            </button>

            <button onClick={() => navigate('/pricing')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Crown size={20} />
              {!isSidebarCollapsed && <span>وضعیت پلن</span>}
            </button>

            <button onClick={() => navigate('/usage')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <BarChart2 size={20} />
              {!isSidebarCollapsed && <span>آمار و گزارشات</span>}
            </button>

            <button onClick={() => navigate('/support')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Link2 size={20} />
              {!isSidebarCollapsed && <span>ارتباط با پشتیبانی</span>}
            </button>

            <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Settings size={20} />
              {!isSidebarCollapsed && <span>تنظیمات</span>}
            </button>
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
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#fa6b23] to-[#fa864b] bg-clip-text text-transparent">
                  پشتیبانی
                </h1>
                <p className="text-gray-600">در صورت بروز هرگونه سوال یا مشکل با ما در تماس باشید</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8" dir="rtl">
          <BackHomeButton />
          <div className="max-w-5xl mx-auto">
            <p className="text-gray-700 leading-7 mb-6">
              تا زمان آماده‌شدن سامانه تیکتینگ، می‌توانید از راه‌های زیر با پشتیبانی در تماس باشید. ما در سریع‌ترین زمان ممکن پاسخگو خواهیم بود.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">تماس تلفنی</h2>
                <p className="text-gray-700 mb-3">در ساعات اداری می‌توانید با شماره زیر تماس بگیرید:</p>
                <a href="tel:09962278508" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  09962278508
                </a>
              </div>

              <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">ایمیل پشتیبانی</h2>
                <p className="text-gray-700 mb-3">در هر زمان برای ما ایمیل ارسال کنید:</p>
                <a href="mailto:electricallover45@gmail.com" className="inline-block px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors break-all">
                  electricallover45@gmail.com
                </a>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white rounded-lg shadow border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">راهنما</h2>
              <ul className="list-disc pr-6 text-gray-700 space-y-2">
                <li>عنوان مشکل و توضیح کوتاه از مسئله را آماده کنید.</li>
                <li>در صورت امکان اسکرین‌شات یا پیام خطا را ذکر کنید.</li>
                <li>نام کاربری یا ایمیل ورود خود را برای پیگیری سریع‌تر درج کنید.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


