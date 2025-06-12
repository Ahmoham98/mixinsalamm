import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

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

        // The backend will handle the token exchange and send a message back
        // We just need to wait for the message from the popup window
        const messageHandler = (event: MessageEvent) => {
          console.log('Message received from:', event.origin)
          console.log('Message data:', event.data)
          
          const { access_token, refresh_token } = event.data
          
          if (access_token) {
            console.log('Setting Basalam credentials...')
            setBasalamCredentials({
              access_token,
              refresh_token
            })
            
            // Remove the listener after successful connection
            window.removeEventListener('message', messageHandler)
            
            // Show success message
            alert('Successfully connected to Basalam!')
            
            // Navigate back to credentials page
            navigate('/')
          } else {
            console.error('No access token in response')
            alert('Failed to connect to Basalam. Please try again.')
            navigate('/')
          }
        }

        // Add the event listener
        window.addEventListener('message', messageHandler)

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