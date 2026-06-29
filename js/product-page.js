import { subscribeToCart } from "./cart-store.js?v=20260615a"
import {
  addCartItemWithInventory,
  getInventoryStatus,
  subscribeToInventory
} from "./inventory-store.js?v=20260619a"
import { trackProductImageView, trackViewItem } from "./analytics-events.js?v=20260602c"
import { getCurrentUser, subscribeToAuthState } from "./firebase-auth.js?v=20260504i"
import {
  deleteReview,
  getReviewSummary,
  saveGuestRating,
  saveReview,
  subscribeToProductReviews,
  subscribeToProductReviewSummary,
  subscribeToReviewSummaries
} from "./firebase-reviews.js?v=20260618b"
import {
  applyResponsiveImage,
  buildResponsiveImageMarkup,
  buildProductUrl,
  formatPrice,
  getAllProducts,
  getProductById,
  getProductIdFromPageUrl,
  getProductImageSources
} from "./product-catalog.js?v=20260617b"
import {
  bindCardNavigation,
  buildRatingSummaryMarkup,
  buildStarMarkup,
  emitToast,
  escapeHtml,
  formatReviewDate,
  primeRatingsCache,
  shareProduct
} from "./ui-utils.js?v=20260627a"
import {
  getActiveOfferForProduct,
  getOfferDisplayData,
  getProductOfferPricing,
  subscribeToProductOffers
} from "./offers-data.js?v=20260624a"
import { applyTranslations, initI18n, t } from "./i18n/i18n.js?v=20260629productdetailsi18n"
import { getProductDisplayData } from "./i18n/product-display.js?v=20260629titlebidi"

const FALLBACK_IMAGE = "images/optimized/Logo.webp"
let offerPricingWarningShown = false

function getProductUiText(key, fallback = "", values = {}) {
  return t(`productUi.${key}`, fallback, values)
}

function getProductUiCountText(key, count, fallback = "", values = {}) {
  const suffix = Number(count) === 1 ? "" : "_plural"
  return getProductUiText(`${key}${suffix}`, fallback, { count, ...values })
}

function resolveProductOfferPricing(product) {
  const catalogPrice = Math.max(0, Number(product?.price) || 0)

  try {
    const pricing = getProductOfferPricing(product)
    const finalPrice = Number(pricing?.finalPrice)
    const originalPrice = Number(pricing?.originalPrice)

    if (Number.isFinite(finalPrice) && finalPrice > 0) {
      return {
        originalPrice: Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : catalogPrice,
        finalPrice,
        savings: Math.max(0, Number(pricing?.savings) || 0),
        offer: pricing?.offer || null
      }
    }
  } catch (error) {
    if (!offerPricingWarningShown) {
      offerPricingWarningShown = true
      console.warn("Offer pricing could not be resolved; using catalog prices.", error)
    }
  }

  return {
    originalPrice: catalogPrice,
    finalPrice: catalogPrice,
    savings: 0,
    offer: null
  }
}

function bindImageFallback(image) {
  if (!image || image.dataset.fallbackBound === "true") {
    return
  }

  image.dataset.fallbackBound = "true"
  image.addEventListener("error", () => {
    const fallback = image.dataset.fallbackSrc || FALLBACK_IMAGE
    if (image.getAttribute("src") !== fallback) {
      image.src = fallback
      return
    }

    if (fallback !== FALLBACK_IMAGE && image.getAttribute("src") !== FALLBACK_IMAGE) {
      image.src = FALLBACK_IMAGE
    }
  })
}

function renderThumbnails(imageSources, mainImageEl, productName, onImageChange) {
  const thumbsContainer = document.getElementById("productThumbs")
  const safeImages = Array.isArray(imageSources)
    ? imageSources.filter((imageSource) => imageSource && imageSource.fallback)
    : []

  if (!thumbsContainer || !mainImageEl) {
    return
  }

  bindImageFallback(mainImageEl)

  const updateActiveImage = (imageSource, index = 0, shouldTrack = false) => {
    const alt = productName || "Selected product image"
    const sourceData = applyResponsiveImage(mainImageEl, imageSource.fallback, {
      alt,
      width: 600,
      height: 600,
      loading: "eager",
      fetchpriority: "high",
      sizes: "(max-width: 991px) 92vw, 560px"
    })
    mainImageEl.dataset.fallbackSrc = imageSource.fallback

    if (typeof onImageChange === "function") {
      onImageChange(sourceData?.optimized || imageSource.optimized || imageSource.fallback, alt, imageSource.fallback)
    }

    if (shouldTrack) {
      trackProductImageView(mainImageEl.closest(".product_main_image")?.getAttribute("data-product-id") || "", index)
    }
  }

  thumbsContainer.innerHTML = ""

  if (!safeImages.length) {
    mainImageEl.removeAttribute("src")
    mainImageEl.alt = productName || "Selected product image"

    if (typeof onImageChange === "function") {
      onImageChange("", mainImageEl.alt, "")
    }

    return
  }

  updateActiveImage(safeImages[0], 0, false)

  safeImages.forEach((imageSource, index) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = `thumb_btn${index === 0 ? " active" : ""}`

    button.innerHTML = buildResponsiveImageMarkup({
      imagePath: imageSource.fallback,
      alt: `${productName || "Product"} view ${index + 1}`,
      width: 96,
      height: 96,
      loading: "lazy",
      sizes: "96px"
    })
    const image = button.querySelector("img")
    bindImageFallback(image)

    button.addEventListener("click", () => {
      updateActiveImage(imageSource, index, true)
      thumbsContainer.querySelectorAll(".thumb_btn").forEach((thumb) => {
        thumb.classList.remove("active")
      })
      button.classList.add("active")
    })

    thumbsContainer.appendChild(button)
  })
}

