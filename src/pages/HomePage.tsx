import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { mixinApi } from "../services/api/mixin";
import { basalamApi } from "../services/api/basalam";
import { BASE_URL } from "../services/api/config";
import {
  X,
  ChevronDown,
  Loader2,
  Package,
  Menu,
  Home,
  Settings,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Crown,
  FolderSync,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MixinProduct, BasalamProduct } from "../types";
import { incrementUsage } from "../services/api/pricing";
import { QuotaExceededModal } from "../components/QuotaExceededModal";
import LogBanner from "../components/LogBanner";
import { useProductsStore } from "../store/productsStore";
import { useGlobalUiStore } from "../store/globalUiStore";
import HomePageTour from "../components/tour/HomePageTour";

// Utility function to convert Toman to Rial
const tomanToRial = (toman: number): number => {
  return toman * 10;
};

// Utility function to generate unique SKU
const generateUniqueSKU = (productName: string, vendorId?: number): string => {
  // Create a base from product name (first 10 chars, alphanumeric only)
  const nameBase = productName
    .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "") // Keep only alphanumeric and Persian chars
    .substring(0, 10)
    .toUpperCase();

  // Add vendor ID if available (helps with uniqueness across vendors)
  const vendorPart = vendorId ? `V${vendorId}` : "VENDOR";

  // Add timestamp-based unique identifier
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  // Format: NAMEBASE-V{VENDOR_ID}-{TIMESTAMP_LAST_6}{RANDOM_3}
  const uniquePart = `${timestamp.toString().slice(-6)}${randomNum}`;

  return `${nameBase}-${vendorPart}-${uniquePart}`;
};



// Utility function to get unit quantity based on unit type ID
const getUnitQuantity = (unitTypeId: number): number => {
  const unitTypeMap: { [key: number]: number } = {
    6375: 10, // مترمربع
    6374: 100, // میلی‌متر
    6373: 1, // جلد
    6332: 30, // فوت
    6331: 10, // اینچ
    6330: 1, // سیر
    6329: 10, // اصله
    6328: 5, // کلاف
    6327: 1, // قالب
    6326: 2, // شاخه
    6325: 1, // بوته
    6324: 2, // دست
    6323: 1, // بطری
    6322: 1, // تخته
    6321: 1, // کارتن
    6320: 1, // توپ
    6319: 1, // بسته
    6318: 2, // جفت
    6317: 2, // جین
    6316: 1, // طاقه
    6315: 1, // قواره
    6314: 10, // انس
    6313: 100, // سی‌سی
    6312: 100, // میلی‌لیتر
    6311: 1, // لیتر
    6310: 1, // تکه (اسلایس)
    6309: 2, // مثقال
    6308: 10, // سانتی‌متر
    6307: 10, // متر
    6306: 10, // گرم
    6305: 500, // کیلو‌گرم
    6304: 1, // عددی
    6392: 1, // رول
    6438: 1, // سوت
    6466: 1, // قیراط
  };

  return unitTypeMap[unitTypeId] || 1; // Default to 1 if not found
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MixinProduct | BasalamProduct | null;
  type: "mixin" | "basalam";
  mixinProducts: MixinProduct[] | undefined;
  basalamProducts: BasalamProduct[] | undefined;
  globalMixinProducts: MixinProduct[];
  globalBasalamProducts: BasalamProduct[];
  onOpenCreateBasalamModal: (product: MixinProduct) => void;
  setQuotaErrorModal: (modal: {
    isOpen: boolean;
    type: "migration" | "realtime";
  }) => void;
}

function isMixinProduct(product: any): product is MixinProduct {
  return "name" in product;
}

function isBasalamProduct(product: any): product is BasalamProduct {
  return "title" in product;
}

const rialToToman = (price: number): number => {
  return Math.floor(price / 10);
};

