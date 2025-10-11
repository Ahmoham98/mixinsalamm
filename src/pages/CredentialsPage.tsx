import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { mixinApi } from '../services/api/mixin'
import { X } from 'lucide-react'
import { ensureUser, createDefaultSubscription, createInitialUsageRecord, formatNow } from '../services/api/pricing'
import { api } from '../services/api/config'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (url: string, token: string) => void
  type: 'mixin' | 'basalam'
}

function Modal({ isOpen, onClose, onSubmit, type }: ModalProps) {
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [showDomainGuide, setShowDomainGuide] = useState(false)
  const [showTokenGuide, setShowTokenGuide] = useState(false)

  if (!isOpen) return null

  // Use public path for video (move the video to public/ if not already there)
  const tokenVideoSrc = process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL + '/how to get mixin access token .mp4'
    : '/how to get mixin access token .mp4';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 relative transform transition-all duration-300 ease-in-out">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-right" style={{direction:'rtl'}}>
            {type === 'mixin' ? 'اتصال به میکسین' : 'Connect to Basalam'}
          </h2>
          {type === 'mixin' && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 text-right w-full" style={{direction:'rtl'}}>
                    آدرس فروشگاه میکسین
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline ml-2"
                    onClick={() => setShowDomainGuide(true)}
                  >
                    راهنما
                  </button>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="مثال: myshop.ir"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                  dir="rtl"
                />
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 text-right w-full" style={{direction:'rtl'}}>
                    توکن دسترسی میکسین
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline ml-2"
                    onClick={() => setShowTokenGuide(true)}
                  >
                    راهنما
                  </button>
                </div>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="توکن دسترسی میکسین خود را وارد کنید"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right"
                  dir="rtl"
                />
              </div>
            </>
          )}
          <button
            onClick={() => onSubmit(url, token)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 font-medium"
          >
            {type === 'mixin' ? 'اتصال' : 'Connect'}
          </button>
        </div>
      </div>
      {/* Domain Guide Modal */}
      {showDomainGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-96 relative">
            <button
              onClick={() => setShowDomainGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-bold mb-4 text-blue-700 text-right" style={{direction:'rtl'}}>راهنمای وارد کردن آدرس فروشگاه میکسین</h3>
            <ul className="text-gray-700 text-sm space-y-2 list-disc pr-4 text-right" style={{direction:'rtl'}}>
              <li>آدرس فروشگاه باید فقط نام دامنه فروشگاه شما در میکسین باشد (بدون http یا www).</li>
              <li>مثال صحیح: <span className="font-mono bg-gray-100 px-2 py-1 rounded">myshop.ir</span></li>
              <li>مثال اشتباه: <span className="font-mono bg-gray-100 px-2 py-1 rounded">https://myshop.ir</span> یا <span className="font-mono bg-gray-100 px-2 py-1 rounded">www.myshop.ir</span></li>
              <li>در صورت داشتن سوال، با پشتیبانی تماس بگیرید.</li>
            </ul>
            <button
              onClick={() => setShowDomainGuide(false)}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              بستن
            </button>
          </div>
        </div>
      )}
      {/* Token Guide Modal with Video */}
      {showTokenGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-[420px] relative">
            <button
              onClick={() => setShowTokenGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-bold mb-4 text-blue-700 text-right" style={{direction:'rtl'}}>راهنمای دریافت توکن دسترسی میکسین</h3>
            <video
              src={tokenVideoSrc}
              controls
              className="w-full rounded-lg border border-gray-200 mb-4"
              style={{background:'#000'}}
              onError={e => {e.currentTarget.poster=''; e.currentTarget.controls=false;}}
            >
              مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
            <p className="text-gray-700 text-sm mb-4 text-right" style={{direction:'rtl'}}>
              در این ویدیو نحوه دریافت توکن دسترسی از پنل میکسین به صورت کامل آموزش داده شده است. لطفاً مراحل را به دقت دنبال کنید.
            </p>
            <button
              onClick={() => setShowTokenGuide(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function CredentialsPage() {
  const [isMixinModalOpen, setIsMixinModalOpen] = useState(false)
  const navigate = useNavigate()
  const { setMixinCredentials, setBasalamCredentials, isAuthenticated, mixinCredentials, basalamCredentials } = useAuthStore()

  // Add effect to handle URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const basalamConnected = urlParams.get('basalam_connected')
    const error = urlParams.get('error')

    if (basalamConnected === 'true') {
      alert('Successfully connected to Basalam!')
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      let errorMessage = 'Failed to connect to Basalam'
      switch (error) {
        case 'basalam_unauthorized':
          errorMessage = 'Authentication failed. Please check your Basalam credentials and try again.'
          break
        case 'basalam_server_error':
          errorMessage = 'Basalam server is currently unavailable. Please try again later.'
          break
        case 'basalam_forbidden':
          errorMessage = 'Access denied. Please check your permissions.'
          break
        case 'basalam_token_failed':
          errorMessage = 'Failed to get access token. Please try again.'
          break
        default:
          errorMessage = `Failed to connect to Basalam: ${error}`
      }
      alert(errorMessage)
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Helper: bootstrap once both tokens exist
  const callBootstrapIfReady = async () => {
    try {
      const bootstrapKey = 'bootstrap_done'
      if (sessionStorage.getItem(bootstrapKey)) return
      const mixinToken = useAuthStore.getState().mixinCredentials?.access_token
      const basalamToken = useAuthStore.getState().basalamCredentials?.access_token
      if (mixinToken && basalamToken) {
        const now = formatNow()
        await ensureUser({
          mixin_access_token: mixinToken,
          basalam_access_token: basalamToken,
          email: `user_${Date.now()}@example.com`,
          created_at: now,
          updated_at: now,
          is_active: true,
          role: 'user',
          is_verified: false
        })
        // Create initial usage record right after user creation
        await createDefaultSubscription()
        await createInitialUsageRecord()
        sessionStorage.setItem(bootstrapKey, 'true')
      }
    } catch (e) {
      console.error('Bootstrap failed:', e)
    }
  }

  const handleMixinConnect = async (url: string, token: string) => {
    try {
      const data = await mixinApi.validateCredentials(url, token)
      
      if (data && data.message === "you are connected successfully!" && data["mixin-ceredentials"]) {
        setMixinCredentials({ 
          url: data["mixin-ceredentials"].mixin_url, 
          access_token: data["mixin-ceredentials"].access_token 
        })
        // Attempt bootstrap if basalam already connected
        await callBootstrapIfReady()
        setIsMixinModalOpen(false)
        alert(data.message || 'Successfully connected to Mixin!')
        navigate('/home')
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (error: any) {
      console.error('Connection error:', error)
      alert(error.message || 'Failed to connect to Mixin. Please check your credentials.')
    }
  }

  const handleBasalamConnect = () => {
    sessionStorage.setItem('shouldReloadAfterBasalam', 'true')
    
    // Add message listener for the new tab
    const messageHandler = async (event: MessageEvent) => {
      
      // Check if the response has the expected tokens
      const { access_token, refresh_token } = event.data;
      
      if (access_token) {
        setBasalamCredentials({
          access_token,
          refresh_token
        });
        
        // Attempt bootstrap if mixin already connected
        callBootstrapIfReady().finally(() => {
          // Remove the listener after successful connection
          window.removeEventListener('message', messageHandler);
          // Show success message
          alert('Successfully connected to Basalam!');
          // Force a re-render
          navigate('/home');
        });
      } else {
        console.error('No access token in response');
      }
    };

    // Remove any existing listeners to prevent duplicates
    window.removeEventListener('message', messageHandler as any);
    
    // Add the event listener
    window.addEventListener('message', messageHandler as any);

    // Open Basalam SSO in new tab
    const basalamUrl = 'https://basalam.com/accounts/sso?client_id=1083&scope=vendor.profile.read%20vendor.product.write%20customer.profile.read%20vendor.product.read&redirect_uri=https://mixinsalam-backend.liara.run/basalam/client/get-user-access-token/&state=management-test';
    const newWindow = window.open(basalamUrl, '_blank');
    
    // Add a fallback check
    if (newWindow) {
      const checkWindow = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkWindow);
          // Check if we have credentials
          const currentCredentials = useAuthStore.getState().basalamCredentials;
          if (!currentCredentials) {
          } else {
            // Force a re-render if we have credentials
            navigate('/home');
          }
        }
      }, 1000);
    }
  }

  const handleContinue = () => {
    navigate('/home')
  }

  React.useEffect(() => {
    if (isAuthenticated()) {
      const done = sessionStorage.getItem('bootstrap_done')
      if (done) {
        navigate('/home')
      }
    }
  }, [isAuthenticated, navigate])

  React.useEffect(() => {
    if (basalamCredentials && sessionStorage.getItem('shouldReloadAfterBasalam')) {
      sessionStorage.removeItem('shouldReloadAfterBasalam')
      navigate('/home')
    }
  }, [basalamCredentials])

  // Add a debug effect to monitor credentials
  React.useEffect(() => {
    if (basalamCredentials) {
    }
  }, [basalamCredentials]);

  // Add a debug effect to monitor the button state
  React.useEffect(() => {
  }, [basalamCredentials]);

  // Mixin quick connect inputs
  const [mixinDomain, setMixinDomain] = useState('')
  const [mixinAccessTokenInput, setMixinAccessTokenInput] = useState('')
  const [mixinConnectMessage, setMixinConnectMessage] = useState<string | null>(null)
  const [isSubmittingMixinConnect, setIsSubmittingMixinConnect] = useState(false)

  // Submit handler
  const handleMixinQuickConnect = async () => {
    setMixinConnectMessage(null)
    setIsSubmittingMixinConnect(true)
    try {
      const res = await api.post(`/mixin/client/`, null, {
        params: { mixin_url: mixinDomain, token: mixinAccessTokenInput }
      })
      setMixinConnectMessage(
        res?.data?.message || 'اتصال میکسین با موفقیت انجام شد'
      )
      // Do the same as normal connect: persist credentials and reload
      setMixinCredentials({ url: mixinDomain, access_token: mixinAccessTokenInput })
      await callBootstrapIfReady()
      navigate('/home')
    } catch (e: any) {
      setMixinConnectMessage(e?.response?.data?.message || e?.message || 'خطا در اتصال میکسین')
    } finally {
      setIsSubmittingMixinConnect(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          حساب های خود را متصل کنید
        </h1>
        <div className="space-y-6">
          <button
            onClick={() => setIsMixinModalOpen(true)}
            className={`w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] ${
              mixinCredentials 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
            }`}
          >
            {mixinCredentials ? (
              <>
                <span className="text-xl">✓</span>
                <span className="mr-2 font-medium">میکسین متصل شد</span>
              </>
            ) : (
              <span className="font-medium">اتصال به میکسین</span>
            )}
          </button>
          <button
            onClick={handleBasalamConnect}
            className={`w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] ${
              basalamCredentials 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
            }`}
          >
            {basalamCredentials ? (
              <>
                <span className="text-xl">✓</span>
                <span className="mr-2 font-medium">باسلام متصل شد</span>
              </>
            ) : (
              <span className="font-medium">اتصال به باسلام</span>
            )}
          </button>

          <p className='text-sm text-center'>هنگام اتصال، از خاموش بودن پروکسی و فیلترشکن خود اطمینان حاصل کنید</p>

          {(mixinCredentials || basalamCredentials) && (
            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] font-medium mt-8"
            >
              برو به صفحه اصلی
            </button>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={isMixinModalOpen}
        onClose={() => setIsMixinModalOpen(false)}
        onSubmit={handleMixinConnect}
        type="mixin"
      />
    </div>
  )
}

export default CredentialsPage