function renderComponents(sectionEl, listEl, components) {
  const safeComponents = Array.isArray(components) ? components.filter(Boolean) : []
  const shouldCollapse = safeComponents.length >= 8
  let isExpanded = false

  if (!sectionEl || !listEl) {
    return
  }

  sectionEl.hidden = safeComponents.length === 0
  listEl.innerHTML = ""
  sectionEl.querySelector(".product_components_toggle")?.remove()

  const paintComponents = () => {
    listEl.innerHTML = ""
    const visibleComponents = shouldCollapse && !isExpanded ? safeComponents.slice(0, 5) : safeComponents

    visibleComponents.forEach((component) => {
      const item = document.createElement("li")
      item.textContent = component
      listEl.appendChild(item)
    })
  }

  paintComponents()

  if (shouldCollapse) {
    const hiddenCount = safeComponents.length - 5
    const toggleButton = document.createElement("button")
    toggleButton.type = "button"
    toggleButton.className = "product_components_toggle"
    toggleButton.textContent = getProductUiText("showMoreComponents", `Show ${hiddenCount} more`, { count: hiddenCount })
    toggleButton.addEventListener("click", () => {
      isExpanded = !isExpanded
      paintComponents()
      toggleButton.textContent = isExpanded
        ? getProductUiText("showLessComponents", "Show less")
        : getProductUiText("showMoreComponents", `Show ${hiddenCount} more`, { count: hiddenCount })
    })
    sectionEl.appendChild(toggleButton)
  }
}

function renderItemDetails(sectionEl, listEl, itemDetails) {
  const safeItemDetails = Array.isArray(itemDetails)
    ? itemDetails.filter((detail) => detail && detail.label && detail.value)
    : []

  if (!sectionEl || !listEl) {
    return
  }

  sectionEl.hidden = safeItemDetails.length === 0
  listEl.innerHTML = ""

  safeItemDetails.forEach((detail) => {
    const row = document.createElement("div")
    row.className = "product_spec_row"

    const term = document.createElement("dt")
    term.textContent = getProductDetailLabel(detail.label)

    const value = document.createElement("dd")
    value.textContent = detail.value

    row.appendChild(term)
    row.appendChild(value)
    listEl.appendChild(row)
  })
}

function getProductDetailLabel(label) {
  const normalizedLabel = String(label || "").trim().replace(/:$/, "").toLowerCase()
  const labelKeyMap = {
    ingredients: "ingredients",
    components: "components",
    "how to use": "howToUse",
    "storage instructions": "storageInstructions"
  }
  const key = labelKeyMap[normalizedLabel]
  return key ? getProductUiText(key, label) : label
}

function appendInlineSegments(parentEl, segments) {
  ;(Array.isArray(segments) ? segments : []).forEach((segment) => {
    if (typeof segment === "string") {
      parentEl.appendChild(document.createTextNode(segment))
      return
    }

    if (!segment || !segment.text) {
      return
    }

    if (segment.href) {
      const link = document.createElement("a")
      link.className = "product_story_link"
      link.href = segment.href
      link.textContent = segment.text
      parentEl.appendChild(link)
      return
    }

    parentEl.appendChild(document.createTextNode(segment.text))
  })
}

function renderDescriptionSection(sectionEl, titleEl, leadEl, bodyEl, product) {
  const leadText = product.longDescriptionIntro || product.description || ""
  const descriptionBlocks = Array.isArray(product.descriptionBlocks) ? product.descriptionBlocks : []
  const hasContent = Boolean(leadText) || descriptionBlocks.length > 0

  if (!sectionEl || !titleEl || !leadEl || !bodyEl) {
    return
  }

  sectionEl.hidden = !hasContent
  titleEl.textContent = product.longDescriptionTitle || product.name
  leadEl.textContent = leadText
  leadEl.hidden = !leadText
  bodyEl.innerHTML = ""

  descriptionBlocks.forEach((block) => {
    if (!block) {
      return
    }

    const blockEl = document.createElement("div")
    blockEl.className = "product_story_block"

    if (block.title) {
      const heading = document.createElement("h4")
      heading.textContent = block.title
      blockEl.appendChild(heading)
    }

    if (block.type === "list") {
      const list = document.createElement("ul")
      list.className = "product_story_list"

      ;(Array.isArray(block.items) ? block.items : []).forEach((item) => {
        const listItem = document.createElement("li")
        listItem.textContent = item
        list.appendChild(listItem)
      })

      blockEl.appendChild(list)
    } else if (Array.isArray(block.segments)) {
      const paragraph = document.createElement("p")
      appendInlineSegments(paragraph, block.segments)
      blockEl.appendChild(paragraph)
    } else if (block.text) {
      const paragraph = document.createElement("p")
      paragraph.textContent = block.text
      blockEl.appendChild(paragraph)
    }

    bodyEl.appendChild(blockEl)
  })
}

function getRecommendationLabel(summary, cartQuantity) {
  const totalReviews = summary ? summary.totalReviews : 0
  const averageRating = summary ? summary.averageRating : 0

  if (cartQuantity > 0) {
    return getProductUiText("popularInCart", "Popular in cart")
  }

  if (averageRating >= 4.5 && totalReviews >= 2) {
    return getProductUiText("topRated", "Top rated")
  }

  if (totalReviews >= 3) {
    return getProductUiText("bestReviewed", "Best reviewed")
  }

  if (averageRating >= 4) {
    return getProductUiText("highlyRated", "Highly rated")
  }

  return getProductUiText("freshPick", "Fresh pick")
}

function getRecommendationScore(summary, cartQuantity) {
  const totalReviews = summary ? summary.totalReviews : 0
  const averageRating = summary ? summary.averageRating : 0

  return (averageRating * 100) + (Math.min(totalReviews, 20) * 12) + (cartQuantity * 20)
}

function getRecommendationPriceMarkup(product) {
  const pricing = resolveProductOfferPricing(product)
  if (!pricing.offer) return escapeHtml(formatPrice(pricing.finalPrice))
  return `<span class="product_offer_price_stack"><del class="product_offer_original_price">${escapeHtml(formatPrice(pricing.originalPrice))}</del><strong class="product_offer_discounted_price">${escapeHtml(formatPrice(pricing.finalPrice))}</strong></span>`
}

function getProductDetailStockMessage(status) {
  if (!status) {
    return ""
  }

  if (status.isOutOfStock) {
    return getProductUiText("outOfStock", "Out of Stock")
  }

  if (status.isLowStock && Number.isFinite(status.available)) {
    return getProductUiText("onlyLeft", "Only {count} left", { count: status.available })
  }

  if (status.tracked && Number.isFinite(status.available) && status.available > 0) {
    return getProductUiText("inStock", "In Stock")
  }

  return status.message || ""
}

