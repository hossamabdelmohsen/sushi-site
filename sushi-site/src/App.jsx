import "./App.css";
import starterImg from "./assets/starter.png";
import familyImg from "./assets/family.png";
import premiumImg from "./assets/premium.png";
import whatsappIcon from "./assets/whatsapp.png";

export default function App() {
  const products = [
    {
      name: "Starter Box",
      price: "249 EGP",
      desc: "بداية مثالية لتجربة السوشي في البيت",
      msg: "السلام عليكم، عايز أطلب Starter Box",
      image: starterImg,
    },
    {
      name: "Family Box",
      price: "399 EGP",
      desc: "مناسب للعيلة أو خروجة مع أصحابك",
      msg: "السلام عليكم، عايز أطلب Family Box",
      image: familyImg,
    },
    {
      name: "Premium Box",
      price: "599 EGP",
      desc: "أفضل جودة وتجربة كاملة لمحبي السوشي",
      msg: "السلام عليكم، عايز أطلب Premium Box",
      image: premiumImg,
    },
  ];

  const phone = "201220385694";

  const openWhatsApp = (message) => {
    const url =
      "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  };

  const whatsappUrl =
    "https://wa.me/" +
    phone +
    "?text=" +
    encodeURIComponent("السلام عليكم، عايز أطلب من Sushi Box Delta");

  return (
  <div
    style={{
      width: "100%", //
      minHeight: "100vh",
      background: "linear-gradient(180deg, #020617 0%, #08122f 100%)",
      color: "white",
      fontFamily: "Arial, sans-serif",
    }}
    >
      <div
        style={{
          backgroundColor: "rgba(2, 6, 23, 0.92)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "min(1180px, calc(100% - 40px))",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 0",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "30px", fontWeight: "800" }}>
            Sushi Box Delta 🍣
          </h2>

          <button
            onClick={() => openWhatsApp("السلام عليكم، عايز أطلب من الموقع")}
            style={{
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              padding: "12px 22px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "15px",
              boxShadow: "0 8px 20px rgba(34, 197, 94, 0.25)",
            }}
          >
            اطلب واتساب
          </button>
        </div>
      </div>

      <div
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            textAlign: "center",
            padding: "90px 0 70px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "10px 16px",
              borderRadius: "999px",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              fontSize: "14px",
              marginBottom: "22px",
            }}
          >
            أفضل تجربة سوشي في البيت
          </div>

          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(42px, 7vw, 78px)",
              lineHeight: 1.05,
              fontWeight: "900",
            }}
          >
            Sushi Box Delta 🍣
          </h1>

          <p
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              color: "#94a3b8",
              fontSize: "21px",
              lineHeight: 1.9,
            }}
          >
            اطلب بوكس السوشي المناسب ليك واستمتع بتجربة راقية في البيت،
            بمكونات مختارة وشكل يفتح النفس.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginTop: "30px",
            }}
          >
            <button
              onClick={() => openWhatsApp("السلام عليكم، عايز أطلب الآن")}
              style={{
                backgroundColor: "#22c55e",
                color: "white",
                border: "none",
                padding: "16px 28px",
                borderRadius: "14px",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "16px",
                boxShadow: "0 10px 24px rgba(34, 197, 94, 0.22)",
              }}
            >
              اطلب الآن
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("products-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                backgroundColor: "transparent",
                color: "white",
                border: "1px solid rgba(255,255,255,0.14)",
                padding: "16px 28px",
                borderRadius: "14px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "16px",
              }}
            >
              شوف المنتجات
            </button>
          </div>
        </section>

        <section id="products-section" style={{ paddingBottom: "80px" }}>
          <h2
            style={{
              textAlign: "center",
              margin: "0 0 36px",
              fontSize: "40px",
              fontWeight: "800",
            }}
          >
            المنتجات
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "26px",
            }}
          >
            {products.map((p) => (
              <div
                key={p.name}
                style={{
                  background: "linear-gradient(180deg, #172554 0%, #1e293b 100%)",
                  borderRadius: "24px",
                  padding: "18px",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    borderRadius: "18px",
                    display: "block",
                    marginBottom: "18px",
                  }}
                />

                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: "34px",
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  {p.name}
                </h3>

                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#22c55e",
                    fontWeight: "800",
                    fontSize: "31px",
                    textAlign: "center",
                  }}
                >
                  {p.price}
                </p>

                <p
                  style={{
                    margin: "0 0 18px",
                    color: "#cbd5e1",
                    textAlign: "center",
                    fontSize: "18px",
                    lineHeight: 1.8,
                    minHeight: "58px",
                  }}
                >
                  {p.desc}
                </p>

                <button
                  onClick={() => openWhatsApp(p.msg)}
                  style={{
                    width: "100%",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    padding: "14px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    fontWeight: "800",
                    fontSize: "16px",
                    boxShadow: "0 8px 20px rgba(34, 197, 94, 0.22)",
                  }}
                >
                  اطلب الآن
                </button>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            marginBottom: "70px",
            background: "linear-gradient(135deg, #0f172a, #111827)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "28px",
            padding: "38px 24px",
            textAlign: "center",
            boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "14px", fontSize: "36px" }}>
            جاهز تطلب؟
          </h2>
          <p
            style={{
              margin: "0 auto 22px",
              maxWidth: "700px",
              color: "#94a3b8",
              fontSize: "18px",
              lineHeight: 1.9,
            }}
          >
            اطلب الآن من خلال واتساب وخلي تجربة السوشي توصلك بشكل أسهل وأفخم.
          </p>

          <button
            onClick={() => openWhatsApp("السلام عليكم، عايز أطلب من Sushi Box Delta")}
            style={{
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              padding: "15px 28px",
              borderRadius: "14px",
              cursor: "pointer",
              fontWeight: "800",
              fontSize: "16px",
            }}
          >
            اطلب عبر واتساب
          </button>
        </section>
      </div>

      <footer
        style={{
          marginTop: "10px",
          padding: "28px 20px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: "#94a3b8",
          fontSize: "15px",
          backgroundColor: "rgba(2, 6, 23, 0.6)",
        }}
      >
        © 2026 Sushi Box Delta - جميع الحقوق محفوظة
      </footer>

      <div className="whatsapp-label">راسلنا الآن</div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
      >
        <img
  src={whatsappIcon}
  alt="WhatsApp"
  style={{ width: "35px", height: "35px" }}
/>
      </a>
    </div>
  );
}