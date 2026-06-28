import { getLanguage } from "./i18n.js";
import { SUSHI_PRODUCT_TRANSLATIONS_AR } from "./product-translations-ar.js";

const FALLBACK_PRODUCT_NAME = "Product";
const FALLBACK_PRODUCT_IMAGE = "images/optimized/Logo.webp";

const CATEGORY_TRANSLATIONS_AR = {
  "Noodles / Ramen": "نودلز / رامن",
  Sauces: "صوصات",
  "Frozen / Dumplings": "مجمدات / دامبلنج",
  "Sushi Essentials / Asian Ingredients": "أساسيات السوشي / مكونات آسيوية",
  Seafood: "مأكولات بحرية",
  "Canned Food / Pantry": "معلبات / مؤن",
  Beverages: "مشروبات"
};

const DETAIL_LABEL_TRANSLATIONS_AR = {
  Brand: "العلامة التجارية",
  Storage: "التخزين",
  Packing: "التعبئة",
  "Country of origin": "بلد المنشأ",
  "Product Name": "اسم المنتج",
  "Model Name": "اسم الموديل",
  Type: "النوع",
  "Product Type": "نوع المنتج",
  Size: "الحجم",
  Weight: "الوزن",
  Count: "العدد",
  Ingredients: "المكونات",
  "Sauce Type": "نوع الصوص",
  "Fat Content": "نسبة الدهون",
  "Number of pieces": "عدد القطع",
  "No. of Pieces": "عدد القطع",
  Filling: "الحشوة",
  Flavor: "النكهة",
  SHU: "درجة الحرارة SHU"
};

const DETAIL_VALUE_TRANSLATIONS_AR = {
  Dry: "جاف",
  Egypt: "مصر",
  China: "الصين",
  Thailand: "تايلاند",
  Simple: "منتج بسيط",
  "Simple Product": "منتج بسيط",
  "Smoked Salmon": "سلمون مدخن",
  Chicken: "دجاج",
  Beef: "لحم",
  Vegetables: "خضار",
  "Lime Spicy Chicken": "دجاج حار باللايم",
  "Naturally brewed, thick soy sauce": "صوص صويا طبيعي التخمير بقوام غني",
  "Water, salt, 11% soybeans, wheat flour, monosodium glutamate, potassium sorbate (E202)": "ماء، ملح، 11% فول صويا، دقيق قمح، جلوتامات أحادية الصوديوم، سوربات البوتاسيوم (E202)",
  "Coconut, water": "جوز هند، ماء"
};

const COMPONENT_TRANSLATIONS_AR = {
  "Sushi Vinegar - 150 ml": "خل سوشي - 150 مل",
  "Zumra Premium Soy Sauce - 50 ml": "صوص صويا Premium من Zumra - 50 مل",
  "He Shun Yuan Teriyaki Sauce - 50 ml": "صوص ترياكي He Shun Yuan - 50 مل",
  "ZUMRA Wasabi - 4 Sachets": "واسابي ZUMRA - 4 أكياس",
  "Zumra Pickled Ginger - 150 gm": "زنجبيل مخلل Zumra - 150 جم",
  "Zumra Sushi Nori - 10 Sheets": "أوراق نوري Zumra للسوشي - 10 أوراق",
  "Japanese Sushi Rice - 500 gm": "أرز سوشي ياباني - 500 جم",
  "Zumra Bamboo Chopsticks + Helpers - 3 pcs": "عيدان بامبو Zumra + مساعدات - 3 قطع",
  "Bamboo Sushi Rolling Mat - 24 cm": "حصيرة لف السوشي بامبو - 24 سم",
  "Number of sheets: 10": "عدد الأوراق: 10"
};

const REPLACEMENTS_AR = [
  [/\b1 kg\b/gi, "1 كجم"],
  [/\bkg\b/gi, "كجم"],
  [/\bgm\b/gi, "جم"],
  [/\bml\b/gi, "مل"],
  [/\bcm\b/gi, "سم"],
  [/\bpcs\b/gi, "قطع"],
  [/\bPcs\b/g, "قطع"],
  [/\bPieces\b/g, "قطعة"],
  [/\bSheets\b/g, "أوراق"],
  [/\bSheet\b/g, "ورقة"]
];

function isArabic(language) {
  return language === "ar";
}

function getTranslation(productId, language) {
  if (!isArabic(language) || !productId) {
    return null;
  }

  return SUSHI_PRODUCT_TRANSLATIONS_AR[productId] || null;
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((copy, key) => {
      copy[key] = cloneValue(value[key]);
      return copy;
    }, {});
  }

  return value;
}

function hasDisplayValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).trim() !== "";
}

function translateUnits(value) {
  return REPLACEMENTS_AR.reduce((text, [pattern, replacement]) => {
    return text.replace(pattern, replacement);
  }, String(value || ""));
}

function getFallbackName(product) {
  return String(product?.name || product?.title || product?.id || product?.slug || FALLBACK_PRODUCT_NAME);
}

function getSafeImages(product) {
  const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
  return images.length ? images : [product?.image || FALLBACK_PRODUCT_IMAGE].filter(Boolean);
}

function translateComponent(component) {
  const source = String(component || "");
  return COMPONENT_TRANSLATIONS_AR[source] || translateUnits(source);
}

function translateDetailValue(value, product, translation) {
  const source = String(value || "");

  if (DETAIL_VALUE_TRANSLATIONS_AR[source]) {
    return DETAIL_VALUE_TRANSLATIONS_AR[source];
  }

  if (
    source === product?.name
    || source === product?.longDescriptionTitle
    || source === product?.id
  ) {
    return translation?.name || source;
  }

  return translateUnits(source);
}

function localizeItemDetails(product, translation, language) {
  const itemDetails = Array.isArray(product?.itemDetails) ? product.itemDetails : [];
  if (!itemDetails.length) {
    return [];
  }

  if (!isArabic(language)) {
    return cloneValue(itemDetails);
  }

  return itemDetails
    .filter((detail) => detail && detail.label && detail.value)
    .map((detail) => ({
      label: DETAIL_LABEL_TRANSLATIONS_AR[detail.label] || detail.label,
      value: translateDetailValue(detail.value, product, translation)
    }));
}

function normalizeTranslationItemDetails(itemDetails, product, translation, language) {
  if (!hasDisplayValue(itemDetails)) {
    return localizeItemDetails(product, translation, language);
  }

  if (Array.isArray(itemDetails)) {
    return cloneValue(itemDetails);
  }

  return Object.keys(itemDetails).map((label) => ({
    label,
    value: itemDetails[label]
  }));
}

function buildFallbackArabicDescriptionBlocks(displayProduct) {
  const intro = displayProduct.longDescriptionIntro || displayProduct.description;
  if (!intro) {
    return [];
  }

  return [
    {
      type: "paragraph",
      text: intro
    }
  ];
}

function mergeTranslatedField(displayProduct, translation, fieldName) {
  if (translation && hasDisplayValue(translation[fieldName])) {
    displayProduct[fieldName] = cloneValue(translation[fieldName]);
  }
}

export function getProductDisplayData(product, language = getLanguage()) {
  const source = product || {};
  const productId = String(source.id || source.slug || "");
  const translation = getTranslation(productId, language);
  const displayProduct = {
    ...source,
    id: productId,
    slug: String(source.slug || productId),
    name: getFallbackName(source),
    description: String(source.description || ""),
    category: String(source.category || ""),
    price: Number.isFinite(Number(source.price)) ? Number(source.price) : 0,
    images: getSafeImages(source)
  };

  if (Array.isArray(source.originalImages)) {
    displayProduct.originalImages = source.originalImages.filter(Boolean);
  }

  if (!translation) {
    return displayProduct;
  }

  [
    "name",
    "description",
    "longDescriptionTitle",
    "longDescriptionIntro",
    "descriptionBlocks",
    "components"
  ].forEach((fieldName) => mergeTranslatedField(displayProduct, translation, fieldName));

  displayProduct.category = translation.category || CATEGORY_TRANSLATIONS_AR[source.category] || source.category || "";

  if (!hasDisplayValue(translation.components) && Array.isArray(source.components)) {
    displayProduct.components = source.components.map(translateComponent);
  }

  displayProduct.itemDetails = normalizeTranslationItemDetails(
    translation.itemDetails,
    source,
    translation,
    language
  );

  if (!hasDisplayValue(displayProduct.descriptionBlocks)) {
    displayProduct.descriptionBlocks = buildFallbackArabicDescriptionBlocks(displayProduct);
  }

  displayProduct.name = displayProduct.name || getFallbackName(source);
  displayProduct.description = displayProduct.description || source.description || "";
  displayProduct.images = getSafeImages(displayProduct);
  displayProduct.slug = displayProduct.slug || productId || displayProduct.id;

  return displayProduct;
}

export function getProductDisplayName(product, language = getLanguage()) {
  return getProductDisplayData(product, language).name;
}
