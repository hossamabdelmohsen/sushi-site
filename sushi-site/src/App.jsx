import { useMemo, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import logoImg from './assets/Logo.png';
import starterImg from "./assets/starter.png";
import familyImg from "./assets/family.png";
import premiumImg from "./assets/premium.png";
import whatsappIcon from "./assets/whatsapp.png";

const phone = "201220385694";

const categories = [
  { id: 1, name: "Sushi Boxes", icon: "🍣" },
  { id: 2, name: "Sauces", icon: "🥫" },
  { id: 3, name: "Noodles", icon: "🍜" },
  { id: 4, name: "Seafood", icon: "🐟" },
  { id: 5, name: "Asian Grocery", icon: "🛒" },
  { id: 6, name: "Kitchen Tools", icon: "🔪" },
];

const products = [
  {
    id: 1,
    name: "Starter Box",
    price: 249,
    image: starterImg,
    category: "Sushi Boxes",
    inStock: true,
    desc: "Perfect starter sushi box for home.",
  },
  {
    id: 2,
    name: "Family Box",
    price: 399,
    image: familyImg,
    category: "Sushi Boxes",
    inStock: true,
    desc: "Great for sharing with friends and family.",
  },
  {
    id: 3,
    name: "Premium Box",
    price: 599,
    image: premiumImg,
    category: "Sushi Boxes",
    inStock: true,
    desc: "Premium sushi selection for the best experience.",
  },
  {
    id: 4,
    name: "Soy Sauce Light",
    price: 129.96,
    image: starterImg,
    category: "Sauces",
    inStock: true,
    desc: "Light soy sauce for sushi and cooking.",
  },
  {
    id: 5,
    name: "Teriyaki Sauce",
    price: 174.42,
    image: familyImg,
    category: "Sauces",
    inStock: true,
    desc: "Sweet savory teriyaki sauce.",
  },
  {
    id: 6,
    name: "Nori Sheets",
    price: 350,
    image: premiumImg,
    category: "Asian Grocery",
    inStock: true,
    desc: "50 sheets sushi nori.",
  },
];

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)
    );
  }, [search]);

  const whatsappCartUrl = useMemo(() => {
    if (cart.length === 0) return "#";
    const lines = cart.map(
      (item) => `- ${item.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} EGP`
    );
    const message =
      "Hello, I want to order:\n\n" +
      lines.join("\n") +
      `\n\nTotal = ${cartTotal.toFixed(2)} EGP` +
      "\n\nName:\nAddress:\nPhone:";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  }, [cart, cartTotal]);

  return (
    <div className="site-shell">
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        search={search}
        setSearch={setSearch}
      />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              addToCart={addToCart}
              filteredProducts={filteredProducts}
            />
          }
        />
        <Route path="/about" element={<SimplePage title="About Us" />} />
        <Route path="/contact" element={<SimplePage title="Contact Us" />} />
        <Route path="/faqs" element={<SimplePage title="FAQs" />} />
        <Route path="/delivery-return" element={<SimplePage title="Delivery & Return" />} />
        <Route path="/privacy-policy" element={<SimplePage title="Privacy Policy" />} />
        <Route path="/terms" element={<SimplePage title="Terms & Conditions" />} />
        <Route path="/cookies" element={<SimplePage title="Cookies Policy" />} />
      </Routes>

      <Footer />

      {cartOpen && (
        <>
          <div className="backdrop" onClick={() => setCartOpen(false)} />
          <aside className="cart-drawer">
            <div className="drawer-head">
              <h3>My Cart</h3>
              <button onClick={() => setCartOpen(false)}>Close</button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-note">Your cart is empty.</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-info">
                      <h4>{item.name}</h4>
                      <p>{item.price.toFixed(2)} EGP</p>
                      <div className="qty-row">
                        <button onClick={() => decreaseQty(item.id)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => increaseQty(item.id)}>+</button>
                      </div>
                    </div>
                    <div className="cart-side">
                      <strong>{(item.price * item.quantity).toFixed(2)} EGP</strong>
                      <button className="remove-btn" onClick={() => removeItem(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="cart-total">
                  <h3>Total: {cartTotal.toFixed(2)} EGP</h3>
                  <a href={whatsappCartUrl} target="_blank" rel="noreferrer" className="checkout-btn">
                    Checkout on WhatsApp
                  </a>
                </div>
              </>
            )}
          </aside>
        </>
      )}

      <a
        href={"https://wa.me/" + phone}
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float"
      >
        <img src={whatsappIcon} alt="WhatsApp" />
      </a>
    </div>
  );
}

