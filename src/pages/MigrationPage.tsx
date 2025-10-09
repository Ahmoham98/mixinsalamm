import BackHomeButton from '../components/BackHomeButton'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useProductsStore } from '../store/productsStore'
import type { MixinProduct, BasalamProduct } from '../types'
import { Layers, BarChart2 } from 'lucide-react'

export default function MigrationPage() {
  const { mixinCredentials, basalamCredentials } = useAuthStore()
  const [globalMixinProducts, setGlobalMixinProducts] = useState<MixinProduct[]>([])
  const [globalBasalamProducts, setGlobalBasalamProducts] = useState<BasalamProduct[]>([])
  const uniqueMixinProducts = useProductsStore((s) => s.uniqueMixinProducts)
  const uniqueBasalamProducts = useProductsStore((s) => s.uniqueBasalamProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vendorId = (useAuthStore.getState()?.basalamCredentials as any)?.vendor?.id || undefined

  // Utilities for normalization similar to HomePage
  const cleanHtmlText = (html: string): string => {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
  }
  // normalize helper no longer used here

  // Uniques are now sourced from global products store; local compute removed

  useEffect(() => {
    const loadAll = async () => {
      if (!mixinCredentials?.url || !mixinCredentials?.access_token || !basalamCredentials?.access_token || !vendorId) return
      setIsLoading(true)
      setError(null)
      try {
        const mixinUrlParam = encodeURIComponent(mixinCredentials.url)
        const [mxRes, bsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://mixinsalam-backend.liara.run'}/products/my-mixin-products/all?mixin_url=${mixinUrlParam}`, {
            headers: { Authorization: `Bearer ${mixinCredentials.access_token}` },
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://mixinsalam-backend.liara.run'}/products/my-basalam-products/${vendorId}/all`, {
            headers: { Authorization: `Bearer ${basalamCredentials.access_token}` },
          }),
        ])

        if (!mxRes.ok) throw new Error(`Mixin fetch failed: ${mxRes.status}`)
        if (!bsRes.ok) throw new Error(`Basalam fetch failed: ${bsRes.status}`)

        const mxData = await mxRes.json()
        const bsData = await bsRes.json()
        setGlobalMixinProducts(Array.isArray(mxData?.products) ? mxData.products : [])
        setGlobalBasalamProducts(Array.isArray(bsData?.products) ? bsData.products : [])
      } catch (e: any) {
        setError(e?.message || 'خطا در دریافت اطلاعات')
      } finally {
        setIsLoading(false)
      }
    }
    loadAll()
    const interval = setInterval(loadAll, 30000)
    return () => clearInterval(interval)
  }, [mixinCredentials, basalamCredentials, vendorId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5b9fdb]/10 to-[#ff6040]/10">
      <header className="sticky top-0 bg-white/70 backdrop-blur-md shadow-sm z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#30cfb7] to-[#ffa454] bg-clip-text text-transparent">انتقال گروهی محصولات</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <BarChart2 className="w-5 h-5 text-[#ffa454]" />
            <span>مدیریت و انتقال سریع</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <BackHomeButton />
        <section className="bg-gradient-to-r from-[#30cfb7]/15 to-[#ffa454]/15 border border-[#30cfb7]/20 rounded-2xl p-6 shadow-md mb-8" dir="rtl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#30cfb7]/20 to-[#ffa454]/20 rounded-lg">
              <Layers className="w-8 h-8 text-[#30cfb7]" />
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800 mb-1">مرکز انتقال محصولات</h2>
              <p className="text-gray-600 text-sm">لیست‌های کامل محصولات میکسین و باسلام بارگذاری می‌شود و آماده انتقال خواهند بود.</p>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl p-6 shadow-md text-center">
            <div className="w-12 h-12 border-4 border-[#30cfb7]/20 rounded-full animate-spin border-t-[#30cfb7] mx-auto mb-3"></div>
            <p className="text-gray-700">در حال بارگذاری لیست‌های محصولات...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6" dir="rtl">
            {error}
          </div>
        )}



        {/* Unique products sections */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-right">محصولات منحصر به میکسین ({uniqueMixinProducts.length})</h3>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {uniqueMixinProducts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">محصول منحصر به میکسین یافت نشد</div>
                ) : (
                  uniqueMixinProducts.slice(0, 100).map((p) => (
                    <div key={(p as any).id} className="py-2 border-b text-right">
                      <div className="text-gray-800 text-sm">{(p as any).name}</div>
                    </div>
                  ))
                )}
                {uniqueMixinProducts.length > 100 && (
                  <div className="text-xs text-gray-500 mt-2 text-right">... و {uniqueMixinProducts.length - 100} محصول دیگر</div>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-right">محصولات منحصر به باسلام ({uniqueBasalamProducts.length})</h3>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {uniqueBasalamProducts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">محصول منحصر به باسلام یافت نشد</div>
                ) : (
                  uniqueBasalamProducts.slice(0, 100).map((p) => (
                    <div key={(p as any).id} className="py-2 border-b text-right">
                      <div className="text-gray-800 text-sm">{(p as any).title}</div>
                    </div>
                  ))
                )}
                {uniqueBasalamProducts.length > 100 && (
                  <div className="text-xs text-gray-500 mt-2 text-right">... و {uniqueBasalamProducts.length - 100} محصول دیگر</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


