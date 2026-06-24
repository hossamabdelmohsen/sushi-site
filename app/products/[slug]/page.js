import Script from "next/script";
import { notFound, permanentRedirect } from "next/navigation";
import { getCanonicalProductPath, getProductBySlug } from "../../../lib/catalog-index.js";
import { buildProductJsonLd } from "../../../lib/product-json-ld.js";
import { buildProductMetadata } from "../../../lib/product-metadata.js";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return buildProductMetadata(product);
}

function CartIcon() {
  return (
    <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 456.029 456.029" style={{ enableBackground: "new 0 0 456.029 456.029" }} xmlSpace="preserve">
      <g>
        <g>
          <path d="M345.6,338.862c-29.184,0-53.248,23.552-53.248,53.248c0,29.184,23.552,53.248,53.248,53.248 c29.184,0,53.248-23.552,53.248-53.248C398.336,362.926,374.784,338.862,345.6,338.862z" />
        </g>
      </g>
      <g>
        <g>
          <path d="M439.296,84.91c-1.024,0-2.56-0.512-4.096-0.512H112.64l-5.12-34.304C104.448,27.566,84.992,10.67,61.952,10.67H20.48 C9.216,10.67,0,19.886,0,31.15c0,11.264,9.216,20.48,20.48,20.48h41.472c2.56,0,4.608,2.048,5.12,4.608l31.744,216.064 c4.096,27.136,27.648,47.616,55.296,47.616h212.992c26.624,0,49.664-18.944,55.296-45.056l33.28-166.4 C457.728,97.71,450.56,86.958,439.296,84.91z" />
        </g>
      </g>
      <g>
        <g>
          <path d="M215.04,389.55c-1.024-28.16-24.576-50.688-52.736-50.688c-29.696,1.536-52.224,26.112-51.2,55.296 c1.024,28.16,24.064,50.688,52.224,50.688h1.024C193.536,443.31,216.576,418.734,215.04,389.55z" />
        </g>
      </g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
      <g></g>
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg className="footer_messenger_icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.2c-5.05 0-9 3.7-9 8.44 0 2.7 1.28 5.1 3.28 6.65v2.92l2.99-1.64c.85.24 1.77.37 2.73.37 5.05 0 9-3.7 9-8.44S17.05 3.2 12 3.2Zm.86 11.08-2.28-2.43-4.43 2.43 4.86-5.16 2.34 2.43 4.37-2.43-4.86 5.16Z" />
    </svg>
  );
}