const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) {
    return "قیمت نامشخص";
  }
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function ProductModal({
  isOpen,
  onClose,
  product,
  type,
  mixinProducts,
  basalamProducts,
  globalMixinProducts,
  globalBasalamProducts,
  onOpenCreateBasalamModal,
  setQuotaErrorModal: _setQuotaErrorModal,
}: ProductModalProps) {
  const [checkMessage, setCheckMessage] = useState<{
    text: string;
    isSuccess: boolean;
  } | null>(null);
  const [editMessage, setEditMessage] = useState<{
    text: string;
    isSuccess: boolean;
  } | null>(null);
  const logs = useGlobalUiStore((s: any) => s.logs);
  const storeAppendLog = useGlobalUiStore((s: any) => s.appendLog);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const [showMixinButton, setShowMixinButton] = useState(false);
  const [showBasalamButton, setShowBasalamButton] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [autoSyncTimeout, setAutoSyncTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [editedProduct, setEditedProduct] = useState<{
    name: string;
    price: number;
    description: string;
    weight: number;
    stock: number;
  }>({
    name: "",
    price: 0,
    description: "",
    weight: 0,
    stock: 1,
  });
  const { mixinCredentials, basalamCredentials, settings } = useAuthStore();
  const queryClient = useQueryClient();

  // --- Multi-image state for Mixin products ---
  const [mixinProductImages, setMixinProductImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch all images for Mixin product on open
  useEffect(() => {
    const fetchImages = async () => {
      if (
        isOpen &&
        product &&
        type === "mixin" &&
        isMixinProduct(product) &&
        mixinCredentials
      ) {
        const images = await mixinApi.getProductImages(
          mixinCredentials,
          product.id,
        );
        setMixinProductImages(images);
        setCurrentImageIndex(0);
        setProductImage(images[0] || null);
      } else if (
        isOpen &&
        product &&
        type === "basalam" &&
        isBasalamProduct(product)
      ) {
        // Collect all image URLs for Basalam product
        const images: string[] = [];
        if (product.photo && (product.photo.md || product.photo.original)) {
          images.push(product.photo.md || product.photo.original);
        }
        if (Array.isArray(product.photos)) {
          for (const p of product.photos) {
            if (p && (p.md || p.original)) {
              const url = p.md || p.original;
              // Avoid duplicate of main photo
              if (!images.includes(url)) images.push(url);
            }
          }
        }
        setMixinProductImages(images);
        setCurrentImageIndex(0);
        setProductImage(images[0] || null);
      }
    };
    fetchImages();
  }, [isOpen, product, type, mixinCredentials]);

  useEffect(() => {
    const fetchProductImage = async () => {
      if (isOpen && product) {
        if (type === "mixin" && isMixinProduct(product) && mixinCredentials) {
          const imageUrl = await mixinApi.getProductImage(
            mixinCredentials,
            product.id,
          );
          setProductImage(imageUrl);
        } else if (type === "basalam" && isBasalamProduct(product)) {
          setProductImage(product.photo.md);
        }
      }
    };
    fetchProductImage();
  }, [isOpen, product, type, mixinCredentials]);

  useEffect(() => {
    if (isOpen && product) {
      const fetchFullProductDetails = async () => {
        if (type === "mixin" && isMixinProduct(product) && mixinCredentials) {
          const fullProduct = await mixinApi.getProductById(
            mixinCredentials,
            product.id,
          );

          if (fullProduct) {
            setEditedProduct({
              name: cleanHtmlText(fullProduct.name),
              price: fullProduct.price,
              description: cleanHtmlText(fullProduct.description || ""),
              weight: fullProduct.weight || 0,
              stock: fullProduct.stock !== undefined ? fullProduct.stock : 1,
            });
          }
        } else if (
          type === "basalam" &&
          isBasalamProduct(product) &&
          basalamCredentials
        ) {
          const fullProduct = await basalamApi.getProductById(
            basalamCredentials,
            product.id,
          );

          if (fullProduct) {
            setEditedProduct({
              name: cleanHtmlText(product.title),
              price: rialToToman(product.price),
              description: cleanHtmlText(fullProduct.description || ""),
              weight: fullProduct.net_weight || 0,
              stock:
                fullProduct.inventory !== undefined ? fullProduct.inventory : 1,
            });
          }
        }
      };
      fetchFullProductDetails();
    }
  }, [isOpen, product, type, mixinCredentials, basalamCredentials]);

  useEffect(() => {
    if (isOpen && product) {
      handleCheck().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, type]);

  // Auto-sync effect
  useEffect(() => {
    // Only trigger auto-sync when:
    // 1. Auto-sync is enabled in settings
    // 2. Sync button is showing (meaning there's a price, description, stock, or weight mismatch)
    // 3. We have a product and both credentials
    if (
      settings.autoSyncEnabled &&
      showSyncButton &&
      product &&
      mixinCredentials &&
      basalamCredentials
    ) {
      // Set a timeout for 1 second
      const timeout = setTimeout(() => {
        handleEdit(); // This is the same function that manual sync button calls
      }, 1000);

      setAutoSyncTimeout(timeout);

      // Cleanup timeout on unmount or when dependencies change
      return () => {
        clearTimeout(timeout);
        setAutoSyncTimeout(null);
      };
    } else {
      // Clear any existing timeout if conditions are not met
      if (autoSyncTimeout) {
        clearTimeout(autoSyncTimeout);
        setAutoSyncTimeout(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.autoSyncEnabled,
    showSyncButton,
    product,
    mixinCredentials,
    basalamCredentials,
  ]);

  // Cleanup timeout when modal closes
  useEffect(() => {
    if (!isOpen && autoSyncTimeout) {
      clearTimeout(autoSyncTimeout);
      setAutoSyncTimeout(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleInputChange = (
    field: "name" | "price" | "description" | "weight" | "stock",
    value: string | number,
  ) => {
    setEditedProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheck = async () => {
    let currentProductName = "";
    let changecard = "";
    let priceMismatch = false;
    let descriptionMismatch = false;
    let stockMismatch = false;
    let weightMismatch = false;

    // Use the same logic as getCommonProducts to get the correct product arrays
    const mixinSource =
      globalMixinProducts && globalMixinProducts.length > 0
        ? globalMixinProducts
        : Array.isArray(mixinProducts)
          ? mixinProducts
          : (mixinProducts as any)?.data || [];
    const basalamSource =
      globalBasalamProducts && globalBasalamProducts.length > 0
        ? globalBasalamProducts
        : Array.isArray(basalamProducts)
          ? basalamProducts
          : (basalamProducts as any)?.data || [];

    // Enhanced normalization function to handle Unicode characters, special cases, and Persian/English numbers
    const normalize = (s: string | undefined) => {
      if (!s) return "";

      return (
        s
          .trim()
          .toLowerCase()
          // Remove zero-width characters
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          // Convert Persian numbers to English numbers
          .replace(/[۰-۹]/g, (match) => {
            const persianToEnglish: { [key: string]: string } = {
              "۰": "0",
              "۱": "1",
              "۲": "2",
              "۳": "3",
              "۴": "4",
              "۵": "5",
              "۶": "6",
              "۷": "7",
              "۸": "8",
              "۹": "9",
            };
            return persianToEnglish[match] || match;
          })
          // Convert Arabic-Indic numbers to English numbers (if any)
          .replace(/[٠-٩]/g, (match) => {
            const arabicToEnglish: { [key: string]: string } = {
              "٠": "0",
              "١": "1",
              "٢": "2",
              "٣": "3",
              "٤": "4",
              "٥": "5",
              "٦": "6",
              "٧": "7",
              "٨": "8",
              "٩": "9",
            };
            return arabicToEnglish[match] || match;
          })
          // Normalize different types of spaces
          .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
          // Normalize different types of dots
          .replace(/[.\u2024\u2025\u2026\u002E]/g, ".")
          // Normalize different types of dashes
          .replace(/[-\u2010-\u2015\u2212]/g, "-")
          // Normalize multiplication sign (×) - handle different Unicode variants
          .replace(/[×\u00D7\u2715\u2716]/g, "×")
          // Remove extra spaces
          .replace(/\s+/g, " ")
          .trim()
      );
    };
    const normalizeDescription = (s: string | undefined) =>
      cleanHtmlText(s || "").trim();

    if (type === "mixin" && isMixinProduct(product)) {
      currentProductName = product.name;
      const matchingBasalamProduct = basalamSource.find(
        (basalamProduct: BasalamProduct) =>
          basalamProduct?.title &&
          normalize(basalamProduct.title) === normalize(currentProductName),
      );

      if (matchingBasalamProduct) {
        // Check price mismatch
        if (rialToToman(matchingBasalamProduct.price) !== product.price) {
          priceMismatch = true;
        }

        // Fetch full product details for accurate description comparison
        let fullMixinProduct = product;
        let fullBasalamProduct = matchingBasalamProduct;

        try {
          if (mixinCredentials) {
            const fullMixin = await mixinApi.getProductById(
              mixinCredentials,
              product.id,
            );
            if (fullMixin) fullMixinProduct = fullMixin;
          }
        } catch (e) {
          console.warn("Failed to fetch full Mixin product for comparison:", e);
        }

        try {
          if (basalamCredentials) {
            const fullBasalam = await basalamApi.getProductById(
              basalamCredentials,
              matchingBasalamProduct.id,
            );
            if (fullBasalam) fullBasalamProduct = fullBasalam;
          }
        } catch (e) {
          console.warn(
            "Failed to fetch full Basalam product for comparison:",
            e,
          );
        }

        // Check description mismatch using full product details
        const mixinDescription = normalizeDescription(
          fullMixinProduct.description,
        );
        const basalamDescription = normalizeDescription(
          fullBasalamProduct.description,
        );

        if (mixinDescription !== basalamDescription) {
          descriptionMismatch = true;
        }

        // Check stock mismatch using full product details
        const mixinStock = fullMixinProduct.stock || 0;
        const basalamStock = fullBasalamProduct.inventory || 0;

        if (mixinStock !== basalamStock) {
          stockMismatch = true;
        }

        // weight comparison intentionally ignored for sync decision per requirements

        if (priceMismatch || descriptionMismatch || stockMismatch) {
          const mismatchTypes = [];
          if (priceMismatch) mismatchTypes.push("قیمت");
          if (descriptionMismatch) mismatchTypes.push("توضیحات");
          if (stockMismatch) mismatchTypes.push("موجودی");

          setCheckMessage({
            text: `${mismatchTypes.join(" و ")} محصول شما تغییر کرده، ${mismatchTypes.join(" و ")} محصول دیگر را همگام سازی کنید`,
            isSuccess: false,
          });
        } else {
          setCheckMessage({
            text: "محصول شما هم در باسلام و هم در میکسین وحود دارد",
            isSuccess: true,
          });
        }
        changecard = "mixin,basalam";
        setShowBasalamButton(false);
      } else {
        setCheckMessage({
          text: "این محصول شما در باسلام ساخته نشده است، لطفاً  ابتدا آنرا در باسلام بسازید",
          isSuccess: false,
        });
        changecard = "mixin";
        setShowBasalamButton(true);
      }
      setShowMixinButton(false);
    } else if (type === "basalam" && isBasalamProduct(product)) {
      currentProductName = product.title;
      const matchingMixinProduct = mixinSource.find(
        (mixinProduct: MixinProduct) =>
          mixinProduct?.name &&
          normalize(mixinProduct.name) === normalize(currentProductName),
      );

      if (matchingMixinProduct) {
        // Check price mismatch
        if (matchingMixinProduct.price !== rialToToman(product.price)) {
          priceMismatch = true;
        }

        // Fetch full product details for accurate description comparison
        let fullMixinProduct = matchingMixinProduct;
        let fullBasalamProduct = product;

        try {
          if (mixinCredentials) {
            const fullMixin = await mixinApi.getProductById(
              mixinCredentials,
              matchingMixinProduct.id,
            );
            if (fullMixin) fullMixinProduct = fullMixin;
          }
        } catch (e) {
          console.warn("Failed to fetch full Mixin product for comparison:", e);
        }

        try {
          if (basalamCredentials) {
            const fullBasalam = await basalamApi.getProductById(
              basalamCredentials,
              product.id,
            );
            if (fullBasalam) fullBasalamProduct = fullBasalam;
          }
        } catch (e) {
          console.warn(
            "Failed to fetch full Basalam product for comparison:",
            e,
          );
        }

        // Check description mismatch using full product details
        const mixinDescription = normalizeDescription(
          fullMixinProduct.description,
        );
        const basalamDescription = normalizeDescription(
          fullBasalamProduct.description,
        );

        if (mixinDescription !== basalamDescription) {
          descriptionMismatch = true;
        }

        // Check stock mismatch using full product details
        const mixinStock = fullMixinProduct.stock || 0;
        const basalamStock = fullBasalamProduct.inventory || 0;

        if (mixinStock !== basalamStock) {
          stockMismatch = true;
        }

        // Check weight mismatch using full product details
        const mixinWeight = fullMixinProduct.weight || 0;
        const basalamWeight = fullBasalamProduct.net_weight || 0;

        if (mixinWeight !== basalamWeight) {
          weightMismatch = true;
        }

        if (
          priceMismatch ||
          descriptionMismatch ||
          stockMismatch ||
          weightMismatch
        ) {
          const mismatchTypes = [];
          if (priceMismatch) mismatchTypes.push("قیمت");
          if (descriptionMismatch) mismatchTypes.push("توضیحات");
          if (stockMismatch) mismatchTypes.push("موجودی");
          if (weightMismatch) mismatchTypes.push("وزن");

          setCheckMessage({
            text: `${mismatchTypes.join(" و ")} محصول شما تغییر کرده، ${mismatchTypes.join(" و ")} محصول دیگر را همگام سازی کنید`,
            isSuccess: false,
          });
        } else {
          setCheckMessage({
            text: "محصول شما هم در باسلام و هم در میکسین وحود دارد",
            isSuccess: true,
          });
        }
        changecard = "mixin,basalam";
        setShowMixinButton(false);
      } else {
        setCheckMessage({
          text: "این محصول شما در میکسین ساخته نشده است، لطفاً  ابتدا آنرا در میکسین بسازید",
          isSuccess: false,
        });
        changecard = "basalam";
        setShowMixinButton(true);
      }
      setShowBasalamButton(false);
    }

    setShowSyncButton(priceMismatch || descriptionMismatch || stockMismatch);
    localStorage.setItem("changecard", changecard);
  };

  const handleEdit = async () => {
    try {
      // Ensure credentials are available before proceeding
      if (!mixinCredentials || !basalamCredentials) {
        setEditMessage({
          text: "لطفاً ابتدا به میکسین و باسلام متصل شوید",
          isSuccess: false,
        });
        return;
      }

      setIsEditing(true);

      // Validation for stock field
      if (editedProduct.stock < 0) {
        setEditMessage({
          text: "تعداد محصول نمی تواند  کمتر از صفر باشد",
          isSuccess: false,
        });
      }

      // Determine direction according to user preference in settings
      let changecard = localStorage.getItem("changecard") || "";
      try {
        if (settings?.preferBasalamFromMixin) {
          changecard = "basalam";
        } else if (settings?.preferMixinFromBasalam) {
          changecard = "mixin";
        }
      } catch {}
      const productId = product?.id;

      if (!productId) {
        throw new Error("Product ID not found");
      }

      // increment realtime will be called only after successful update

      let mixinProductId = productId;
      let basalamProductId = productId;

      // Use global arrays when available to match across all pages
      const mixinSource: MixinProduct[] =
        globalMixinProducts && globalMixinProducts.length > 0
          ? globalMixinProducts
          : Array.isArray(mixinProducts)
            ? mixinProducts
            : (mixinProducts as any)?.data || [];
      const basalamSource: BasalamProduct[] =
        globalBasalamProducts && globalBasalamProducts.length > 0
          ? globalBasalamProducts
          : Array.isArray(basalamProducts)
            ? basalamProducts
            : (basalamProducts as any)?.data || [];
      const normalize = (s: string | undefined) =>
        (s || "").trim().toLowerCase();

      if (type === "mixin") {
        const originalMixinProduct = await mixinApi.getProductById(
          mixinCredentials!,
          productId,
        );
        if (originalMixinProduct) {
          const match = basalamSource.find(
            (p) =>
              p?.title &&
              normalize(p.title) === normalize(originalMixinProduct.name),
          );
          if (match) {
            basalamProductId = match.id;
          }
        }
      } else if (type === "basalam") {
        const originalBasalamProduct = await basalamApi.getProductById(
          basalamCredentials!,
          productId,
        );
        if (originalBasalamProduct) {
          const match = mixinSource.find(
            (p) =>
              p?.name &&
              normalize(p.name) === normalize(originalBasalamProduct.title),
          );
          if (match) {
            mixinProductId = match.id;
          }
        }
      }

      if (changecard.includes("mixin") && mixinCredentials) {
        const originalProduct = await mixinApi.getProductById(
          mixinCredentials,
          mixinProductId,
        );
        if (!originalProduct) {
          throw new Error("Could not fetch original Mixin product data");
        }

        const mixinProductData = {
          ...originalProduct,
          name: editedProduct.name,
          price: Number(editedProduct.price),
          description: editedProduct.description || "",
          weight:
            Number(editedProduct.weight) > 0
              ? Number(editedProduct.weight)
              : 500,
          stock: Number(editedProduct.stock),
          extra_fields: [],
        };

        try {
          const mixinResponse = await mixinApi.updateProduct(
            mixinCredentials,
            mixinProductId,
            mixinProductData,
          );
          console.log("Mixin update response:", mixinResponse);
          // increment realtime only when update is successful
          try {
            await incrementUsage("realtime");
          } catch {}
        } catch (error: any) {
          const status = error?.response?.status || error?.status;
          if (status === 404) {
            const title = editedProduct.name;
            const key = `mixin:${mixinProductId}`;
            useGlobalUiStore.getState().register404(key, mixinProductId, title);
            storeAppendLog({
              id: `${Date.now()}-${Math.random()}`,
              platform: "mixin",
              productId: mixinProductId,
              title,
              status: "یافت نشد",
              message: `در هنگام به‌روزرسانی محصول، میکسین درخواست را رد کرد. لطفاً در پلتفرم میکسین بررسی کنید.`,
              url: "https://mixin.ir/",
              ts: Date.now(),
            });
          }
          throw error;
        }
      }

      if (changecard.includes("basalam") && basalamCredentials) {
        console.log("Updating Basalam product...");
        const basalamProductData = {
          name: editedProduct.name,
          price: tomanToRial(editedProduct.price),
          description: editedProduct.description,
          stock: Number(editedProduct.stock), // stock
          weight:
            Number(editedProduct.weight) > 0
              ? Number(editedProduct.weight)
              : 500, // weight
        };
        try {
          console.log("Sending Basalam update request with data:", {
            productId: basalamProductId,
            data: basalamProductData,
            descriptionLength: editedProduct.description.length,
            descriptionPreview:
              editedProduct.description.substring(0, 100) + "...",
            fullDescription: editedProduct.description,
          });
          try {
            const basalamResponse = await basalamApi.updateProduct(
              basalamCredentials,
              basalamProductId,
              basalamProductData,
            );
            console.log("Basalam update response:", basalamResponse);
            // increment realtime only when update is successful
            try {
              await incrementUsage("realtime");
            } catch {}
          } catch (err: any) {
            const status = err?.response?.status || err?.status;
            if (status === 404) {
              const title = editedProduct.name;
              const key = `basalam:${basalamProductId}`;
              useGlobalUiStore
                .getState()
                .register404(key, basalamProductId, title);
              storeAppendLog({
                id: `${Date.now()}-${Math.random()}`,
                platform: "basalam",
                productId: basalamProductId,
                title,
                status: "یافت نشد",
                message: `در هنگام به‌روزرسانی محصول، باسلام درخواست را رد کرد. لطفاً در پلتفرم باسلام بررسی کنید.`,
                url: "https://basalam.com/",
                ts: Date.now(),
              });
            }
            throw err;
          }
          // Verify the update by fetching the updated product
          console.log("Verifying Basalam product update...");
          const updatedBasalamProduct = await basalamApi.getProductById(
            basalamCredentials,
            basalamProductId,
          );
          console.log("Updated Basalam product description:", {
            originalLength: editedProduct.description.length,
            updatedLength: updatedBasalamProduct?.description?.length || 0,
            updatedDescription:
              updatedBasalamProduct?.description?.substring(0, 100) + "...",
          });
        } catch (error) {
          console.error("Error updating Basalam product:", error);
        }
      }

      setEditMessage({
        text: "محصول شما با موفقیت به‌روز شد",
        isSuccess: true,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mixinProducts"] }),
        queryClient.invalidateQueries({ queryKey: ["basalamProducts"] }),
      ]);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["mixinProducts"] }),
        queryClient.refetchQueries({ queryKey: ["basalamProducts"] }),
      ]);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating product:", error);
      setEditMessage({
        text:
          error instanceof Error
            ? error.message
            : "Failed to update product. Please try again.",
        isSuccess: false,
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleMixinNavigation = () => {
    window.open("https://mixin.ir/", "_blank");
  };

  const handleBasalamAction = () => {
    if (type === "mixin" && isMixinProduct(product) && showBasalamButton) {
      // Always pass the full product object (with id) so the create modal can fetch all images
      onOpenCreateBasalamModal(product);
      onClose();
    } else {
      window.open("https://basalam.com/", "_blank");
    }
  };

  // --- Multi-image navigation handlers ---
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      mixinProductImages.length > 0
        ? (prev - 1 + mixinProductImages.length) % mixinProductImages.length
        : 0,
    );
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      mixinProductImages.length > 0
        ? (prev + 1) % mixinProductImages.length
        : 0,
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {isEditing && <LoadingModal />}
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-semibold">جزئیات محصول</h2>
        </div>

        <div className="mb-6">
          <div className="w-full min-h-[200px] bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-4">
            {mixinProductImages.length > 0 ? (
              <div className="flex flex-col items-center w-full">
                <img
                  src={mixinProductImages[currentImageIndex]}
                  alt={cleanHtmlText(
                    isMixinProduct(product) ? product.name : product.title,
                  )}
                  className="max-w-full max-h-[300px] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error("Error loading image:", e);
                  }}
                />
                {mixinProductImages.length > 1 && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handlePrevImage}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      قبلی
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentImageIndex + 1} / {mixinProductImages.length}
                    </span>
                    <button
                      onClick={handleNextImage}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </div>
            ) : productImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={productImage}
                  alt={cleanHtmlText(
                    isMixinProduct(product) ? product.name : product.title,
                  )}
                  className="max-w-full max-h-[300px] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error("Error loading image:", e);
                    setProductImage(null);
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

        <div className="space-y-4" id="product-modal-fields">
          <div dir="rtl">
            <label className="font-medium text-lg text-right block">
              نام محصول:
            </label>
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
          <div dir="rtl">
            <label className="font-medium text-lg text-right block">
              قیمت:
            </label>
            <div className="relative">
              <input
                type="number"
                value={editedProduct.price}
                onChange={(e) =>
                  handleInputChange("price", parseFloat(e.target.value) || 0)
                }
                className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                dir="rtl"
              />
              <p className="text-sm text-gray-500 mt-1 text-right">
                {formatPrice(editedProduct.price)} تومان
              </p>
            </div>
          </div>
          <div dir="rtl">
            <label className="font-medium text-lg text-right block">
              توضیحات:
            </label>
            <textarea
              value={editedProduct.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
            />
          </div>
          <div dir="rtl">
            <label className="font-medium text-lg text-right block">
              وزن محصول (گرم):
            </label>
            <input
              type="number"
              value={editedProduct.weight}
              onChange={(e) =>
                handleInputChange("weight", Number(e.target.value))
              }
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
              min={0}
            />
          </div>
          <div dir="rtl">
            <label className="font-medium text-lg text-right block">
              موجودی محصول:
            </label>
            <input
              type="number"
              value={editedProduct.stock}
              onChange={(e) =>
                handleInputChange("stock", Number(e.target.value))
              }
              className="mt-2 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              dir="rtl"
              min={0}
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-end gap-4">
          <div
            className="flex gap-4 w-full justify-end"
            id="product-modal-update-button"
          >
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
              <p
                className={`text-sm ${checkMessage.isSuccess ? "text-green-600" : "text-red-600"}`}
              >
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
                  <span>
                    {type === "mixin" &&
                    isMixinProduct(product) &&
                    showBasalamButton
                      ? "ایجاد در باسلام"
                      : "برو به باسلام"}
                  </span>
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
          {/* Log banner */}
          <LogBanner
            logs={logs}
            onOpenLink={(e) => {
              if (e.url) window.open(e.url, "_blank");
            }}
          />
          {editMessage && (
            <p
              className={`text-sm ${editMessage.isSuccess ? "text-green-600" : "text-red-600"}`}
            >
              {editMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <div className="w-16 h-16 border-4 border-[#5b9fdb]/20 rounded-full animate-spin border-t-[#5b9fdb]"></div>
        <h3 className="text-xl font-semibold text-gray-800">
          در حال بارگذاری...
        </h3>
        <p className="text-gray-600 text-center">
          لطفا صبر کنید تا اطلاعات محصولات بارگذاری شود
        </p>
      </div>
    </div>
  );
}

interface CreateBasalamProductModalProps {
  open: boolean;
  onClose: () => void;
  mixinProduct: MixinProduct | null;
  queryClient: any; // Add queryClient to props
  vendorId: number;
}

function CreateBasalamProductModal({
  open,
  onClose,
  mixinProduct,
  queryClient,
  vendorId,
}: CreateBasalamProductModalProps) {
  const [productName, setProductName] = useState(mixinProduct?.name || "");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [price, setPrice] = useState(
    mixinProduct?.price ? mixinProduct.price.toString() : "",
  );
  const [preparationDays, setPreparationDays] = useState("");
  const [weight, setWeight] = useState(
    mixinProduct?.weight ? mixinProduct.weight.toString() : "",
  );
  const [packageWeight, setPackageWeight] = useState("");
  const [stock, setStock] = useState("1"); // Default to 1
  const [sku, setSku] = useState(""); // SKU field
  const [mixinImageUrls, setMixinImageUrls] = useState<string[]>([]); // All mixin image URLs
  const [uploadedImageIds, setUploadedImageIds] = useState<number[]>([]); // All uploaded Basalam image IDs
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
      setSku(
        mixinProduct?.name
          ? generateUniqueSKU(mixinProduct.name, vendorId)
          : "",
      ); // Auto-generate unique SKU
      setSelectedCategory(""); // Clear selected category
      setMixinImageUrls([]);
      setUploadedImageIds([]);
      setError(null);
      setMessage(null);
      setIsSubmitting(false);
      setIsImageUploading(false);
    }
  }, [open, mixinProduct]);

  // Fetch category suggestions based on product name
  const {
    data: categorySuggestions,
    isLoading: areCategoriesLoading,
    error: categoryError,
  } = useQuery({
    queryKey: ["basalamCategorySuggestions", productName],
    queryFn: async () => {
      if (!productName.trim()) return [];
      try {
        const response = await fetch(
          `${BASE_URL}/products/category-detection/?title=${encodeURIComponent(productName)}`,
        );
        if (!response.ok) {
          throw new Error(`خطا در دریافت دسته‌بندی‌ها: ${response.statusText}`);
        }
        const data = await response.json();
        // Transform the response structure to match UI expectations
        return (data.result || []).map((cat: any) => ({
          id: cat.cat_id.toString(),
          name: cat.cat_title,
        }));
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
    if (
      categorySuggestions &&
      categorySuggestions.length > 0 &&
      !selectedCategory
    ) {
      setSelectedCategory(categorySuggestions[0].id);
    }
  }, [categorySuggestions, selectedCategory]);

  // Handle image fetch and upload logic when modal opens
  useEffect(() => {
    const fetchAndUploadAllImages = async () => {
      setError(null);
      setMessage(null);
      setIsImageUploading(true);
      try {
        if (!basalamCredentials) {
          throw new Error("گواهی باسلام برای آپلود تصویر یافت نشد.");
        }
        // جمع‌آوری همه URL های تصاویر میکسین
        let urls: string[] = [];
        if (mixinProduct?.id && mixinCredentials) {
          urls = await mixinApi.getProductImages(
            mixinCredentials,
            mixinProduct.id,
          );
        } else if (mixinProduct?.imageUrl) {
          urls = [mixinProduct.imageUrl];
        }

        if (!urls || urls.length === 0) {
          throw new Error("هیچ تصویری برای محصول میکسین یافت نشد.");
        }

        setMixinImageUrls(urls);

        // آپلود همه تصاویر به باسلام (به ترتیب)
        const ids: number[] = [];
        for (const u of urls) {
          console.log("Uploading image to Basalam via sync-image:", u);
          const up = await basalamApi.uploadImage(basalamCredentials, u);
          if (up?.id) ids.push(Number(up.id));
        }
        if (ids.length === 0) {
          throw new Error("آپلود تصاویر به باسلام ناموفق بود.");
        }
        setUploadedImageIds(ids);
        setMessage("همه تصاویر با موفقیت آپلود شدند.");
      } catch (err: any) {
        console.error("خطا در آپلود عکس به باسلام:", err);
        setError(`خطا در آپلود عکس: ${err.message || "خطای ناشناخته"}`);
      } finally {
        setIsImageUploading(false);
      }
    };

    if (
      open &&
      mixinProduct &&
      (mixinProduct.imageUrl || mixinProduct.id) &&
      basalamCredentials &&
      mixinCredentials
    ) {
      fetchAndUploadAllImages();
    } else if (
      open &&
      mixinProduct &&
      !mixinProduct.imageUrl &&
      !mixinProduct.id
    ) {
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
    if (!uploadedImageIds.length) missingFields.push("تصاویر محصول");

    if (missingFields.length > 0) {
      setError(`لطفاً فیلدهای زیر را پر کنید: ${missingFields.join(", ")}`);
      setIsSubmitting(false);
      return;
    }

    console.log("Starting product creation with payload preparation...");

    try {
      if (!basalamCredentials) {
        throw new Error("گواهی باسلام برای ایجاد محصول یافت نشد.");
      }

      // Fetch unit type for the selected category
      let unitTypeId: number | null = null;
      let unitQuantity: number = 1;

      try {
        const unitTypeResponse = await basalamApi.getCategoryUnitType(
          basalamCredentials,
          parseInt(selectedCategory, 10),
        );
        if (unitTypeResponse?.unit_type?.id) {
          unitTypeId = unitTypeResponse.unit_type.id;
          unitQuantity = getUnitQuantity(unitTypeId);
        }
      } catch (error) {
        console.warn("Failed to fetch unit type for category:", error);
      }

      // Determine final description with fallback: description -> seo_description -> default
      let finalDescription = cleanHtmlText(
        (mixinProduct?.description || "").trim(),
      );
      if (!finalDescription) {
        try {
          if (mixinCredentials && mixinProduct?.id) {
            const full = await mixinApi.getProductById(
              mixinCredentials,
              mixinProduct.id,
            );
            finalDescription =
              cleanHtmlText((full as any)?.seo_description || "") ||
              "بدون توضیحات";
          } else {
            finalDescription = "بدون توضیحات";
          }
        } catch {
          finalDescription = "بدون توضیحات";
        }
      }

      // Build brief with same fallback to keep UI consistent
      const initialBrief = cleanHtmlText(mixinProduct?.description || "");
      const finalBrief = initialBrief || finalDescription;

      const payload = {
        name: productName,
        category_id: parseInt(selectedCategory, 10), // Step 3: Fixed field name
        status: status === "active" ? "2976" : "2975", // Basalam status codes: "2976" = active, "2975" = inactive
        primary_price: tomanToRial(parseFloat(price)), // Step 7: Fixed field name
        preparation_days: parseInt(preparationDays, 10), // Step 5: Fixed field name
        weight: (() => {
          const w = parseInt(weight, 10);
          return Number.isFinite(w) && w > 0 ? w : 500;
        })(),
        package_weight: (() => {
          const pw = parseInt(packageWeight, 10);
          return Number.isFinite(pw) && pw > 0 ? pw : 500;
        })(), // Step 6: Fixed field name
        photo: uploadedImageIds[0], // اولین تصویر به عنوان عکس اصلی
        photos: uploadedImageIds.length > 1 ? uploadedImageIds.slice(1) : [], // سایر تصاویر
        stock: parseInt(stock, 10), // Step 8: Stock field
        brief: finalBrief, // Keep brief in sync with description fallback
        description: finalDescription, // Full description with fallback to SEO or default
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
        // Unit type and quantity - only include if we have unit type data
        ...(unitTypeId
          ? {
              unit_quantity: unitQuantity,
              unit_type: unitTypeId,
            }
          : {
              unit_quantity: 1,
              unit_type: 6304, // Default to "عددی" if no unit type found
            }),
        // If available, include packaging dimensions from Mixin details
        packaging_dimensions: ((): {
          height: number;
          length: number;
          width: number;
        } => {
          const h =
            (mixinProduct as any)?.height != null
              ? Number((mixinProduct as any).height)
              : undefined;
          const l =
            (mixinProduct as any)?.length != null
              ? Number((mixinProduct as any).length)
              : undefined;
          const w =
            (mixinProduct as any)?.width != null
              ? Number((mixinProduct as any).width)
              : undefined;
          if ((h && h > 0) || (l && l > 0) || (w && w > 0)) {
            return {
              height: h || 0,
              length: l || 0,
              width: w || 0,
            };
          }
          return { width: 0, height: 0, depth: 0 } as any;
        })(),
        is_wholesale: false, // Required field - false by default
        order: 1, // Required field - default order
      };

      console.log("در حال ارسال داده به باسلام برای ایجاد محصول:", payload);
      console.log("Vendor ID:", vendorId);
      console.log("Basalam credentials present:", !!basalamCredentials);

      const response = await basalamApi.createProduct(
        basalamCredentials,
        vendorId,
        payload,
      );
      console.log("Basalam product creation response:", response);

      setMessage("محصول با موفقیت در باسلام ثبت شد!");

      // Generate new unique SKU for next product creation
      if (mixinProduct?.name) {
        setSku(generateUniqueSKU(mixinProduct.name, vendorId));
        console.log(
          "Generated new SKU for next product:",
          generateUniqueSKU(mixinProduct.name, vendorId),
        );
      }

      // Refresh lists and counts after successful creation
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["basalamProducts"] }),
          queryClient.invalidateQueries({ queryKey: ["mixinProducts"] }),
        ]);
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["basalamProducts"] }),
          queryClient.refetchQueries({ queryKey: ["mixinProducts"] }),
        ]);
      } catch {}

      setTimeout(onClose, 2000); // Close the modal after a short delay
    } catch (err: any) {
      console.error("خطا در ساخت محصول باسلام:", err);
      setError(`خطا در ثبت محصول باسلام: ${err.message || "خطای ناشناخته"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-sans">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl mx-auto transform transition-all sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">
            ساخت محصول در باسلام
          </h2>
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
            <label
              htmlFor="productName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              نام محصول
            </label>
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
            ) : mixinImageUrls && mixinImageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-w-[180px]">
                {mixinImageUrls.slice(0, 4).map((u, idx) => (
                  <img
                    key={idx}
                    src={u}
                    alt={cleanHtmlText(mixinProduct?.name || "تصویر محصول")}
                    className="w-20 h-20 object-cover rounded-md shadow-sm border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://placehold.co/80x80/CCCCCC/666666?text=No+Image";
                    }}
                  />
                ))}
                {mixinImageUrls.length > 4 && (
                  <div className="w-20 h-20 flex items-center justify-center text-xs text-gray-600 bg-gray-100 rounded-md border border-gray-200">
                    +{mixinImageUrls.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-32 h-32 bg-gray-200 text-gray-500 rounded-md border border-gray-300">
                بدون تصویر
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="categorySelect"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              دسته‌بندی پیشنهادی
            </label>
            {areCategoriesLoading ? (
              <div className="text-gray-500 flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>در حال دریافت دسته‌بندی‌ها...</span>
              </div>
            ) : categoryError ? (
              <div className="text-red-500">
                خطا در دریافت دسته‌بندی:{" "}
                {categoryError.message || "خطای ناشناخته"}
              </div>
            ) : categorySuggestions && categorySuggestions.length > 0 ? (
              <div className="relative">
                <select
                  id="categorySelect"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>
                    انتخاب دسته‌بندی
                  </option>
                  {categorySuggestions.map(
                    (cat: { id: string; name: string }) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ),
                  )}
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
            <label
              htmlFor="statusSelect"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              وضعیت
            </label>
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
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              قیمت (تومان)
            </label>
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
            <label
              htmlFor="preparationDays"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              تعداد روز آماده‌سازی
            </label>
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
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              وزن محصول (گرم)
            </label>
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
            <label
              htmlFor="packageWeight"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              وزن با بسته‌بندی (گرم)
            </label>
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
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              موجودی
            </label>
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
            <label
              htmlFor="sku"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              کد محصول (SKU)
            </label>
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
                onClick={() =>
                  setSku(
                    productName ? generateUniqueSKU(productName, vendorId) : "",
                  )
                }
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                title="تولید کد جدید"
              >
                🔄
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              کد محصول باید برای هر محصول منحصر به فرد باشد
            </p>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">خطا:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {message && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">موفقیت:</strong>
            <span className="block sm:inline"> {message}</span>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isImageUploading || areCategoriesLoading}
            className={`px-6 py-2 rounded-lg shadow-md transition duration-300 ${isSubmitting || isImageUploading || areCategoriesLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"}`}
          >
            {isSubmitting
              ? "در حال ثبت..."
              : isImageUploading
                ? "در حال بارگذاری عکس..."
                : areCategoriesLoading
                  ? "در حال دریافت دسته‌بندی..."
                  : "ثبت محصول"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkMigrationPanel({
  mixinCredentials,
  basalamCredentials,
  vendorId,
  queryClient,
  uniqueMixinProducts,
  setQuotaErrorModal,
  autoMigrationTriggerCount,
}: {
  mixinCredentials: any;
  basalamCredentials: any;
  vendorId?: number;
  queryClient: any;
  uniqueMixinProducts: MixinProduct[];
  setQuotaErrorModal: (modal: {
    isOpen: boolean;
    type: "migration" | "realtime";
  }) => void;
  autoMigrationTriggerCount: number;
}) {
  // Eligibility now relies on credentials and vendor presence; aggregate lists are loaded by HomePage
  const isEligible = !!(mixinCredentials && basalamCredentials && vendorId);

  // Debug logging
  console.log("BulkMigrationPanel Debug:", {
    isEligible,
    mixinCredentials: !!mixinCredentials,
    basalamCredentials: !!basalamCredentials,
    vendorId,
  });
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  // Start migration automatically when trigger count increments
  const lastTriggerRef = useRef(0);
  useEffect(() => {
    if (autoMigrationTriggerCount > lastTriggerRef.current) {
      lastTriggerRef.current = autoMigrationTriggerCount;
      if (!isProcessing && (uniqueMixinProducts?.length || 0) > 0) {
        runInBatches(uniqueMixinProducts);
      }
    }
  }, [autoMigrationTriggerCount, isProcessing, uniqueMixinProducts]);
  // Halt execution on fatal conditions (e.g., quota exceeded)
  const [isHalted, setIsHalted] = useState(false);
  const isHaltedRef = useRef(false);
  useEffect(() => {
    isHaltedRef.current = isHalted;
  }, [isHalted]);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    errors: any[];
    successes: number;
  }>({ done: 0, total: 0, errors: [], successes: 0 });
  const [results, setResults] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bulk_migration_results") || "[]");
    } catch {
      return [];
    }
  });
  const [concurrency, setConcurrency] = useState(3);
  const [maxRetries] = useState(2);
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("bulk_migration_audit_logs") || "[]",
      );
    } catch {
      return [];
    }
  });

  // Rate limiting state for bulk product creation
  const [processedCount, setProcessedCount] = useState(0);
  const [isRateLimitPaused, setIsRateLimitPaused] = useState(false);

  // Dynamic pause configuration based on concurrency
  const getPauseConfig = (concurrency: number) => {
    const configs = {
      1: { interval: 1, pauseSeconds: 5 }, // 5 seconds after every 1 product
      2: { interval: 2, pauseSeconds: 10 }, // 10 seconds after every 2 products
      3: { interval: 3, pauseSeconds: 15 }, // 15 seconds after every 3 products
      4: { interval: 4, pauseSeconds: 20 }, // 20 seconds after every 4 products
      5: { interval: 5, pauseSeconds: 25 }, // 25 seconds after every 5 products
    };
    return configs[concurrency as keyof typeof configs] || configs[3]; // Default to concurrency 3
  };

  // Use the uniqueMixinProducts passed from the homepage (which uses the same logic as getCommonProducts)
  const missingProducts = uniqueMixinProducts || [];
  console.log("===== this is what product migration panel uses =====");
  console.log("missingProducts", missingProducts);

  // Function to extract error reason from API response
  const getErrorReason = (error: any): string => {
    try {
      // Check if it's a 422 error with validation messages
      if (error?.status_code === 422 || error?.response?.http_status === 422) {
        const messages = error?.response?.messages || error?.messages;
        if (messages && Array.isArray(messages) && messages.length > 0) {
          return messages[0].message || "خطای اعتبارسنجی محصول";
        }
      }

      // Check if it's a 500 error
      if (error?.status_code === 500 || error?.response?.http_status === 500) {
        return "انتقال محصول از سمت سرور باسلام. به پشتیبانی اطلاع دهید...";
      }

      // Check for other HTTP status codes
      if (error?.status_code || error?.response?.http_status) {
        const statusCode = error?.status_code || error?.response?.http_status;
        return `خطای سرور (${statusCode})`;
      }

      // Fallback to generic error message
      return error?.message || "خطای نامشخص در انتقال محصول";
    } catch (e) {
      return "خطای نامشخص در انتقال محصول";
    }
  };

  const saveResults = (items: any[]) => {
    const merged = [...items, ...results].slice(0, 200);
    setResults(merged);
    localStorage.setItem("bulk_migration_results", JSON.stringify(merged));
  };

  const addAuditLog = (action: string, details: any) => {
    const log = {
      timestamp: Date.now(),
      action,
      details,
      sessionId: Date.now().toString(36),
    };
    const updated = [log, ...auditLogs].slice(0, 100);
    setAuditLogs(updated);
    localStorage.setItem("bulk_migration_audit_logs", JSON.stringify(updated));
  };

  const exportCsv = () => {
    const header = [
      "time",
      "id",
      "name",
      "status",
      "error",
      "retry_count",
      "duration_ms",
    ];
    const rows = results.map((r) =>
      [
        new Date(r.time).toISOString(),
        r.id,
        `"${(r.name || "").replace(/"/g, '""')}"`,
        r.status,
        `"${(r.error || "").replace(/"/g, '""')}"`,
        r.retryCount || 0,
        r.duration || 0,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-migration-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAuditLogs = () => {
    const header = ["timestamp", "action", "details", "session_id"];
    const rows = auditLogs.map((log) =>
      [
        new Date(log.timestamp).toISOString(),
        log.action,
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
        log.sessionId,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-migration-audit-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const fetchCategoryId = async (title: string): Promise<number | null> => {
    try {
      const resp = await fetch(
        `${BASE_URL}/products/category-detection/?title=${encodeURIComponent(title)}`,
      );
      const data = await resp.json();
      console.log("Category detection response:", data);
      const id = data?.result?.[0]?.cat_id;
      console.log("Extracted category ID:", id);
      return id ? parseInt(id, 10) : null;
    } catch (error) {
      console.error("Category detection error:", error);
      return null;
    }
  };

  const createBasalamProduct = async (
    mixinProduct: any,
  ): Promise<{ ok: boolean; message: string; product?: any }> => {
    if (!basalamCredentials || !vendorId)
      return { ok: false, message: "Missing Basalam credentials or vendorId" };

    const categoryId = await fetchCategoryId(mixinProduct.name);
    if (!categoryId) return { ok: false, message: "Unable to detect category" };

    // --- CRITICAL FIX: Fetch full product details for complete description ---
    let fullMixinProduct = mixinProduct;
    try {
      if (mixinCredentials && mixinProduct?.id) {
        console.log(
          `Bulk creation: Fetching full details for product ${mixinProduct.id} (${mixinProduct.name})`,
        );
        const full = await mixinApi.getProductById(
          mixinCredentials,
          mixinProduct.id,
        );
        if (full) {
          fullMixinProduct = full;
          console.log(
            `Bulk creation: Full product details fetched. Description length: ${full.description?.length || 0}, SEO description length: ${full.seo_description?.length || 0}`,
          );
        }
      }
    } catch (e) {
      console.warn(
        "Bulk creation: Failed to fetch full product details, using paginated data:",
        e,
      );
      // Continue with paginated data if full fetch fails
    }

    // --- New logic for multiple images ---
    let imageIds: number[] = [];
    try {
      let imageUrls: string[] = [];
      if (fullMixinProduct?.id && mixinCredentials) {
        imageUrls = await mixinApi.getProductImages(
          mixinCredentials,
          fullMixinProduct.id,
        );
      } else if (fullMixinProduct?.imageUrl) {
        imageUrls = [fullMixinProduct.imageUrl];
      }
      if (!imageUrls.length)
        return { ok: false, message: "No images found for upload" };
      for (const url of imageUrls) {
        const up = await basalamApi.uploadImage(basalamCredentials, url);
        if (up?.id) imageIds.push(Number(up.id));
      }
    } catch (err) {
      return { ok: false, message: "Image upload failed" };
    }
    if (!imageIds.length) return { ok: false, message: "Image upload failed" };
    const mainImageId = imageIds[0];
    const otherImageIds = imageIds.length > 1 ? imageIds.slice(1) : [];
    // --- End new logic ---

    const sku = generateUniqueSKU(fullMixinProduct.name, vendorId);

    // Try to fetch full Mixin product to get optional dimensions (now using fullMixinProduct)
    let packagingDimensionsFromMixin: {
      height?: number;
      length?: number;
      width?: number;
    } | null = null;
    try {
      if (mixinCredentials && fullMixinProduct?.id) {
        const lengthVal =
          fullMixinProduct?.length != null
            ? Number(fullMixinProduct.length)
            : undefined;
        const widthVal =
          fullMixinProduct?.width != null
            ? Number(fullMixinProduct.width)
            : undefined;
        const heightVal =
          fullMixinProduct?.height != null
            ? Number(fullMixinProduct.height)
            : undefined;
        if (
          (lengthVal && lengthVal > 0) ||
          (widthVal && widthVal > 0) ||
          (heightVal && heightVal > 0)
        ) {
          packagingDimensionsFromMixin = {
            height: heightVal,
            length: lengthVal,
            width: widthVal,
          };
        }
      }
    } catch (e) {
      // ignore optional fetch errors
    }

    // Fetch unit type for the category
    let unitTypeId: number | null = null;
    let unitQuantity: number = 1;

    try {
      const unitTypeResponse = await basalamApi.getCategoryUnitType(
        basalamCredentials,
        categoryId,
      );
      if (unitTypeResponse?.unit_type?.id) {
        unitTypeId = unitTypeResponse.unit_type.id;
        unitQuantity = getUnitQuantity(unitTypeId);
      }
    } catch (error) {
      console.warn("Failed to fetch unit type for category:", error);
    }

    // Determine final description with fallback: description -> seo_description -> default
    // Now using fullMixinProduct which has complete data
    let finalDescription = cleanHtmlText(
      (fullMixinProduct.description || "").trim(),
    );
    if (!finalDescription) {
      try {
        // Use seo_description from the full product data we already fetched
        finalDescription =
          cleanHtmlText((fullMixinProduct as any)?.seo_description || "") ||
          "بدون توضیحات";
      } catch {
        finalDescription = "بدون توضیحات";
      }
    }

    // Build brief with same fallback to keep consistency with manual creation
    const initialBrief = cleanHtmlText(fullMixinProduct.description || "");
    const finalBrief = initialBrief || finalDescription;

    // Debug logging for bulk creation
    console.log(`Bulk creation for ${fullMixinProduct.name}:`, {
      originalDescription:
        fullMixinProduct.description?.substring(0, 100) + "...",
      finalDescriptionLength: finalDescription.length,
      finalBriefLength: finalBrief.length,
      finalDescription: finalDescription.substring(0, 200) + "...",
      finalBrief: finalBrief.substring(0, 200) + "...",
      dataSource: "fullMixinProduct",
    });

    const payload = {
      name: fullMixinProduct.name,
      category_id: categoryId,
      status: "2976",
      primary_price: tomanToRial(Number(fullMixinProduct.price || 0)),
      preparation_days: 3,
      weight: Number(fullMixinProduct.weight || 500),
      package_weight: Number(
        fullMixinProduct.weight ? Number(fullMixinProduct.weight) + 50 : 550,
      ),
      photo: mainImageId,
      photos: otherImageIds,
      stock: Number(fullMixinProduct.stock || 1),
      brief: finalBrief, // Use the same fallback logic as manual creation
      description: finalDescription,
      sku,
      video: "",
      keywords: "",
      shipping_city_ids: [],
      shipping_method_ids: [],
      wholesale_prices: [],
      product_attribute: [],
      virtual: false,
      variants: [],
      shipping_data: {},
      // Unit type and quantity - only include if we have unit type data
      ...(unitTypeId
        ? {
            unit_quantity: unitQuantity,
            unit_type: unitTypeId,
          }
        : {
            unit_quantity: 1,
            unit_type: 6304, // Default to "عددی" if no unit type found
          }),
      packaging_dimensions: packagingDimensionsFromMixin
        ? {
            height: packagingDimensionsFromMixin.height || 0,
            length: packagingDimensionsFromMixin.length || 0,
            width: packagingDimensionsFromMixin.width || 0,
          }
        : { width: 0, height: 0, depth: 0 },
      is_wholesale: false,
      order: 1,
    };

    try {
      const resp = await basalamApi.createProduct(
        basalamCredentials,
        vendorId,
        payload,
      );
      return { ok: true, message: "Created", product: resp };
    } catch (e: any) {
      console.log(
        `createBasalamProduct error for ${fullMixinProduct.name}:`,
        e,
      );
      // Throw the error so withRetries can handle it properly
      throw e;
    }
  };

  const withRetries = async (
    fn: () => Promise<any>,
    itemId: number,
    itemName: string,
  ) => {
    let attempt = 0;
    let lastErr: any = null;
    const startTime = Date.now();

    addAuditLog("ITEM_START", { itemId, itemName, attempt: 0 });

    while (attempt <= maxRetries) {
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        addAuditLog("ITEM_SUCCESS", { itemId, itemName, attempt, duration });
        return { ...result, retryCount: attempt, duration };
      } catch (e) {
        lastErr = e;
        attempt += 1;
        addAuditLog("ITEM_RETRY", {
          itemId,
          itemName,
          attempt,
          error: (e as any)?.message || "Unknown error",
        });
        await sleep(500 * attempt);
      }
    }

    const duration = Date.now() - startTime;
    addAuditLog("ITEM_FAILED", {
      itemId,
      itemName,
      attempt,
      error: lastErr?.message || "Unknown error",
      duration,
    });
    throw { ...lastErr, retryCount: attempt, duration };
  };

  const runInBatches = async (items: any[]) => {
    // Ensure credentials are available before proceeding
    if (!mixinCredentials || !basalamCredentials) {
      console.error("Bulk migration failed: Missing credentials");
      return;
    }

    // Capture quota error modal setter for use in nested functions
    const setQuotaError = setQuotaErrorModal;

    setIsProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;

    // Reset rate limiting counters
    setProcessedCount(0);
    setIsRateLimitPaused(false);

    const itemsToProcess = items;
    const sessionId = Date.now().toString(36);

    addAuditLog("BATCH_START", {
      sessionId,
      totalItems: itemsToProcess.length,
      concurrency,
      maxRetries,
    });

    setProgress({
      done: 0,
      total: itemsToProcess.length,
      errors: [],
      successes: 0,
    });

    let active = 0; //Current processing items
    let idx = 0; //Next item to process
    let done = 0; //Completed items
    let successes = 0;
    const errors: any[] = [];
    const newFailedItems: any[] = [];

    return new Promise<void>((resolve) => {
      const next = () => {
        // If halted, finalize and resolve without proceeding
        if (isHaltedRef.current) {
          setIsProcessing(false);
          setProgress({
            done,
            total: itemsToProcess.length,
            errors,
            successes,
          });
          addAuditLog("BATCH_HALTED", {
            reason: "quota_exceeded",
            totalProcessed: done,
            successes,
            failures: errors.length,
          });
          resolve();
          return;
        }
        if (idx >= itemsToProcess.length && active === 0) {
          setIsProcessing(false);
          setProgress({
            done,
            total: itemsToProcess.length,
            errors,
            successes,
          });

          addAuditLog("BATCH_COMPLETE", {
            sessionId,
            totalProcessed: done,
            successes,
            failures: errors.length,
            failedItems: newFailedItems.length,
          });

          // Refresh product lists on batch completion
          queryClient.invalidateQueries({ queryKey: ["basalamProducts"] });
          queryClient.invalidateQueries({ queryKey: ["mixinProducts"] });

          resolve();
          return;
        }
        // If paused, do not start new tasks. Check again shortly.
        if (isPausedRef.current) {
          setTimeout(next, 300);
          return;
        }
        while (
          active < concurrency &&
          idx < itemsToProcess.length &&
          !isPausedRef.current
        ) {
          if (isHaltedRef.current) {
            // Do not start new tasks when halted
            break;
          }
          const mp = itemsToProcess[idx++];
          active += 1;
          (async () => {
            try {
              // Check migration quota before creating product
              try {
                console.log(
                  "Bulk migration - Checking credentials before incrementUsage:",
                  {
                    hasMixinCredentials: !!mixinCredentials,
                    hasBasalamCredentials: !!basalamCredentials,
                    basalamToken: basalamCredentials?.access_token
                      ? `${basalamCredentials.access_token.substring(0, 20)}...`
                      : "No token",
                  },
                );
                await incrementUsage("migration");
              } catch (error: any) {
                console.error("Bulk migration incrementUsage error:", error);
                const status = error?.response?.status || error?.status;
                // Workaround: Axios 'Network Error' may happen on 429 with CORS issues
                if (
                  status === 429 ||
                  (error?.message === "Network Error" &&
                    error?.config?.url &&
                    error.config.url.includes("/api/usage/increment"))
                ) {
                  console.log(
                    "Quota exceeded: showing modal (migration, network error workaround)",
                  );
                  setQuotaError({ isOpen: true, type: "migration" });
                  setIsProcessing(false);
                  // Halt all further processing
                  setIsHalted(true);
                  return;
                }
                if (status === 401) {
                  useGlobalUiStore.getState().setShowTokenExpiredModal(true);
                  setIsProcessing(false);
                  setIsHalted(true);
                  return;
                }
                throw error;
              }

              const res = await withRetries(
                () => createBasalamProduct(mp),
                mp.id,
                mp.name,
              );
              console.log(`Bulk migration SUCCESS for ${mp.name}:`, res);
              // If we reach here, the product was created successfully
              successes += 1;
              saveResults([
                {
                  id: mp.id,
                  name: mp.name,
                  status: "success",
                  time: Date.now(),
                  retryCount: res.retryCount || 0,
                  duration: res.duration || 0,
                },
              ]);
            } catch (error: any) {
              console.log(`Bulk migration ERROR for ${mp.name}:`, error);
              const errorReason = getErrorReason(error);
              const errorItem = {
                id: mp.id,
                name: mp.name,
                error: errorReason,
              };
              errors.push(errorItem);
              newFailedItems.push(mp);
              saveResults([
                {
                  id: mp.id,
                  name: mp.name,
                  status: "error",
                  error: errorReason,
                  time: Date.now(),
                  retryCount: error?.retryCount || maxRetries,
                  duration: error?.duration || 0,
                },
              ]);
            } finally {
              // Always decrement active and update counters
              active -= 1;
              done += 1;
              // Update progress so counters reflect item-level completion in real time
              setProgress({
                done,
                total: itemsToProcess.length,
                errors,
                successes,
              });
              // If halted, trigger scheduler to finalize
              if (isHaltedRef.current) {
                next();
                return;
              }
              // Schedule next
              next();
            }
          })();
        }
        if (active === 0 && idx < itemsToProcess.length) {
          setTimeout(next, 200);
        }
      };

      // Kick off initial scheduling
      next();
    });
  };

  const handleBatchMigrate = async () => {
    if (!mixinCredentials || !basalamCredentials || !vendorId) {
      alert("لطفاً ابتدا به میکسین و باسلام متصل شوید.");
      return;
    }

    if (isScheduled && scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      const now = new Date();
      if (scheduledDate > now) {
        const delay = scheduledDate.getTime() - now.getTime();
        addAuditLog("SCHEDULE_SET", { scheduledTime, delayMs: delay });
        setTimeout(() => {
          runInBatches(missingProducts).then(async () => {
            try {
              await queryClient.invalidateQueries({
                queryKey: ["basalamProducts"],
              });
              await queryClient.refetchQueries({
                queryKey: ["basalamProducts"],
              });
            } catch {}
          });
        }, delay);
        setIsScheduled(false);
        setScheduledTime("");
        return;
      }
    }

    await runInBatches(missingProducts);
    try {
      await queryClient.invalidateQueries({ queryKey: ["basalamProducts"] });
      await queryClient.refetchQueries({ queryKey: ["basalamProducts"] });
    } catch {}
  };

  if (!isEligible) return null;

  return (
    <div
      className="bg-gradient-to-r from-[#30cfb7]/20 to-[#ffa454]/20 backdrop-blur-md rounded-lg p-6 mb-6 shadow-lg border border-[#30cfb7]/30"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#30cfb7]/200 to-[#ffa454]/200 rounded-lg">
            <Layers className="w-8 h-8 text-[#30cfb7]" />
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              انتقال سریع محصولات میکسین به باسلام
            </h3>
            <>
              <p className="text-[#5e5d5b] text-sm">
                شما واجد شرایط انتقال خودکار محصولات هستید.
              </p>
              <p className="text-[#5e5d5b] text-xs">
                {missingProducts.length} محصول آماده انتقال!
              </p>
            </>
          </div>
        </div>
        <div className="flex items-center gap-2 mr-6">
          <button
            className="bg-gradient-to-r from-[#30cfb7] to-[#ffa454] text-white px-6 py-3 rounded-lg font-semibold hover:from-[#2bbfa7] hover:to-[#ffb454] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => setShowModal(true)}
            id="migration-panel-start-button"
          >
            شروع انتقال
          </button>
          {results.length > 0 && (
            <button
              className="px-4 py-2 border border-[#30cfb7] text-[#30cfb7] rounded hover:bg-[#30cfb7]/10 transition-all duration-200"
              onClick={exportCsv}
            >
              خروجی CSV
            </button>
          )}
          {auditLogs.length > 0 && (
            <button
              className="px-4 py-2 border border-[#ffa454] text-[#ffa454] rounded hover:bg-[#ffa454]/10 transition-all duration-200"
              onClick={exportAuditLogs}
            >
              گزارشات
            </button>
          )}
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-0 flex-shrink-0">
              <div
                className="flex items-center justify-between mb-2"
                id="migration-modal-controls"
              >
                <h2 className="text-xl font-bold text-blue-700">
                  محصولات آماده انتقال ({missingProducts.length})
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">
                      حداکثر همزمانی
                    </label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={concurrency}
                      onChange={(e) =>
                        setConcurrency(parseInt(e.target.value) || 1)
                      }
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                  <button
                    className={`px-3 py-1 rounded text-sm ${isPaused ? "bg-green-600 text-white hover:bg-green-700" : "bg-yellow-500 text-white hover:bg-yellow-600"}`}
                    onClick={() => {
                      setIsPaused((p) => {
                        const next = !p;
                        isPausedRef.current = next;
                        return next;
                      });
                      // When pausing, refresh lists to reflect current state so counts and common/unique update promptly
                      queryClient.invalidateQueries({
                        queryKey: ["basalamProducts"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["mixinProducts"],
                      });
                    }}
                    disabled={!isProcessing}
                  >
                    {isPaused ? "ادامه" : "توقف موقت"}
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div
              className="flex-1 overflow-y-auto px-6"
              id="migration-modal-content"
            >
              {/* Scheduling Section */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">
                      زمان‌بندی برای ساعت کم‌ترافیک
                    </span>
                  </label>
                  {isScheduled && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="border rounded px-2 py-1 text-sm"
                    />
                  )}
                </div>
                {isScheduled && scheduledTime && (
                  <p className="text-xs text-gray-600 mt-1">
                    انتقال در ساعت{" "}
                    {new Date(scheduledTime).toLocaleString("fa-IR")} شروع خواهد
                    شد
                  </p>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto border rounded mb-4">
                <ul className="divide-y divide-gray-200">
                  {missingProducts.map((p: any) => (
                    <li key={p.id} className="p-2 text-gray-700">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
              {isProcessing ? (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-blue-700">
                    {progress.done} از {progress.total} محصول منتقل شد • موفق:{" "}
                    {progress.successes} • خطا: {progress.errors.length}
                  </p>

                  {/* Rate Limit Indicator */}
                  {isRateLimitPaused && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-yellow-800 font-medium">
                          محدودیت نرخ: توقف{" "}
                          {getPauseConfig(concurrency).pauseSeconds} ثانیه‌ای
                          ادامه پس از {getPauseConfig(concurrency).pauseSeconds}{" "}
                          ثانیه
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        پس از پردازش {getPauseConfig(concurrency).interval}{" "}
                        محصول ({processedCount} کل)
                      </p>
                    </div>
                  )}

                  {progress.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-red-600 text-sm cursor-pointer">
                        مشاهده خطاها ({progress.errors.length})
                      </summary>
                      <ul className="mt-2 text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                        {progress.errors.map((e: any, idx: number) => (
                          <li key={idx}>
                            #{e.id} - {e.name}: {e.error}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
                  onClick={() => handleBatchMigrate()}
                  disabled={isProcessing || missingProducts.length === 0}
                >
                  شروع انتقال گروهی واقعی
                </button>
              )}

              {/* Results Section */}
              {results.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-700 text-sm">
                      نتایج اخیر
                    </h4>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 border border-blue-400 text-blue-700 rounded hover:bg-blue-50 text-xs"
                        onClick={exportCsv}
                      >
                        خروجی CSV
                      </button>
                      {auditLogs.length > 0 && (
                        <button
                          className="px-3 py-1 border border-green-400 text-green-700 rounded hover:bg-green-50 text-xs"
                          onClick={exportAuditLogs}
                        >
                          گزارشات
                        </button>
                      )}
                    </div>
                  </div>
                  <ul className="max-h-40 overflow-y-auto text-xs space-y-1">
                    {results.slice(0, 20).map((r) => (
                      <li
                        key={`${r.id}-${r.time}`}
                        className={
                          r.status === "success"
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {new Date(r.time).toLocaleString()} • {r.name} •{" "}
                        {r.status === "success" ? "موفق" : `خطا: ${r.error}`}
                        {r.retryCount > 0 && ` (${r.retryCount} تلاش)`}
                        {r.duration && ` (${r.duration}ms)`}
                      </li>
                    ))}
                    {results.length > 20 && (
                      <li className="text-gray-500">
                        ... و {results.length - 20} مورد دیگر
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex-shrink-0">
              <div className="flex justify-end">
                <button
                  className="text-gray-500 hover:text-gray-700 text-sm"
                  onClick={() => setShowModal(false)}
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const { mixinCredentials, basalamCredentials, clearCredentials, settings } =
    useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<
    MixinProduct | BasalamProduct | null
  >(null);
  const [modalType, setModalType] = useState<"mixin" | "basalam">("mixin");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMixinSectionOpen, setIsMixinSectionOpen] = useState(true);
  const [isBasalamSectionOpen, setIsBasalamSectionOpen] = useState(true);
  const [isCommonMixinSectionOpen, setIsCommonMixinSectionOpen] =
    useState(true);
  const [isCommonBasalamSectionOpen, setIsCommonBasalamSectionOpen] =
    useState(true);
  const [isCreateMixinModalOpen, setIsCreateMixinModalOpen] = useState(false);
  const [isCreateBasalamModalOpen, setIsCreateBasalamModalOpen] =
    useState(false);
  const [productToCreateInBasalam, setProductToCreateInBasalam] =
    useState<MixinProduct | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false)
  // Auto-migration trigger counter; increment to trigger migration in panel
  const [autoMigrationTriggerCount, setAutoMigrationTriggerCount] = useState(0);

  // Quota error modal state
  const [quotaErrorModal, setQuotaErrorModal] = useState<{
    isOpen: boolean;
    type: "migration" | "realtime";
  }>({
    isOpen: false,
    type: "migration",
  });

  // Global full lists for cross-page comparison
  const [globalMixinProducts, setGlobalMixinProducts] = useState<
    MixinProduct[]
  >([]);
  const [globalBasalamProducts, setGlobalBasalamProducts] = useState<
    BasalamProduct[]
  >([]);
  const [isLoadingGlobalLists, setIsLoadingGlobalLists] = useState(false);

  // Loading progress tracking
  const [loadingProgress, setLoadingProgress] = useState({
    mixin: { current: 0, total: 0, status: "idle" }, // idle, loading, completed, error
    basalam: { current: 0, total: 0, status: "idle" },
  });

  // Background Auto-Sync state
  const backgroundSyncRunningRef = useRef(false);
  const normalizeName = (s: string | undefined) =>
    (s || "").trim().toLowerCase();
  const toToman = (rial: number) => Math.floor((rial || 0) / 10);

  // Load all products using backend aggregation endpoints (server-side pagination)
  const loadAllProductsForComparison = async () => {
    if (
      !mixinCredentials?.url ||
      !basalamCredentials?.access_token ||
      !userData?.vendor?.id
    )
      return;
    setIsLoadingGlobalLists(true);

    // Initialize progress for two aggregate requests
    setLoadingProgress({
      mixin: { current: 0, total: 1, status: "loading" },
      basalam: { current: 0, total: 1, status: "loading" },
    });

    try {
      const mixinUrlValue =
        (mixinCredentials as any)?.mixin_url ||
        (mixinCredentials as any)?.url ||
        "";
      const mixinUrlParam = encodeURIComponent(mixinUrlValue);
      const vendorId = userData.vendor.id;

      const mixinAllPromise = fetch(
        `${BASE_URL}/products/my-mixin-products/all?mixin_url=${mixinUrlParam}`,
        {
          headers: { Authorization: `Bearer ${mixinCredentials.access_token}` },
        },
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(`Mixin all fetch failed: ${res.status}`);
          const data = await res.json();
          console.log("=== Mixin ALL aggregate response ===", {
            count: data?.count,
            productsLen: Array.isArray(data?.products)
              ? data.products.length
              : 0,
            mixinUrlValue,
          });
          // Expected shape: { count: number, products: MixinProduct[] }
          const products = Array.isArray(data?.products) ? data.products : [];
          setGlobalMixinProducts(products as unknown as MixinProduct[]);
          console.log(" setGlobalMixinProducts length:", products.length);
          setLoadingProgress((prev) => ({
            ...prev,
            mixin: { current: 1, total: 1, status: "completed" },
          }));
          return { products };
        })
        .catch((err) => {
          console.error("Mixin aggregate fetch error:", err);
          setLoadingProgress((prev) => ({
            ...prev,
            mixin: { current: 0, total: 1, status: "error" },
          }));
          return { products: [] };
        });

      const basalamAllPromise = fetch(
        `${BASE_URL}/products/my-basalam-products/${vendorId}/all`,
        {
          headers: {
            Authorization: `Bearer ${basalamCredentials.access_token}`,
          },
        },
      )
        .then(async (res) => {
          if (!res.ok)
            throw new Error(`Basalam all fetch failed: ${res.status}`);
          const data = await res.json();
          console.log("=== Basalam ALL aggregate response ===", {
            count: data?.count,
            productsLen: Array.isArray(data?.products)
              ? data.products.length
              : 0,
            vendorId,
          });
          // Expected shape: { count: number, products: BasalamProduct[] }
          const products = Array.isArray(data?.products) ? data.products : [];
          setGlobalBasalamProducts(products as unknown as BasalamProduct[]);
          console.log(" setGlobalBasalamProducts length:", products.length);
          setLoadingProgress((prev) => ({
            ...prev,
            basalam: { current: 1, total: 1, status: "completed" },
          }));
          return { products };
        })
        .catch((err) => {
          console.error("Basalam aggregate fetch error:", err);
          setLoadingProgress((prev) => ({
            ...prev,
            basalam: { current: 0, total: 1, status: "error" },
          }));
          return { products: [] };
        });

      const [{ products: mixinAgg }, { products: basalamAgg }] =
        await Promise.all([mixinAllPromise, basalamAllPromise]);
      console.log("=== Global lists loaded (from aggregates) ===", {
        globalMixinLen: mixinAgg.length,
        globalBasalamLen: basalamAgg.length,
      });
    } catch (error) {
      console.warn("Failed to load aggregate products for comparison:", error);
      setLoadingProgress((prev) => ({
        mixin: { ...prev.mixin, status: "error" },
        basalam: { ...prev.basalam, status: "error" },
      }));
    } finally {
      setIsLoadingGlobalLists(false);
    }
  };

  // No-op here; we refresh inline where needed to avoid hoisting issues

  const handleLogout = async () => {
    try {
      if (!window.confirm("Are you sure you want to logout?")) {
        return;
      }

      clearCredentials();
      localStorage.removeItem("auth-storage");
      sessionStorage.clear();
      queryClient.clear();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["basalamUser"],
    queryFn: () => basalamApi.getUserData(basalamCredentials!),
    enabled: !!basalamCredentials?.access_token,
    retry: 1,
    staleTime: 30000,
  });

  // Load total counts for pagination

  // Load global lists in background for cross-page comparison
  useEffect(() => {
    if (mixinCredentials && basalamCredentials && userData?.vendor?.id) {
      loadAllProductsForComparison();
    }
  }, [mixinCredentials, basalamCredentials, userData?.vendor?.id]);

  // Background Auto-Sync loop every ~3 minutes using full-detail comparison and needToUpdate list
  useEffect(() => {
    if (!settings?.autoSyncEnabled) return;
    const preferBasalam = !!settings?.preferBasalamFromMixin;
    const preferMixin = !!settings?.preferMixinFromBasalam;
    if (!preferBasalam && !preferMixin) return;
    if (!mixinCredentials || !basalamCredentials) return;

    const buildPairs = () => {
      if (!globalMixinProducts?.length || !globalBasalamProducts?.length)
        return [] as Array<{ mixin: any; basalam: any }>;
      const mixinByName = new Map<string, any>();
      for (const mp of globalMixinProducts) {
        if (mp?.name) mixinByName.set(normalizeName(mp.name), mp);
      }
      const basalamByName = new Map<string, any>();
      for (const bp of globalBasalamProducts) {
        if ((bp as any)?.title)
          basalamByName.set(normalizeName((bp as any).title), bp);
      }
      const pairs: Array<{ mixin: any; basalam: any }> = [];
      for (const [name, mp] of mixinByName.entries()) {
        const bp = basalamByName.get(name);
        if (bp) pairs.push({ mixin: mp, basalam: bp });
      }
      return pairs;
    };

    const compareWithFullDetails = async (
      mp: any,
      bp: any,
      fullMCache?: Record<number, any>,
      fullBCache?: Record<number, any>,
    ) => {
      try {
        const [fullM, fullB] = await Promise.all([
          fullMCache?.[mp.id] ||
            mixinApi.getProductById(mixinCredentials!, mp.id),
          fullBCache?.[bp.id] ||
            basalamApi.getProductById(basalamCredentials!, bp.id),
        ]);

        // Use full product details (same as sync button)
        const fullMixinProduct = fullM || mp;
        const fullBasalamProduct = fullB || bp;

        // Price comparison - use rialToToman like sync button
        const priceMismatch =
          rialToToman(fullBasalamProduct.price) !== fullMixinProduct.price;

        // Stock comparison - use full product details like sync button
        const mixinStock = fullMixinProduct.stock || 0;
        const basalamStock = fullBasalamProduct.inventory || 0;
        const stockMismatch = mixinStock !== basalamStock;

        // Description comparison - use normalizeDescription like sync button
        const normalizeDescription = (s: string | undefined) =>
          cleanHtmlText(s || "").trim();
        const mixinDescription = normalizeDescription(
          fullMixinProduct.description,
        );
        const basalamDescription = normalizeDescription(
          fullBasalamProduct.description,
        );
        const descriptionMismatch = mixinDescription !== basalamDescription;

        return {
          mismatch: priceMismatch || stockMismatch || descriptionMismatch,
          fullM,
          fullB,
        };
      } catch {
        return { mismatch: false, fullM: null, fullB: null };
      }
    };

    const run = async () => {
      if (backgroundSyncRunningRef.current) return;
      backgroundSyncRunningRef.current = true;
      try {
        console.log("[AutoSync] Cycle start");
        const pairs = buildPairs();
        console.log("[AutoSync] Candidate pairs:", pairs.length);
        // Pre-fetch all mixin full products in one batch
        const mixinIds = pairs.map((p) => Number(p.mixin?.id)).filter(Boolean);
        const mixinFullMap = await mixinApi.getProductsByIds(
          mixinCredentials!,
          mixinIds,
        );
        // Pre-fetch all basalam full products in one batch
        const basalamIds = pairs
          .map((p) => Number(p.basalam?.id))
          .filter(Boolean);
        const basalamFullMap = await basalamApi.getProductsByIds(
          basalamCredentials!,
          basalamIds,
        );

        const needToUpdate: Array<{
          mp: any;
          bp: any;
          fullM: any;
          fullB: any;
        }> = [];
        for (const { mixin: mp, basalam: bp } of pairs) {
          const { mismatch, fullM, fullB } = await compareWithFullDetails(
            mp,
            bp,
            mixinFullMap,
            basalamFullMap,
          );
          if (mismatch) needToUpdate.push({ mp, bp, fullM, fullB });
        }
        console.log("[AutoSync] needToUpdate size:", needToUpdate.length);
        // Process updates sequentially to avoid rate issues
        for (const item of needToUpdate) {
          try {
            if (preferBasalam) {
              const src = item.fullM || item.mp;
              const key = `basalam:${item.bp.id}`;
              if (useGlobalUiStore.getState().isBlocked(key)) {
                continue;
              }
              const payload = {
                name: src?.name || item.bp?.title,
                price: tomanToRial(Number(src?.price || 0)),
                description: (src?.description || "").toString(),
                stock: Number(src?.stock || 0),
                weight:
                  Number(src?.weight || 0) > 0 ? Number(src?.weight) : 500,
              };
              try {
                await basalamApi.updateProduct(
                  basalamCredentials!,
                  item.bp.id,
                  payload as any,
                );
                try {
                  await incrementUsage("realtime");
                } catch {}
              } catch (err: any) {
                const status = err?.response?.status || err?.status;
                if (status === 404) {
                  const title = src?.name || (item.bp as any)?.title || "";
                  useGlobalUiStore
                    .getState()
                    .register404(key, item.bp.id, title);
                  storeAppendLog({
                    id: `${Date.now()}-${Math.random()}`,
                    platform: "basalam",
                    productId: item.bp.id,
                    title,
                    status: "یافت نشد",
                    message:
                      "در هنگام به‌روزرسانی محصول، باسلام درخواست را رد کرد. لطفاً در پلتفرم باسلام بررسی کنید.",
                    url: "https://basalam.com/",
                    ts: Date.now(),
                  });
                  const st = useGlobalUiStore.getState() as any;
                  if (
                    st.product404[key]?.count >= 3 &&
                    st.productBlockList[key]
                  ) {
                    storeAppendLog({
                      id: `${Date.now()}-${Math.random()}`,
                      platform: "basalam",
                      productId: item.bp.id,
                      title,
                      status: "موقتا متوقف شد",
                      message:
                        "ارسال درخواست به‌روزرسانی برای این محصول به مدت ۳۰ دقیقه متوقف شد. لطفاً از وجود محصول در باسلام اطمینان حاصل کنید.",
                      url: "https://basalam.com/",
                      ts: Date.now(),
                    });
                  }
                }
                continue;
              }
            } else if (preferMixin) {
              const src = item.fullB || item.bp;
              const key = `mixin:${item.mp.id}`;
              if (useGlobalUiStore.getState().isBlocked(key)) {
                continue;
              }
              const original = await mixinApi.getProductById(
                mixinCredentials!,
                item.mp.id,
              );
              if (original) {
                const payload = {
                  ...original,
                  name: (src as any)?.title || original.name,
                  price: Number(toToman(Number(src?.price || 0))),
                  description: (src?.description || "").toString(),
                  stock: Number(src?.inventory || 0),
                  weight:
                    Number(src?.net_weight || 0) > 0
                      ? Number(src?.net_weight)
                      : 500,
                  extra_fields: [] as any[],
                };
                try {
                  await mixinApi.updateProduct(
                    mixinCredentials!,
                    item.mp.id,
                    payload as any,
                  );
                  try {
                    await incrementUsage("realtime");
                  } catch {}
                } catch (err: any) {
                  const status = err?.response?.status || err?.status;
                  if (status === 404) {
                    const title = (src as any)?.title || original.name || "";
                    useGlobalUiStore
                      .getState()
                      .register404(key, item.mp.id, title);
                    storeAppendLog({
                      id: `${Date.now()}-${Math.random()}`,
                      platform: "mixin",
                      productId: item.mp.id,
                      title,
                      status: "یافت نشد",
                      message:
                        "در هنگام به‌روزرسانی محصول، میکسین درخواست را رد کرد. لطفاً در پلتفرم میکسین بررسی کنید.",
                      url: "https://mixin.ir/",
                      ts: Date.now(),
                    });
                    const st = useGlobalUiStore.getState() as any;
                    if (
                      st.product404[key]?.count >= 3 &&
                      st.productBlockList[key]
                    ) {
                      storeAppendLog({
                        id: `${Date.now()}-${Math.random()}`,
                        platform: "mixin",
                        productId: item.mp.id,
                        title,
                        status: "موقتا متوقف شد",
                        message:
                          "ارسال درخواست به‌روزرسانی برای این محصول به مدت ۳۰ دقیقه متوقف شد. لطفاً از وجود محصول در میکسین اطمینان حاصل کنید.",
                        url: "https://mixin.ir/",
                        ts: Date.now(),
                      });
                    }
                  }
                  continue;
                }
              }
            }
          } catch {
            // continue with next
          }
        }
      } finally {
        backgroundSyncRunningRef.current = false;
      }
    };
    // Run once immediately (if lists exist), then every ~3 minutes
    setTimeout(() => {
      run().catch(() => (backgroundSyncRunningRef.current = false));
    }, 1000);
    const interval = setInterval(() => {
      run().catch(() => (backgroundSyncRunningRef.current = false));
    }, 180000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings?.autoSyncEnabled,
    settings?.preferBasalamFromMixin,
    settings?.preferMixinFromBasalam,
    mixinCredentials,
    basalamCredentials,
    globalMixinProducts,
    globalBasalamProducts,
  ]);
  // Background auto-refresh every 20 seconds
  useEffect(() => {
    if (!(mixinCredentials && basalamCredentials && userData?.vendor?.id))
      return;
    const interval = setInterval(() => {
      loadAllProductsForComparison();
      setIsLoadingGlobalLists(false);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [mixinCredentials, basalamCredentials, userData?.vendor?.id]);

  const {
    data: mixinProducts,
    isLoading: isMixinLoading,
    error: mixinError,
  } = useQuery({
    queryKey: ["mixinProducts"],
    queryFn: () => mixinApi.getProducts(mixinCredentials!),
    enabled: !!mixinCredentials?.url && !!mixinCredentials?.access_token,
    retry: 1,
    staleTime: 30000,
  });

  const {
    data: basalamProducts,
    isLoading: isBasalamLoading,
    error: basalamError,
  } = useQuery({
    queryKey: ["basalamProducts", userData?.vendor?.id],
    queryFn: async () => {
      if (!userData?.vendor?.id) {
        throw new Error("Vendor ID is required to fetch Basalam products");
      }
      return basalamApi.getProducts(basalamCredentials!, userData.vendor.id);
    },
    enabled: false, // Disabled: we use aggregate endpoint instead
    retry: 1,
    staleTime: 30000,
  });

  useEffect(() => {
    console.log("=== Debug Information ===");
    console.log("Mixin Products:", mixinProducts);
    console.log("Basalam Products:", basalamProducts);
    console.log("User Data:", userData);
    console.log("Mixin Credentials:", mixinCredentials);
    console.log("Basalam Credentials:", basalamCredentials);
    console.log("Mixin Error:", mixinError);
    console.log("Basalam Error:", basalamError);
    console.log("Is Mixin Loading:", isMixinLoading);
    console.log("Is Basalam Loading:", isBasalamLoading);
    console.log("Is User Loading:", isUserLoading);
  }, [
    mixinProducts,
    basalamProducts,
    userData,
    mixinCredentials,
    basalamCredentials,
    mixinError,
    basalamError,
    isMixinLoading,
    isBasalamLoading,
    isUserLoading,
  ]);

  const getCommonProducts = () => {
    // Use only full global lists populated by aggregate endpoints
    const mixinSource = globalMixinProducts;
    const basalamSource = globalBasalamProducts;

    if (!mixinSource || !basalamSource) {
      return {
        commonMixinProducts: [],
        commonBasalamProducts: [],
        uniqueMixinProducts: [],
        uniqueBasalamProducts: [],
      };
    }

    const mixinProductsArray = mixinSource;
    const basalamProductsArray = basalamSource;

    console.log("Processing Mixin Products:", mixinProductsArray);
    console.log("Processing Basalam Products:", basalamProductsArray);

    // Enhanced normalization function to handle Unicode characters, special cases, and Persian/English numbers
    const normalize = (s: string | undefined) => {
      if (!s) return "";

      return (
        s
          .trim()
          .toLowerCase()
          // Remove zero-width characters
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          // Convert Persian numbers to English numbers
          .replace(/[۰-۹]/g, (match) => {
            const persianToEnglish: { [key: string]: string } = {
              "۰": "0",
              "۱": "1",
              "۲": "2",
              "۳": "3",
              "۴": "4",
              "۵": "5",
              "۶": "6",
              "۷": "7",
              "۸": "8",
              "۹": "9",
            };
            return persianToEnglish[match] || match;
          })
          // Convert Arabic-Indic numbers to English numbers (if any)
          .replace(/[٠-٩]/g, (match) => {
            const arabicToEnglish: { [key: string]: string } = {
              "٠": "0",
              "١": "1",
              "٢": "2",
              "٣": "3",
              "٤": "4",
              "٥": "5",
              "٦": "6",
              "٧": "7",
              "٨": "8",
              "٩": "9",
            };
            return arabicToEnglish[match] || match;
          })
          // Normalize different types of spaces
          .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
          // Normalize different types of dots
          .replace(/[.\u2024\u2025\u2026\u002E]/g, ".")
          // Normalize different types of dashes
          .replace(/[-\u2010-\u2015\u2212]/g, "-")
          // Normalize multiplication sign (×) - handle different Unicode variants
          .replace(/[×\u00D7\u2715\u2716]/g, "×")
          // Remove extra spaces
          .replace(/\s+/g, " ")
          .trim()
      );
    };

    const commonMixinProducts = mixinProductsArray.filter(
      (mixinProduct: MixinProduct) => {
        if (!mixinProduct?.name) return false;

        const hasMatch = basalamProductsArray.some(
          (basalamProduct: BasalamProduct) => {
            if (!basalamProduct?.title) return false;

            const isMatch =
              normalize(basalamProduct.title) === normalize(mixinProduct.name);
            return isMatch;
          },
        );

        return hasMatch;
      },
    );

    const commonBasalamProducts = basalamProductsArray.filter(
      (basalamProduct: BasalamProduct) => {
        if (!basalamProduct?.title) return false;

        const hasMatch = mixinProductsArray.some(
          (mixinProduct: MixinProduct) => {
            if (!mixinProduct?.name) return false;

            const isMatch =
              normalize(mixinProduct.name) === normalize(basalamProduct.title);
            return isMatch;
          },
        );

        return hasMatch;
      },
    );

    const uniqueMixinProducts = mixinProductsArray.filter(
      (mixinProduct: MixinProduct) => {
        if (!mixinProduct?.name) return false;

        return !basalamProductsArray.some((basalamProduct: BasalamProduct) => {
          if (!basalamProduct?.title) return false;

          return (
            normalize(basalamProduct.title) === normalize(mixinProduct.name)
          );
        });
      },
    );

    const uniqueBasalamProducts = basalamProductsArray.filter(
      (basalamProduct: BasalamProduct) => {
        if (!basalamProduct?.title) return false;

        return !mixinProductsArray.some((mixinProduct: MixinProduct) => {
          if (!mixinProduct?.name) return false;

          return (
            normalize(mixinProduct.name) === normalize(basalamProduct.title)
          );
        });
      },
    );

    // Ensure same ordering across columns by normalized name
    commonMixinProducts.sort((a: MixinProduct, b: MixinProduct) =>
      normalize(a.name).localeCompare(normalize(b.name)),
    );
    commonBasalamProducts.sort((a: BasalamProduct, b: BasalamProduct) =>
      normalize(a.title).localeCompare(normalize(b.title)),
    );
    uniqueMixinProducts.sort((a: MixinProduct, b: MixinProduct) =>
      normalize(a.name).localeCompare(normalize(b.name)),
    );
    uniqueBasalamProducts.sort((a: BasalamProduct, b: BasalamProduct) =>
      normalize(a.title).localeCompare(normalize(b.title)),
    );

    console.log("Common Mixin Products:", commonMixinProducts);
    console.log("Common Basalam Products:", commonBasalamProducts);
    console.log("Unique Mixin Products:", uniqueMixinProducts);
    console.log("Unique Basalam Products:", uniqueBasalamProducts);

    // Additional debugging for product counts
    console.log(`📊 Product Counts Summary:`);
    console.log(`   Total Mixin Products: ${mixinProductsArray.length}`);
    console.log(`   Total Basalam Products: ${basalamProductsArray.length}`);
    console.log(`   Common Products: ${commonMixinProducts.length}`);
    console.log(`   Unique Mixin Products: ${uniqueMixinProducts.length}`);
    console.log(`   Unique Basalam Products: ${uniqueBasalamProducts.length}`);

    // Verify that common products are properly matched
    if (commonMixinProducts.length > 0 && commonBasalamProducts.length > 0) {
      console.log(`✅ Found ${commonMixinProducts.length} common products`);
      console.log(
        "Sample common products:",
        commonMixinProducts.slice(0, 3).map((p: MixinProduct) => p.name),
      );
    } else {
      console.log(
        "⚠️ No common products found - this might indicate a matching issue",
      );
    }

    return {
      commonMixinProducts,
      commonBasalamProducts,
      uniqueMixinProducts,
      uniqueBasalamProducts,
    };
  };

  const {
    commonMixinProducts,
    commonBasalamProducts,
    uniqueMixinProducts,
    uniqueBasalamProducts,
  } = getCommonProducts();

  // Sync uniques into global products store for cross-page usage
  const setUniqueLists = useProductsStore((s) => s.setUniqueLists);
  const storeAppendLog = useGlobalUiStore((s: any) => s.appendLog);
  const globalLogs = useGlobalUiStore((s: any) => s.logs);
  useEffect(() => {
    try {
      setUniqueLists(uniqueMixinProducts, uniqueBasalamProducts);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueMixinProducts, uniqueBasalamProducts]);

  useEffect(() => {
    console.log("=== Product Data Debug ===");
    console.log("Mixin Products:", mixinProducts);
    console.log("Basalam Products:", basalamProducts);
    console.log("Common Mixin Products:", commonMixinProducts);
    console.log("Common Basalam Products:", commonBasalamProducts);
    console.log("Unique Mixin Products:", uniqueMixinProducts);
    console.log("Unique Basalam Products:", uniqueBasalamProducts);
  }, [
    mixinProducts,
    basalamProducts,
    commonMixinProducts,
    commonBasalamProducts,
    uniqueMixinProducts,
    uniqueBasalamProducts,
  ]);

  // Automatic migration check - runs when unique products change
  useEffect(() => {
    if (!settings.autoMigrationEnabled || !uniqueMixinProducts.length) return;

    const checkAndTriggerMigration = () => {
      const currentUniqueCount = uniqueMixinProducts.length;
      const threshold = settings.autoMigrationThreshold;

      console.log(
        `Auto-migration check: ${currentUniqueCount} unique products, threshold: ${threshold}`,
      );

      if (currentUniqueCount >= threshold) {
        console.log(
          `Auto-migration triggered: ${currentUniqueCount} >= ${threshold}`,
        );
        // Trigger automatic migration process in BulkMigrationPanel
        setAutoMigrationTriggerCount((prev) => prev + 1);
      }
    };

    // Check immediately if conditions are met
    checkAndTriggerMigration();

    // Set up interval to check every 30 min
    const migrationInterval = setInterval(checkAndTriggerMigration, 1800000);

    return () => clearInterval(migrationInterval);
  }, [
    settings.autoMigrationEnabled,
    settings.autoMigrationThreshold,
    uniqueMixinProducts,
  ]);

  const handleProductClick = async (
    productId: number,
    type: "mixin" | "basalam",
  ) => {
    try {
      console.log("=== Product Click Debug ===");
      console.log("Product ID:", productId);
      console.log("Type:", type);

      let product: MixinProduct | BasalamProduct | null = null;

      if (type === "mixin" && mixinCredentials) {
        console.log("Fetching Mixin product details...");
        const fullProduct = await mixinApi.getProductById(
          mixinCredentials,
          productId,
        );
        console.log("Full Mixin product data:", fullProduct);

        if (fullProduct) {
          product = {
            ...fullProduct,
            description: fullProduct.description || "",
          };
          console.log("Processed Mixin product with description:", product);
        }
      } else if (type === "basalam" && basalamCredentials) {
        console.log("Fetching Basalam product details...");
        product = await basalamApi.getProductById(
          basalamCredentials,
          productId,
        );
        console.log("Full Basalam product data:", product);
      }

      if (product) {
        console.log("Setting selected product:", product);
        setSelectedProduct(product);
        setModalType(type);
        setIsModalOpen(true);
      } else {
        throw new Error("Failed to fetch product details");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert(
        "خطا در دریافت محصول، لطفاً از اتصال اینترنت خود اطمینان حاصل کنید و یا پروکسی خود را در صورتی که متصل است، خاموش کنید!",
      );
    }
  };

  const handleOpenCreateBasalamModal = (product: MixinProduct) => {
    setProductToCreateInBasalam(product);
    setIsCreateBasalamModalOpen(true);
  };

  const isLoading =
    isUserLoading || isMixinLoading || isBasalamLoading || isLoadingGlobalLists;

  // Automation Banner component
  const AutomationBanner = () => {
    return (
      <div
        className="bg-gradient-to-r from-[#5b9fdb]/20 to-[#ff6040]/20 backdrop-blur-md rounded-lg p-6 mb-6 shadow-lg border border-[#5b9fdb]/30"
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          {/* Icon for realtime update banner */}
          <div className="flex-shrink-0 ml-6">
            <div className="bg-gradient-to-tr from-[#5b9fdb]/20 to-[#ff6040]/30 rounded-lg p-3 shadow-lg flex items-center justify-center">
              <FolderSync size={32} className="w-8 h-8 text-[#ff6040]" />
            </div>
          </div>
          <div className="flex-1 text-right">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              میخوای هر تغییری که توی میکسین میدی همونجا روی محصولاتت توی
              باسلامم اعمال شه؟
            </h3>
            <p className="text-gray-600 text-sm">
              دکمه رو بزن که بریم فعالش کنیم
            </p>
          </div>
          <div className="mr-6">
            <button
              onClick={() => navigate("/settings")}
              className="bg-gradient-to-r from-[#5b9fdb] to-[#ff6040] text-white px-6 py-3 rounded-lg font-semibold hover:from-[#4a8bc7] hover:to-[#e5553a] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              اتوماتیک کن!
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5b9fdb]/10 to-[#ff6040]/10">
      <button
        onClick={() => {
          setIsSidebarCollapsed(false);
          setIsSidebarOpen(true);
        }}
        className={`fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isSidebarCollapsed ? "block" : "hidden"}`}
      >
        <Menu size={24} />
      </button>

      <aside
        className={`fixed top-0 right-0 h-full bg-white/80 backdrop-blur-md shadow-lg transform transition-all duration-300 ease-in-out z-40 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"} ${isSidebarCollapsed ? "w-0" : "w-64"}`}
      >
        <div
          className={`p-6 h-full flex flex-col ${isSidebarCollapsed ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        >
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
              {isSidebarCollapsed ? (
                <ChevronLeft size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-[#5b9fdb]/10 rounded-lg hover:bg-[#5b9fdb]/20 transition-colors"
            >
              <Home size={20} />
              {!isSidebarCollapsed && <span>داشبورد</span>}
            </a>

            <button
              onClick={() => navigate("/migration")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <Package size={20} />
              {!isSidebarCollapsed && <span>انتقال گروهی محصولات</span>}
            </button>

            <button
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <Crown size={20} />
              {!isSidebarCollapsed && <span>وضعیت پلن</span>}
            </button>

            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <BarChart2 size={20} />
              {!isSidebarCollapsed && <span>آمار و گزارشات</span>}
            </a>

            <button
              onClick={() => navigate("/support")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <Link2 size={20} />
              {!isSidebarCollapsed && <span>ارتباط با پشتیبانی</span>}
            </button>

            <button
              onClick={() => navigate("/settings")}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#5b9fdb]/10 rounded-lg transition-colors"
            >
              <Settings size={20} />
              {!isSidebarCollapsed && <span>تنظیمات</span>}
            </button>
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] text-white rounded-lg hover:from-[#ff6040]/90 hover:to-[#5b9fdb]/90 transition-all duration-200 shadow-md hover:shadow-lg ${isSidebarCollapsed ? "px-3" : ""}`}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>خروج</span>}
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ${isSidebarOpen ? (isSidebarCollapsed ? "lg:mr-0" : "lg:mr-64") : "mr-0"}`}
      >
        <header className="sticky top-0 bg-white/60 backdrop-blur-md shadow-lg z-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#fa6b23] to-[#fa864b] bg-clip-text text-transparent">
                  به سایت میکسین سلام خیلی خوش آمدید
                </h1>
                <p className="text-gray-600">
                  سپاس بابت اینکه ما را انتخاب کردید
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          <HomePageTour />

          {/* Automation Banner */}
          <div id="realtime-automation-banner">
            <AutomationBanner />
          </div>

          <div
            id="statistic-section"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#5b9fdb]/10 to-[#5b9fdb]/20 rounded-lg">
                  <Layers className="w-8 h-8 text-[#5b9fdb]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">تعداد کل محصولات</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[#5b9fdb] to-[#5b9fdb]/80 bg-clip-text text-transparent">
                    {(commonMixinProducts?.length || 0) +
                      (uniqueMixinProducts?.length || 0) +
                      (uniqueBasalamProducts?.length || 0)}
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
                    {(uniqueMixinProducts?.length || 0) +
                      (uniqueBasalamProducts?.length || 0)}
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
            {/* Log banner under stats and before lists */}
            <LogBanner
              logs={globalLogs}
              onOpenLink={(e) => {
                if (e.url) window.open(e.url, "_blank");
              }}
            />
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              id="product-list"
            >
              <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    محصولات مشترک در میکسین
                  </h3>
                  <button
                    onClick={() =>
                      setIsCommonMixinSectionOpen(!isCommonMixinSectionOpen)
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isCommonMixinSectionOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>

                {isCommonMixinSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {!mixinCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        لطفا ابتدا به میکسین متصل شوید
                      </div>
                    ) : isMixinLoading || isBasalamLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b9fdb] mx-auto"></div>
                        <p className="mt-2 text-gray-600">
                          در حال بارگذاری محصولات...
                        </p>
                      </div>
                    ) : commonMixinProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        محصول مشترکی یافت نشد
                      </div>
                    ) : (
                      commonMixinProducts.map((product: MixinProduct) => (
                        <div
                          key={product.id}
                          onClick={() =>
                            handleProductClick(product.id, "mixin")
                          }
                          className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 text-right group"
                          dir="rtl"
                        >
                          <h3 className="font-medium text-gray-800 group-hover:text-[#5b9fdb] transition-colors">
                            {cleanHtmlText(product.name)}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            قیمت:{" "}
                            {product.price
                              ? formatPrice(product.price)
                              : "قیمت نامشخص"}{" "}
                            تومان
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    محصولات مشترک در باسلام
                  </h3>
                  <button
                    onClick={() =>
                      setIsCommonBasalamSectionOpen(!isCommonBasalamSectionOpen)
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isCommonBasalamSectionOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>

                {isCommonBasalamSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {!basalamCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        لطفا ابتدا به باسلام متصل شوید
                      </div>
                    ) : isUserLoading || isBasalamLoading || isMixinLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6040] mx-auto"></div>
                        <p className="mt-2 text-gray-600">
                          در حال بارگذاری محصولات...
                        </p>
                      </div>
                    ) : commonBasalamProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        محصول مشترکی یافت نشد
                      </div>
                    ) : (
                      commonBasalamProducts.map((product: BasalamProduct) => (
                        <div
                          key={product.id}
                          onClick={() =>
                            handleProductClick(product.id, "basalam")
                          }
                          className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 text-right group"
                          dir="rtl"
                        >
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {cleanHtmlText(product.title)}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            قیمت:{" "}
                            {product.price
                              ? formatPrice(rialToToman(product.price))
                              : "قیمت نامشخص"}{" "}
                            تومان
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12">
            {/* Product migration panel banner, button and panel*/}
            <BulkMigrationPanel
              mixinCredentials={mixinCredentials}
              basalamCredentials={basalamCredentials}
              vendorId={userData?.vendor?.id}
              queryClient={queryClient}
              uniqueMixinProducts={uniqueMixinProducts}
              setQuotaErrorModal={setQuotaErrorModal}
              autoMigrationTriggerCount={autoMigrationTriggerCount}
            />

            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-[#ff9233] to-[#ffa454] bg-clip-text text-transparent">
              محصولات غیرمشترک در باسلام و میکسین
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    محصولات منحصر به میکسین
                  </h3>
                  <button
                    onClick={() => setIsMixinSectionOpen(!isMixinSectionOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isMixinSectionOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>

                {isMixinSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {!mixinCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        لطفا ابتدا به میکسین متصل شوید
                      </div>
                    ) : isLoadingGlobalLists ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">
                          در حال بارگذاری محصولات میکسین...
                        </p>
                      </div>
                    ) : uniqueMixinProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        محصول منحصر به میکسین یافت نشد
                      </div>
                    ) : (
                      uniqueMixinProducts.map((product: MixinProduct) => (
                        <div
                          key={product.id}
                          onClick={() =>
                            handleProductClick(product.id, "mixin")
                          }
                          className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 text-right group"
                          dir="rtl"
                        >
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {cleanHtmlText(product.name)}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            قیمت:{" "}
                            {product.price
                              ? formatPrice(product.price)
                              : "قیمت نامشخص"}{" "}
                            تومان
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    محصولات منحصر به باسلام
                  </h3>
                  <button
                    onClick={() =>
                      setIsBasalamSectionOpen(!isBasalamSectionOpen)
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isBasalamSectionOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>

                {isBasalamSectionOpen && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {!basalamCredentials ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        لطفا ابتدا به باسلام متصل شوید
                      </div>
                    ) : isUserLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">
                          در حال بارگذاری اطلاعات کاربر...
                        </p>
                      </div>
                    ) : isBasalamLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">
                          در حال بارگذاری محصولات باسلام...
                        </p>
                      </div>
                    ) : uniqueBasalamProducts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        محصول منحصر به باسلام یافت نشد
                      </div>
                    ) : (
                      uniqueBasalamProducts.map((product: BasalamProduct) => (
                        <div
                          key={product.id}
                          onClick={() =>
                            handleProductClick(product.id, "basalam")
                          }
                          className="p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 text-right group"
                          dir="rtl"
                        >
                          <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {cleanHtmlText(product.title)}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            قیمت:{" "}
                            {product.price
                              ? formatPrice(rialToToman(product.price))
                              : "قیمت نامشخص"}{" "}
                            تومان
                          </p>
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
          globalMixinProducts={globalMixinProducts}
          globalBasalamProducts={globalBasalamProducts}
          onOpenCreateBasalamModal={handleOpenCreateBasalamModal}
          setQuotaErrorModal={setQuotaErrorModal}
        />

        {(isLoading || isLoadingGlobalLists) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-[#5b9fdb] border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] bg-clip-text text-transparent mb-2">
                  در حال بارگذاری...
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  لطفاً صبر کنید تا اطلاعات محصولات بارگذاری شود
                </p>

                {/* Progress tracking for both platforms */}
                <div className="w-full space-y-4">
                  {/* Mixin Progress */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          loadingProgress.mixin.status === "completed"
                            ? "bg-green-500"
                            : loadingProgress.mixin.status === "error"
                              ? "bg-red-500"
                              : loadingProgress.mixin.status === "loading"
                                ? "bg-blue-500 animate-pulse"
                                : "bg-gray-300"
                        }`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        میکسین
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {loadingProgress.mixin.status === "loading" &&
                      loadingProgress.mixin.total > 0
                        ? `${loadingProgress.mixin.current} از ${loadingProgress.mixin.total}`
                        : loadingProgress.mixin.status === "completed"
                          ? "تکمیل شد"
                          : loadingProgress.mixin.status === "error"
                            ? "خطا"
                            : "در انتظار"}
                    </div>
                  </div>

                  {/* Basalam Progress */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          loadingProgress.basalam.status === "completed"
                            ? "bg-green-500"
                            : loadingProgress.basalam.status === "error"
                              ? "bg-red-500"
                              : loadingProgress.basalam.status === "loading"
                                ? "bg-blue-500 animate-pulse"
                                : "bg-gray-300"
                        }`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        باسلام
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {loadingProgress.basalam.status === "loading" &&
                      loadingProgress.basalam.total > 0
                        ? `${loadingProgress.basalam.current} از ${loadingProgress.basalam.total}`
                        : loadingProgress.basalam.status === "completed"
                          ? "تکمیل شد"
                          : loadingProgress.basalam.status === "error"
                            ? "خطا"
                            : "در انتظار"}
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  {(loadingProgress.mixin.status === "loading" ||
                    loadingProgress.basalam.status === "loading") && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div
                        className="bg-gradient-to-r from-[#ff6040] to-[#5b9fdb] h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(() => {
                            const mixinProgress =
                              loadingProgress.mixin.status === "completed"
                                ? 50
                                : loadingProgress.mixin.status === "loading"
                                  ? 25
                                  : 0;
                            const basalamProgress =
                              loadingProgress.basalam.status === "completed"
                                ? 50
                                : loadingProgress.basalam.status === "loading"
                                  ? 25
                                  : 0;
                            return mixinProgress + basalamProgress;
                          })()}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
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

        {isCreateBasalamModalOpen &&
          productToCreateInBasalam &&
          userData?.vendor?.id && (
            <CreateBasalamProductModal
              open={isCreateBasalamModalOpen}
              onClose={() => setIsCreateBasalamModalOpen(false)}
              mixinProduct={productToCreateInBasalam}
              queryClient={queryClient} // Pass queryClient here
              vendorId={userData.vendor.id}
            />
          )}
      </div>

      {/* Quota Exceeded Modal */}
      <QuotaExceededModal
        isOpen={quotaErrorModal.isOpen}
        onClose={() => setQuotaErrorModal({ isOpen: false, type: "migration" })}
        type={quotaErrorModal.type}
      />
    </div>
  );
}

export default HomePage;