function getProductCardStockStatusText(status) {
  if (!status || !status.message) {
    return ""
  }

  if (status.isOutOfStock) {
    return getProductUiText("outOfStock", "Out of Stock")
  }

  if (status.isLowStock && Number.isFinite(status.available)) {
    return getProductUiText("onlyLeft", "Only {count} left", { count: status.available })
  }

  return status.message
}

function getQuantityLimitMessage(status) {
  if (!status || !status.tracked || !Number.isFinite(status.available) || status.available <= 0) {
    return ""
  }

  return getProductUiCountText(
    "onlyItemsAvailable",
    status.available,
    `Only ${status.available} item${status.available === 1 ? "" : "s"} available.`
  )
}

function renderRecommendations(container, currentProduct, products, reviewSummaries, cart) {
  if (!container || !currentProduct) {
    return
  }

  const preferredProductIds = Array.isArray(currentProduct.recommendedProductIds)
    ? currentProduct.recommendedProductIds
    : []
  const preferredRanks = new Map(preferredProductIds.map((productId, index) => [productId, index]))
  const recommendationLimit = preferredProductIds.length ? Math.min(preferredProductIds.length, 6) : 3
  const cartPopularity = (Array.isArray(cart) ? cart : []).reduce((accumulator, item) => {
    accumulator[item.id] = (accumulator[item.id] || 0) + (Number(item.quantity) || 0)
    return accumulator
  }, {})

  const recommendations = (Array.isArray(products) ? products : [])
    .filter((candidate) => candidate && candidate.id !== currentProduct.id)
    .map((candidate, index) => {
      const summary = reviewSummaries[candidate.id] || null
      const cartQuantity = cartPopularity[candidate.id] || 0

      return {
        candidate,
        summary,
        cartQuantity,
        index,
        score: getRecommendationScore(summary, cartQuantity) + (preferredRanks.has(candidate.id) ? 100000 - preferredRanks.get(candidate.id) : 0)
      }
    })
    .sort((left, right) => {
      const reviewDifference = (right.summary ? right.summary.totalReviews : 0) - (left.summary ? left.summary.totalReviews : 0)
      const ratingDifference = (right.summary ? right.summary.averageRating : 0) - (left.summary ? left.summary.averageRating : 0)

      return right.score - left.score || reviewDifference || ratingDifference || left.index - right.index
    })
    .slice(0, recommendationLimit)

  if (!recommendations.length) {
    container.innerHTML = `
      <div class="recommendations_empty">
        <p>${escapeHtml(getProductUiText("noRecommendations", "No recommendations are available right now."))}</p>
      </div>
    `
    return
  }

  container.innerHTML = recommendations.map(({ candidate, summary, cartQuantity }) => {
    const productUrl = buildProductUrl(candidate.id)
    const displayCandidate = getProductDisplayData(candidate)
    const inventoryStatus = getInventoryStatus(candidate.id)
    const stockStatusText = getProductCardStockStatusText(inventoryStatus)
    const offer = getActiveOfferForProduct(candidate.id)
    const offerBadge = offer ? getOfferDisplayData(offer).discountLabel : ""

    return `
      <article class="recommendation_card product-card" data-product-id="${escapeHtml(candidate.id)}" data-product-url="${escapeHtml(productUrl)}">
        <div class="recommendation_card_media product-card-media">
          <a class="recommendation_card_image product-image product-card-image" href="${escapeHtml(productUrl)}">
            ${buildResponsiveImageMarkup({
              product: candidate,
              alt: displayCandidate.name,
              width: 600,
              height: 600,
              loading: "lazy",
              sizes: "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 320px"
            })}
          </a>
          ${offerBadge ? `<span class="product_offer_badge">${escapeHtml(offerBadge)}</span>` : ""}
          <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(stockStatusText)}</span>
          <button class="product-share-btn recommendation_share_btn" type="button" data-recommend-share-product-id="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(getProductUiText("shareProduct", "Share {name}", { name: displayCandidate.name }))}" title="${escapeHtml(getProductUiText("share", "Share"))}">
            <i class="fa fa-share-alt" aria-hidden="true"></i>
          </button>
          <button class="product-wishlist-btn recommendation_wishlist_btn" type="button" data-wishlist-product-id="${escapeHtml(candidate.id)}" aria-label="${escapeHtml(getProductUiText("addProductToFavorites", "Add {name} to favorites", { name: displayCandidate.name }))}" aria-pressed="false" title="${escapeHtml(getProductUiText("addToFavorites", "Add to favorites"))}">
            <i class="fa fa-heart-o" aria-hidden="true"></i>
          </button>
        </div>
        <div class="recommendation_card_body product-content">
          <span class="recommendation_card_label">${escapeHtml(getRecommendationLabel(summary, cartQuantity))}</span>
          <div class="recommendation_card_copy">
            <h3 class="product-title"><a href="${escapeHtml(productUrl)}">${escapeHtml(displayCandidate.name)}</a></h3>
            ${buildRatingSummaryMarkup(summary, "recommendation_card_rating", { productId: candidate.id })}
            <p class="product-description">${escapeHtml(displayCandidate.description)}</p>
          </div>
          <div class="recommendation_card_footer product-footer">
            <span class="recommendation_card_price${offer ? " product_card_price--offer" : ""}">${getRecommendationPriceMarkup(candidate)}</span>
            <div class="recommendation_card_actions">
              <a class="recommendation_link" href="${escapeHtml(productUrl)}">${escapeHtml(getProductUiText("viewDetailsLower", "View details"))}</a>
              <button type="button" class="recommendation_add_btn" data-recommend-product-id="${escapeHtml(candidate.id)}" ${inventoryStatus.isOutOfStock ? "disabled aria-disabled=\"true\"" : ""}>${escapeHtml(getProductUiText("addToCartLower", "Add to cart"))}</button>
            </div>
          </div>
        </div>
      </article>
    `
  }).join("")

  container.querySelectorAll(".recommendation_card").forEach((card) => {
    bindCardNavigation(card, card.getAttribute("data-product-url"))
  })

  if (typeof bindImageFallback === "function") {
    container.querySelectorAll("img").forEach((image) => bindImageFallback(image))
  }
  window.dispatchEvent(new CustomEvent("sushi-box:wishlist-controls-ready"))

  container.querySelectorAll("[data-recommend-product-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      const recommendedProduct = getProductById(button.getAttribute("data-recommend-product-id"))

      if (recommendedProduct) {
        addCartItemWithInventory(recommendedProduct, 1, {
          successMessage: getProductUiText("addedToCart", "Product added to cart successfully")
        })
      }
    })
  })
}