function Header() {
  return (
    <div className="hero_area">
      <div className="bg-box">
        <picture>
          <source media="(max-width: 768px)" type="image/webp" srcSet="/images/hero-bg.webp" />
          <source type="image/webp" srcSet="/images/optimized/hero-bg-768.webp 768w, /images/optimized/hero-bg-1280.webp 1280w, /images/optimized/hero-bg-1920.webp 1920w" sizes="100vw" />
          <img src="/images/hero-bg.jpg" alt="" width="5647" height="3239" loading="lazy" decoding="async" />
        </picture>
      </div>
      <header className="header_section">
        <div className="container">
          <nav className="navbar navbar-expand-lg custom_nav-container ">
            <a className="navbar-brand" href="/index.html">
              <picture className="brand_logo_picture">
                <source type="image/webp" srcSet="/images/optimized/Logo-160.webp 160w, /images/optimized/Logo-320.webp 320w, /images/optimized/Logo-640.webp 640w" sizes="64px" />
                <img src="/images/Logo.png" alt="Sushi Box logo" width="599" height="593" loading="lazy" decoding="async" />
              </picture>
              <span>Sushi Box</span>
            </a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className=""> </span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav  mx-auto ">
                <li className="nav-item"><a className="nav-link" href="/index.html">Home </a></li>
                <li className="nav-item active"><a className="nav-link" href="/menu.html">Products <span className="sr-only">(current)</span> </a></li>
                <li className="nav-item"><a className="nav-link" href="/book.html">How to Order</a></li>
                <li className="nav-item"><a className="nav-link" href="/about.html">About</a></li>
                <li className="nav-item"><a className="nav-link wishlist_nav_link" href="/wishlist.html">My Favorites <span className="wishlist_count_badge" hidden>0</span></a></li>
              </ul>
              <div className="user_option">
                <a href="" className="user_link"><i className="fa fa-user" aria-hidden="true" /></a>
                <a className="cart_link" href="/cart.html"><CartIcon /></a>
                <form className="form-inline">
                  <button className="btn  my-2 my-sm-0 nav_search-btn" type="submit">
                    <i className="fa fa-search" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
}

function ProductDetails() {
  return (
    <>
      <section className="product_details_section layout_padding">
        <div className="container product_page_container">
          <a href="/menu.html" className="return_menu_btn product_back_link">
            <i className="fa fa-angle-left" aria-hidden="true" />
            Return to Products
          </a>
          <div className="row product_details_layout">
            <div className="col-lg-7 product_gallery_column">
              <div className="product_gallery">
                <div className="product_main_image">
                  <picture id="mainProductPicture">
                    <img id="mainProductImage" alt="Selected product image" width="600" height="600" loading="lazy" decoding="async" />
                  </picture>
                </div>
                <div id="productThumbs" className="product_thumbs" />
              </div>
            </div>
            <div className="col-lg-5 product_info_column">
              <div className="product_info_card">
                <button id="productShareBtn" type="button" className="product_share_detail_btn" aria-label="Share product" title="Share">
                  <i className="fa fa-share-alt" aria-hidden="true" />
                </button>
                <button id="productFavoriteBtn" type="button" className="product_favorite_detail_btn" data-wishlist-product-id="" aria-label="Add product to favorites" aria-pressed="false" title="Add to favorites">
                  <i className="fa fa-heart-o" aria-hidden="true" />
                </button>
                <span id="productCategory" className="product_category_label" />
                <h1 id="productName" />
                <div className="product_rating_meta">
                  <div id="productRatingStars" className="rating_stars_wrap" />
                  <span id="productRatingText" hidden />
                </div>
                <p id="productDescription" />
                <div id="productComponentsSection" className="product_meta_section" hidden>
                  <h2 className="product_meta_title">Components</h2>
                  <ul id="productComponentsList" className="product_feature_list" />
                </div>
                <div id="productItemDetailsSection" className="product_meta_section" hidden>
                  <h2 className="product_meta_title">Item Details</h2>
                  <dl id="productItemDetailsList" className="product_spec_list" />
                </div>
                <div className="product_price_row">
                  <span id="originalPrice" className="product_original_price" hidden />
                  <span id="unitPrice" className="product_sale_price">EGP 0.00</span>
                  <span id="discountBadge" className="product_discount_badge" hidden />
                </div>

                <div className="quantity_wrap">
                  <span>Quantity</span>
                  <div className="qty_controls">
                    <button id="qtyMinus" type="button">-</button>
                    <input id="qtyInput" type="text" value="1" readOnly />
                    <button id="qtyPlus" type="button">+</button>
                  </div>
                </div>

                <p className="product_total_price">Total: <span id="totalPrice">EGP 0.00</span></p>

                <div className="product_action_row">
                  <button id="addToCartBtn" type="button" className="product_cart_primary_btn">
                    <i className="fa fa-shopping-basket" aria-hidden="true" />
                    Add to Cart
                  </button>
                  <button id="productCheckoutBtn" type="button" className="product_checkout_btn">
                    <i className="fa fa-credit-card" aria-hidden="true" />
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="productImageLightbox" className="product_lightbox" hidden aria-hidden="true">
        <div className="product_lightbox_backdrop" data-lightbox-close="true" />
        <div className="product_lightbox_dialog" role="dialog" aria-modal="true" aria-label="Product image preview">
          <div className="product_lightbox_toolbar">
            <div className="product_lightbox_zoom_group" aria-label="Image zoom controls">
              <button id="productImageZoomOut" type="button" className="product_lightbox_control" aria-label="Zoom out">
                <i className="fa fa-search-minus" aria-hidden="true" />
              </button>
              <span id="productImageZoomValue" className="product_lightbox_zoom_value">100%</span>
              <button id="productImageZoomIn" type="button" className="product_lightbox_control" aria-label="Zoom in">
                <i className="fa fa-search-plus" aria-hidden="true" />
              </button>
            </div>
            <button id="productImageLightboxClose" type="button" className="product_lightbox_close" aria-label="Close image preview">
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <div id="productImageLightboxStage" className="product_lightbox_stage">
            <img id="productImageLightboxImage" alt="Expanded product image" width="1200" height="1200" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </>
  );
}

function ProductStory() {
  return (
    <section id="productStorySection" className="product_story_section layout_padding-bottom">
      <div className="container product_page_container">
        <div className="product_story_card">
          <div className="product_detail_tabs" aria-label="Product detail sections">
            <a className="product_detail_tab active" href="#productStorySection">Description</a>
            <a className="product_detail_tab" href="#productComponentsSection">Components</a>
            <a className="product_detail_tab" href="#productReviewsSection">Reviews</a>
          </div>
          <div className="heading_container">
            <h2>Product Description</h2>
          </div>
          <h3 id="productStoryTitle" className="product_story_title" />
          <p id="productStoryLead" className="product_story_lead" />
          <div id="productStoryBody" className="product_story_body" />
        </div>
      </div>
    </section>
  );
}

function ProductReviews() {
  return (
    <section id="productReviewsSection" className="product_reviews_section layout_padding-bottom">
      <div className="container product_page_container">
        <div className="product_reviews_stack">
          <div className="reviews_summary_card">
            <span className="reviews_kicker">Live customer reviews</span>
            <h2>What customers think</h2>
            <div className="rating_overview">
              <div className="rating_overview_score" id="averageRatingValue">0.0</div>
              <div className="rating_overview_meta">
                <div id="averageRatingStars" className="rating_stars_wrap" />
                <p><span id="reviewCountValue">0</span> ratings</p>
              </div>
            </div>
            <p className="reviews_summary_text" id="ratingSummaryText">Be the first to rate this product and help future customers choose with confidence.</p>
          </div>

          <div id="reviewsList" className="reviews_list" />

          <div className="reviews_panel">
            <div className="reviews_panel_head">
              <div>
                <span className="reviews_kicker">Share your experience</span>
                <h3>Leave a review</h3>
              </div>
            </div>

            <form id="reviewForm" className="review_form">
              <div className="review_field">
                <label>Rating</label>
                <div className="review_star_picker" aria-label="Choose a star rating from one to five">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" className="review_star_btn" data-rating={rating} aria-label={`Rate ${rating} star${rating === 1 ? "" : "s"}`}>
                      <i className="fa fa-star" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="review_field">
                <label htmlFor="reviewComment">Comment</label>
                <textarea id="reviewComment" rows="5" placeholder="Tell other customers what stood out about this product." />
              </div>

              <div className="review_form_actions">
                <button id="reviewSubmitBtn" type="submit" className="review_submit_btn">Publish Review</button>
                <button id="reviewDeleteBtn" type="button" className="review_delete_btn" hidden>Delete My Review</button>
              </div>

              <p id="reviewFormStatus" className="review_form_status">Please sign in first to review this product.</p>
            </form>
            <div id="reviewAuthNotice" className="review_auth_notice" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Recommendations() {
  return (
    <section className="product_recommendations_section products-section layout_padding-bottom">
      <div className="container product_page_container">
        <div className="heading_container">
          <h2>You Might Also Like</h2>
          <p>Handpicked pairings for this product.</p>
        </div>
        <div id="recommendedProducts" className="recommendations_grid products-grid" />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer_section">
      <div className="container">
        <div className="row">
          <div className="col-md-4 footer-col">
            <div className="footer_contact">
              <h4>Contact Us</h4>
              <div className="contact_link_box">
                <a href="https://maps.google.com/?q=Egypt%20El%20Gharbia%20El%20Mahalla%20El%20Kubra" target="_blank" rel="noopener noreferrer"><i className="fa fa-map-marker" aria-hidden="true" /><span>Egypt - El Gharbia - El Mahalla El Kubra</span></a>
                <a href="tel:+201503460361"><i className="fa fa-phone" aria-hidden="true" /><span>Call +201503460361</span></a>
                <a href="https://wa.me/201503460361" target="_blank" rel="noopener noreferrer"><i className="fa fa-whatsapp" aria-hidden="true" /><span>WhatsApp</span></a>
                <a href="mailto:info@sushiboxshop.com"><i className="fa fa-envelope" aria-hidden="true" /><span>info@sushiboxshop.com</span></a>
              </div>
            </div>
            <nav className="footer_policy_links footer_policy_links_contact" aria-label="Company links">
              <a href="/about.html">About Us</a>
              <a href="/privacy-policy.html">Privacy Policy</a>
            </nav>
          </div>
          <div className="col-md-4 footer-col">
            <div className="footer_detail">
              <a href="/index.html" className="footer-logo">Sushi Box</a>
              <p>Sushi Box is your trusted source for premium Asian ingredients, sushi essentials, frozen products, sauces, noodles, baozi, dumplings, and reliable supply across the Delta region.</p>
              <div className="footer_social">
                <a href="https://www.facebook.com/profile.php?id=61589534703634" target="_blank" rel="noopener noreferrer"><i className="fa fa-facebook" aria-hidden="true" /></a>
                <a href="https://x.com/SushiBo0oX" target="_blank" rel="noopener noreferrer"><i className="fa fa-twitter" aria-hidden="true" /></a>
                <a href="https://www.instagram.com/sushibo0ox/" target="_blank" rel="noopener noreferrer"><i className="fa fa-instagram" aria-hidden="true" /></a>
                <a href="https://wa.me/201503460361" target="_blank" rel="noopener noreferrer"><i className="fa fa-whatsapp" aria-hidden="true" /></a>
                <a className="footer_messenger_link" href="https://m.me/61589534703634" target="_blank" rel="noopener noreferrer" aria-label="Messenger"><MessengerIcon /></a>
              </div>
            </div>
          </div>
          <div className="col-md-4 footer-col">
            <h4>Delivery Schedule</h4>
            <div className="delivery-list simple-footer-list">
              {[
                ["fa-map-marker", "Kafr El Sheikh"],
                ["fa-truck", "Mansoura"],
                ["fa-calendar", "Tanta"],
                ["fa-map-marker", "El Mahalla"]
              ].map(([icon, city]) => (
                <div className="footer-info-item delivery-item" key={city}>
                  <span className="footer-icon delivery-icon"><i className={`fa ${icon}`} aria-hidden="true" /></span>
                  <div className="delivery-text"><strong>{city}</strong><span>Wednesday, Thursday, Friday</span></div>
                </div>
              ))}
            </div>
            <nav className="footer_policy_links footer_policy_links_delivery" aria-label="Policy links">
              <a href="/delivery-shipping-policy.html">Delivery &amp; Shipping Policy</a>
              <a href="/refund-cancellation-policy.html">Refund &amp; Cancellation Policy</a>
            </nav>
          </div>
        </div>
        <div className="footer-info">
          <p>&copy; <span id="displayYear" /> Sushi Box. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function ProductScripts() {
  return (
    <>
      <Script src="/js/jquery-3.4.1.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" strategy="afterInteractive" />
      <Script src="/js/bootstrap.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js" strategy="afterInteractive" />
      <Script src="https://unpkg.com/isotope-layout@3.0.4/dist/isotope.pkgd.min.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/js/jquery.nice-select.min.js" strategy="afterInteractive" />
      <Script src="/js/custom.js?v=20260603a" strategy="afterInteractive" />
      <Script type="module" src="/js/navbar-offers.js?v=20260518c" strategy="afterInteractive" />
      <Script type="module" src="/js/app-shell.js?v=20260617b" strategy="afterInteractive" />
      <Script type="module" src="/js/product-page.js?v=20260618b" strategy="afterInteractive" />
    </>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  if (slug !== product.id) {
    permanentRedirect(getCanonicalProductPath(product));
  }

  const jsonLd = buildProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ProductDetails />
      <ProductStory />
      <ProductReviews />
      <Recommendations />
      <Footer />
      <ProductScripts />
    </>
  );
}
