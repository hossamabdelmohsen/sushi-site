import { clearCart, whenCartReady } from "./cart-store.js?v=20260615a";
import { trackPurchase } from "./analytics-events.js?v=20260602c";
import { getCurrentCustomerOrder } from "./orders-store.js?v=20260520a";
import { applyTranslations, t } from "./i18n/i18n.js?v=20260629paymentresult";

const PAYMENT_RESULT_FALLBACKS = {
  pendingPaymobReference: "Pending Paymob reference",
  notAvailableYet: "Not available yet"
};

function getPaymentResultText(key) {
  return t(`paymentResultUi.${key}`, PAYMENT_RESULT_FALLBACKS[key] || "");
}

function getQueryValue(name) {
  try {
    return new URL(window.location.href).searchParams.get(name) || "";
  } catch (error) {
    return "";
  }
}

function renderPaymentReference() {
  const referenceEl = document.getElementById("paymentResultReference");
  const transactionEl = document.getElementById("paymentResultTransaction");
  const orderReference = getQueryValue("order");
  const transactionId = getQueryValue("transaction");

  if (referenceEl) {
    referenceEl.textContent = orderReference || getPaymentResultText("pendingPaymobReference");
    referenceEl.setAttribute("dir", orderReference ? "ltr" : "auto");
  }

  if (transactionEl) {
    transactionEl.textContent = transactionId || getPaymentResultText("notAvailableYet");
    transactionEl.setAttribute("dir", transactionId ? "ltr" : "auto");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations(document);
  renderPaymentReference();
  window.addEventListener("sushi-box:language-change", () => {
    applyTranslations(document);
    renderPaymentReference();
  });

  if (document.body.classList.contains("payment-success-page")) {
    let cleared = false;
    const clearPaidCart = async () => {
      if (cleared) {
        return;
      }

      const orderReference = getQueryValue("order");
      const order = await getCurrentCustomerOrder(orderReference).catch((error) => {
        console.error("Could not confirm paid order before clearing cart.", error);
        return null;
      });

      if ((order?.paymentStatus || order?.status) !== "paid") {
        return;
      }

      cleared = true;
      const cart = await whenCartReady();
      trackPurchase(order, cart);
      clearCart();
    };

    window.setTimeout(clearPaidCart, 250);
    window.setTimeout(clearPaidCart, 2500);
  }
});
