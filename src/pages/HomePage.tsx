import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { mixinApi } from '../services/api/mixin'
import { basalamApi } from '../services/api/basalam'
import { X, ChevronDown, ChevronUp, LogOut, Loader2, Package, ShoppingCart, TrendingUp, Users, Layers, Link2, Unlink, Menu, Home, Settings, BarChart2, ChevronRight, ChevronLeft } from 'lucide-react'
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
  const [productImage, setProductImage] = useState<string | null>(null)
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

  // Fetch product image when modal opens
  React.useEffect(() => {
    const fetchProductImage = async () => {
      if (isOpen && product) {
        if (type === 'mixin' && mixinCredentials) {
          console.log('Fetching image for Mixin product:', product.id)
          const imageUrl = await mixinApi.getProductImage(mixinCredentials, product.id)
          console.log('Received Mixin image URL:', imageUrl)
          setProductImage(imageUrl)
        } else if (type === 'basalam' && isBasalamProduct(product)) {
          // For Basalam products, use the photo from the product data
          console.log('Setting Basalam product image:', product.photo)
          // Use the 'md' size for a good balance of quality and performance
          setProductImage(product.photo.md)
        }
      }
    }
    fetchProductImage()
  }, [isOpen, product, type, mixinCredentials])

  // Initialize editedProduct when product changes
  React.useEffect(() => {
    if (product) {
      console.log('=== ProductModal Debug ===');
      console.log('Product type:', type);
      console.log('Product data:', JSON.stringify(product, null, 2));
      
      const fetchFullProductDetails = async () => {
        if (type === 'mixin' && isMixinProduct(product) && mixinCredentials) {
          console.log('Fetching full Mixin product details...');
          const fullProduct = await mixinApi.getProductById(mixinCredentials, product.id)
          console.log('Full Mixin product data:', JSON.stringify(fullProduct, null, 2));
          
          if (fullProduct) {
            setEditedProduct({
              name: fullProduct.name,
              price: fullProduct.price,
              description: fullProduct.description || ''
            })
            console.log('Set edited product with description:', fullProduct.description);
          }
        } else if (type === 'basalam' && isBasalamProduct(product) && basalamCredentials) {
          console.log('Fetching full Basalam product details...');
          const fullProduct = await basalamApi.getProductById(basalamCredentials, product.id)
          console.log('Full Basalam product data:', JSON.stringify(fullProduct, null, 2));
          
          if (fullProduct) {
            setEditedProduct({
              name: product.title,
              price: rialToToman(product.price), // Convert Rial to Toman for display
              description: fullProduct.description || ''
            })
            console.log('Set edited product with description:', fullProduct.description);
          }
        }
      }
      fetchFullProductDetails()
    }
  }, [product, type, mixinCredentials, basalamCredentials])

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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold">جزئیات محصول</h2>
        </div>

        {/* Product Image Section */}
        <div className="mb-6">
          <div className="w-full min-h-[200px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-4">
            {productImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={productImage} 
                  alt={isMixinProduct(product) ? product.name : product.title}
                  className="max-w-full max-h-[300px] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Error loading image:', e)
                    setProductImage(null)
                  }}
                />
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Package size={48} />
                <span className="mt-2">تصویر محصول</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
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

