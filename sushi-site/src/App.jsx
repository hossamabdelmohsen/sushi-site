import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useParams } from "react-router-dom";
import logoImg from './assets/Logo.png';
import starterImg from "./assets/starter.png";
import familyImg from "./assets/family.png";
import premiumImg from "./assets/premium.png";
import whatsappIcon from "./assets/whatsapp.png";
import { signInWithGoogle } from "./firebase/config";
import { db } from "./firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
const phone = "201220385694";

const categories = [
  { id: 1, name: "Sushi Boxes", icon: "🍣" },
  { id: 2, name: "Sauces", icon: "🥫" },
  { id: 3, name: "Noodles", icon: "🍜" },
  { id: 4, name: "Seafood", icon: "🐟" },
  { id: 5, name: "Asian Grocery", icon: "🛒" },
  { id: 6, name: "Kitchen Tools", icon: "🔪" },
];

const initialProducts = [
  {
    id: 1,
    name: "Starter Box",
    price: 249,
    image: starterImg,
    images: [starterImg, familyImg, premiumImg],
    category: "Sushi Boxes",
    desc: "Perfect starter sushi box for home.",
    details: "A starter sushi selection made for beginners and casual sushi lovers.",
    inStock: true,
    stockCount: 12,
    brand: "Sushi Box",
    storage: "Keep Refrigerated",
    packing: "1 Box",
    origin: "Egypt",
    sku: "SB-001",
    rating: 0,
reviews: 0,
  },
  {
    id: 2,
    name: "Family Box",
    price: 399,
    image: familyImg,
    images: [familyImg, starterImg, premiumImg],
    category: "Sushi Boxes",
    desc: "Great for sharing with friends and family.",
    details: "A larger sushi box prepared for sharing occasions and family gatherings.",
    inStock: true,
    stockCount: 8,
    brand: "Sushi Box",
    storage: "Keep Refrigerated",
    packing: "1 Box",
    origin: "Egypt",
    sku: "SB-002",
    rating: 0,
reviews: 0,
  },
  {
    id: 3,
    name: "Premium Box",
    price: 599,
    image: premiumImg,
    images: [premiumImg, starterImg, familyImg],
    category: "Sushi Boxes",
    desc: "Premium sushi selection for the best experience.",
    details: "Our premium sushi box with a richer variety and a more elevated experience.",
    inStock: true,
    stockCount: 5,
    brand: "Sushi Box",
    storage: "Keep Refrigerated",
    packing: "1 Box",
    origin: "Egypt",
    sku: "SB-003",
    rating: 0,
reviews: 0,
  },
  {
    id: 4,
    name: "Soy Sauce Light",
    price: 129.96,
    image: starterImg,
    images: [starterImg],
    category: "Sauces",
    desc: "Light soy sauce for sushi and cooking.",
    details: "Perfect for sushi dipping, marinades, and daily Asian cooking.",
    inStock: true,
    stockCount: 20,
    brand: "Zumra",
    storage: "Dry",
    packing: "Bottle",
    origin: "China",
    sku: "ZU-004",
    rating: 0,
reviews: 0,
  },
  {
    id: 5,
    name: "Teriyaki Sauce",
    price: 174.42,
    image: familyImg,
    images: [familyImg],
    category: "Sauces",
    desc: "Sweet savory teriyaki sauce.",
    details: "A balanced sweet and savory sauce for glazing, dipping, and stir-fry dishes.",
    inStock: true,
    stockCount: 10,
    brand: "Zumra",
    storage: "Dry",
    packing: "Bottle",
    origin: "China",
    sku: "ZU-005",
    rating: 0,
reviews: 0,
  },
  {
    id: 6,
    name: "Nori Sheets",
    price: 350,
    image: premiumImg,
    images: [premiumImg, starterImg],
    category: "Asian Grocery",
    desc: "50 sheets sushi nori.",
    details: "Roasted nori sheets used for sushi rolls, rice wraps, and many Japanese recipes.",
    inStock: true,
    stockCount: 15,
    brand: "Zumra",
    storage: "Dry",
    packing: "50 Sheets",
    origin: "China",
    sku: "ZU-006",
    rating: 0,
reviews: 0,
  },
];

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [productsData, setProductsData] = useState(initialProducts);
  const [user, setUser] = useState(null);
  const [reviewsByProduct, setReviewsByProduct] = useState({});
  const [stars, setStars] = useState(0);
const [comment, setComment] = useState("");
const [firestoreReviews, setFirestoreReviews] = useState([]);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      setUser(result.user);
    } catch (error) {
      console.log(error);
    }
  };
const addReview = async (productId, rating, comment) => {
  const existing = firestoreReviews.find(
    (r) => r.userId === user.uid && String(r.productId) === String(productId)
  );

  const reviewData = {
    userId: user.uid,
    userName: user.displayName || "User",
    userEmail: user.email || "",
    productId: String(productId),
    rating: Number(rating),
    comment: comment || "",
    createdAt: new Date().toLocaleString(),
  };

  setReviewsByProduct((prev) => {
    const currentReviews = prev[productId] || [];
    const filteredReviews = currentReviews.filter(
      (r) => r.userId !== user.uid
    );
    const updatedReviews = [reviewData, ...filteredReviews];

    const totalRatings = updatedReviews.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );
    const avgRating = totalRatings / updatedReviews.length;

    setProductsData((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, rating: avgRating }
          : product
      )
    );

    return {
      ...prev,
      [productId]: updatedReviews,
    };
  });

  if (existing) {
  await updateDoc(doc(db, "reviews", existing.id), {
    rating: Number(rating),
    comment: comment || "",
    updatedAt: new Date().toLocaleString(),
  });
  alert("review updated");
} else {
  await addDoc(collection(db, "reviews"), {
    userId: user.uid,
    userName: user.displayName || "User",
    userEmail: user.email || "",
    productId: String(productId),
    rating: Number(rating),
    comment: comment || "",
    createdAt: new Date().toLocaleString(),
  });
  alert("review saved");
}

  const reviews = await loadReviews(productId);
alert("loadReviews done");
};
const loadReviews = async (productId) => {
  try {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", String(productId))
    );

    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));

    setFirestoreReviews(reviews);
