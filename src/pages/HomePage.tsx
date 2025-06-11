import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { mixinApi } from '../services/api/mixin'
import { basalamApi } from '../services/api/basalam'
import { X, ChevronDown, ChevronUp, LogOut, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MixinProduct, BasalamProduct } from '../types'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: MixinProduct | BasalamProduct | null
  type: 'mixin' | 'basalam'
  mixinProducts: MixinProduct[] | undefined
  basalamProducts: BasalamProduct[] | undefined
}

function isMixinProduct(product: any): product is MixinProduct {
  return 'name' in product
}

function isBasalamProduct(product: any): product is BasalamProduct {
  return 'title' in product
}

// Add utility functions for price conversion and formatting
const rialToToman = (price: number): number => {
  return Math.floor(price / 10)
}

const tomanToRial = (price: number): number => {
  return price * 10
}

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) {
    return 'قیمت نامشخص';
  }
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function ProductModal({ isOpen, onClose, product, type, mixinProducts, basalamProducts }: ProductModalProps) {
  const [checkMessage, setCheckMessage] = useState<{ text: string; isSuccess: boolean } | null>(null)
  const [editMessage, setEditMessage] = useState<{ text: string; isSuccess: boolean } | null>(null)
  const [showSyncButton, setShowSyncButton] = useState(false)
  const [showMixinButton, setShowMixinButton] = useState(false)
  const [showBasalamButton, setShowBasalamButton] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProduct, setEditedProduct] = useState<{
    name: string;
    price: number;
    description: string;
  }>({
    name: '',
    price: 0,
    description: ''
  })
  const { mixinCredentials, basalamCredentials } = useAuthStore()
  const queryClient = useQueryClient()

  // Initialize editedProduct when product changes
  React.useEffect(() => {
    if (product) {
      if (type === 'mixin' && isMixinProduct(product)) {
        setEditedProduct({
          name: product.name,
          price: product.price,
          description: product.description
        })
      } else if (type === 'basalam' && isBasalamProduct(product)) {
        setEditedProduct({
          name: product.title,
          price: rialToToman(product.price), // Convert Rial to Toman for display
          description: '' // Basalam products don't have a description field
        })
      }
    }
  }, [product, type])

  // Automatically check product existence when modal opens or product changes
  React.useEffect(() => {
    if (isOpen && product) {
      console.log('Running check for product:', product)
      handleCheck()
    }
  }, [isOpen, product, type])

  if (!isOpen || !product) return null

  const handleInputChange = (field: 'name' | 'price' | 'description', value: string | number) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheck = () => {
    let currentProductName = ''
    let changecard = ''
    let priceMismatch = false

    if (type === 'mixin' && isMixinProduct(product)) {
      currentProductName = product.name
      // Check if product exists in Basalam list
      const matchingBasalamProduct = basalamProducts?.find(
        basalamProduct => basalamProduct.title.toLowerCase() === currentProductName.toLowerCase()
      )
      
      if (matchingBasalamProduct) {
        // Check if prices match (convert Basalam price from Rial to Toman for comparison)
        if (rialToToman(matchingBasalamProduct.price) !== product.price) {
          setCheckMessage({
            text: "قیمت محصول شما تغییر کرده، قیمت محصول دیگر را همگام سازی کنید",
            isSuccess: false
          })
          priceMismatch = true
        } else {
        setCheckMessage({
            text: "محصول شما هم در باسلام و هم در میکسین وحود دارد",
          isSuccess: true
        })
        }
        changecard = 'mixin,basalam'
        setShowBasalamButton(false)
      } else {
        setCheckMessage({
          text: "این محصول شما در باسلام ساخته نشده است، لطفاً  ابتدا آنرا در باسلام بسازید",
          isSuccess: false
        })
        changecard = 'mixin'
        setShowBasalamButton(true)
      }
      setShowMixinButton(false)
    } else if (type === 'basalam' && isBasalamProduct(product)) {
      currentProductName = product.title
      // Check if product exists in Mixin list
      const matchingMixinProduct = mixinProducts?.find(
        mixinProduct => mixinProduct.name.toLowerCase() === currentProductName.toLowerCase()
      )
      
      if (matchingMixinProduct) {
        // Check if prices match (convert Basalam price from Rial to Toman for comparison)
        if (matchingMixinProduct.price !== rialToToman(product.price)) {
          setCheckMessage({
            text: "قیمت محصول شما تغییر کرده، قیمت محصول دیگر را همگام سازی کنید",
            isSuccess: false
          })
          priceMismatch = true
        } else {
        setCheckMessage({
            text: "محصول شما هم در باسلام و هم در میکسین وحود دارد",
          isSuccess: true
        })
        }
        changecard = 'mixin,basalam'
        setShowMixinButton(false)
      } else {
        setCheckMessage({
          text: "این محصول شما در میکسین ساخته نشده است، لطفاً  ابتدا آنرا در میکسین بسازید",
          isSuccess: false
        })
        changecard = 'basalam'
        setShowMixinButton(true)
      }
      setShowBasalamButton(false)
    }

    setShowSyncButton(priceMismatch)
    localStorage.setItem('changecard', changecard)
    console.log('Updated changecard:', changecard, 'for product:', currentProductName)
  }

  const handleEdit = async () => {
    try {
      setIsEditing(true)
      const changecard = localStorage.getItem('changecard') || ''
      const productId = product?.id

      if (!productId) {
        throw new Error('Product ID not found')
      }

      console.log('Starting edit process with:', {
        changecard,
        productId,
        editedProduct,
        type
      })

      // Find corresponding product IDs for both platforms
      let mixinProductId = productId
      let basalamProductId = productId

      if (type === 'mixin' && basalamProducts) {
        // When updating from Mixin, find the Basalam product by matching the original name
        const originalMixinProduct = await mixinApi.getProductById(mixinCredentials!, productId)
        if (originalMixinProduct) {
          const basalamProduct = basalamProducts.find(
            p => p.title.toLowerCase() === originalMixinProduct.name.toLowerCase()
          )
          if (basalamProduct) {
            basalamProductId = basalamProduct.id
            console.log('Found Basalam product ID:', basalamProductId, 'for Mixin product:', originalMixinProduct.name)
          }
        }
      } else if (type === 'basalam' && mixinProducts) {
        // When updating from Basalam, find the Mixin product by matching the original name
        const originalBasalamProduct = await basalamApi.getProductById(basalamCredentials!, productId)
        if (originalBasalamProduct) {
          const mixinProduct = mixinProducts.find(
            p => p.name.toLowerCase() === originalBasalamProduct.title.toLowerCase()
          )
          if (mixinProduct) {
            mixinProductId = mixinProduct.id
            console.log('Found Mixin product ID:', mixinProductId, 'for Basalam product:', originalBasalamProduct.title)
          }
        }
      }

      console.log('Using product IDs:', { mixinProductId, basalamProductId })

      if (changecard.includes('mixin') && mixinCredentials) {
        console.log('Updating Mixin product...')
        // Get the original product data first
        const originalProduct = await mixinApi.getProductById(mixinCredentials, mixinProductId)
        if (!originalProduct) {
          throw new Error('Could not fetch original Mixin product data')
        }

        // Create updated data by merging original data with new values
        const mixinProductData = {
          ...originalProduct,
          name: editedProduct.name,
          price: Number(editedProduct.price),
          description: editedProduct.description || '',
          extra_fields: []
        }

        console.log('Sending Mixin update request with data:', mixinProductData)
        const mixinResponse = await mixinApi.updateProduct(mixinCredentials, mixinProductId, mixinProductData)
        console.log('Mixin update response:', mixinResponse)
      }

      if (changecard.includes('basalam') && basalamCredentials) {
        console.log('Updating Basalam product...')
        // Convert Toman to Rial for Basalam update
        const basalamProductData = {
          name: editedProduct.name,
          price: tomanToRial(editedProduct.price) // Convert Toman to Rial for Basalam API
        }
        try {
          console.log('Sending Basalam update request with data:', {
            productId: basalamProductId,
            data: basalamProductData
          })
          const basalamResponse = await basalamApi.updateProduct(basalamCredentials, basalamProductId, basalamProductData)
        console.log('Basalam update response:', basalamResponse)
        } catch (error) {
          console.error('Error updating Basalam product:', error)
          // Don't throw error here, just log it and continue
          // This way, if Mixin update succeeds but Basalam fails, we still show success for Mixin
        }
      }

      setEditMessage({
        text: 'محصول شما با موفقیت به‌روز شد',
        isSuccess: true
      })

      // Refetch products data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mixinProducts'] }),
        queryClient.invalidateQueries({ queryKey: ['basalamProducts'] })
      ])

      // Wait for the queries to complete
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['mixinProducts'] }),
        queryClient.refetchQueries({ queryKey: ['basalamProducts'] })
      ])

      // Close modal after success
      setTimeout(() => {
        onClose()
      }, 1000) // Reduced timeout to 1 second for better UX

    } catch (error) {
      console.error('Error updating product:', error)
      setEditMessage({
        text: error instanceof Error ? error.message : 'Failed to update product. Please try again.',
        isSuccess: false
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleMixinNavigation = () => {
    window.open('https://mixin.ir/', '_blank')
  }

  const handleBasalamNavigation = () => {
    window.open('https://basalam.com/', '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      {isEditing && <LoadingModal />}
      <div className="bg-white p-8 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-semibold mb-6">Product Details</h2>
        <div className="space-y-6">
          <div>
            <label className="font-medium text-lg">Name/Title:</label>
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="font-medium text-lg">Price:</label>
            <div className="relative">
            <input
              type="number"
              value={editedProduct.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {formatPrice(editedProduct.price)} تومان
              </p>
            </div>
          </div>
          <div>
            <label className="font-medium text-lg">Description:</label>
            <textarea
              value={editedProduct.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-end gap-4">
          <div className="flex gap-4 w-full justify-end">
          <div className="flex gap-4">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-md"
            >
                <span>ویرایش</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleCheck}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
                <span>بررسی</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            </div>
          </div>
          {checkMessage && (
            <div className="flex flex-col items-end gap-2 w-full">
            <p className={`text-sm ${checkMessage.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {checkMessage.text}
            </p>
              {showSyncButton && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <span>همگام سازی</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              {showMixinButton && (
                <button
                  onClick={handleMixinNavigation}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <span>برو به میکسین</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              {showBasalamButton && (
                <button
                  onClick={handleBasalamNavigation}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <span>برو به باسلام</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          {editMessage && (
            <p className={`text-sm ${editMessage.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {editMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface CreateMixinProductModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateMixinProductModal({ isOpen, onClose }: CreateMixinProductModalProps) {
  const [createMessage, setCreateMessage] = useState<{ text: string; isSuccess: boolean } | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    main_category: 1,
    description: '',
    price: 0,
    stock: 6,
    weight: 750,
    stock_type: 'unlimited',
    available: true,
    english_name: undefined,
    other_categories: [],
    brand: undefined,
    analysis: undefined,
    special_offer_end: undefined,
    length: undefined,
    height: undefined,
    barcode: '',
    compare_at_price: undefined,
    guarantee: undefined,
    product_identifier: undefined,
    max_order_quantity: undefined,
    old_slug: undefined,
    old_path: undefined,
    seo_title: undefined,
    seo_description: undefined,
    extra_fields: []
  })
  const { mixinCredentials } = useAuthStore()

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreate = async () => {
    try {
      if (!mixinCredentials) {
        throw new Error('Mixin credentials not found')
      }

      // Validate required fields
      if (!newProduct.name.trim()) {
        throw new Error('Product name is required')
      }

      if (newProduct.price <= 0) {
        throw new Error('Price must be greater than 0')
      }

      const response = await mixinApi.createProduct(mixinCredentials, newProduct)
      console.log('Create response:', response)

      setCreateMessage({
        text: 'Product created successfully!',
        isSuccess: true
      })

      // Clear form
      setNewProduct({
        name: '',
        main_category: 1,
        description: '',
        price: 0,
        stock: 6,
        weight: 750,
        stock_type: 'unlimited',
        available: true,
        english_name: undefined,
        other_categories: [],
        brand: undefined,
        analysis: undefined,
        special_offer_end: undefined,
        length: undefined,
        height: undefined,
        barcode: '',
        compare_at_price: undefined,
        guarantee: undefined,
        product_identifier: undefined,
        max_order_quantity: undefined,
        old_slug: undefined,
        old_path: undefined,
        seo_title: undefined,
        seo_description: undefined,
        extra_fields: []
      })

      // Close modal and reload page after success
      setTimeout(() => {
        setCreateMessage(null)
        onClose()
        window.location.reload()
      }, 1000) // Reduced timeout to 1 second for better UX

    } catch (error) {
      console.error('Error creating product:', error)
      let errorMessage = 'Failed to create product. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error)
      }

      setCreateMessage({
        text: errorMessage,
        isSuccess: false
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-semibold mb-6">Create New Mixin Product</h2>
        <div className="space-y-6">
          <div>
            <label className="font-medium text-lg">Name:</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="font-medium text-lg">Price:</label>
            <div className="relative">
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {formatPrice(newProduct.price)} تومان
              </p>
            </div>
          </div>
          <div>
            <label className="font-medium text-lg">Stock:</label>
            <input
              type="number"
              value={newProduct.stock}
              onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="font-medium text-lg">Weight (g):</label>
            <input
              type="number"
              value={newProduct.weight}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 0)}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="font-medium text-lg">Description:</label>
            <textarea
              value={newProduct.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-end gap-4">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <span>Create Product</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {createMessage && (
            <p className={`text-sm ${createMessage.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {createMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Add LoadingModal component
function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  )
}

function HomePage() {
  const { mixinCredentials, basalamCredentials, clearCredentials } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState<MixinProduct | BasalamProduct | null>(null)
  const [modalType, setModalType] = useState<'mixin' | 'basalam'>('mixin')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMixinSectionOpen, setIsMixinSectionOpen] = useState(true)
  const [isBasalamSectionOpen, setIsBasalamSectionOpen] = useState(true)
  const [isCommonMixinSectionOpen, setIsCommonMixinSectionOpen] = useState(true)
  const [isCommonBasalamSectionOpen, setIsCommonBasalamSectionOpen] = useState(true)
  const [isCreateMixinModalOpen, setIsCreateMixinModalOpen] = useState(false)

  const handleLogout = async () => {
    try {
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to logout?')) {
        return;
      }

      // Clear credentials from store
      clearCredentials();

      // Clear any cached data
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();

      // Clear React Query cache
      queryClient.clear();

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to logout. Please try again.');
    }
  }

  const { data: userData, isLoading: isUserLoading, error: userError } = useQuery({
    queryKey: ['basalamUser'],
    queryFn: () => basalamApi.getUserData(basalamCredentials!),
    enabled: !!basalamCredentials?.access_token,
    retry: 1,
    staleTime: 30000,
  })

  const { data: mixinProducts, isLoading: isMixinLoading, error: mixinError } = useQuery({
    queryKey: ['mixinProducts'],
    queryFn: () => mixinApi.getProducts(mixinCredentials!),
    enabled: !!mixinCredentials?.url && !!mixinCredentials?.access_token,
    retry: 1,
    staleTime: 30000,
  })

  const { data: basalamProducts, isLoading: isBasalamLoading, error: basalamError } = useQuery({
    queryKey: ['basalamProducts', userData?.vendor?.id],
    queryFn: () => {
      if (!userData?.vendor?.id) {
        throw new Error('Vendor ID is required to fetch Basalam products');
      }
      return basalamApi.getProducts(basalamCredentials!, userData.vendor.id);
    },
    enabled: !!userData?.vendor?.id && !!basalamCredentials?.access_token,
    retry: 1,
    staleTime: 30000,
  })

  // Add debug logging
  React.useEffect(() => {
    console.log('=== Debug Information ===');
    console.log('Mixin Products:', mixinProducts);
    console.log('Basalam Products:', basalamProducts);
    console.log('User Data:', userData);
    console.log('Mixin Credentials:', mixinCredentials);
    console.log('Basalam Credentials:', basalamCredentials);
    console.log('Mixin Error:', mixinError);
    console.log('Basalam Error:', basalamError);
    console.log('Is Mixin Loading:', isMixinLoading);
    console.log('Is Basalam Loading:', isBasalamLoading);
    console.log('Is User Loading:', isUserLoading);
  }, [mixinProducts, basalamProducts, userData, mixinCredentials, basalamCredentials, mixinError, basalamError, isMixinLoading, isBasalamLoading, isUserLoading]);

  // Add error display component
  const ErrorDisplay = ({ error }: { error: any }) => {
    if (!error) return null;
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Products</h3>
        <p className="text-red-600 text-sm">{error.message || 'An unknown error occurred'}</p>
        {error.response && (
          <div className="mt-2 text-xs text-red-500">
            <p>Status: {error.response.status}</p>
            <p>Data: {JSON.stringify(error.response.data)}</p>
          </div>
        )}
      </div>
    );
  };

  // Update getCommonProducts function to handle undefined data and null values
  const getCommonProducts = () => {
    if (!mixinProducts || !basalamProducts) {
      return { 
        commonMixinProducts: [], 
        commonBasalamProducts: [],
        uniqueMixinProducts: [],
        uniqueBasalamProducts: []
      }
    }

    // Extract the data array from the response if it exists
    const mixinProductsArray = Array.isArray(mixinProducts) ? mixinProducts : (mixinProducts as any).data || [];
    const basalamProductsArray = Array.isArray(basalamProducts) ? basalamProducts : (basalamProducts as any).data || [];

    console.log('Processing Mixin Products:', mixinProductsArray);
    console.log('Processing Basalam Products:', basalamProductsArray);

    const commonMixinProducts = mixinProductsArray.filter((mixinProduct: MixinProduct) => 
      mixinProduct?.name && basalamProductsArray.some((basalamProduct: BasalamProduct) => 
        basalamProduct?.title && 
        basalamProduct.title.toLowerCase() === mixinProduct.name.toLowerCase()
      )
    )

    const commonBasalamProducts = basalamProductsArray.filter((basalamProduct: BasalamProduct) => 
      basalamProduct?.title && mixinProductsArray.some((mixinProduct: MixinProduct) => 
        mixinProduct?.name && 
        mixinProduct.name.toLowerCase() === basalamProduct.title.toLowerCase()
      )
    )

    // Get unique products (products that only exist in one platform)
    const uniqueMixinProducts = mixinProductsArray.filter((mixinProduct: MixinProduct) => 
      mixinProduct?.name && !basalamProductsArray.some((basalamProduct: BasalamProduct) => 
        basalamProduct?.title && 
        basalamProduct.title.toLowerCase() === mixinProduct.name.toLowerCase()
      )
    )

    const uniqueBasalamProducts = basalamProductsArray.filter((basalamProduct: BasalamProduct) => 
      basalamProduct?.title && !mixinProductsArray.some((mixinProduct: MixinProduct) => 
        mixinProduct?.name && 
        mixinProduct.name.toLowerCase() === basalamProduct.title.toLowerCase()
      )
    )

    console.log('Common Mixin Products:', commonMixinProducts);
    console.log('Common Basalam Products:', commonBasalamProducts);
    console.log('Unique Mixin Products:', uniqueMixinProducts);
    console.log('Unique Basalam Products:', uniqueBasalamProducts);

    return { 
      commonMixinProducts, 
      commonBasalamProducts,
      uniqueMixinProducts,
      uniqueBasalamProducts
    }
  }

  // Get all product lists
  const { 
    commonMixinProducts, 
    commonBasalamProducts,
    uniqueMixinProducts,
    uniqueBasalamProducts 
  } = getCommonProducts()

  // Add debug logging for product data
  React.useEffect(() => {
    console.log('=== Product Data Debug ===');
    console.log('Mixin Products:', mixinProducts);
    console.log('Basalam Products:', basalamProducts);
    console.log('Common Mixin Products:', commonMixinProducts);
    console.log('Common Basalam Products:', commonBasalamProducts);
    console.log('Unique Mixin Products:', uniqueMixinProducts);
    console.log('Unique Basalam Products:', uniqueBasalamProducts);
  }, [mixinProducts, basalamProducts, commonMixinProducts, commonBasalamProducts, uniqueMixinProducts, uniqueBasalamProducts]);

  const handleProductClick = async (productId: number, type: 'mixin' | 'basalam') => {
    try {
      let product: MixinProduct | BasalamProduct | null = null;
      
      if (type === 'mixin' && mixinCredentials) {
        product = await mixinApi.getProductById(mixinCredentials, productId)
      } else if (type === 'basalam' && basalamCredentials) {
        product = await basalamApi.getProductById(basalamCredentials, productId)
      }

      if (product) {
        setSelectedProduct(product)
        setModalType(type)
        setIsModalOpen(true)
      } else {
        throw new Error('Failed to fetch product details')
      }
    } catch (error) {
      console.error('Error fetching product details:', error)
      alert('Failed to fetch product details')
    }
  }

  // Add loading state check
  const isLoading = isUserLoading || isMixinLoading || isBasalamLoading

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <ErrorDisplay error={mixinError} />
          <ErrorDisplay error={basalamError} />
        </div>
        
        {isLoading && <LoadingModal />}
        
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white shadow-md z-20">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={20} />
                <span>خروج</span>
            </button>
              <div className="text-center flex-1 -ml-[55px]">
                <h1 className="text-3xl font-bold mb-2">به سایت میکسین سلام خیلی خوش آمدید</h1>
                <p className="text-gray-600">سپاس بابت اینکه ما را انتخاب کردید</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Common Products Header */}
              <div className="col-span-2 flex justify-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">محصولات مشترک در باسلام و میکسین</h2>
              </div>

              {/* Common Mixin Products */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-4"
                >
                  <button 
                    className="text-gray-500 hover:text-gray-700 focus:outline-none order-first"
                    onClick={() => setIsCommonMixinSectionOpen(!isCommonMixinSectionOpen)}
                  >
                    {isCommonMixinSectionOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                  <h2 className="text-xl font-semibold text-right w-full">محصول مشترک در میکسین</h2>
                </div>
                {isCommonMixinSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {!mixinCredentials ? (
                      <div className="text-center py-4 text-gray-500">Please connect to Mixin first</div>
                    ) : isMixinLoading || isBasalamLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2">Loading products...</p>
                      </div>
                    ) : commonMixinProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No common products found</div>
                    ) : (
                      commonMixinProducts.map((product: MixinProduct) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product.id, 'mixin')}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 text-right"
                          dir="rtl"
                        >
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-gray-600">قیمت: {product.price ? formatPrice(product.price) : 'قیمت نامشخص'} تومان</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Common Basalam Products */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div 
                  className="flex items-center justify-between cursor-pointer mb-4"
                >
                  <button 
                    className="text-gray-500 hover:text-gray-700 focus:outline-none order-first"
                    onClick={() => setIsCommonBasalamSectionOpen(!isCommonBasalamSectionOpen)}
                  >
                    {isCommonBasalamSectionOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                  <h2 className="text-xl font-semibold text-right w-full">محصول مشترک در باسلام</h2>
                </div>
                {isCommonBasalamSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {!basalamCredentials ? (
                      <div className="text-center py-4 text-gray-500">Please connect to Basalam first</div>
                    ) : isUserLoading || isBasalamLoading || isMixinLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2">Loading products...</p>
                      </div>
                    ) : commonBasalamProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No common products found</div>
                    ) : (
                      commonBasalamProducts.map((product: BasalamProduct) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product.id, 'basalam')}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 text-right"
                          dir="rtl"
                        >
                          <h3 className="font-medium">{product.title}</h3>
                          <p className="text-gray-600">قیمت: {product.price ? formatPrice(rialToToman(product.price)) : 'قیمت نامشخص'} تومان</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Unique Products Header */}
              <div className="col-span-2 mt-8 flex justify-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">محصولات غیرمشترک در باسلام و میکسین</h2>
              </div>

            {/* Mixin Products */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div 
                className="flex items-center justify-between cursor-pointer mb-4"
                >
                  <button 
                    className="text-gray-500 hover:text-gray-700 focus:outline-none order-first"
                    onClick={() => setIsMixinSectionOpen(!isMixinSectionOpen)}
                  >
                    {isMixinSectionOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                  <h2 className="text-xl font-semibold text-right w-full">محصولات غیر مشترک در میکسین</h2>
                </div>
                {isMixinSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {!mixinCredentials ? (
                    <div className="text-center py-4 text-gray-500">Please connect to Mixin first</div>
                  ) : isMixinLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2">Loading Mixin products...</p>
                    </div>
                    ) : uniqueMixinProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No unique Mixin products found</div>
                  ) : (
                      uniqueMixinProducts.map((product: MixinProduct) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id, 'mixin')}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 text-right"
                          dir="rtl"
                      >
                        <h3 className="font-medium">{product.name}</h3>
                          <p className="text-gray-600">قیمت: {product.price ? formatPrice(product.price) : 'قیمت نامشخص'} تومان</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Basalam Products */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div 
                className="flex items-center justify-between cursor-pointer mb-4"
                >
                  <button 
                    className="text-gray-500 hover:text-gray-700 focus:outline-none order-first"
                    onClick={() => setIsBasalamSectionOpen(!isBasalamSectionOpen)}
                  >
                    {isBasalamSectionOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                  <h2 className="text-xl font-semibold text-right w-full">محصولات غیر مشترک در باسلام</h2>
                </div>
                {isBasalamSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {!basalamCredentials ? (
                    <div className="text-center py-4 text-gray-500">Please connect to Basalam first</div>
                  ) : isUserLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2">Loading user data...</p>
                    </div>
                  ) : isBasalamLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2">Loading Basalam products...</p>
                    </div>
                    ) : uniqueBasalamProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No unique Basalam products found</div>
                  ) : (
                      uniqueBasalamProducts.map((product: BasalamProduct) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id, 'basalam')}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 text-right"
                          dir="rtl"
                      >
                        <h3 className="font-medium">{product.title}</h3>
                          <p className="text-gray-600">قیمت: {product.price ? formatPrice(rialToToman(product.price)) : 'قیمت نامشخص'} تومان</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              </div>
            </div>
          </div>

          <ProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={selectedProduct}
            type={modalType}
            mixinProducts={mixinProducts}
            basalamProducts={basalamProducts}
          />

          <CreateMixinProductModal
            isOpen={isCreateMixinModalOpen}
            onClose={() => setIsCreateMixinModalOpen(false)}
          />
        </main>
      </div>
    </div>
  )
}

export default HomePage