import { getAbsoluteUrl } from "../lib/site-url.js";

export const metadata = {
  metadataBase: new URL(getAbsoluteUrl("/")),
  title: {
    default: "Sushi Box | Premium Asian Ingredients",
    template: "%s"
  },
  description: "Sushi Box supplies premium Asian ingredients, sushi essentials, frozen products, sauces, noodles, baozi, and dumplings across the Delta region."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="keywords" content="" />
        <meta name="author" content="" />
        <link rel="shortcut icon" href="/images/favicon.png" type="image/x-icon" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/css/nice-select.min.css" />
        <link rel="stylesheet" href="/css/bootstrap.css" />
        <link rel="stylesheet" href="/css/font-awesome.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap" />
        <link rel="stylesheet" href="/css/style.css?v=20260603d" />
        <link rel="stylesheet" href="/css/responsive.css?v=20260629footerrows" />
      </head>
      <body className="sub_page product-page">{children}</body>
    </html>
  );
}
