const GUEST_SESSION_STORAGE_KEY = "sushi-box-guest-session-id";
const GUEST_LOCAL_STORAGE_KEY = "sushi-box-guest-browser-id";

let memoryGuestSessionId = "";

function getStorage(storageName) {
  try {
    return window[storageName] || null;
  } catch (error) {
    return null;
  }
}

function createStorageId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2)
  ].join("-");
}

function cleanKeyPart(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getGuestSessionId() {
  const localStorage = getStorage("localStorage");
  const sessionStorage = getStorage("sessionStorage");

  if (localStorage) {
    try {
      let guestId = localStorage.getItem(GUEST_LOCAL_STORAGE_KEY);
      if (!guestId && sessionStorage) {
        guestId = sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
      }
      if (!guestId) {
        guestId = createStorageId();
      }
      localStorage.setItem(GUEST_LOCAL_STORAGE_KEY, guestId);
      if (sessionStorage) {
        sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, guestId);
      }
      return guestId;
    } catch (error) {}
  }

  if (!sessionStorage) {
    memoryGuestSessionId = memoryGuestSessionId || createStorageId();
    return memoryGuestSessionId;
  }

  try {
    let sessionId = sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = createStorageId();
      sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    memoryGuestSessionId = memoryGuestSessionId || createStorageId();
    return memoryGuestSessionId;
  }
}

export function getScopedStorageKey(resourceName) {
  const safeResourceName = cleanKeyPart(resourceName);
  return `sushi-box-${safeResourceName}-guest-${cleanKeyPart(getGuestSessionId())}`;
}

export function readStorageArray(storageKey) {
  const localStorage = getStorage("localStorage");
  if (!localStorage) {
    return [];
  }

  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

export function writeStorageArray(storageKey, items) {
  const localStorage = getStorage("localStorage");
  if (!localStorage) {
    return false;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.isArray(items) ? items : []));
    return true;
  } catch (error) {}

  return false;
}

export function removeStorageKey(storageKey) {
  const localStorage = getStorage("localStorage");
  if (!localStorage) {
    return false;
  }

  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {}

  return false;
}

export function removeLegacyStorageKeys(storageKeys) {
  if (!Array.isArray(storageKeys)) {
    return;
  }

  storageKeys.forEach(removeStorageKey);
}

export function findStorageKeys(prefix) {
  const localStorage = getStorage("localStorage");
  if (!localStorage) {
    return [];
  }

  try {
    const safePrefix = String(prefix || "");
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(safePrefix)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    return [];
  }
}
