import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { basalamApi } from '../services/api/basalam'

function BasalamCallback() {
  const navigate = useNavigate()
  const { setBasalamCredentials } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code and state from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')

        console.log('Received callback with params:', { code, state })

        if (!code || !state) {
          throw new Error('Missing code or state parameters')
        }

        // Exchange code for access token
        console.log('Attempting to exchange code for token...')
        const response = await basalamApi.getAccessToken(code, state)
        console.log('Received response from token exchange:', response)
        
        // Check if response is a string (error message)
        if (typeof response === 'string') {
          throw new Error(response)
        }

        // Check if response has the expected structure
        if (!response.result?.response?.access_token) {
          console.error('Invalid response format:', response)
          throw new Error('No access token received in response')
        }

        // Set the Basalam credentials
        console.log('Setting Basalam credentials...')
        setBasalamCredentials({
          access_token: response.result.response.access_token,
          refresh_token: response.result.response.refresh_token
        })

        // Show success message
        alert(response.result.message || 'Successfully connected to Basalam!')

        // Set reload flag and navigate back to credentials page
        console.log('Redirecting back to credentials page...')
        sessionStorage.setItem('shouldReloadAfterBasalam', 'true')
        window.location.href = '/'
      } catch (error: any) {
        console.error('Error handling Basalam callback:', error)
        alert(error.message || 'Failed to connect to Basalam. Please try again.')
        navigate('/')
      }
    }

    handleCallback()
  }, [navigate, setBasalamCredentials])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-xl font-semibold mb-4">Connecting to Basalam</h2>
        <p className="text-gray-600">Please wait while we complete the connection...</p>
      </div>
    </div>
  )
}

export default BasalamCallback 