function initProductPage() {
  initI18n()

  const productId = getProductIdFromPageUrl()
  const product = getProductById(productId)
  const allProducts = getAllProducts()

  let quantity = 1
  let selectedRating = 0
  let activeUser = null
  let latestReviews = []
  let latestProductSummary = null
  let latestRecommendationSummaries = {}
  let latestCart = []

  const nameEl = document.getElementById("productName")
  const categoryEl = document.getElementById("productCategory")
  const descEl = document.getElementById("productDescription")
  const unitPriceEl = document.getElementById("unitPrice")
  const originalPriceEl = document.getElementById("originalPrice")
  const discountBadgeEl = document.getElementById("discountBadge")
  const totalPriceEl = document.getElementById("totalPrice")
  const qtyInput = document.getElementById("qtyInput")
  const qtyMinus = document.getElementById("qtyMinus")
  const qtyPlus = document.getElementById("qtyPlus")
  const productCheckoutBtn = document.getElementById("productCheckoutBtn")
  const addToCartBtn = document.getElementById("addToCartBtn")
  const productShareBtn = document.getElementById("productShareBtn")
  const productFavoriteBtn = document.getElementById("productFavoriteBtn")
  const mainImageEl = document.getElementById("mainProductImage")
  const mainImageFrame = document.querySelector(".product_main_image")
  const productComponentsSection = document.getElementById("productComponentsSection")
  const productComponentsList = document.getElementById("productComponentsList")
  const productItemDetailsSection = document.getElementById("productItemDetailsSection")
  const productItemDetailsList = document.getElementById("productItemDetailsList")
  const productStorySection = document.getElementById("productStorySection")
  const productStoryTitle = document.getElementById("productStoryTitle")
  const productStoryLead = document.getElementById("productStoryLead")
  const productStoryBody = document.getElementById("productStoryBody")
  const recommendedProductsEl = document.getElementById("recommendedProducts")
  const productRatingStars = document.getElementById("productRatingStars")
  const productRatingText = document.getElementById("productRatingText")
  const averageRatingValue = document.getElementById("averageRatingValue")
  const averageRatingStars = document.getElementById("averageRatingStars")
  const reviewCountValue = document.getElementById("reviewCountValue")
  const ratingSummaryText = document.getElementById("ratingSummaryText")
  const reviewAuthNotice = document.getElementById("reviewAuthNotice")
  const reviewForm = document.getElementById("reviewForm")
  const reviewComment = document.getElementById("reviewComment")
  const reviewSubmitBtn = document.getElementById("reviewSubmitBtn")
  const reviewDeleteBtn = document.getElementById("reviewDeleteBtn")
  const reviewFormStatus = document.getElementById("reviewFormStatus")
  const reviewStars = Array.from(document.querySelectorAll(".review_star_btn"))
  const reviewsList = document.getElementById("reviewsList")
  const lightboxEl = document.getElementById("productImageLightbox")
  const lightboxCloseBtn = document.getElementById("productImageLightboxClose")
  const lightboxStage = document.getElementById("productImageLightboxStage")
  const lightboxImageEl = document.getElementById("productImageLightboxImage")
  const lightboxZoomInBtn = document.getElementById("productImageZoomIn")
  const lightboxZoomOutBtn = document.getElementById("productImageZoomOut")
  const lightboxZoomValue = document.getElementById("productImageZoomValue")

  function renderProductNotFound() {
    if (nameEl) {
      nameEl.removeAttribute("data-i18n")
      nameEl.textContent = getProductUiText("productNotFound", "Product not found")
    }
    if (descEl) {
      descEl.textContent = getProductUiText("backToProducts", "Back to products")
      descEl.hidden = false
    }
    ;[addToCartBtn, productCheckoutBtn, qtyMinus, qtyPlus].forEach((control) => {
      if (control) {
        control.disabled = true
        control.setAttribute("aria-disabled", "true")
      }
    })
    document.querySelectorAll("#productStorySection, #productReviewsSection, .product_recommendations_section").forEach((section) => {
      section.hidden = true
    })
  }

  if (!product) {
    renderProductNotFound()
    return
  }

  let activeImageSrc = ""
  let activeImageFallbackSrc = ""
  let activeImageAlt = getProductDisplayData(product).name || "Selected product image"
  let lightboxZoom = 1

  function setButtonLabel(button, text) {
    if (!button) {
      return
    }

    const label = button.querySelector("[data-product-button-label]")
    if (label) {
      label.textContent = text
      return
    }

    button.textContent = text
  }

  function getOrCreateStockStatusElement() {
    let stockStatusEl = document.getElementById("productStockStatus")
    if (stockStatusEl) {
      return stockStatusEl
    }

    stockStatusEl = document.createElement("p")
    stockStatusEl.id = "productStockStatus"
    stockStatusEl.className = "product_stock_status product_detail_stock_status"
    stockStatusEl.hidden = true
    const priceRow = document.querySelector(".product_price_row")
    if (priceRow) {
      priceRow.insertAdjacentElement("afterend", stockStatusEl)
    }
    return stockStatusEl
  }

  function getOrCreateQuantityLimitElement() {
    let quantityLimitEl = document.getElementById("productQuantityLimitNotice")
    if (quantityLimitEl) {
      return quantityLimitEl
    }

    quantityLimitEl = document.createElement("p")
    quantityLimitEl.id = "productQuantityLimitNotice"
    quantityLimitEl.className = "cart_quantity_limit_notice product_quantity_limit_notice"
    quantityLimitEl.hidden = true
    const quantityWrap = document.querySelector(".quantity_wrap")
    if (quantityWrap) {
      quantityWrap.insertAdjacentElement("afterend", quantityLimitEl)
    }
    return quantityLimitEl
  }

  function syncProductInventoryUi() {
    const status = getInventoryStatus(product.id)
    const stockStatusEl = getOrCreateStockStatusElement()
    const quantityLimitEl = getOrCreateQuantityLimitElement()
    const stockMessage = getProductDetailStockMessage(status)

    if (stockStatusEl) {
      stockStatusEl.textContent = stockMessage
      stockStatusEl.hidden = !stockMessage
      stockStatusEl.classList.toggle("is_out", status.isOutOfStock)
      stockStatusEl.classList.toggle("is_low", status.isLowStock)
    }

    if (status.isOutOfStock) {
      quantity = 1
    } else if (status.tracked && quantity > status.available) {
      quantity = Math.max(1, status.available)
    }

    const quantityLimitMessage = status.tracked && !status.isOutOfStock && quantity >= status.available
      ? getQuantityLimitMessage(status)
      : ""

    if (quantityLimitEl) {
      quantityLimitEl.textContent = quantityLimitMessage
      quantityLimitEl.hidden = !quantityLimitMessage
    }

    if (qtyPlus) {
      qtyPlus.disabled = status.tracked && quantity >= status.available
    }
    if (qtyMinus) {
      qtyMinus.disabled = quantity <= 1
    }
    if (addToCartBtn) {
      addToCartBtn.disabled = status.isOutOfStock
      addToCartBtn.setAttribute("aria-disabled", String(status.isOutOfStock))
      setButtonLabel(addToCartBtn, status.isOutOfStock
        ? getProductUiText("outOfStock", "Out of Stock")
        : getProductUiText("addToCart", "Add to Cart"))
    }
    if (productCheckoutBtn) {
      productCheckoutBtn.disabled = status.isOutOfStock
      productCheckoutBtn.setAttribute("aria-disabled", String(status.isOutOfStock))
    }

    updatePricing()
  }

  function syncActiveImage(src, altText, fallbackSrc) {
    activeImageSrc = src || ""
    activeImageFallbackSrc = fallbackSrc || src || ""
    activeImageAlt = altText || getProductDisplayData(product).name || "Selected product image"
  }

  function updateLightboxZoomUi() {
    if (lightboxZoomValue) {
      lightboxZoomValue.textContent = `${Math.round(lightboxZoom * 100)}%`
    }

    if (lightboxZoomOutBtn) {
      lightboxZoomOutBtn.disabled = lightboxZoom <= 1
    }

    if (lightboxZoomInBtn) {
      lightboxZoomInBtn.disabled = lightboxZoom >= 4
    }
  }

  function refreshLightboxImageSize() {
    if (!lightboxImageEl || !lightboxStage || !lightboxImageEl.complete) {
      return
    }

    const availableWidth = Math.max(lightboxStage.clientWidth - 32, 260)
    const baseWidth = Math.min(lightboxImageEl.naturalWidth || availableWidth, availableWidth)

    lightboxImageEl.style.width = `${Math.max(baseWidth * lightboxZoom, 220)}px`
    updateLightboxZoomUi()
  }

  function setLightboxZoom(nextZoom) {
    lightboxZoom = Math.min(4, Math.max(1, Number(nextZoom) || 1))
    refreshLightboxImageSize()
  }

  function closeLightbox() {
    if (!lightboxEl) {
      return
    }

    lightboxEl.hidden = true
    lightboxEl.setAttribute("aria-hidden", "true")
    document.body.classList.remove("lightbox_open")

    if (lightboxStage) {
      lightboxStage.scrollTop = 0
      lightboxStage.scrollLeft = 0
    }

    if (lightboxImageEl) {
      lightboxImageEl.style.width = ""
    }

    lightboxZoom = 1
    updateLightboxZoomUi()
  }

  function openLightbox() {
    if (!lightboxEl || !lightboxImageEl || !activeImageSrc) {
      return
    }

    lightboxZoom = 1
    lightboxEl.hidden = false
    lightboxEl.setAttribute("aria-hidden", "false")
    document.body.classList.add("lightbox_open")
    lightboxImageEl.dataset.fallbackSrc = activeImageFallbackSrc
    lightboxImageEl.src = activeImageSrc
    lightboxImageEl.alt = activeImageAlt
    updateLightboxZoomUi()

    if (lightboxImageEl.complete) {
      if (lightboxStage) {
        lightboxStage.scrollTop = 0
        lightboxStage.scrollLeft = 0
      }

      refreshLightboxImageSize()
    }

    if (lightboxCloseBtn) {
      lightboxCloseBtn.focus()
    }
  }

  if (lightboxImageEl) {
    bindImageFallback(lightboxImageEl)

    lightboxImageEl.addEventListener("load", () => {
      if (lightboxStage) {
        lightboxStage.scrollTop = 0
        lightboxStage.scrollLeft = 0
      }

      refreshLightboxImageSize()
    })
  }

  function getOwnReview() {
    if (!activeUser) {
      return null
    }

    return latestReviews.find((review) => review.userId === activeUser.uid) || null
  }

  function updatePricing() {
    const offerPricing = resolveProductOfferPricing(product)
    const salePrice = offerPricing.finalPrice
    const originalPrice = offerPricing.offer
      ? offerPricing.originalPrice
      : Number(product.originalPrice ?? product.compareAtPrice) || 0
    const total = salePrice * quantity
    qtyInput.value = quantity
    unitPriceEl.textContent = formatPrice(salePrice)
    totalPriceEl.textContent = formatPrice(total)

    if (originalPriceEl && discountBadgeEl) {
      const hasDiscount = originalPrice > salePrice && salePrice > 0
      originalPriceEl.hidden = !hasDiscount
      discountBadgeEl.hidden = !hasDiscount

      if (hasDiscount) {
        const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100)
        originalPriceEl.textContent = formatPrice(originalPrice)
        discountBadgeEl.textContent = offerPricing.offer
          ? getOfferDisplayData(offerPricing.offer).discountLabel
          : `${discountPercent}% OFF`
      }
    }
  }

  function renderProductDisplayOffer() {
    const priceRow = document.querySelector(".product_price_row")
    if (!priceRow) return

    let offerPanel = document.getElementById("productDisplayOffer")
    const offer = getActiveOfferForProduct(product.id)
    if (!offer) {
      if (offerPanel) offerPanel.hidden = true
      return
    }

    if (!offerPanel) {
      offerPanel = document.createElement("aside")
      offerPanel.id = "productDisplayOffer"
      offerPanel.className = "product_display_offer"
      priceRow.insertAdjacentElement("afterend", offerPanel)
    }

    const display = getOfferDisplayData(offer)
    const savings = Math.max(0, display.originalPrice - display.discountedPrice)
    offerPanel.hidden = false
    offerPanel.innerHTML = `
      ${display.marketingTitle ? `<strong class="product_display_offer_title">${escapeHtml(display.marketingTitle)}</strong>` : ""}
      <span class="product_display_offer_badge">${escapeHtml(display.discountLabel)}</span>
      <span class="product_display_offer_prices"><del>${escapeHtml(display.originalPriceText)}</del><strong>${escapeHtml(display.discountedPriceText)}</strong></span>
      <span class="product_display_offer_savings">${escapeHtml(getProductUiText("saveAmount", "Save {amount}", { amount: formatPrice(savings) }))}</span>
      <small>${escapeHtml(getProductUiText("offerAppliedAutomatically", "Offer applied automatically in cart and checkout."))}</small>
    `
  }

  function setSelectedRating(rating) {
    selectedRating = Number(rating) || 0
    reviewStars.forEach((button) => {
      const starValue = Number(button.getAttribute("data-rating"))
      button.classList.toggle("is_active", starValue <= selectedRating)
    })
  }

  function setFormEnabled(isEnabled) {
    reviewStars.forEach((button) => {
      button.disabled = false
    })

    reviewComment.disabled = false
    reviewSubmitBtn.disabled = !isEnabled
  }

  function syncReviewForm() {
    const ownReview = getOwnReview()

    if (!activeUser) {
      reviewDeleteBtn.hidden = true
      reviewAuthNotice.innerHTML = `
        <div class="review_notice_card">
          <p>${escapeHtml(getProductUiText("guestsCanRateOnly", "Guests can rate only"))}. ${escapeHtml(getProductUiText("signInToWriteReview", "Sign in to write a review"))}.</p>
          <button class="auth_dropdown_btn review_google_signin_btn" type="button" data-auth-action="login"><i class="fa fa-google" aria-hidden="true"></i><span>${escapeHtml(getProductUiText("signInWithGoogleToReview", "Sign in with Google to review"))}</span></button>
        </div>
      `
      reviewFormStatus.textContent = `${getProductUiText("guestsCanRateOnly", "Guests can rate only")}. ${getProductUiText("signInToWriteReview", "Sign in to write a review")}.`
      reviewSubmitBtn.textContent = getProductUiText("submitRating", "Submit Rating")
      setFormEnabled(true)
      return
    }

    reviewAuthNotice.innerHTML = `
      <div class="review_notice_card review_notice_card_user">
        <span class="review_notice_avatar">
          ${activeUser.photoURL ? `<img src="${activeUser.photoURL}" alt="${escapeHtml(activeUser.displayName || "User")}" width="96" height="96" loading="lazy" decoding="async">` : '<i class="fa fa-user" aria-hidden="true"></i>'}
        </span>
        <div>
          <strong>${escapeHtml(activeUser.displayName || getProductUiText("sushiBoxCustomer", "Sushi Box Customer"))}</strong>
          <p>${escapeHtml(getProductUiText("reviewUserLiveHint", "Your review will update live for everyone viewing this product."))}</p>
        </div>
      </div>
    `
    reviewFormStatus.textContent = ownReview
      ? getProductUiText("reviewEditHint", "You can edit or remove your review at any time.")
      : getProductUiText("reviewPublishHint", "Your review will appear instantly after you publish it.")
    reviewDeleteBtn.hidden = !ownReview
    reviewSubmitBtn.textContent = ownReview
      ? getProductUiText("updateReview", "Update Review")
      : getProductUiText("submitReview", "Submit Review")
    setFormEnabled(true)

    if (ownReview) {
      setSelectedRating(ownReview.rating)
      reviewComment.value = ownReview.comment || ""
    } else {
      setSelectedRating(0)
      reviewComment.value = ""
    }
  }