function Header({ cartCount, onOpenCart, search, setSearch }) {
  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Download our app</span>
          <span>Fast Delivery • Premium Asian Grocery</span>
        </div>
      </div>

      <header className="main-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img src={logoImg} alt="Sushi Box" />
            <div>
              <h1>Sushi Box</h1>
              <p>Asian Grocery & Sushi Store</p>
            </div>
          </Link>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <nav className="header-actions">
            <button>Login</button>
            <button>Notifications</button>
            <button className="cart-btn" onClick={onOpenCart}>
              My Cart
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}

function HomePage({ addToCart, filteredProducts }) {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <span className="badge">Premium Sushi & Asian Grocery</span>
            <h2>Everything you need for sushi, noodles, sauces, and more.</h2>
            <p>
              Build a premium ordering experience with Sushi Box. Fresh look,
              clean layout, and fast WhatsApp checkout.
            </p>
            <div className="hero-actions">
              <a href="#products" className="primary-btn">Shop Now</a>
              <Link to="/about" className="secondary-btn">Learn More</Link>
            </div>
          </div>

          <div className="hero-card">
            <img src={logoImg} alt="Sushi Box Logo" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h3>Top Category</h3>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <div className="category-card" key={cat.id}>
                <div className="cat-icon">{cat.icon}</div>
                <h4>{cat.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt-bg">
        <div className="container">
          <div className="section-head">
            <h3>Shop by Categories</h3>
            <p>Explore our main product groups.</p>
          </div>

          <div className="category-banners">
            <div className="mini-banner">
              <h4>Sushi Essentials</h4>
              <p>Nori, rice, soy sauce, wasabi and more.</p>
            </div>
            <div className="mini-banner">
              <h4>Asian Sauces</h4>
              <p>Teriyaki, sriracha, oyster sauce and premium mixes.</p>
            </div>
            <div className="mini-banner">
              <h4>Seafood & Toppings</h4>
              <p>Salmon, masago, tobiko and premium additions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="products">
        <div className="container">
          <div className="section-head">
            <h3>All Products</h3>
            <p>Inspired by premium online grocery stores, customized for Sushi Box.</p>
          </div>

          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} />
                  <span className={product.inStock ? "stock in" : "stock out"}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                <div className="product-body">
                  <span className="product-category">{product.category}</span>
                  <h4>{product.name}</h4>
                  <p>{product.desc}</p>

                  <div className="product-footer">
                    <strong>{product.price.toFixed(2)} EGP</strong>
                    <button onClick={() => addToCart(product)}>Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt-bg">
        <div className="container app-banner">
          <div>
            <h3>Sushi Box App</h3>
            <p>
              Order faster, browse products easily, and get updates directly.
            </p>
          </div>
          <div className="app-actions">
            <button>App Store</button>
            <button>Google Play</button>
          </div>
        </div>
      </section>
    </>
  );
}

function SimplePage({ title }) {
  return (
    <section className="section">
      <div className="container simple-page">
        <h2>{title}</h2>
        <p>Content for {title} will be added in the next step.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>About Us</h4>
          <p>
            Sushi Box is your premium destination for sushi essentials and Asian grocery products.
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
          </ul>
        </div>

        <div>
          <h4>Customer Service</h4>
          <ul>
            <li><Link to="/delivery-return">Delivery & Return</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/cookies">Cookies Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <p>WhatsApp: 01220385694</p>
          <p>Email: info@sushibox.com</p>
          <p>Cairo, Egypt</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Sushi Box. All rights reserved.
      </div>
    </footer>
  );
}

export default App;