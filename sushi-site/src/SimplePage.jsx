function SimplePage({ title }) {
  return (
    <div
  style={{
    padding: "40px",
    color: "white",
    background: "#041633",
    minHeight: "100vh"
  }}
>
      <h1>{title}</h1>

      {title === "About Us" && (
        <p>
          Sushi Box is your premium destination for sushi essentials and Asian grocery products.
          We provide fresh ingredients, high quality meals, and fast delivery across Egypt.
        </p>
      )}

      {title === "Contact Us" && (
        <p>
          📞 WhatsApp: 01220385694 <br />
          📧 Email: info@sushibox.com <br />
          📍 Cairo, Egypt
        </p>
      )}

      {title === "FAQs" && (
        <p>
          ❓ Do you deliver daily? Yes <br />
          ❓ Can I return items? Within 24 hours
        </p>
      )}

      {title === "Delivery & Return" && (
        <p>
          Delivery within 24 hours. Returns accepted within 24 hours if product is damaged.
        </p>
      )}

      {title === "Privacy Policy" && (
        <p>
          Your data is محفوظ بالكامل and never shared.
        </p>
      )}

      {title === "Terms & Conditions" && (
        <p>
          By using this site you agree to our terms and conditions.
        </p>
      )}

      {title === "Cookies Policy" && (
        <p>
          We use cookies to improve your experience.
        </p>
      )}
    </div>
  );
}

export default SimplePage;