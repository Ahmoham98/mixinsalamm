import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { mixinApi } from '../services/api/mixin'
import { basalamApi } from '../services/api/basalam'
import { X, ChevronDown, ChevronUp, LogOut, Loader2, Package, Layers, Link2, Unlink, Menu, Home, Settings, BarChart2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MixinProduct, BasalamProduct } from '../types'

// Utility function to convert Toman to Rial
const tomanToRial = (toman: number): number => {
  return toman * 10;
};

// Utility function to generate unique SKU
const generateUniqueSKU = (productName: string, vendorId?: number): string => {
  // Create a base from product name (first 10 chars, alphanumeric only)
  const nameBase = productName
    .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '') // Keep only alphanumeric and Persian chars
    .substring(0, 10)
    .toUpperCase();
  
  // Add vendor ID if available (helps with uniqueness across vendors)
  const vendorPart = vendorId ? `V${vendorId}` : 'VENDOR';
  
  // Add timestamp-based unique identifier
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Format: NAMEBASE-V{VENDOR_ID}-{TIMESTAMP_LAST_6}{RANDOM_3}
  const uniquePart = `${timestamp.toString().slice(-6)}${randomNum}`;
  
  return `${nameBase}-${vendorPart}-${uniquePart}`;
};

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: MixinProduct | BasalamProduct | null
  type: 'mixin' | 'basalam'
  mixinProducts: MixinProduct[] | undefined
  basalamProducts: BasalamProduct[] | undefined
  onOpenCreateBasalamModal: (product: MixinProduct) => void
}

function isMixinProduct(product: any): product is MixinProduct {
  return 'name' in product
}

function isBasalamProduct(product: any): product is BasalamProduct {
  return 'title' in product
}

const rialToToman = (price: number): number => {
  return Math.floor(price / 10)
}



