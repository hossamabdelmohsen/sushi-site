import { clearCart, whenCartReady } from "./cart-store.js?v=20260615a";
import { trackPurchase } from "./analytics-events.js?v=20260602c";
import { getCurrentCustomerOrder } from "./orders-store.js?v=20260520a";

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
    referenceEl.textContent = orderReference || "Pending Paymob reference";
  }

  if (transactionEl) {
    transactionEl.textContent = transactionId || "Not available yet";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderPaymentReference();

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