function renderReviewSummary() {
    const summary = latestProductSummary || getReviewSummary(latestReviews)
    const hasReviews = summary.totalReviews > 0

    productRatingStars.innerHTML = buildStarMarkup(summary.averageRating, "compact")
    productRatingText.hidden = !hasReviews
    productRatingText.textContent = hasReviews
      ? getProductUiCountText(
        "averageRating",
        summary.totalReviews,
        `${summary.averageRating.toFixed(1)} average - ${summary.totalReviews} rating${summary.totalReviews === 1 ? "" : "s"}`,
        { average: summary.averageRating.toFixed(1) }
      )
      : ""

    averageRatingValue.textContent = hasReviews ? summary.averageRating.toFixed(1) : "0.0"
    averageRatingStars.innerHTML = buildStarMarkup(summary.averageRating, "large")
    reviewCountValue.textContent = String(summary.totalReviews)
    ratingSummaryText.textContent = hasReviews
      ? getProductUiCountText(
        "ratingSummary",
        summary.totalReviews,
        `Customers have shared ${summary.totalReviews} rating${summary.totalReviews === 1 ? "" : "s"} for this product.`
      )
      : getProductUiText("ratingSummaryEmpty", "No reviews yet. Be the first to rate this product and help future customers choose with confidence.")
  }

  function bindProductDetailTabs() {
    const tabs = Array.from(document.querySelectorAll(".product_detail_tab"))
    if (!tabs.length) {
      return
    }

    const targets = tabs.map((tab) => {
      const selector = tab.getAttribute("href") || ""
      return selector.startsWith("#") ? document.querySelector(selector) : null
    })

    tabs.forEach((tab, index) => {
      tab.setAttribute("role", "tab")
      tab.setAttribute("aria-selected", String(tab.classList.contains("active")))
      tab.addEventListener("click", () => {
        tabs.forEach((item) => {
          item.classList.remove("active")
          item.setAttribute("aria-selected", "false")
        })
        tab.classList.add("active")
        tab.setAttribute("aria-selected", "true")
      })

      if (targets[index]) {
        targets[index].setAttribute("tabindex", "-1")
      }
    })

    if (!("IntersectionObserver" in window)) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

      if (!visible) {
        return
      }

      const activeIndex = targets.indexOf(visible.target)
      if (activeIndex < 0 || !tabs[activeIndex]) {
        return
      }

      tabs.forEach((tab, index) => {
        const isActive = index === activeIndex
        tab.classList.toggle("active", isActive)
        tab.setAttribute("aria-selected", String(isActive))
      })
    }, {
      rootMargin: "-18% 0px -60% 0px",
      threshold: [0.2, 0.45, 0.7]
    })

    targets.filter(Boolean).forEach((target) => observer.observe(target))
  }

  function renderReviewsList() {
    if (!reviewsList) {
      return
    }

    if (!latestReviews.length) {
      reviewsList.innerHTML = `
        <div class="review_empty_state">
          <div class="review_empty_icon"><i class="fa fa-comments-o" aria-hidden="true"></i></div>
          <p>${escapeHtml(getProductUiText("reviewEmptyHint", "No reviews yet. Be the first to share your Sushi Box experience."))}</p>
        </div>
      `
      return
    }

    reviewsList.innerHTML = latestReviews.map((review) => {
      const isOwnReview = activeUser && review.userId === activeUser.uid
      return `
        <article class="review_card${isOwnReview ? " is_current_user" : ""}">
          <div class="review_card_header">
            <div class="review_card_identity">
              <span class="review_card_avatar">
                ${review.userPhoto ? `<img src="${review.userPhoto}" alt="${escapeHtml(review.userName || "User")}" width="96" height="96" loading="lazy" decoding="async">` : '<i class="fa fa-user" aria-hidden="true"></i>'}
              </span>
              <div>
                <strong>${escapeHtml(review.userName || getProductUiText("sushiBoxCustomer", "Sushi Box Customer"))}</strong>
                <span>${formatReviewDate(review.updatedAt || review.createdAt)}</span>
              </div>
            </div>
            <div class="review_card_meta">
              ${buildStarMarkup(review.rating)}
              ${isOwnReview ? `<span class="review_owner_badge">${escapeHtml(getProductUiText("yourReview", "Your review"))}</span>` : ""}
            </div>
          </div>
          <p>${escapeHtml(review.comment)}</p>
      </article>
    `
  }).join("")

  if (reviewsList && typeof bindImageFallback === "function") {
    reviewsList.querySelectorAll("img").forEach(bindImageFallback);
  }
}

  function renderProductContent() {
    const displayProduct = getProductDisplayData(product)
    nameEl.removeAttribute("data-i18n")
    nameEl.textContent = displayProduct.name
    if (categoryEl) {
      categoryEl.textContent = displayProduct.category || "Sushi Box"
      categoryEl.hidden = !categoryEl.textContent
    }
    descEl.textContent = displayProduct.description || ""
    descEl.hidden = !descEl.textContent
    document.title = `Sushi Box - ${product.name}`

    if (mainImageFrame) {
      mainImageFrame.setAttribute("data-product-id", product.id)
    }

    if (productShareBtn) {
      productShareBtn.setAttribute("aria-label", getProductUiText("shareProduct", "Share {name}", { name: displayProduct.name }))
      productShareBtn.setAttribute("title", getProductUiText("share", "Share"))
    }

    if (productFavoriteBtn) {
      productFavoriteBtn.setAttribute("data-wishlist-product-id", product.id)
      productFavoriteBtn.setAttribute("aria-label", getProductUiText("addProductToFavorites", "Add {name} to favorites", { name: displayProduct.name }))
      productFavoriteBtn.setAttribute("title", getProductUiText("addToFavorites", "Add to favorites"))
      window.dispatchEvent(new CustomEvent("sushi-box:wishlist-controls-ready"))
    }

    renderThumbnails(getProductImageSources(product), mainImageEl, displayProduct.name, syncActiveImage)
    renderComponents(productComponentsSection, productComponentsList, displayProduct.components)
    renderItemDetails(productItemDetailsSection, productItemDetailsList, displayProduct.itemDetails)
    renderDescriptionSection(productStorySection, productStoryTitle, productStoryLead, productStoryBody, displayProduct)
  }

  function refreshRecommendations() {
    renderRecommendations(
      recommendedProductsEl,
      product,
      allProducts,
      latestRecommendationSummaries,
      latestCart
    )
  }

  renderProductContent()
  trackViewItem(product)
  bindProductDetailTabs()
  updatePricing()
  renderProductDisplayOffer()
  subscribeToProductOffers(() => {
    updatePricing()
    renderProductDisplayOffer()
    refreshRecommendations()
  }, (error) => {
    console.error("Product offer could not be loaded.", error)
  })
  refreshRecommendations()

  if (mainImageFrame) {
    mainImageFrame.setAttribute("role", "button")
    mainImageFrame.setAttribute("tabindex", "0")
    mainImageFrame.setAttribute("aria-label", `Open a larger preview of ${getProductDisplayData(product).name}`)
    mainImageFrame.addEventListener("click", openLightbox)
    mainImageFrame.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        openLightbox()
      }
    })
  }

  if (lightboxEl) {
    lightboxEl.addEventListener("click", (event) => {
      if (event.target.closest("[data-lightbox-close='true']")) {
        closeLightbox()
      }
    })
  }

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener("click", closeLightbox)
  }

  if (lightboxZoomInBtn) {
    lightboxZoomInBtn.addEventListener("click", () => {
      setLightboxZoom(lightboxZoom + 0.25)
    })
  }

  if (lightboxZoomOutBtn) {
    lightboxZoomOutBtn.addEventListener("click", () => {
      setLightboxZoom(lightboxZoom - 0.25)
    })
  }

  if (lightboxStage) {
    lightboxStage.addEventListener("wheel", (event) => {
      if (lightboxEl && !lightboxEl.hidden) {
        event.preventDefault()
        setLightboxZoom(lightboxZoom + (event.deltaY < 0 ? 0.2 : -0.2))
      }
    }, { passive: false })
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightboxEl && !lightboxEl.hidden) {
      closeLightbox()
    }
  })

  window.addEventListener("resize", () => {
    if (lightboxEl && !lightboxEl.hidden) {
      refreshLightboxImageSize()
    }
  })

  qtyMinus.addEventListener("click", () => {
    if (quantity > 1) {
      quantity -= 1
      syncProductInventoryUi()
    }
  })

  qtyPlus.addEventListener("click", () => {
    const status = getInventoryStatus(product.id)
    if (status.tracked && quantity >= status.available) {
      emitToast(getQuantityLimitMessage(status) || getProductUiText("onlyItemsAvailable", "Only {count} item available.", { count: status.available }), "error")
      syncProductInventoryUi()
      return
    }
    quantity += 1
    syncProductInventoryUi()
  })

  addToCartBtn.addEventListener("click", async () => {
    await addCartItemWithInventory(product, quantity, {
      successMessage: getProductUiText("addedToCart", "Product added to cart successfully")
    })
  })

  if (productCheckoutBtn) {
    productCheckoutBtn.addEventListener("click", async () => {
      const result = await addCartItemWithInventory(product, quantity, {
        successMessage: getProductUiText("addedToCart", "Product added to cart successfully")
      })
      if (result.ok) {
        window.location.href = "/checkout.html"
      }
    })
  }

  if (productShareBtn) {
    productShareBtn.addEventListener("click", () => {
      shareProduct(product, buildProductUrl(product.id))
    })
  }

  if (recommendedProductsEl) {
    recommendedProductsEl.addEventListener("click", (event) => {
      const shareButton = event.target.closest("[data-recommend-share-product-id]")
      if (shareButton) {
        event.preventDefault()
        event.stopPropagation()
        const recommendedProduct = getProductById(shareButton.getAttribute("data-recommend-share-product-id"))
        if (recommendedProduct) {
          shareProduct(recommendedProduct, buildProductUrl(recommendedProduct.id))
        }
        return
      }

      const addButton = event.target.closest("[data-recommend-product-id]")
      if (!addButton) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const recommendedProductId = addButton.getAttribute("data-recommend-product-id")
      const recommendedProduct = getProductById(recommendedProductId)

      if (recommendedProduct) {
        addCartItemWithInventory(recommendedProduct, 1, {
          successMessage: getProductUiText("addedToCart", "Product added to cart successfully")
        })
      }
    })
  }

  reviewStars.forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedRating(button.getAttribute("data-rating"))
    })
  })

  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    const authenticatedUser = getCurrentUser()

    if (selectedRating < 1) {
      reviewFormStatus.textContent = getProductUiText("selectRatingFirst", "Please select a rating first.")
      emitToast(getProductUiText("selectRatingFirst", "Please select a rating first."), "info")
      return
    }

    const comment = reviewComment.value.trim()

    if (!authenticatedUser) {
      activeUser = null

      if (comment) {
        syncReviewForm()
        reviewFormStatus.textContent = getProductUiText("signInRequiredReview", "Please sign in to write a review.")
        emitToast(getProductUiText("signInRequiredReview", "Please sign in to write a review."), "info")
        return
      }

      reviewFormStatus.textContent = getProductUiText("ratingSaving", "Saving your rating...")
      reviewSubmitBtn.disabled = true

      try {
        await saveGuestRating(product, selectedRating)
        reviewFormStatus.textContent = getProductUiText("ratingSaved", "Thanks for rating this product.")
        emitToast(getProductUiText("ratingSaved", "Thanks for rating this product."), "success")
      } catch (error) {
        reviewFormStatus.textContent = error.message || "We could not save your rating."
        emitToast(error.message || "We could not save your rating.", "error")
      } finally {
        reviewSubmitBtn.disabled = false
      }
      return
    }

    activeUser = authenticatedUser
    reviewFormStatus.textContent = getProductUiText("reviewSaving", "Saving your review...")
    reviewSubmitBtn.disabled = true

    try {
      await saveReview(product, authenticatedUser, {
        rating: selectedRating,
        comment
      })
      reviewFormStatus.textContent = getProductUiText("reviewSaved", "Review saved successfully.")
      emitToast(getProductUiText("reviewLive", "Your review is live now."), "success")
    } catch (error) {
      reviewFormStatus.textContent = error.message || "We could not save your review."
      emitToast(error.message || "We could not save your review.", "error")
    } finally {
      reviewSubmitBtn.disabled = false
    }
  })

  reviewDeleteBtn.addEventListener("click", async () => {
    if (!activeUser) {
      return
    }

    reviewFormStatus.textContent = getProductUiText("reviewRemoveLoading", "Removing your review...")
    reviewDeleteBtn.disabled = true

    try {
      await deleteReview(product.id, activeUser.uid)
      reviewFormStatus.textContent = getProductUiText("reviewRemoved", "Your review has been removed.")
      emitToast(getProductUiText("reviewDeleted", "Review deleted."), "info")
    } catch (error) {
      reviewFormStatus.textContent = error.message || "We could not delete your review."
      emitToast(error.message || "We could not delete your review.", "error")
    } finally {
      reviewDeleteBtn.disabled = false
    }
  })

  subscribeToAuthState((user) => {
    activeUser = user
    syncReviewForm()
    renderReviewsList()
  })

  subscribeToProductReviews(product.id, (reviews) => {
    latestReviews = reviews
    renderReviewSummary()
    renderReviewsList()
    syncReviewForm()
  }, (error) => {
    console.error("Reviews listener failed.", error)
    reviewFormStatus.textContent = getProductUiText("reviewUnavailable", "Reviews are temporarily unavailable. Please check your Firebase setup.")
  })

  subscribeToProductReviewSummary(product.id, (summary) => {
    latestProductSummary = summary
    renderReviewSummary()
  }, (error) => {
    console.error("Product review summary listener failed.", error)
  })

  subscribeToReviewSummaries((summaries) => {
    latestRecommendationSummaries = summaries || {}
    primeRatingsCache(latestRecommendationSummaries)
    refreshRecommendations()
  }, (error) => {
    console.error("Recommendation summary listener failed.", error)
  })

  subscribeToCart((cart) => {
    latestCart = Array.isArray(cart) ? cart : []
    refreshRecommendations()
  })

  subscribeToInventory(() => {
    syncProductInventoryUi()
    refreshRecommendations()
  }, (error) => {
    console.error("Product page inventory listener failed.", error)
  })

  window.addEventListener("sushi-box:language-change", () => {
    applyTranslations(document)
    renderProductContent()
    syncProductInventoryUi()
    renderReviewSummary()
    renderReviewsList()
    syncReviewForm()
    refreshRecommendations()
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProductPage)
} else {
  initProductPage()
}

