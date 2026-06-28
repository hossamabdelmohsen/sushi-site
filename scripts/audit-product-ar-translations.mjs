import { getAllProducts } from "../js/product-catalog.js";
import { getProductDisplayData } from "../js/i18n/product-display.js";

const CUSTOMER_FIELDS = [
  "name",
  "category",
  "description",
  "longDescriptionTitle",
  "longDescriptionIntro",
  "components",
  "itemDetails",
  "descriptionBlocks",
  "ingredients",
  "howToUse",
  "storage",
  "storageInstructions",
  "whyChoose",
  "benefits",
  "suitableFor"
];

const ALLOWED_LATIN_TERMS = [
  "AMR",
  "Buldak",
  "Bosphorus",
  "Chung Jung One",
  "Dragon",
  "EGP",
  "Foco",
  "He Shun Yuan",
  "Kikkoman",
  "Nissin",
  "Ottogi",
  "Samyang",
  "Soly",
  "Tai Hua",
  "Yopokki",
  "Zumra",
  "ZUMRA",
  "SHU",
  "E202"
];

function countDisplayItems(value) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length;
  }

  return value ? 1 : 0;
}

function collectStrings(value, path = "") {
  if (typeof value === "string") {
    return value.trim() ? [{ path, text: value.trim() }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => (
      key === "href" ? [] : collectStrings(item, path ? `${path}.${key}` : key)
    ));
  }

  return [];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripAllowedLatinTerms(value) {
  return ALLOWED_LATIN_TERMS.reduce((text, term) => {
    return text.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"), "");
  }, value);
}

function hasLikelyEnglishPhrase(value) {
  const cleaned = stripAllowedLatinTerms(value)
    .replace(/\b\d+(\.\d+)?\b/g, "")
    .replace(/\b(?:gm|kg|ml|cm|pcs|pc|sheets?|piece|pieces)\b/gi, "");

  return /[A-Za-z]{3,}(?:[\s/&+'-]+[A-Za-z]{3,})+/.test(cleaned);
}

const reports = [];

for (const product of getAllProducts()) {
  const productId = product.slug || product.id;
  const arabicProduct = getProductDisplayData(product, "ar");
  const issues = [];

  for (const field of CUSTOMER_FIELDS) {
    const englishCount = countDisplayItems(product[field]);
    const arabicCount = countDisplayItems(arabicProduct[field]);

    if (englishCount !== arabicCount) {
      issues.push({
        type: "structure",
        field,
        englishCount,
        arabicCount
      });
    }
  }

  for (const field of CUSTOMER_FIELDS) {
    for (const entry of collectStrings(arabicProduct[field], field)) {
      if (hasLikelyEnglishPhrase(entry.text)) {
        issues.push({
          type: "likely-english",
          field: entry.path,
          text: entry.text
        });
      }
    }
  }

  if (issues.length) {
    reports.push({ slug: productId, issues });
  }
}

const totalIssueCount = reports.reduce((total, report) => total + report.issues.length, 0);
const cappedReports = reports.map((report) => ({
  slug: report.slug,
  issues: report.issues.slice(0, 20),
  omittedIssues: Math.max(report.issues.length - 20, 0)
}));

console.log(JSON.stringify({
  totalProducts: getAllProducts().length,
  productsWithIssues: reports.length,
  totalIssueCount,
  reports: cappedReports
}, null, 2));
