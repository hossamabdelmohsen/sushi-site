(function () {
  "use strict";

  var EMAILJS_SERVICE_ID = "service_ku8ruq6";
  var EMAILJS_TEMPLATE_ID = "template_ibctpck";
  var EMAILJS_PUBLIC_KEY = "1zJOrN6rWGpU4sugt";
  var DESTINATION_EMAIL = "sushib0ooo0x@gmail.com";
  var SUCCESS_MESSAGE = "Thank you for helping Sushi Box improve 💛";
  var emailJsReady = false;

  function getElement(id) {
    return document.getElementById(id);
  }

  function getFieldValue(id) {
    var field = getElement(id);
    return field ? String(field.value || "").trim() : "";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function dispatchToast(message, tone) {
    window.dispatchEvent(new CustomEvent("sushi-box:notify", {
      detail: {
        message: message,
        tone: tone || "info"
      }
    }));
  }

  function setStatus(message, tone) {
    var status = getElement("feedbackStatus");
    if (!status) {
      return;
    }

    status.textContent = message || "";
    status.hidden = !message;
    status.className = "feedback_status";
    if (tone) {
      status.classList.add("feedback_status_" + tone);
    }
  }

  function setFieldInvalid(field, isInvalid) {
    if (!field) {
      return;
    }

    field.setAttribute("aria-invalid", String(Boolean(isInvalid)));

    if (field.tagName === "SELECT" && window.jQuery) {
      var niceSelect = window.jQuery(field).next(".nice-select");
      if (niceSelect.length) {
        niceSelect.toggleClass("is_invalid", Boolean(isInvalid));
      }
    }
  }

  function clearInvalidState(form) {
    form.querySelectorAll("[aria-invalid='true']").forEach(function (field) {
      setFieldInvalid(field, false);
    });

    form.querySelectorAll(".nice-select.is_invalid").forEach(function (selectShell) {
      selectShell.classList.remove("is_invalid");
    });
  }

  function focusField(field) {
    if (!field) {
      return;
    }

    if (field.tagName === "SELECT" && window.jQuery) {
      var niceSelect = window.jQuery(field).next(".nice-select");
      if (niceSelect.length) {
        niceSelect[0].focus();
        return;
      }
    }

    field.focus();
  }

  function getValidationError(form) {
    var nameField = getElement("feedbackName");
    var emailField = getElement("feedbackEmail");
    var typeField = getElement("feedbackType");
    var subjectField = getElement("feedbackSubject");
    var messageField = getElement("feedbackMessage");
    var name = getFieldValue("feedbackName");
    var email = getFieldValue("feedbackEmail");
    var subject = getFieldValue("feedbackSubject");
    var message = getFieldValue("feedbackMessage");

    clearInvalidState(form);

    if (name.length < 2) {
      setFieldInvalid(nameField, true);
      return { field: nameField, message: "Please enter your full name." };
    }

    if (!isValidEmail(email)) {
      setFieldInvalid(emailField, true);
      return { field: emailField, message: "Please enter a valid email address." };
    }

    if (!typeField || !typeField.value) {
      setFieldInvalid(typeField, true);
      return { field: typeField, message: "Please choose a feedback type." };
    }

    if (subject.length < 3) {
      setFieldInvalid(subjectField, true);
      return { field: subjectField, message: "Please add a short subject." };
    }

    if (message.length < 10) {
      setFieldInvalid(messageField, true);
      return { field: messageField, message: "Please write a little more detail before sending." };
    }

    return null;
  }

  function setHiddenValue(id, value) {
    var field = getElement(id);
    if (field) {
      field.value = value;
    }
  }

  function syncTemplateAliases() {
    var name = getFieldValue("feedbackName");
    var email = getFieldValue("feedbackEmail");
    var type = getFieldValue("feedbackType") || "General Feedback";
    var subject = getFieldValue("feedbackSubject");
    var title = type + ": " + subject;

    setHiddenValue("feedbackNameAlias", name);
    setHiddenValue("feedbackEmailAlias", email);
    setHiddenValue("feedbackTitleAlias", title);
    setHiddenValue("feedbackSubjectAlias", subject);
    setHiddenValue("feedbackReplyAlias", email);
    setHiddenValue("feedbackPageUrl", window.location.href);
    setHiddenValue("feedbackSubmittedAt", new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }));

    var destinationField = document.querySelector("input[name='to_email']");
    if (destinationField) {
      destinationField.value = DESTINATION_EMAIL;
    }
  }

  function initEmailJs() {
    if (!window.emailjs || typeof window.emailjs.init !== "function" || typeof window.emailjs.send !== "function") {
      return false;
    }

    if (!emailJsReady) {
      window.emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY,
        limitRate: {
          id: "sushi-box-feedback-form",
          throttle: 10000
        }
      });
      emailJsReady = true;
    }

    return true;
  }

  function setSendingState(form, isSending) {
    var button = getElement("feedbackSubmitButton");
    var buttonText = button ? button.querySelector(".feedback_submit_text") : null;

    form.dataset.sending = isSending ? "true" : "false";
    form.setAttribute("aria-busy", String(Boolean(isSending)));

    form.querySelectorAll("input, textarea").forEach(function (field) {
      if (field.type === "hidden" || field.classList.contains("feedback_honeypot")) {
        return;
      }

      field.readOnly = Boolean(isSending);
    });

    form.querySelectorAll("select").forEach(function (field) {
      field.setAttribute("aria-disabled", String(Boolean(isSending)));
    });

    if (button) {
      button.disabled = Boolean(isSending);
      button.classList.toggle("is_sending", Boolean(isSending));
    }

    if (buttonText) {
      buttonText.textContent = isSending ? "Sending..." : "Send Feedback";
    }
  }

  function autoresizeTextarea(textarea) {
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 260) + "px";
  }

  function updateNiceSelect(form) {
    if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.niceSelect) {
      return;
    }

    window.jQuery(form).find("select").niceSelect("update");
  }

  function bindFeedbackForm() {
    var form = getElement("feedbackForm");
    var textarea = getElement("feedbackMessage");
    var honeypot = form ? form.querySelector(".feedback_honeypot") : null;

    if (!form) {
      return;
    }

    syncTemplateAliases();

    if (textarea) {
      autoresizeTextarea(textarea);
      textarea.addEventListener("input", function () {
        autoresizeTextarea(textarea);
      });
    }

    form.querySelectorAll("input, textarea, select").forEach(function (field) {
      field.addEventListener("input", function () {
        setFieldInvalid(field, false);
        syncTemplateAliases();
      });

      field.addEventListener("change", function () {
        setFieldInvalid(field, false);
        syncTemplateAliases();
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (form.dataset.sending === "true") {
        return;
      }

      if (honeypot && honeypot.value.trim()) {
        form.reset();
        updateNiceSelect(form);
        setStatus(SUCCESS_MESSAGE, "success");
        dispatchToast(SUCCESS_MESSAGE, "success");
        return;
      }

      var validationError = getValidationError(form);
      if (validationError) {
        setStatus(validationError.message, "error");
        focusField(validationError.field);
        return;
      }

      if (!initEmailJs()) {
        setStatus("Feedback service is still loading. Please check your connection and try again.", "error");
        dispatchToast("Feedback service could not load. Please try again.", "error");
        return;
      }

      syncTemplateAliases();
      setSendingState(form, true);
      setStatus("Sending your feedback securely...", "info");

      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
  name: getFieldValue("feedbackName"),
  email: getFieldValue("feedbackEmail"),
  title: getFieldValue("feedbackSubject"),
  message: getFieldValue("feedbackMessage")
})
        .then(function () {
          form.reset();
          syncTemplateAliases();
          autoresizeTextarea(textarea);
          updateNiceSelect(form);
          clearInvalidState(form);
          setStatus(SUCCESS_MESSAGE, "success");
          dispatchToast(SUCCESS_MESSAGE, "success");
        })
        .catch(function (error) {
          console.error("Sushi Box feedback email failed:", error);
          setStatus("We could not send your feedback right now. Please try again in a moment or contact Sushi Box on WhatsApp.", "error");
          dispatchToast("We could not send your feedback. Please try again.", "error");
        })
        .finally(function () {
          setSendingState(form, false);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindFeedbackForm, { once: true });
  } else {
    bindFeedbackForm();
  }
}());