return reviews;
  } catch (error) {
    console.log(error);
  }
};
const deleteReviewById = async (reviewId, productId) => {
  try {
    await deleteDoc(doc(db, "reviews", reviewId));
    await loadReviews(productId);
  } catch (error) {
    console.log(error);
  }
};
const addToCart = (product) => {
    if (product.stockCount === 0) return;

    setProductsData((prevProducts) =>
      prevProducts.map((p) =>
        p.id === product.id
          ? {
              ...p,
              stockCount: p.stockCount - 1,
              inStock: p.stockCount - 1 > 0,
            }
          : p
      )
    );

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
    const product = productsData.find((p) => p.id === id);
    if (!product || product.stockCount === 0) return;

    setProductsData((prevProducts) =>
      prevProducts.map((p) =>
        p.id === id
          ? {
              ...p,
              stockCount: p.stockCount - 1,
              inStock: p.stockCount - 1 > 0,
            }
          : p
      )
    );

    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQty = (id) => {
    const cartItem = cart.find((item) => item.id === id);
    if (!cartItem) return;

    setProductsData((prevProducts) =>
      prevProducts.map((p) =>
        p.id === id
          ? {
              ...p,
              stockCount: p.stockCount + 1,
              inStock: true,
            }
          : p
      )
    );

    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    const cartItem = cart.find((item) => item.id === id);
    if (!cartItem) return;

    setProductsData((prevProducts) =>
      prevProducts.map((p) =>
        p.id === id
          ? {
              ...p,
              stockCount: p.stockCount + cartItem.quantity,
              inStock: true,
            }
          : p
      )
    );

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
    if (!q) return productsData;
    return productsData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)
    );
  }, [search, productsData]);

  const whatsappCartUrl = useMemo(() => {
    if (cart.length === 0) return "#";
    const lines = cart.map(
      (item) =>
        `- ${item.name} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} EGP`
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
        user={user}
        handleLogin={handleLogin}
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

        <Route
  path="/product/:id"
  element={
    <ProductDetails
      addToCart={addToCart}
      productsData={productsData}
      user={user}
      handleLogin={handleLogin}
      addReview={addReview}
      firestoreReviews={firestoreReviews}
      loadReviews={loadReviews}
      deleteReviewById={deleteReviewById}
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
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="cart-total">
                  <h3>Total: {cartTotal.toFixed(2)} EGP</h3>
                  <a
                    href={whatsappCartUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="checkout-btn"
                  >
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

function Header({ cartCount, onOpenCart, search, setSearch, user, handleLogin }) {
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
            {user ? (
              <span>Welcome, {user.displayName}</span>
            ) : (
              <button onClick={handleLogin}>Sign in</button>
            )}

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
            <Link to={`/product/${product.id}`}>
              <img src={product.image} alt={product.name} />
            </Link>

            <span className={product.inStock ? "stock in" : "stock out"}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          <div className="product-body">
            <span className="product-category">{product.category}</span>

            <h4>
              <Link to={`/product/${product.id}`}>{product.name}</Link>
            </h4>

            <p>{product.desc}</p>

            <p className="stock-note">
              {product.stockCount > 0
                ? product.stockCount <= 5
                  ? `Only ${product.stockCount} left`
                  : `${product.stockCount} available`
                : "Out of Stock"}
            </p>

            <div className="product-footer">
              <strong>{product.price.toFixed(2)} EGP</strong>

              <div className="product-actions">
                <Link to={`/product/${product.id}`} className="details-btn">
                  View Details
                </Link>

                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stockCount === 0}
                >
                  {product.stockCount === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
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
function ProductDetails({
  addToCart,
  productsData,
  user,
  handleLogin,
  addReview,
  firestoreReviews,
  loadReviews,
  deleteReviewById,
}) {
  const { id } = useParams();
  const product = productsData.find((item) => item.id === Number(id));
  const [selectedImage, setSelectedImage] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
  if (product) {
    setSelectedImage(product.image);
  }
}, [product]);

  if (!product) {
    return (
      <section className="section">
        <div className="container simple-page">
          <h2>Product not found</h2>
          <p>This product does not exist.</p>
          <Link to="/" className="primary-btn">Back to Home</Link>
        </div>
      </section>
    );
  }

  const relatedProducts = productsData
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const productReviews = (firestoreReviews || []).filter(
  (review) => String(review?.productId ?? "") === String(product?.id ?? "")
);

  const handleSubmitReview = async (e) => {
  e.preventDefault();

  if (!user) {
    handleLogin();
    return;
  }

  if (!reviewRating) return;

  await addReview(product.id, Number(reviewRating), reviewText);

  setReviewText("");
  setReviewRating(5);
};

  return (
    <section className="section product-page-section">
      <div className="container">
        <div className="product-page-layout">
          <div className="product-gallery-side">
            <div className="product-thumbs-vertical">
              {(product.images || [product.image]).map((img, index) => (
                <button
                  key={index}
                  className={`product-thumb ${selectedImage === img ? "active" : ""}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>

            <div className="product-main-preview">
              <img src={selectedImage} alt={product.name} />
            </div>
          </div>

          <div className="product-info-side">
            <div className="product-share">↗</div>
            <h1>{product.name}</h1>

            <p className="mini-muted">Category: {product.category}</p>
            <p className="mini-muted">SKU: {product.sku}</p>

            <div className="product-rating-row">
              <span className="stars">★</span>
              <span>{(product.rating ?? 0).toFixed(1)} ({product.reviews ?? 0} Reviews)</span>
            </div>

            <h2 className="product-big-price">{product.price.toFixed(2)} EGP</h2>

            <p className="product-short-desc">{product.desc}</p>

            <div className="product-info-actions">
              <button onClick={() => addToCart(product)} className="primary-btn">
                Add to Cart
              </button>
              <Link to="/" className="secondary-btn">
                Back
              </Link>
            </div>
          </div>
        </div>

        <div className="product-detail-block">
          <div className="detail-block-head">Item Details</div>
          <div className="details-table">
            <div className="details-row">
              <span>Brand:</span>
              <strong>{product.brand}</strong>
            </div>
            <div className="details-row">
              <span>Packing:</span>
              <strong>{product.packing}</strong>
            </div>
            <div className="details-row">
              <span>Storage:</span>
              <strong>{product.storage}</strong>
            </div>
            <div className="details-row">
              <span>Country of origin:</span>
              <strong>{product.origin}</strong>
            </div>
          </div>
        </div>

        <div className="product-detail-block">
          <div className="detail-block-head">Description</div>
          <div className="detail-block-body">
            <p>{product.details}</p>
          </div>
        </div>

        <div className="product-detail-block">
  <div className="detail-block-head">Customers Reviews</div>

  <div className="reviews-box">
    <div className="reviews-summary">
      <div className="stars">☆ ☆ ☆ ☆ ☆</div>
      <strong>{product.reviews ?? 0}</strong>
      <span>Customer Rating</span>
    </div>

    <div className="reviews-login-note">
      {user ? `Welcome, ${user.displayName}` : "Please login to add your review"}
    </div>

    {!user && (
      <button className="review-login-btn" onClick={handleLogin}>
        LOG IN
      </button>
    )}
  </div>

  {user && (
    <form className="review-form" onSubmit={handleSubmitReview}>
      <div className="review-form-row">
        <label>Rating</label>
        <select
          value={reviewRating}
          onChange={(e) => setReviewRating(e.target.value)}
        >
          <option value={5}>5 Stars</option>
          <option value={4}>4 Stars</option>
          <option value={3}>3 Stars</option>
          <option value={2}>2 Stars</option>
          <option value={1}>1 Star</option>
        </select>
      </div>

      <div className="review-form-row">
        <label>Your Review</label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write comment (optional)"
          rows="4"
        />
      </div>

      <button type="submit" className="review-submit-btn">
        Submit Review
      </button>
    </form>
  )}

  {productReviews.length > 0 && (
    <div className="reviews-list">
      {productReviews.map((review, index) => (
        <div className="review-item" key={index}>
          <div className="review-item-head">
            <strong>{review.userName}</strong>
            <span>{review.createdAt}</span>
          </div>

          <div className="review-stars">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </div>

          {review.comment && <p>{review.comment}</p>}
        </div>
      ))}
    </div>
  )}
</div>

        {relatedProducts.length > 0 && (
          <div className="related-products-wrap">
            <h3>You might also like</h3>

            <div className="products-grid">
              {relatedProducts.map((item) => (
                <div className="product-card" key={item.id}>
                  <div className="product-image-wrap">
                    <Link to={`/product/${item.id}`}>
                      <img src={item.image} alt={item.name} />
                    </Link>

                    <span className={item.inStock ? "stock in" : "stock out"}>
                      {item.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <div className="product-body">
                    <span className="product-category">{item.category}</span>

                    <h4>
                      <Link to={`/product/${item.id}`}>{item.name}</Link>
                    </h4>

                    <p>{item.desc}</p>

                    <p className="stock-note">
                      {item.stockCount > 0
                        ? item.stockCount <= 5
                          ? `Only ${item.stockCount} left`
                          : `${item.stockCount} available`
                        : "Out of Stock"}
                    </p>

                    <div className="product-footer">
                      <strong>{item.price.toFixed(2)} EGP</strong>

                      <div className="product-actions">
                        <Link to={`/product/${item.id}`} className="details-btn">
                          View Details
                        </Link>

                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.stockCount === 0}
                        >
                          {item.stockCount === 0 ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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