const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) {
    return 'قیمت نامشخص';
  }
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function ProductModal({ isOpen, onClose, product, type, mixinProducts, basalamProducts, onOpenCreateBasalamModal }: ProductModalProps) {
  const [checkMessage, setCheckMessage] = useState<{ text: string; isSuccess: boolean } | null>(null)
  const [editMessage, setEditMessage] = useState<{ text: string; isSuccess: boolean } | null>(null)
  const [showSyncButton, setShowSyncButton] = useState(false)
  const [showMixinButton, setShowMixinButton] = useState(false)
  const [showBasalamButton, setShowBasalamButton] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [autoSyncTimeout, setAutoSyncTimeout] = useState<NodeJS.Timeout | null>(null)
  const [editedProduct, setEditedProduct] = useState<{
    name: string;
    price: number;
    description: string;
  }>({
    name: '',
    price: 0,
    description: ''
  })
  const { mixinCredentials, basalamCredentials, settings } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchProductImage = async () => {
      if (isOpen && product) {
        if (type === 'mixin' && isMixinProduct(product) && mixinCredentials) {
          console.log('Fetching image for Mixin product:', product.id)
          const imageUrl = await mixinApi.getProductImage(mixinCredentials, product.id)
          console.log('Received Mixin image URL:', imageUrl)
          setProductImage(imageUrl)
        } else if (type === 'basalam' && isBasalamProduct(product)) {
          console.log('Setting Basalam product image:', product.photo)
          setProductImage(product.photo.md)
        }
      }
    }
    fetchProductImage()
  }, [isOpen, product, type, mixinCredentials])

  useEffect(() => {
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
              price: rialToToman(product.price),
              description: fullProduct.description || ''
            })
            console.log('Set edited product with description:', fullProduct.description);
          }
        }
      }
      fetchFullProductDetails()
    }
  }, [product, type, mixinCredentials, basalamCredentials])

  useEffect(() => {
    if (isOpen && product) {
      console.log('Running check for product:', product)
      handleCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, type])

  // Auto-sync effect
  useEffect(() => {
    // Only trigger auto-sync when:
    // 1. Auto-sync is enabled in settings
    // 2. Sync button is showing (meaning there's a price mismatch)
    // 3. We have a product and both credentials
    if (settings.autoSyncEnabled && showSyncButton && product && mixinCredentials && basalamCredentials) {
      console.log('Auto-sync enabled and sync needed, starting countdown...')
      
      // Set a timeout for 1 second
      const timeout = setTimeout(() => {
        console.log('Auto-sync triggered for product:', product)
        handleEdit() // This is the same function that manual sync button calls
      }, 1000)

      setAutoSyncTimeout(timeout)

      // Cleanup timeout on unmount or when dependencies change
      return () => {
        clearTimeout(timeout)
        setAutoSyncTimeout(null)
      }
    } else {
      // Clear any existing timeout if conditions are not met
      if (autoSyncTimeout) {
        clearTimeout(autoSyncTimeout)
        setAutoSyncTimeout(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoSyncEnabled, showSyncButton, product, mixinCredentials, basalamCredentials])

  // Cleanup timeout when modal closes
  useEffect(() => {
    if (!isOpen && autoSyncTimeout) {
      clearTimeout(autoSyncTimeout)
      setAutoSyncTimeout(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

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
      const matchingBasalamProduct = basalamProducts?.find(
        basalamProduct => basalamProduct.title.toLowerCase() === currentProductName.toLowerCase()
      )

      if (matchingBasalamProduct) {
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
      const matchingMixinProduct = mixinProducts?.find(
        mixinProduct => mixinProduct.name.toLowerCase() === currentProductName.toLowerCase()
      )

      if (matchingMixinProduct) {
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

      let mixinProductId = productId
      let basalamProductId = productId

      if (type === 'mixin' && basalamProducts) {
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
        const originalProduct = await mixinApi.getProductById(mixinCredentials, mixinProductId)
        if (!originalProduct) {
          throw new Error('Could not fetch original Mixin product data')
        }

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
        const basalamProductData = {
          name: editedProduct.name,
          price: tomanToRial(editedProduct.price)
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
        }
      }

      setEditMessage({
        text: 'محصول شما با موفقیت به‌روز شد',
        isSuccess: true
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mixinProducts'] }),
        queryClient.invalidateQueries({ queryKey: ['basalamProducts'] })
      ])

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['mixinProducts'] }),
        queryClient.refetchQueries({ queryKey: ['basalamProducts'] })
      ])

      setTimeout(() => {
        onClose()
      }, 1000)

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

  const handleBasalamAction = () => {
    if (type === 'mixin' && isMixinProduct(product) && showBasalamButton) {
      // Ensure the Mixin product object passed to the creation modal includes its image URL
      const mixinProductWithImage = {
        ...product,
        imageUrl: productImage || undefined // Use the already fetched or available productImage URL
      };
      onOpenCreateBasalamModal(mixinProductWithImage);
      onClose();
    } else {
      window.open('https://basalam.com/', '_blank');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      {isEditing && <LoadingModal />}
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold">جزئیات محصول</h2>
        </div>

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
                <div className="flex flex-col items-end gap-2">
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
                  {settings.autoSyncEnabled && autoSyncTimeout && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      همگام‌سازی خودکار در ۱ ثانیه...
                    </div>
                  )}
                </div>
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
                  onClick={handleBasalamAction}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <span>{type === 'mixin' && isMixinProduct(product) && showBasalamButton ? 'ایجاد در باسلام' : 'برو به باسلام'}</span>
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
  queryClient: any; // Add queryClient to props
}

function CreateMixinProductModal({ isOpen, onClose, queryClient }: CreateMixinProductModalProps) {
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

      // Invalidate and refetch mixinProducts after successful creation
      await queryClient.invalidateQueries({ queryKey: ['mixinProducts'] });
      await queryClient.refetchQueries({ queryKey: ['mixinProducts'] });

      setTimeout(() => {
        setCreateMessage(null)
        onClose()
      }, 1000)

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

interface CreateBasalamProductModalProps {
  open: boolean;
  onClose: () => void;
  mixinProduct: MixinProduct | null;
  queryClient: any; // Add queryClient to props
  vendorId: number;
}

function CreateBasalamProductModal({ open, onClose, mixinProduct, queryClient, vendorId }: CreateBasalamProductModalProps) {
  const [productName, setProductName] = useState(mixinProduct?.name || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [price, setPrice] = useState(mixinProduct?.price ? mixinProduct.price.toString() : "");
  const [preparationDays, setPreparationDays] = useState("");
  const [weight, setWeight] = useState(mixinProduct?.weight ? mixinProduct.weight.toString() : "");
  const [packageWeight, setPackageWeight] = useState("");
  const [stock, setStock] = useState("1"); // Default to 1
  const [sku, setSku] = useState(""); // SKU field
  const [imageId, setImageId] = useState(""); // Will store the Basalam image ID after upload
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { basalamCredentials, mixinCredentials } = useAuthStore();

  // Reset form fields when modal opens for a new product
  useEffect(() => {
    if (open) {
      setProductName(mixinProduct?.name || "");
      setPrice(mixinProduct?.price ? mixinProduct.price.toString() : "");
      setWeight(mixinProduct?.weight ? mixinProduct.weight.toString() : "");
      setPreparationDays(""); // Clear preparation days
      setPackageWeight(""); // Clear package weight
      setStock("1"); // Default stock
      setSku(mixinProduct?.name ? generateUniqueSKU(mixinProduct.name, vendorId) : ""); // Auto-generate unique SKU
      setSelectedCategory(""); // Clear selected category
      setImageId(""); // Clear image ID
      setError(null);
      setMessage(null);
      setIsSubmitting(false);
      setIsImageUploading(false);
    }
  }, [open, mixinProduct]);


  // Fetch category suggestions based on product name
  const { data: categorySuggestions, isLoading: areCategoriesLoading, error: categoryError } = useQuery({
    queryKey: ['basalamCategorySuggestions', productName],
    queryFn: async () => {
      if (!productName.trim()) return [];
      try {

        const response = await fetch(`https://mixinsalama.liara.run/products/category-detection/?title=${encodeURIComponent(productName)}`);
        if (!response.ok) {
          throw new Error(`خطا در دریافت دسته‌بندی‌ها: ${response.statusText}`);
        }
        const data = await response.json();
        // اصلاح ساختار داده بر اساس ریسپانس واقعی
        if (Array.isArray(data.result)) {
          return data.result.map((cat: any) => ({
            id: cat.cat_id,
            name: cat.cat_title
          }));
        }
        return [];
      } catch (err) {
        console.error("خطا در فراخوانی API دسته‌بندی باسلام:", err);
        throw err;
      }
    },
    enabled: !!productName.trim() && open,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Automatically select the first suggested category after receiving
  useEffect(() => {
    if (categorySuggestions && categorySuggestions.length > 0 && !selectedCategory) {
      setSelectedCategory(categorySuggestions[0].id);
    }
  }, [categorySuggestions, selectedCategory]);

  // Handle image upload logic when modal opens and mixinProduct has an image
  useEffect(() => {
    const uploadImageToBasalam = async () => {
      setError(null);
      setMessage(null);
      setIsImageUploading(true);
      try {
        if (!basalamCredentials) {
          throw new Error('گواهی باسلام برای آپلود تصویر یافت نشد.');
        }
        // اگر mixinProduct.imageUrl مستقیماً در آبجکت محصول موجود است، از آن استفاده کنید.
        // در غیر این صورت، آن را از API میکسین دریافت کنید.
        let imageUrlToUpload = mixinProduct?.imageUrl;

        if (!imageUrlToUpload && mixinProduct?.id && mixinCredentials) {
          imageUrlToUpload = await mixinApi.getProductImage(mixinCredentials, mixinProduct.id) || undefined;
        }

        if (!imageUrlToUpload) {
          throw new Error('تصویر محصول میکسین برای آپلود یافت نشد. لطفا مطمئن شوید که محصول میکسین دارای تصویر است.');
        }

        // ***** اینجا نقطه حیاتی است: basalamApi.uploadImage باید URL را بپذیرد یا شما باید آن را پیش‌پردازش کنید. *****
        // فرض می‌کنیم basalamApi.uploadImage می‌تواند یک URL را دریافت کند.
        // اگر basalamApi.uploadImage نیاز به فایل باینری دارد، باید یک بک‌اند واسط
        // ایجاد کنید که URL را دریافت کند، تصویر را دانلود کند و سپس به باسلام آپلود کند.
        console.log("در حال تلاش برای آپلود تصویر به باسلام از URL:", imageUrlToUpload);
        const response = await basalamApi.uploadImage(basalamCredentials, imageUrlToUpload);

        setImageId(response.id.toString()); // Use the actual id from the response
        setMessage("عکس با موفقیت آپلود شد.");
      } catch (err: any) {
        console.error("خطا در آپلود عکس به باسلام:", err);
        setError(`خطا در آپلود عکس: ${err.message || 'خطای ناشناخته'}`);
      } finally {
        setIsImageUploading(false);
      }
    };

    if (open && mixinProduct && (mixinProduct.imageUrl || mixinProduct.id) && basalamCredentials && mixinCredentials) {
      uploadImageToBasalam();
    } else if (open && mixinProduct && (!mixinProduct.imageUrl && !mixinProduct.id)) {
      // اگر محصول میکسین نه URL تصویر دارد و نه ID برای دریافت، می‌توانیم پیامی نمایش دهیم
      setError("محصول میکسین تصویر قابل دسترسی برای آپلود ندارد.");
    }
  }, [open, mixinProduct, basalamCredentials, mixinCredentials]);


  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    // Basic validation
    const missingFields = [];
    if (!productName.trim()) missingFields.push("نام محصول");
    if (!selectedCategory) missingFields.push("دسته‌بندی");
    if (!price) missingFields.push("قیمت");
    if (!preparationDays) missingFields.push("تعداد روز آماده‌سازی");
    if (!weight) missingFields.push("وزن محصول");
    if (!packageWeight) missingFields.push("وزن بسته‌بندی");
    if (!stock) missingFields.push("موجودی");
    if (!sku) missingFields.push("کد محصول");
    if (!imageId) missingFields.push("تصویر محصول");

    if (missingFields.length > 0) {
      setError(`لطفاً فیلدهای زیر را پر کنید: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    console.log("Starting product creation with payload preparation...");

    try {
      if (!basalamCredentials) {
        throw new Error('گواهی باسلام برای ایجاد محصول یافت نشد.');
      }

      const payload = {
        name: productName,
        category_id: parseInt(selectedCategory, 10), // Step 3: Fixed field name
        status: status === "active" ? "2976" : "2975", // Basalam status codes: "2976" = active, "2975" = inactive
        primary_price: tomanToRial(parseFloat(price)), // Step 7: Fixed field name
        preparation_days: parseInt(preparationDays, 10), // Step 5: Fixed field name
        weight: parseInt(weight, 10),
        package_weight: parseInt(packageWeight, 10), // Step 6: Fixed field name
        photo: parseInt(imageId, 10), // Step 1: Use imageId as photo
        photos: [parseInt(imageId, 10)], // Step 2: Photos array
        stock: parseInt(stock, 10), // Step 8: Stock field
        brief: mixinProduct?.description || "", // Step 9: Brief field
        description: mixinProduct?.description || "", // Full description
        sku: sku, // SKU field
        video: "", // Required field - empty for now
        keywords: "", // Required field - empty for now
        shipping_city_ids: [], // Required field - empty array for now
        shipping_method_ids: [], // Required field - empty array for now
        wholesale_prices: [], // Required field - empty array for now
        product_attribute: [], // Required field - empty array for now
        virtual: false, // Required field - false for physical products
        variants: [], // Required field - empty array for now
        shipping_data: {}, // Required field - empty object for now
        unit_quantity: 1, // Required field - default to 1
        unit_type: "عدد", // Required field - default unit type
        packaging_dimensions: { width: 0, height: 0, depth: 0 }, // Required field - default dimensions
        is_wholesale: false, // Required field - false by default
        order: 1 // Required field - default order
      };

      console.log("در حال ارسال داده به باسلام برای ایجاد محصول:", payload);
      console.log("Vendor ID:", vendorId);
      console.log("Basalam credentials present:", !!basalamCredentials);
      
      const response = await basalamApi.createProduct(basalamCredentials, vendorId, payload);
      console.log('Basalam product creation response:', response);

      setMessage("محصول با موفقیت در باسلام ثبت شد!");

      // Generate new unique SKU for next product creation
      if (mixinProduct?.name) {
        setSku(generateUniqueSKU(mixinProduct.name, vendorId));
        console.log("Generated new SKU for next product:", generateUniqueSKU(mixinProduct.name, vendorId));
      }

      // Invalidate and refetch Basalam products after successful creation
      await queryClient.invalidateQueries({ queryKey: ['basalamProducts'] });
      await queryClient.refetchQueries({ queryKey: ['basalamProducts'] });

      setTimeout(onClose, 2000); // Close the modal after a short delay
    } catch (err: any) {
      console.error("خطا در ساخت محصول باسلام:", err);
      setError(`خطا در ثبت محصول باسلام: ${err.message || 'خطای ناشناخته'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-sans">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl mx-auto transform transition-all sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">ساخت محصول در باسلام</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="بستن"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-6">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">نام محصول</label>
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: عسل طبیعی"
            />
          </div>

          <div className="flex justify-center md:justify-end mb-4 md:mb-0">
            {isImageUploading ? (
              <div className="flex items-center justify-center w-32 h-32 bg-gray-200 rounded-md">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                <span className="sr-only">در حال بارگذاری عکس...</span>
              </div>
            ) : mixinProduct?.imageUrl ? (
              <img
                src={mixinProduct.imageUrl}
                alt="تصویر محصول"
                className="w-32 h-32 object-cover rounded-md shadow-sm border border-gray-200"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/150x150/CCCCCC/666666?text=No+Image"; }}
              />
            ) : (
              <div className="flex items-center justify-center w-32 h-32 bg-gray-200 text-gray-500 rounded-md border border-gray-300">
                بدون تصویر
              </div>
            )}
          </div>

          <div>
            <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی پیشنهادی</label>
            {areCategoriesLoading ? (
              <div className="text-gray-500 flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>در حال دریافت دسته‌بندی‌ها...</span>
              </div>
            ) : categoryError ? (
              <div className="text-red-500">
                خطا در دریافت دسته‌بندی: {categoryError.message || 'خطای ناشناخته'}
              </div>
            ) : categorySuggestions && categorySuggestions.length > 0 ? (
              <div className="relative">
                <select
                  id="categorySelect"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>انتخاب دسته‌بندی</option>
                  {categorySuggestions.map((cat: {id: string; name: string}) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDown size={16} />
                </div>
              </div>
            ) : (
              <div className="text-gray-500">دسته‌بندی یافت نشد.</div>
            )}
          </div>

          <div>
            <label htmlFor="statusSelect" className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
            <div className="relative">
              <select
                id="statusSelect"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: 120000"
            />
          </div>

          <div>
            <label htmlFor="preparationDays" className="block text-sm font-medium text-gray-700 mb-1">تعداد روز آماده‌سازی</label>
            <input
              id="preparationDays"
              type="number"
              value={preparationDays}
              onChange={(e) => setPreparationDays(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: 3"
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">وزن محصول (گرم)</label>
            <input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: 500"
            />
          </div>

          <div>
            <label htmlFor="packageWeight" className="block text-sm font-medium text-gray-700 mb-1">وزن با بسته‌بندی (گرم)</label>
            <input
              id="packageWeight"
              type="number"
              value={packageWeight}
              onChange={(e) => setPackageWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: 550"
            />
          </div>

          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">موجودی</label>
            <input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: 10"
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">کد محصول (SKU)</label>
            <div className="flex gap-2">
              <input
                id="sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="مثال: PRODUCT-001"
              />
              <button
                type="button"
                onClick={() => setSku(productName ? generateUniqueSKU(productName, vendorId) : "")}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                title="تولید کد جدید"
              >
                🔄
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">کد محصول باید برای هر محصول منحصر به فرد باشد</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">خطا:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">موفقیت:</strong>
            <span className="block sm:inline"> {message}</span>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isImageUploading || areCategoriesLoading}
            className={`px-6 py-2 rounded-lg shadow-md transition duration-300 ${isSubmitting || isImageUploading || areCategoriesLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75'}`}
          >
            {isSubmitting ? "در حال ثبت..." : isImageUploading ? "در حال بارگذاری عکس..." : areCategoriesLoading ? "در حال دریافت دسته‌بندی..." : "ثبت محصول"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [isCreateBasalamModalOpen, setIsCreateBasalamModalOpen] = useState(false);
  const [productToCreateInBasalam, setProductToCreateInBasalam] = useState<MixinProduct | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      if (!window.confirm('Are you sure you want to logout?')) {
        return;
      }

      clearCredentials();
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();
      queryClient.clear();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to logout. Please try again.');
    }
  }

  const { data: userData, isLoading: isUserLoading } = useQuery({
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
    queryFn: async () => {
      if (!userData?.vendor?.id) {
        throw new Error('Vendor ID is required to fetch Basalam products');
      }
      return basalamApi.getProducts(basalamCredentials!, userData.vendor.id);
    },
    enabled: !!userData?.vendor?.id && !!basalamCredentials?.access_token,
    retry: 1,
    staleTime: 30000,
  })

  useEffect(() => {
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

  const getCommonProducts = () => {
    if (!mixinProducts || !basalamProducts) {
      return {
        commonMixinProducts: [],
        commonBasalamProducts: [],
        uniqueMixinProducts: [],
        uniqueBasalamProducts: []
      }
    }

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

  const {
    commonMixinProducts,
    commonBasalamProducts,
    uniqueMixinProducts,
    uniqueBasalamProducts
  } = getCommonProducts()

  useEffect(() => {
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

  const handleOpenCreateBasalamModal = (product: MixinProduct) => {
    setProductToCreateInBasalam(product);
    setIsCreateBasalamModalOpen(true);
  };

  const isLoading = isUserLoading || isMixinLoading || isBasalamLoading

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

            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
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
                  به سایت میکسین سلام خیلی خوش آمدید
                </h1>
                <p className="text-gray-600">سپاس بابت اینکه ما را انتخاب کردید</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-[#ffa454] to-[#ffa454] bg-clip-text text-transparent">
                محصولات مشترک در باسلام و میکسین
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-[#ff9233] to-[#ffa454] bg-clip-text text-transparent">
              محصولات غیرمشترک در باسلام و میکسین
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          onOpenCreateBasalamModal={handleOpenCreateBasalamModal}
        />

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

        {isCreateBasalamModalOpen && productToCreateInBasalam && userData?.vendor?.id && (
          <CreateBasalamProductModal
            open={isCreateBasalamModalOpen}
            onClose={() => setIsCreateBasalamModalOpen(false)}
            mixinProduct={productToCreateInBasalam}
            queryClient={queryClient} // Pass queryClient here
            vendorId={userData.vendor.id}
          />
        )}
      </div>
    </div>
  )
}

export default HomePage