function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <div className="w-16 h-16 border-4 border-[#5b9fdb]/20 rounded-full animate-spin border-t-[#5b9fdb]"></div>
        <h3 className="text-xl font-semibold text-gray-800">در حال بارگذاری...</h3>
        <p className="text-gray-600 text-center">لطفا صبر کنید تا اطلاعات محصولات بارگذاری شود</p>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
      console.log('=== Product Click Debug ===');
      console.log('Product ID:', productId);
      console.log('Type:', type);
      
      let product: MixinProduct | BasalamProduct | null = null;
      
      if (type === 'mixin' && mixinCredentials) {
        console.log('Fetching Mixin product details...');
        // For Mixin products, always fetch the full details
        const fullProduct = await mixinApi.getProductById(mixinCredentials, productId)
        console.log('Full Mixin product data:', fullProduct);
        
        if (fullProduct) {
          product = {
            ...fullProduct,
            description: fullProduct.description || ''
          }
          console.log('Processed Mixin product with description:', product);
        }
      } else if (type === 'basalam' && basalamCredentials) {
        console.log('Fetching Basalam product details...');
        // For Basalam products, always fetch the full details
        product = await basalamApi.getProductById(basalamCredentials, productId)
        console.log('Full Basalam product data:', product);
      }

      if (product) {
        console.log('Setting selected product:', product);
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
    <div className="min-h-screen bg-gradient-to-br from-[#5b9fdb]/10 to-[#ff6040]/10">
      {/* Sidebar Toggle Button - Show when sidebar is collapsed */}
      <button
        onClick={() => {
          setIsSidebarCollapsed(false);
          setIsSidebarOpen(true);
        }}
        className={`fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isSidebarCollapsed ? 'block' : 'hidden'}`}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
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
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-[#5b9fdb]/10 rounded-lg hover:bg-[#5b9fdb]/20 transition-colors">
              <Home size={20} />
              {!isSidebarCollapsed && <span>داشبورد</span>}
            </a>
            
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <Package size={20} />
              {!isSidebarCollapsed && <span>محصولات</span>}
            </a>
            
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
              <BarChart2 size={20} />
              {!isSidebarCollapsed && <span>آمار و گزارشات</span>}
            </a>
            
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors">
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

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? (isSidebarCollapsed ? 'lg:mr-0' : 'lg:mr-64') : 'mr-0'}`}>
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/60 backdrop-blur-md shadow-lg z-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#fa6b23] to-[#fa864b] bg-clip-text text-transparent">
                  به سایت میکسین سلام خیلی خوش آمدید
                </h1>
              <p className="text-gray-600">سپاس بابت اینکه ما را انتخاب کردید</p>
            </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Products Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#5b9fdb]/10 to-[#5b9fdb]/20 rounded-lg">
                  <Layers className="w-8 h-8 text-[#5b9fdb]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">تعداد کل محصولات</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[#5b9fdb] to-[#5b9fdb]/80 bg-clip-text text-transparent">
                    {mixinProducts?.length || 0}
                  </h3>
                </div>
              </div>
            </div>

            {/* Common Products Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#ff6040]/10 to-[#ff6040]/20 rounded-lg">
                  <Link2 className="w-8 h-8 text-[#ff6040]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">محصولات مشترک</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[#ff6040] to-[#ff6040]/80 bg-clip-text text-transparent">
                    {commonMixinProducts?.length || 0}
                  </h3>
                </div>
              </div>
            </div>

            {/* Uncommon Products Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#5b9fdb]/10 to-[#ff6040]/10 rounded-lg">
                  <Unlink className="w-8 h-8 text-[#5b9fdb]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">محصولات غیرمشترک</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[#5b9fdb] to-[#ff6040] bg-clip-text text-transparent">
                    {uniqueMixinProducts?.length || 0}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Common Products Section */}
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-[#ffa454] to-[#ffa454] bg-clip-text text-transparent">
                محصولات مشترک در باسلام و میکسین
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mixin Common Products */}
              <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">محصولات مشترک در میکسین</h3>
                <button 
                  onClick={() => setIsCommonMixinSectionOpen(!isCommonMixinSectionOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {isCommonMixinSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {isCommonMixinSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {!mixinCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">لطفا ابتدا به میکسین متصل شوید</div>
                  ) : isMixinLoading || isBasalamLoading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b9fdb] mx-auto"></div>
                        <p className="mt-2 text-gray-600">در حال بارگذاری محصولات...</p>
                    </div>
                  ) : commonMixinProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">محصول مشترکی یافت نشد</div>
                  ) : (
                    commonMixinProducts.map((product: MixinProduct) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id, 'mixin')}
                          className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 text-right group"
                        dir="rtl"
                      >
                          <h3 className="font-medium text-gray-800 group-hover:text-[#5b9fdb] transition-colors">{product.name}</h3>
                          <p className="text-gray-600 mt-1">قیمت: {product.price ? formatPrice(product.price) : 'قیمت نامشخص'} تومان</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

              {/* Basalam Common Products */}
              <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">محصولات مشترک در باسلام</h3>
                <button 
                  onClick={() => setIsCommonBasalamSectionOpen(!isCommonBasalamSectionOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {isCommonBasalamSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {isCommonBasalamSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {!basalamCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">لطفا ابتدا به باسلام متصل شوید</div>
                  ) : isUserLoading || isBasalamLoading || isMixinLoading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6040] mx-auto"></div>
                        <p className="mt-2 text-gray-600">در حال بارگذاری محصولات...</p>
                    </div>
                  ) : commonBasalamProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">محصول مشترکی یافت نشد</div>
                  ) : (
                    commonBasalamProducts.map((product: BasalamProduct) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id, 'basalam')}
                          className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 text-right group"
                        dir="rtl"
                      >
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{product.title}</h3>
                          <p className="text-gray-600 mt-1">قیمت: {product.price ? formatPrice(rialToToman(product.price)) : 'قیمت نامشخص'} تومان</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            </div>
            </div>

          {/* Main Content */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-[#ff9233] to-[#ffa454] bg-clip-text text-transparent">
              محصولات غیرمشترک در باسلام و میکسین
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Unique Mixin Products */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">محصولات منحصر به میکسین</h3>
                <button 
                  onClick={() => setIsMixinSectionOpen(!isMixinSectionOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {isMixinSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {isMixinSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {!mixinCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">لطفا ابتدا به میکسین متصل شوید</div>
                ) : isMixinLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">در حال بارگذاری محصولات میکسین...</p>
                  </div>
                  ) : uniqueMixinProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">محصول منحصر به میکسین یافت نشد</div>
                ) : (
                    uniqueMixinProducts.map((product: MixinProduct) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id, 'mixin')}
                          className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 text-right group"
                        dir="rtl"
                    >
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                          <p className="text-gray-600 mt-1">قیمت: {product.price ? formatPrice(product.price) : 'قیمت نامشخص'} تومان</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

              {/* Unique Basalam Products */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">محصولات منحصر به باسلام</h3>
                <button 
                  onClick={() => setIsBasalamSectionOpen(!isBasalamSectionOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {isBasalamSectionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {isBasalamSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {!basalamCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">لطفا ابتدا به باسلام متصل شوید</div>
                ) : isUserLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">در حال بارگذاری اطلاعات کاربر...</p>
                  </div>
                ) : isBasalamLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">در حال بارگذاری محصولات باسلام...</p>
                  </div>
                  ) : uniqueBasalamProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">محصول منحصر به باسلام یافت نشد</div>
                ) : (
                    uniqueBasalamProducts.map((product: BasalamProduct) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id, 'basalam')}
                          className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 text-right group"
                        dir="rtl"
                    >
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{product.title}</h3>
                          <p className="text-gray-600 mt-1">قیمت: {product.price ? formatPrice(rialToToman(product.price)) : 'قیمت نامشخص'} تومان</p>
                    </div>
                  ))
                )}
              </div>
            )}
            </div>
          </div>
        </div>
        </main>

        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          type={modalType}
          mixinProducts={mixinProducts}
          basalamProducts={basalamProducts}
        />

        {/* Loading Modal */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-[#5b9fdb] border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] bg-clip-text text-transparent mb-2">
                  در حال بارگذاری...
                </h3>
                <p className="text-gray-600 text-center">
                  لطفاً صبر کنید تا اطلاعات محصولات بارگذاری شود
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Mixin Product Modal */}
        {isCreateMixinModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] bg-clip-text text-transparent">
                  ایجاد محصول در میکسین
                </h2>
                <button
                  onClick={() => setIsCreateMixinModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام محصول
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5b9fdb] focus:ring-2 focus:ring-[#5b9fdb]/20 outline-none transition-all duration-200"
                    placeholder="نام محصول را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قیمت (تومان)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5b9fdb] focus:ring-2 focus:ring-[#5b9fdb]/20 outline-none transition-all duration-200"
                    placeholder="قیمت محصول را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5b9fdb] focus:ring-2 focus:ring-[#5b9fdb]/20 outline-none transition-all duration-200 min-h-[100px]"
                    placeholder="توضیحات محصول را وارد کنید"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsCreateMixinModalOpen(false)}
                    className="px-6 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    انصراف
                  </button>
                  <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] text-white hover:from-[#ff6040]/90 hover:to-[#5b9fdb]/90 transition-all duration-200 shadow-md hover:shadow-lg">
                    ایجاد محصول
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage