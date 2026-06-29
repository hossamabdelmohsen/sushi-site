import { en } from "./en.js?v=20260629commonaccessibility";
import { ar } from "./ar.js?v=20260629commonaccessibility";

const STORAGE_KEY = "sushiBoxLanguage";
const LEGACY_STORAGE_KEY = "sushiBoxLang";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = new Set(["en", "ar"]);
const DICTIONARIES = { en, ar };

let currentLanguage = DEFAULT_LANGUAGE;

function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.has(language);
}

function getStoredLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return isSupportedLanguage(savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE;
  } catch (error) {
    return DEFAULT_LANGUAGE;
  }
}

function getDocumentLanguage() {
  const documentLanguage = document.documentElement.getAttribute("lang");
  return isSupportedLanguage(documentLanguage) ? documentLanguage : null;
}

function syncCurrentLanguage() {
  const documentLanguage = getDocumentLanguage();
  if (documentLanguage && documentLanguage !== currentLanguage) {
    currentLanguage = documentLanguage;
  }

  return currentLanguage;
}

function storeLanguage(language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
    window.localStorage.setItem(LEGACY_STORAGE_KEY, language);
  } catch (error) {}
}

function getTranslationValue(dictionary, key) {
  return String(key || "")
    .split(".")
    .reduce((value, part) => {
      return value && Object.prototype.hasOwnProperty.call(value, part) ? value[part] : undefined;
    }, dictionary);
}

function formatTranslation(value, values = {}) {
  return String(value || "").replace(/\{(\w+)\}/g, (match, name) => {
    return Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match;
  });
}

export function t(key, fallback = "", values = {}) {
  syncCurrentLanguage();
  const dictionary = DICTIONARIES[currentLanguage] || DICTIONARIES[DEFAULT_LANGUAGE];
  const translated = getTranslationValue(dictionary, key);
  if (typeof translated === "string") {
    return formatTranslation(translated, values);
  }

  const english = getTranslationValue(DICTIONARIES[DEFAULT_LANGUAGE], key);
  return formatTranslation(typeof english === "string" ? english : fallback, values);
}

export function getLanguage() {
  return syncCurrentLanguage();
}

export function isRtlLanguage(language = currentLanguage) {
  return language === "ar";
}

function applyDocumentDirection(language) {
  document.documentElement.setAttribute("lang", language);
  document.documentElement.setAttribute("dir", isRtlLanguage(language) ? "rtl" : "ltr");
}

function applyTextTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = t(key);
    if (value) {
      element.textContent = value;
    }
  });
}

function applyAttributeTranslations(root = document) {
  [
    ["data-i18n-placeholder", "placeholder"],
    ["data-i18n-alt", "alt"],
    ["data-i18n-title", "title"],
    ["data-i18n-aria-label", "aria-label"]
  ].forEach(([dataAttribute, targetAttribute]) => {
    root.querySelectorAll(`[${dataAttribute}]`).forEach((element) => {
      const value = t(element.getAttribute(dataAttribute));
      if (value) {
        element.setAttribute(targetAttribute, value);
      }
    });
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    const mappings = element.getAttribute("data-i18n-attr").split(",");
    mappings.forEach((mapping) => {
      const parts = mapping.split(":").map((part) => part.trim());
      const attribute = parts[0];
      const key = parts[1];
      if (!attribute || !key) {
        return;
      }

      const value = t(key);
      if (value) {
        element.setAttribute(attribute, value);
      }
    });
  });
}

function updateLanguageControls(root = document) {
  syncCurrentLanguage();
  root.querySelectorAll("[data-language-option]").forEach((control) => {
    const language = control.getAttribute("data-language-option");
    const isCurrent = language === currentLanguage;
    control.classList.toggle("is_active", isCurrent);
    control.classList.toggle("is-active", isCurrent);
    control.setAttribute("aria-pressed", String(isCurrent));
  });

  root.querySelectorAll("[data-current-language]").forEach((element) => {
    element.textContent = t("language.current");
  });

  root.querySelectorAll("[data-language-code]").forEach((element) => {
    element.textContent = currentLanguage.toUpperCase();
  });
}

export function applyTranslations(root = document) {
  applyDocumentDirection(currentLanguage);
  applyTextTranslations(root);
  applyAttributeTranslations(root);
  updateLanguageControls(root);
}

export function setLanguage(language, options = {}) {
  const nextLanguage = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  currentLanguage = nextLanguage;
  storeLanguage(nextLanguage);
  applyTranslations();

  if (!options.silent) {
    window.dispatchEvent(new CustomEvent("sushi-box:language-change", {
      detail: { language: nextLanguage, dir: isRtlLanguage(nextLanguage) ? "rtl" : "ltr" }
    }));
  }

  return currentLanguage;
}

function bindLanguageEvents() {
  if (document.documentElement.dataset.i18nBound === "true") {
    return;
  }

  document.documentElement.dataset.i18nBound = "true";
  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-language-option]");
    if (!control || control.getAttribute("aria-disabled") === "true") {
      return;
    }

    event.preventDefault();
    setLanguage(control.getAttribute("data-language-option"));
  });
}

export function initI18n() {
  currentLanguage = getStoredLanguage();
  applyTranslations();
  bindLanguageEvents();
  window.SushiBoxI18n = {
    applyTranslations,
    getLanguage,
    setLanguage,
    t
  };
  return currentLanguage;
}
