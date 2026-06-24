const zumraSushiKitComponents = [
  "Sushi Vinegar - 150 ml",
  "Zumra Premium Soy Sauce - 50 ml",
  "He Shun Yuan Teriyaki Sauce - 50 ml",
  "ZUMRA Wasabi - 4 Sachets",
  "Zumra Pickled Ginger - 150 gm",
  "Zumra Sushi Nori - 10 Sheets",
  "Japanese Sushi Rice - 500 gm",
  "Zumra Bamboo Chopsticks + Helpers - 3 pcs",
  "Bamboo Sushi Rolling Mat - 24 cm"
];

const zumraSushiKitItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Storage", value: "Dry" },
  { label: "Packing", value: "Carton 1 Piece" },
  { label: "Country of origin", value: "Egypt" }
];

const zumraSushiNoriComponents = [
  "Number of sheets: 10"
];

const zumraSushiNoriItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Sushi Nori - 10 Sheet" },
  { label: "Type", value: "Simple" }
];

const zumraSushiVinegarImages = [
  "images/optimized/37-Zumra Sushi Vinegar - 150 ml.webp"
];

const zumraSushiVinegarItemDetails = [
  { label: "Product Name", value: "Zumra Sushi Vinegar - 150 ml" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Sushi Vinegar - 150 ml" },
  { label: "Type", value: "Simple Product" },
  { label: "Size", value: "150 ml" }
];

const zumraPankoBreadcrumbsImages = [
  "images/optimized/3-Zumra Panko Breadcrumbs - 200 gm-Front.webp",
  "images/optimized/3-Zumra Panko Breadcrumbs - 200 gm-Back.webp"
];

const zumraPankoBreadCrumbs1KgImages = [
  "images/optimized/3-Zumra Panko Bread Crumbs - 1 kg-Front.webp",
  "images/optimized/3-Zumra Panko Bread Crumbs - 1 kg-Back.webp"
];

const zumraPankoBreadcrumbsIntro = "Add a light, satisfying crunch to your dishes with Zumra Panko Bread Crumbs - made from premium wheat flour, yeast, oil, and salt for a golden, crispy texture that doesn't absorb too much oil.";

function getZumraPankoBreadcrumbsItemDetails(productName, weight) {
  return [
    { label: "Product Name", value: productName },
    { label: "Weight", value: weight },
    { label: "Brand", value: "Zumra" },
    { label: "Model Name", value: productName },
    { label: "Type", value: "Simple" }
  ];
}

function getZumraPankoBreadcrumbsDescriptionBlocks(weight) {
  return [
    {
      type: "paragraph",
      text: "Whether you're frying, baking, or topping your favorite dishes, these panko bread crumbs give you that perfect crunch every time."
    },
    {
      type: "list",
      title: "Product Details",
      items: [
        `Weight: ${weight}`,
        "Ingredients: Wheat flour, yeast, oil, salt",
        "Texture: Light, airy, and extra crispy"
      ]
    },
    {
      type: "list",
      title: "Why Choose Zumra Panko Bread Crumbs?",
      items: [
        "Stays crispy longer - doesn't get soggy after cooking",
        "Perfect for frying chicken, shrimp, or onion rings",
        "Adds a crunchy topping to casseroles, gratins, and baked pasta",
        "Versatile and easy to use in everyday recipes"
      ]
    },
    {
      type: "list",
      title: "How to Use:",
      items: [
        "Coat chicken or cutlets before frying for a crunchy crust",
        "Mix into meatballs for a better, firmer texture",
        "Sprinkle over pasta or Vegetable Baozi before baking for added crisp"
      ]
    },
    {
      type: "paragraph",
      segments: [
        "Pair it with flavorful sauces like ",
        { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
        ", ",
        { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
        ", or a drizzle of ",
        { text: "Dark Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
        " for an unbeatable finish."
      ]
    },
    {
      type: "list",
      title: "How to use?",
      items: [
        "1- Use breadcrumbs to bread cutlets and chicken for a crunchy taste.",
        "2- Add to meatballs for better texture",
        "3- Sprinkle on top of pasta and gratin to make a crunchy layer."
      ]
    }
  ];
}

const solySmokedSalmonImages = [
  "images/optimized/505.webp",
  "images/optimized/4-Smoked Salmon golden fish - 250gm-2nd.webp",
  "images/optimized/4-Smoked Salmon golden fish - 250gm-3rd.webp"
];

const solySmokedSalmonDescription = "Your perfect choice for lunch or dinner! Smoked salmon from Soly. A rich and healthy meal. Salmon is loaded with Omega3, minerals, and vitamins. Try out Soly's Salmon Fillet Cut and enjoy the premium quality besides a luscious taste.";

const solySmokedSalmonUsage = "Smoked salmon is already cooked so it doesn't need any further cooking. It can be consumed straight off the package or can be served as slices on toast with cream cheese, in making sushi, or can be included in salads.";

function getSolySmokedSalmonItemDetails(productName, weight) {
  return [
    { label: "Product Name", value: productName },
    { label: "Weight", value: weight },
    { label: "Type", value: "Smoked Salmon" },
    { label: "Brand", value: "Soly" },
    { label: "Model Name", value: productName },
    { label: "Product Type", value: "Simple" }
  ];
}

function getSolySmokedSalmonDescriptionBlocks(weight) {
  return [
    {
      type: "list",
      title: "Product Details",
      items: [
        `Weight: ${weight}`,
        "Type: Smoked Salmon",
        "Brand: Soly",
        "Product Type: Simple"
      ]
    },
    {
      type: "paragraph",
      title: "How to use?",
      text: solySmokedSalmonUsage
    }
  ];
}

const bosphorusShrimpProductName = "Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm";

const bosphorusShrimpDescription = "Enjoy the goodness of shrimps, rich in protein and low in calories. Delight in Bosphorus' Emirati Shrimps, perfect whether grilled or fried, tailored to your taste preferences. Try now.";

const bosphorusShrimpUsage = "Peeled shrimp can be easily included in any recipe as for their infinite uses, they can be prepared in many ways; broiled, grilled, boiled, or sauteed. Use peeled shrimp also in making shrimp pasta.";

const bosphorusShrimpPreparation = "To prepare peeled shrimp, bring water to a boil. Once boiling, add shrimp and cook until it turns orange or pink in color. Then drain and let it cool. It is now ready to be used in any recipe.";

const bosphorusShrimpImages = [
  "images/optimized/11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm.webp",
  "images/optimized/11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm-2nd.webp"
];

const bosphorusShrimpItemDetails = [
  { label: "Product Name", value: bosphorusShrimpProductName },
  { label: "Weight", value: "400 gm" },
  { label: "Brand", value: "Bosphorus" },
  { label: "Model Name", value: bosphorusShrimpProductName },
  { label: "Type", value: "Simple" },
  { label: "Count", value: "30-40 Pieces" }
];

const bosphorusShrimpLargeProductName = "Bosphorus Emirati Large Peeled And Deveined Shrimp (40-60 Pieces) - 400 gm";

const bosphorusShrimpLargeDescription = bosphorusShrimpDescription;

const bosphorusShrimpLargeImages = [
  "images/optimized/12-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm.webp",
  "images/optimized/11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm-2nd.webp"
];

const bosphorusShrimpLargeItemDetails = [
  { label: "Product Name", value: bosphorusShrimpLargeProductName },
  { label: "Weight", value: "400 gm" },
  { label: "Brand", value: "Bosphorus" },
  { label: "Model Name", value: bosphorusShrimpLargeProductName },
  { label: "Type", value: "Simple" },
  { label: "Count", value: "40-60 Pieces" }
];

const bosphorusShrimpMediumProductName = "Bosphorus Emirati Medium Peeled And Deveined Shrimp (60-80 Pieces) - 400 gm";

const bosphorusShrimpMediumDescription = bosphorusShrimpDescription;

const bosphorusShrimpMediumImages = [
  "images/optimized/13-Bosphorus Emirati Medium Peeled And Deveined Shrimp (60-80 Pieces) - 400 gm.webp",
  "images/optimized/11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm-2nd.webp"
];

const bosphorusShrimpMediumItemDetails = [
  { label: "Product Name", value: bosphorusShrimpMediumProductName },
  { label: "Weight", value: "400 gm" },
  { label: "Brand", value: "Bosphorus" },
  { label: "Model Name", value: bosphorusShrimpMediumProductName },
  { label: "Type", value: "Simple" },
  { label: "Count", value: "60-80 Pieces" }
];

const productAliases = {
  "bosphorus-shrimp-emirati-extra-large-peeled-and-deveined-30-40-pieces-400gm": "bosphorus-shrimp-emirati-extra-large-peeled-deveined-30-40-400gm",
  "bamboo-sushi-rolling-mat-27-cm": "bamboo-sushi-rolling-mat-27cm",
  "bamboo-sushi-rolling-mat-24-24cm": "bamboo-sushi-rolling-mat-24x24cm",
  "bamboo-sushi-rolling-mat-24cm": "bamboo-sushi-rolling-mat-24x24cm",
  "bamboo-sushi-rolling-mat-24*24-cm": "bamboo-sushi-rolling-mat-24x24cm",
  "zumra-panko-bread-crumbs-1kg": "zumra-panko-breadcrumbs-1kg",
  "smoked-salmon-golden-fish-250gm": "soly-smoked-salmon-200gm"
};

const zumraCrabSticksItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Crab Sticks - Surimi 45% - 250 gm" },
  { label: "Type", value: "Simple" }
];

const zumraDarkSoySauceItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Dark Soy Sauce - 150 ml" },
  { label: "Type", value: "Simple" }
];

const zumraPremiumSoySauceImages = [
  "images/optimized/31-Zumra Premium Soy Sauce - 150 ml.webp"
];

const zumraPremiumSoySauceItemDetails = [
  { label: "Product Name", value: "Zumra Premium Soy Sauce - 150 ml" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Premium Soy Sauce - 150 ml" },
  { label: "Type", value: "Simple Product" },
  { label: "Size", value: "150 ml" },
  { label: "Sauce Type", value: "Naturally brewed, thick soy sauce" }
];

const zumraLightSoySauceImages = [
  "images/optimized/32-Zumra Light Soy Sauce - 625 ml.webp",
  "images/optimized/32-Zumra Light Soy Sauce - 625 ml-2nd.webp",
  "images/optimized/32-Zumra Light Soy Sauce - 625 ml-3rd.webp"
];

const zumraLightSoySauceItemDetails = [
  { label: "Product Name", value: "Zumra Light Soy Sauce - 625 ml" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Light Soy Sauce - 625 ml" },
  { label: "Type", value: "Simple Product" },
  { label: "Size", value: "625 ml" },
  { label: "Ingredients", value: "Water, salt, 11% soybeans, wheat flour, monosodium glutamate, potassium sorbate (E202)" }
];

const taiHuaSweetSauceImages = [
  "images/optimized/33-Tai Hua Sweet Sauce - 320 ml.webp",
  "images/optimized/33-Tai Hua Sweet Sauce - 320 ml-2nd.webp"
];

const taiHuaSweetSauceItemDetails = [
  { label: "Product Name", value: "Tai Hua Sweet Sauce - 320 ml" },
  { label: "Brand", value: "Tai Hua" },
  { label: "Model Name", value: "Tai Hua Sweet Sauce - 320 ml" },
  { label: "Type", value: "Simple Product" },
  { label: "Size", value: "320 ml" }
];

const kikkomanSoySauceTablePotImages = [
  "images/optimized/35-Kikkoman Soy Sauce Table Pot - 148 ml.webp",
  "images/35-Kikkoman Soy Sauce Table Pot - 148 ml-2nd.webp"
];

const kikkomanSoySauceTablePotItemDetails = [
  { label: "Product Name", value: "Kikkoman Soy Sauce Table Pot - 148 ml" },
  { label: "Brand", value: "Kikkoman" },
  { label: "Model Name", value: "Kikkoman Soy Sauce Table Pot - 148 ml" },
  { label: "Type", value: "Simple Product" },
  { label: "Size", value: "148 ml" }
];

const zumraTeriyakiSauceItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Teriyaki Sauce - 150 ml" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "150 ml" },
  { label: "Storage", value: "Dry" },
  { label: "Country of origin", value: "China" }
];

const zumraSweetChiliSauceItemDetails = [
  { label: "Model Name", value: "Zumra Sweet Chili Sauce - 280 gm" },
  { label: "Type", value: "Simple" }
];

const zumraSrirachaSauceItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Sriracha Sauce - 250 ml" },
  { label: "Type", value: "Simple" }
];

const zumraBobaPearlsItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Boba Pearls - 1 kg" },
  { label: "Type", value: "Simple" },
  { label: "Storage", value: "Dry" },
  { label: "Country of origin", value: "Thailand" },
  { label: "Weight", value: "1 kg" }
];

const zumraCoconutCreamImages = [
  "images/optimized/coconut-cream-front.webp",
  "images/optimized/coconut-cream-side.webp"
];

const zumraCoconutCreamItemDetails = [
  { label: "Product Name", value: "Zumra Coconut Cream 20-22% Fat - 400 ml" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Creamy Coconut Milk 20-22% Fat - 400 ml" },
  { label: "Type", value: "Simple Product" },
  { label: "Size", value: "400 ml" },
  { label: "Ingredients", value: "Coconut, water" },
  { label: "Fat Content", value: "20-22%" }
];

const amrSweetCornImages = [
  "images/optimized/30-AMR Sweet Corn - 400 gm.webp"
];

const amrSweetCornItemDetails = [
  { label: "Product Name", value: "AMR Sweet Corn - 400 gm" },
  { label: "Brand", value: "AMR" },
  { label: "Model Name", value: "AMR Sweet Corn - 400 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "400 gm" }
];

const zumraRiceCakeImages = [
  "images/optimized/14-Zumra Rice Cake (Tteokbokki) - 250 gm.webp",
  "images/optimized/14-Zumra Rice Cake (Tteokbokki) - 250 gm-2nd.webp",
  "images/optimized/14-Zumra Rice Cake (Tteokbokki) - 250 gm-3rd.webp",
  "images/optimized/14-Zumra Rice Cake (Tteokbokki) - 250 gm-4th.webp"
];

const zumraRiceCakeItemDetails = [
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Rice Cake (Tteokbokki) - 250 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "250 gm" }
];

const yopokkiSpicyRiceCakesImages = [
  "images/optimized/36-Yopokki Korean Spicy Rice Cakes - 120 gm.webp",
  "images/36-Yopokki Korean Spicy Rice Cakes - 120 gm-2nd.webp",
  "images/optimized/36-Yopokki Korean Spicy Rice Cakes - 120 gm-3rd.webp",
  "images/36-Yopokki Korean Spicy Rice Cakes - 120 gm-3rd.webp"
];

const yopokkiSpicyRiceCakesItemDetails = [
  { label: "Product Name", value: "Yopokki Korean Spicy Rice Cakes - 120 gm" },
  { label: "Brand", value: "Yopokki" },
  { label: "Model Name", value: "Yopokki Korean Spicy Rice Cakes - 120 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "120 gm" }
];

const samyangRamenImages = [
  "images/optimized/15-Samyang Hot Chicken Carbonara Korean Ramen Noodles - 130 gm.webp",
  "images/optimized/15-Samyang Hot Chicken Carbonara Korean Ramen Noodles - 130 gm-2nd.webp",
  "images/15-Samyang Hot Chicken Carbonara Korean Ramen Noodles - 130 gm-3rd.webp"
];

const samyangCreamCarbonaraImages = [
  "images/optimized/16-Samyang Cream Carbonara Ramen - 140 gm.webp"
];

const samyangHotChickenImages = [
  "images/optimized/23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm.webp",
  "images/optimized/23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm-2nd.webp",
  "images/23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm-3rd.webp",
  "images/23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm-4th.webp"
];

const samyangHotCheeseImages = [
  "images/optimized/24-Samyang Hot Chicken and Cheese Korean Ramen Noodles - 140 gm.webp",
  "images/optimized/24-Samyang Hot Chicken and Cheese Korean Ramen Noodles - 140 gm-2nd.webp"
];

const samyangHotChickenJjajangImages = [
  "images/optimized/26-Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm.webp",
  "images/optimized/26-Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm-2nd.webp"
];

const samyangBuldakHabaneroLimeImages = [
  "images/optimized/28-Samyang Buldak Habanero Lime Spicy Chicken - 135 gm.webp",
  "images/optimized/28-Samyang Buldak Habanero Lime Spicy Chicken - 135 gm-2nd.webp",
  "images/optimized/28-Samyang Buldak Habanero Lime Spicy Chicken - 135 gm-3rd.webp"
];

const samyangCreamCarbonaraItemDetails = [
  { label: "Product Name", value: "Samyang Cream Carbonara Ramen - 140 gm" },
  { label: "Brand", value: "Samyang" },
  { label: "Model Name", value: "Samyang Cream Carbonara Ramen - 140 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "140 gm" }
];

const samyangRamenItemDetails = [
  { label: "Product Name", value: "Samyang Hot Carbonara & Chicken Korean Ramen - 130 gm" },
  { label: "Brand", value: "Samyang" },
  { label: "Model Name", value: "Samyang Hot Carbonara & Chicken Korean Ramen - 130 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "130 gm" }
];

const samyangHotChickenItemDetails = [
  { label: "Product Name", value: "Samyang Hot Chicken Korean Ramen Noodles - 140 gm" },
  { label: "Brand", value: "Samyang" },
  { label: "Model Name", value: "Samyang Hot Chicken Korean Ramen Noodles - 140 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "140 gm" }
];

const samyangHotCheeseItemDetails = [
  { label: "Product Name", value: "Samyang Hot Cheese and Chicken Korean Ramen Noodles - 140 gm" },
  { label: "Brand", value: "Samyang" },
  { label: "Model Name", value: "Samyang Hot Cheese and Chicken Korean Ramen Noodles - 140 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "140 gm" }
];

const samyangHotChickenJjajangItemDetails = [
  { label: "Product Name", value: "Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm" },
  { label: "Brand", value: "Samyang" },
  { label: "Model Name", value: "Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "140 gm" },
  { label: "SHU", value: "2,600" }
];

const samyangBuldakHabaneroLimeItemDetails = [
  { label: "Product Name", value: "Samyang Buldak Habanero Lime Spicy Chicken - 135 gm" },
  { label: "Brand", value: "Samyang" },
  { label: "Model Name", value: "Samyang Buldak Habanero Lime Spicy Chicken - 135 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "135 gm" },
  { label: "Flavor", value: "Lime Spicy Chicken" }
];

const zumraChickenDumplingsImages = [
  "images/optimized/17-Zumra Chicken Dumplings - 200 gm.webp",
  "images/optimized/17-Zumra Chicken Dumplings - 200 gm-2nd.webp",
  "images/optimized/17-Zumra Chicken Dumplings - 200 gm-3rd.webp"
];

const zumraChickenBaoziImages = [
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces.webp",
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces-2nd.webp",
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces-3rd.webp"
];

const zumraBeefBaoziImages = [
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces.webp",
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces-2nd.webp",
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces-3rd.webp"
];

const zumraVeggiesBaoziImages = [
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces.webp",
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces-2nd.webp",
  "images/optimized/27-Zumra Chicken Baozi - 4 Pieces-3rd.webp"
];

const zumraChickenDumplingsItemDetails = [
  { label: "Product Name", value: "Zumra Chicken Dumplings - 200 gm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Chicken Dumplings - 200 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "200 gm" },
  { label: "Number of pieces", value: "7" }
];

const zumraChickenBaoziItemDetails = [
  { label: "Product Name", value: "Zumra Chicken Baozi - 4 Pieces" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Chicken Baozi - 4 Pieces" },
  { label: "Type", value: "Simple Product" },
  { label: "Filling", value: "Chicken" },
  { label: "No. of Pieces", value: "4" }
];

const zumraBeefBaoziItemDetails = [
  { label: "Product Name", value: "Zumra Beef Baozi - 4 Pieces" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Beef Baozi - 4 Pieces" },
  { label: "Type", value: "Simple Product" },
  { label: "Filling", value: "Beef" },
  { label: "No. of Pieces", value: "4" }
];

const zumraVeggiesBaoziItemDetails = [
  { label: "Product Name", value: "Zumra Veggies Baozi - 4 Pieces" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Veggies Baozi - 4 Pieces" },
  { label: "Type", value: "Simple Product" },
  { label: "Filling", value: "Fresh vegetable mix" },
  { label: "Number of Pieces", value: "4" },
  { label: "Product Type", value: "Ready-to-cook steamed buns" }
];

const zumraBeefDumplingsImages = [
  "images/optimized/18-Zumra Beef Dumplings - 200 gm.webp",
  "images/optimized/18-Zumra Beef Dumplings - 200 gm-2nd.webp",
  "images/optimized/17-Zumra Chicken Dumplings - 200 gm-3rd.webp"
];

const zumraBeefDumplingsItemDetails = [
  { label: "Product Name", value: "Zumra Beef Dumplings - 200 gm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Beef Dumplings - 200 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "200 gm" },
  { label: "Number of pieces", value: "7" }
];

const zumraVegetableDumplingsImages = [
  "images/optimized/22-Zumra Vegetable Dumplings - 200 gm.webp",
  "images/optimized/22-Zumra Vegetable Dumplings - 200 gm-2nd.webp",
  "images/optimized/17-Zumra Chicken Dumplings - 200 gm-3rd.webp"
];

const zumraVegetableDumplingsItemDetails = [
  { label: "Product Name", value: "Zumra Vegetable Dumplings - 200 gm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Vegetable Dumplings - 200 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "200 gm" },
  { label: "Number of Pieces", value: "7" }
];

const zumraShrimpDumplingsImages = [
  "images/optimized/20-Zumra Shrimp Dumplings - 200 gm.webp",
  "images/optimized/20-Zumra Shrimp Dumplings - 200 gm-2nd.webp",
  "images/optimized/17-Zumra Chicken Dumplings - 200 gm-3rd.webp"
];

const zumraShrimpDumplingsItemDetails = [
  { label: "Product Name", value: "Zumra Shrimp Dumplings - 200 gm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Shrimp Dumplings - 200 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "200 gm" },
  { label: "Filling", value: "Fresh shrimp" }
];

const zumraChopsticksImages = [
  "images/optimized/19-506.webp"
];

const zumraChopsticksItemDetails = [
  { label: "Product Name", value: "Zumra Chopsticks - 25 Pcs + Helpers - 5 Pcs" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Chopsticks - 25 Pcs + Helpers - 5 Pcs" },
  { label: "Type", value: "Simple" },
  { label: "Chopsticks", value: "25 Pcs" },
  { label: "Helpers", value: "5 Pcs" }
];

const bambooSushiRollingMatImages = [
  "images/optimized/39-Bamboo Sushi Rolling Mat - 27 cm.webp",
  "images/39-Bamboo Sushi Rolling Mat - 27 cm-2nd.webp",
  "images/39-Bamboo Sushi Rolling Mat - 27 cm.3rd.webp",
  "images/optimized/39-Bamboo Sushi Rolling Mat - 27 cm-4th.webp",
  "images/optimized/39-Bamboo Sushi Rolling Mat - 27 cm-5th.webp",
  "images/optimized/39-Bamboo Sushi Rolling Mat - 27 cm-6th.webp"
];

const bambooSushiRollingMatDescription = "Roll your sushi like a pro with this sushi mat made of natural fine bamboo that provides a non-stick surface which will guarantee a smooth and easy experience and a perfect sushi roll. Try now.";

const bambooSushiRollingMatRecommendedProductIds = [
  "zumra-sushi-nori-sheets",
  "zumra-sushi-vinegar-150ml",
  "zumra-premium-soy-sauce-150ml",
  "zumra-chopsticks-25pcs-helpers-5pcs",
  "zumra-pickled-ginger-150gm",
  "zumra-crab-sticks-surimi-45-250gm",
  "zumra-dark-soy-sauce-150ml",
  "samyang-cream-carbonara-ramen-140gm"
];

function getBambooSushiRollingMatItemDetails(productName, dimensions) {
  return [
    { label: "Product Name", value: productName },
    { label: "Model Name", value: productName },
    { label: "Type", value: "Simple" },
    { label: "Material", value: "Natural fine bamboo woven with cotton thread" },
    { label: "Dimensions", value: dimensions }
  ];
}

function getBambooSushiRollingMatDescriptionBlocks(dimensions, alternateMatId, alternateMatName) {
  return [
    {
      type: "paragraph",
      text: `Natural bamboo sushi mat. Woven with cotton thread. Dimensions: ${dimensions}.`
    },
    {
      type: "list",
      title: "Why You'll Love This Sushi Mat",
      items: [
        "Natural fine bamboo provides a smooth, reliable rolling surface",
        "Cotton-thread weave gives the mat flexibility and control",
        "Ideal for homemade maki rolls, sushi nights, and beginner practice",
        "Easy to pair with nori sheets, sushi vinegar, rice, and dipping sauces"
      ]
    },
    {
      type: "list",
      title: "How to use?",
      items: [
        "1. Lay out your bamboo mat with a piece of plastic wrap on top (optional)",
        "2. Make sure that the dried seaweed (nori) has its rough side facing upward.",
        "3. Spread rice evenly over the nori while leaving space at the top and bottom of the sheet.",
        "4. Start rolling while lightly pressing on the mat to make a perfect tight roll"
      ]
    },
    {
      type: "paragraph",
      segments: [
        "Complete your sushi setup with ",
        { text: "Zumra Sushi Nori Sheets", href: buildProductUrl("zumra-sushi-nori-sheets") },
        ", ",
        { text: "Zumra Sushi Vinegar", href: buildProductUrl("zumra-sushi-vinegar-150ml") },
        ", ",
        { text: "Zumra Premium Soy Sauce", href: buildProductUrl("zumra-premium-soy-sauce-150ml") },
        ", ",
        { text: "Zumra Pickled Ginger", href: buildProductUrl("zumra-pickled-ginger-150gm") },
        ", and ",
        { text: "Zumra Chopsticks", href: buildProductUrl("zumra-chopsticks-25pcs-helpers-5pcs") },
        "."
      ]
    },
    {
      type: "paragraph",
      segments: [
        "Need another size? View the ",
        { text: alternateMatName, href: buildProductUrl(alternateMatId) },
        "."
      ]
    }
  ];
}

const zumraPickledGingerImages = [
  "images/optimized/21-Zumra Pickled Ginger - 150 gm.webp",
  "images/optimized/21-Zumra Pickled Ginger - 150 gm-2nd.webp",
  "images/optimized/21-Zumra Pickled Ginger - 150 gm-3rd.webp"
];

const zumraPickledGingerItemDetails = [
  { label: "Product Name", value: "Zumra Pickled Ginger - 150 gm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Pickled Ginger - 150 gm" },
  { label: "Type", value: "Simple" },
  { label: "Weight", value: "150 gm" }
];

const zumraKimchiImages = [
  "images/optimized/34-Zumra Kimchi - 200 gm.webp"
];

const zumraKimchiItemDetails = [
  { label: "Product Name", value: "Zumra Kimchi - 200 gm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Kimchi - 200 gm" },
  { label: "Type", value: "Simple Product" },
  { label: "Weight", value: "200 gm" },
  { label: "Dietary Info", value: "Gluten-free, low fat, high fiber" }
];

const zumraRicePaperImages = [
  "images/optimized/25-Zumra Round Rice Paper - 22 cm.webp",
  "images/25-Zumra Fresh Round Rice Paper - 22 cm-2nd.webp",
  "images/25-Zumra Fresh Round Rice Paper - 22 cm-3rd.webp",
  "images/25-Zumra Fresh Round Rice Paper - 22 cm-4th.webp",
  "images/optimized/25-Zumra Fresh Round Rice Paper - 22 cm-5th.webp"
];

const zumraRicePaperItemDetails = [
  { label: "Product Name", value: "Zumra Fresh Round Rice Paper - 22 cm" },
  { label: "Brand", value: "Zumra" },
  { label: "Model Name", value: "Zumra Fresh Round Rice Paper - 22 cm" },
  { label: "Type", value: "Simple" },
  { label: "Size", value: "22 cm" },
  { label: "Weight", value: "340 gm" },
  { label: "Shape", value: "Round" }
];

export const productCatalog = [
  {
    id: "samyang-hot-carbonara-chicken-korean-ramen-130gm",
    name: "Samyang Hot Carbonara & Chicken Korean Ramen - 130 gm",
    category: "Noodles / Ramen",
    filterGroup: "noodles",
    price: 140,
    description: "Treat yourself to the quickest yet most delicious ramen noodles from Samyang. Made of the finest wheat flour that's thicker and chewier than regular ramen. Try now & enjoy some spiciness.",
    images: samyangRamenImages,
    itemDetails: samyangRamenItemDetails,
    recommendedProductIds: [
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-dark-soy-sauce-150ml",
      "zumra-sriracha-sauce-250ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-teriyaki-sauce-150ml"
    ],
    longDescriptionTitle: "Samyang Hot Carbonara & Chicken Korean Ramen - 130 gm",
    longDescriptionIntro: "A spicy Korean carbonara chicken ramen with thick, chewy noodles and creamy chicken flavor.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 130 gm",
          "SHU: 2,600"
        ]
      },
      {
        type: "list",
        title: "Noodles Ingredients",
        items: [
          "wheat flour",
          "modified tapioca starch",
          "refined palm oil",
          "modified potato starch",
          "refined salt",
          "emulsifier",
          "citric acid",
          "thickener",
          "green tea flavor oil"
        ]
      },
      {
        type: "list",
        title: "Soup Ingredients",
        items: [
          "water",
          "artificial chicken flavor powder",
          "soy sauce",
          "white sugar",
          "red pepper powder",
          "chili pepper powder",
          "soybean oil",
          "onion",
          "red pepper seed oil",
          "garlic",
          "modified potato starch",
          "paprika extract",
          "decolorized chili extract",
          "black pepper powder",
          "curry powder"
        ]
      },
      {
        type: "list",
        title: "Powder Ingredients",
        items: [
          "whole milk powder",
          "white sugar",
          "milk powder",
          "salt",
          "mozzarella cheese powder",
          "butter powder",
          "modified potato starch",
          "curly parsley",
          "pepper powder",
          "garlic powder",
          "soybean oil"
        ]
      },
      {
        type: "list",
        title: "How to use",
        items: [
          "Cook noodles for 5 minutes in boiling water",
          "Remove most of the water then add the sauce",
          "Stir fry for 30 seconds and serve"
        ]
      }
    ]
  },
  {
    id: "samyang-cream-carbonara-ramen-140gm",
    name: "Samyang Cream Carbonara Ramen - 140 gm",
    category: "Noodles / Ramen",
    filterGroup: "noodles",
    price: 140,
    description: "Samyang Korean Ramen Noodles is the best premium spicy noodles you can ever eat! Enjoy the maximum spicy levels, with a chewier and thicker texture.",
    images: samyangCreamCarbonaraImages,
    itemDetails: samyangCreamCarbonaraItemDetails,
    recommendedProductIds: [
      "samyang-hot-carbonara-chicken-korean-ramen-130gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-teriyaki-sauce-150ml"
    ],
    longDescriptionTitle: "Samyang Cream Carbonara Ramen - 140 gm",
    longDescriptionIntro: "Creamy Korean carbonara ramen with spicy flavor sachets, thick chewy noodles, and a quick stir-fry finish.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Add your favorite soy sauce with the sachets of flavors and sauce in the packet to have the most delicious noodles."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 140 gm",
          "Brand: Samyang",
          "Type: Simple"
        ]
      },
      {
        type: "list",
        title: "How to use",
        items: [
          "Cook noodles for 5 minutes in boiling water",
          "Remove most of the water from noodles then add the sauce",
          "Stir fry for 30 seconds then serve"
        ]
      }
    ]
  },
  {
    id: "samyang-hot-chicken-korean-ramen-noodles-140gm",
    name: "Samyang Hot Chicken Korean Ramen Noodles - 140 gm",
    category: "Noodles / Ramen",
    filterGroup: "noodles",
    price: 140,
    description: "Fiery Korean instant ramen with thick, chewy noodles and bold hot chicken seasoning for serious spice lovers.",
    images: samyangHotChickenImages,
    itemDetails: samyangHotChickenItemDetails,
    recommendedProductIds: [
      "samyang-cream-carbonara-ramen-140gm",
      "samyang-hot-carbonara-chicken-korean-ramen-130gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm"
    ],
    longDescriptionTitle: "Samyang Hot Chicken Korean Ramen Noodles - 140 gm",
    longDescriptionIntro: "Spice up your mealtime with Samyang Hot Chicken, the Korean ramen that took the world by storm. With its fiery flavor, thick chewy noodles, and bold seasoning, this instant ramen is perfect for spice lovers who want an unforgettable kick in every bite.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Why You'll Love Samyang Hot Chicken Ramen",
        items: [
          "Made from premium wheat flour for thick and chewy noodles",
          "Intense hot chicken flavor with a rich, savory soup base",
          "Easy to cook - ready in just minutes",
          "A 140 gm pack that satisfies your biggest cravings"
        ]
      },
      {
        type: "paragraph",
        text: "Crafted with quality ingredients like soy sauce, garlic, pepper, sesame, and a special chicken curry base, Samyang Hot Chicken delivers a balanced yet fiery taste."
      },
      {
        type: "paragraph",
        segments: [
          "Looking for more fiery ramen? Try ",
          { text: "Samyang Cream Carbonara Ramen", href: buildProductUrl("samyang-cream-carbonara-ramen-140gm") },
          " or explore ",
          { text: "Samyang Hot Cheese Ramen", href: buildProductUrl("samyang-hot-cheese-chicken-korean-ramen-noodles-140gm") },
          "."
        ]
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Cook noodles for 5 minutes in boiling water.",
          "Remove most of the water, then add the sauce.",
          "Stir fry for 30 seconds and serve."
        ]
      }
    ]
  },
  {
    id: "samyang-hot-cheese-chicken-korean-ramen-noodles-140gm",
    name: "Samyang Hot Cheese and Chicken Korean Ramen Noodles - 140 gm",
    category: "Noodles / Ramen",
    filterGroup: "noodles",
    price: 126,
    description: "Spicy Korean ramen with hot chicken heat, creamy mozzarella-style cheese flavor, and thick chewy noodles.",
    images: samyangHotCheeseImages,
    itemDetails: samyangHotCheeseItemDetails,
    recommendedProductIds: [
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "samyang-cream-carbonara-ramen-140gm",
      "samyang-hot-carbonara-chicken-korean-ramen-130gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-chinese-sweet-chili-sauce-280gm"
    ],
    longDescriptionTitle: "Samyang Hot Cheese and Chicken Korean Ramen Noodles - 140 gm",
    longDescriptionIntro: "Turn up the heat and flavor with Samyang Hot Cheese - a bold twist on classic Korean ramen. This delicious noodle pack combines the fiery kick of hot chicken with the creamy richness of mozzarella cheese, giving you a spicy yet cheesy taste that's irresistibly satisfying.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Why You'll Love Samyang Hot Cheese Ramen",
        items: [
          "Made with premium wheat flour noodles - thicker and chewier than regular ramen",
          "Unique blend of hot chicken spice and smooth, cheesy flavor",
          "Easy to prepare - ready in just minutes for a quick, hearty meal",
          "Perfect 140 gm serving size, ideal for a filling lunch or late-night craving"
        ]
      },
      {
        type: "paragraph",
        text: "Whether you enjoy it as it is or elevate it with toppings like eggs, vegetables, or grilled chicken, Samyang Hot Cheese guarantees a mouthwatering Korean ramen experience."
      },
      {
        type: "paragraph",
        segments: [
          "Looking for more fiery ramen? Try ",
          { text: "Samyang Hot Chicken", href: buildProductUrl("samyang-hot-chicken-korean-ramen-noodles-140gm") },
          " or ",
          { text: "Samyang Cream Carbonara Ramen", href: buildProductUrl("samyang-cream-carbonara-ramen-140gm") },
          "."
        ]
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Cook noodles for 5 minutes in boiling water.",
          "Remove most of the water, then add the sauce.",
          "Stir fry for 30 seconds and serve."
        ]
      }
    ]
  },
  {
    id: "samyang-hot-chicken-jjajang-flavor-ramen-140gm",
    name: "Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm",
    category: "Noodles / Ramen",
    filterGroup: "noodles",
    price: 140,
    description: "Spicy Samyang hot chicken noodles mixed with deep, savory Korean black bean sauce, thick chewy noodles, and bold flavor ready in minutes.",
    images: samyangHotChickenJjajangImages,
    itemDetails: samyangHotChickenJjajangItemDetails,
    recommendedProductIds: [
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "samyang-hot-cheese-chicken-korean-ramen-noodles-140gm",
      "samyang-cream-carbonara-ramen-140gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-dark-soy-sauce-150ml"
    ],
    longDescriptionTitle: "Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm",
    longDescriptionIntro: "Dive into the bold and flavorful world of jjajang ramen - a perfect mix of Samyang's signature heat and the rich, savory taste of Korean black bean sauce. This jjajang ramen brings together chewy noodles, spicy chicken flavor, and a smoky, deep aroma that makes every bite unforgettable.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Why You'll Love Jjajang Ramen",
        items: [
          "Combines the authentic taste of Korean black bean with a spicy kick",
          "Premium-quality jjajang ramen made with chewy, thick noodles",
          "Bursting with flavor - sweet, savory, and perfectly balanced",
          "Easy to prepare in minutes for a comforting, satisfying meal",
          "A must-try for ramen lovers who enjoy rich sauces and bold tastes"
        ]
      },
      {
        type: "paragraph",
        text: "Jjajang ramen - spicy Samyang hot chicken noodles mixed with deep, savory Korean black bean sauce. Thick, chewy noodles and bold flavor ready in minutes."
      },
      {
        type: "paragraph",
        text: "With 2,600 SHU of heat, jjajang ramen delivers the perfect punch - spicy enough to excite, but rich enough to keep you craving more. Whether you enjoy it solo or with your favorite toppings, this jjajang ramen will transport your taste buds straight to Korea."
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Cook noodles for 5 minutes in boiling water.",
          "Remove most of the water, then add the sauce.",
          "Stir fry for 30 seconds and serve."
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair it with ",
          { text: "Samyang Hot Chicken Ramen", href: buildProductUrl("samyang-hot-chicken-korean-ramen-noodles-140gm") },
          ", ",
          { text: "Samyang Hot Cheese Ramen", href: buildProductUrl("samyang-hot-cheese-chicken-korean-ramen-noodles-140gm") },
          ", or ",
          { text: "Samyang Cream Carbonara Ramen", href: buildProductUrl("samyang-cream-carbonara-ramen-140gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "samyang-buldak-habanero-lime-spicy-chicken-135gm",
    name: "Samyang Buldak Habanero Lime Spicy Chicken - 135 gm",
    category: "Noodles / Ramen",
    filterGroup: "noodles",
    price: 130,
    description: "Samyang's fiery habanero lime ramen combines intense pepper heat with a fresh lime kick, chewy noodles, and a bold spicy-zesty balance.",
    images: samyangBuldakHabaneroLimeImages,
    itemDetails: samyangBuldakHabaneroLimeItemDetails,
    recommendedProductIds: [
      "samyang-hot-chicken-jjajang-flavor-ramen-140gm",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "samyang-hot-cheese-chicken-korean-ramen-noodles-140gm",
      "samyang-cream-carbonara-ramen-140gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-chinese-sweet-chili-sauce-280gm"
    ],
    longDescriptionTitle: "Samyang Buldak Habanero Lime Spicy Chicken - 135 gm",
    longDescriptionIntro: "Get ready for a fiery, tangy twist with habanero lime ramen from Samyang! This bold Korean favorite brings together the heat of habanero peppers and the refreshing zest of lime for an unforgettable kick in every bite. Perfect for spice lovers who crave something intense yet refreshing, habanero lime ramen is the perfect balance of heat and citrusy flavor.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Why You'll Love Habanero Lime Ramen",
        items: [
          "Made with high-quality, chewy noodles that soak up every bit of flavor",
          "Combines spicy habanero heat with a tangy habanero lime twist",
          "Bold, zesty, and satisfying - a must-try for ramen enthusiasts",
          "Quick and easy to prepare, perfect for a cozy meal or a spicy snack",
          "Signature Samyang intensity with a refreshing habanero lime edge"
        ]
      },
      {
        type: "paragraph",
        text: "Savor the ultimate flavor fusion of spice and zest with habanero lime - the ramen that awakens your taste buds and keeps you coming back for more."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 135 gm",
          "Flavor: Lime Spicy Chicken"
        ]
      },
      {
        type: "paragraph",
        text: "Habanero lime - Samyang's fiery ramen combining intense habanero heat with a fresh lime kick. Chewy noodles, bold flavor, and a perfect spicy-zesty balance."
      },
      {
        type: "paragraph",
        segments: [
          "Want more spicy adventures? Try ",
          { text: "Jjajang Ramen", href: buildProductUrl("samyang-hot-chicken-jjajang-flavor-ramen-140gm") },
          " or ",
          { text: "Samyang Hot Cheese Ramen", href: buildProductUrl("samyang-hot-cheese-chicken-korean-ramen-noodles-140gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-chicken-dumplings-200gm",
    name: "Zumra Chicken Dumplings - 200 gm",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 120,
    description: "Ready-to-cook chicken dumplings with juicy savory filling and soft, chewy dough for an easy Asian street food experience at home.",
    images: zumraChickenDumplingsImages,
    itemDetails: zumraChickenDumplingsItemDetails,
    recommendedProductIds: [
      "zumra-sriracha-sauce-250ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-rice-cake-tteokbokki-250gm",
      "samyang-hot-carbonara-chicken-korean-ramen-130gm",
      "zumra-chinese-sweet-chili-sauce-280gm"
    ],
    longDescriptionTitle: "Zumra Chicken Dumplings - 200 gm",
    longDescriptionIntro: "Experience the rich, savory flavor of Zumra Chicken Dumplings, crafted with juicy chicken filling and soft, chewy dough.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Perfect as an appetizer or a main dish, these chicken dumplings are easy to prepare and even easier to love."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 200 gm",
          "Number of pieces: 7",
          "Type: Ready-to-cook dumplings with chicken filling"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Chicken Dumplings?",
        items: [
          "Filled with fresh, flavorful chicken",
          "Authentic chewy dumpling dough",
          "Easy to steam, pan-fry, or boil"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Perfect with dipping sauces like ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          " or ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          "."
        ]
      },
      {
        type: "paragraph",
        text: "Whether you're hosting a dinner, craving comfort food, or prepping a quick lunch, Zumra Chicken Dumplings deliver flavor, texture, and authenticity in every bite."
      }
    ]
  },
  {
    id: "zumra-chicken-baozi-4-pieces",
    name: "Zumra Chicken Baozi - 4 Pieces",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 205,
    description: "Authentic Chinese steamed buns with fluffy dough and a savory chicken filling. A hearty, delicious bite of traditional Asian street food.",
    images: zumraChickenBaoziImages,
    itemDetails: zumraChickenBaoziItemDetails,
    recommendedProductIds: [
      "zumra-chicken-dumplings-200gm",
      "zumra-beef-dumplings-200gm",
      "zumra-vegetable-dumplings-200gm",
      "samyang-hot-cheese-chicken-korean-ramen-noodles-140gm",
      "samyang-hot-chicken-jjajang-flavor-ramen-140gm",
      "zumra-dark-soy-sauce-150ml",
      "zumra-sriracha-sauce-250ml",
      "zumra-rice-cake-tteokbokki-250gm"
    ],
    longDescriptionTitle: "Zumra Chicken Baozi - 4 Pieces",
    longDescriptionIntro: "Enjoy the authentic taste of steamed buns with Chicken baozi, a soft and fluffy dough filled with a juicy chicken mixture. These delicious baozi buns are perfect for a light meal or snack, bringing you the comforting flavors of traditional Asian street food right to your table.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Filling: Chicken",
          "No. of Pieces: 4"
        ]
      },
      {
        type: "paragraph",
        text: "Chicken baozi - authentic Chinese steamed buns with fluffy dough and a savory chicken filling. A hearty, delicious bite of traditional Asian street food."
      },
      {
        type: "list",
        title: "Why You'll Love Chicken Baozi",
        items: [
          "Soft and fluffy dough filled with savory chicken",
          "Nutritious and flavorful - a perfect balance of protein and taste",
          "Comes in a pack of 4 pieces, ideal for sharing or enjoying solo",
          "Best served with soy sauce for an authentic touch"
        ]
      },
      {
        type: "paragraph",
        text: "With Chicken baozi, you'll get a hearty and wholesome snack that's both delicious and easy to prepare."
      },
      {
        type: "paragraph",
        segments: [
          "Looking for more baozi flavors? Try it with ",
          { text: "Samyang Hot Cheese Ramen", href: buildProductUrl("samyang-hot-cheese-chicken-korean-ramen-noodles-140gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-beef-baozi-4-pieces",
    name: "Zumra Beef Baozi - 4 Pieces",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 215,
    description: "Authentic Chinese steamed buns with soft dough and a savory beef filling. A comforting, flavorful bite of traditional Asian street food.",
    images: zumraBeefBaoziImages,
    itemDetails: zumraBeefBaoziItemDetails,
    recommendedProductIds: [
      "zumra-chicken-baozi-4-pieces",
      "zumra-beef-dumplings-200gm",
      "zumra-chicken-dumplings-200gm",
      "zumra-shrimp-dumplings-200gm",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "samyang-hot-cheese-chicken-korean-ramen-noodles-140gm",
      "zumra-dark-soy-sauce-150ml",
      "zumra-sriracha-sauce-250ml"
    ],
    longDescriptionTitle: "Zumra Beef Baozi - 4 Pieces",
    longDescriptionIntro: "Discover the taste of authentic Chinese steamed buns with Beef baozi. These fluffy, soft dough buns are generously filled with a savory beef mixture, creating a wholesome snack or meal that's both delicious and satisfying. Perfect to steam at home and enjoy fresh, warm, and flavorful.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Filling: Beef",
          "No. of Pieces: 4"
        ]
      },
      {
        type: "paragraph",
        text: "Beef baozi - authentic Chinese steamed buns with soft dough and a savory beef filling. A comforting, flavorful bite of traditional Asian street food."
      },
      {
        type: "list",
        title: "Why You'll Love Beef Baozi",
        items: [
          "Soft and fluffy dough filled with juicy beef",
          "Nutritious and flavorful - a perfect balance of protein and taste",
          "Comes in a pack of 4 pieces, ideal for sharing or enjoying solo",
          "Best served with soy sauce for an authentic touch"
        ]
      },
      {
        type: "paragraph",
        text: "With Beef baozi, you get a comforting and hearty bite of traditional Chinese street food right at your table."
      },
      {
        type: "paragraph",
        segments: [
          "Looking for more baozi flavors? Try ",
          { text: "Chicken baozi", href: buildProductUrl("zumra-chicken-baozi-4-pieces") },
          " or ",
          { text: "Samyang Hot Chicken Ramen", href: buildProductUrl("samyang-hot-chicken-korean-ramen-noodles-140gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-veggies-baozi-4-pieces",
    name: "Zumra Veggies Baozi - 4 Pieces",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 140,
    description: "Soft, fluffy Asian-style steamed buns packed with a hearty fresh vegetable mix for a nutritious meal, snack, or appetizer.",
    images: zumraVeggiesBaoziImages,
    itemDetails: zumraVeggiesBaoziItemDetails,
    recommendedProductIds: [
      "zumra-chicken-baozi-4-pieces",
      "zumra-beef-baozi-4-pieces",
      "zumra-vegetable-dumplings-200gm",
      "zumra-chicken-dumplings-200gm",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-panko-breadcrumbs",
      "samyang-hot-chicken-jjajang-flavor-ramen-140gm"
    ],
    longDescriptionTitle: "Zumra Veggies Baozi - 4 Pieces",
    longDescriptionIntro: "Discover the authentic taste of Asia with Zumra Veggies Baozi - soft, fluffy buns packed with a hearty mix of vegetables like carrots, cabbage, onions, bell peppers, mushrooms, and more. Perfect for a nutritious and delicious meal, these baozi are a must-try for anyone who loves Asian street food.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Filling: Fresh vegetable mix",
          "Number of Pieces: 4",
          "Type: Ready-to-cook steamed buns"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Veggies Baozi?",
        items: [
          "Traditional Asian-style soft buns",
          "Packed with fresh veggies for a wholesome, flavorful bite",
          "Versatile cooking methods - air fry, pan fry, or steam for different textures",
          "Perfect as a meal, snack, or appetizer"
        ]
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Steam for a classic, pillowy-soft texture",
          "Air fry or pan fry for a crispier finish"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair with dipping sauces like ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          " or ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          ". Enjoy with ",
          { text: "Vegetable Dumplings", href: buildProductUrl("zumra-vegetable-dumplings-200gm") },
          "."
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Complete your meal with ",
          { text: "Panko Bread Crumbs", href: buildProductUrl("zumra-panko-breadcrumbs") },
          " or ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-beef-dumplings-200gm",
    name: "Zumra Beef Dumplings - 200 gm",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 135,
    description: "Ready-to-cook beef dumplings with seasoned ground beef, soft chewy dough, and bold savory flavor for an Asian street food experience at home.",
    images: zumraBeefDumplingsImages,
    itemDetails: zumraBeefDumplingsItemDetails,
    recommendedProductIds: [
      "zumra-chicken-dumplings-200gm",
      "zumra-chopsticks-25pcs-helpers-5pcs",
      "zumra-sriracha-sauce-250ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm"
    ],
    longDescriptionTitle: "Zumra Beef Dumplings - 200 gm",
    longDescriptionIntro: "Get the full Asian street food experience at home with chewy, juicy beef dumplings bursting with bold, savory flavor.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "These premium beef dumplings are filled with seasoned ground beef and wrapped in soft dough that delivers the perfect bite every time."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 200 gm",
          "Number of pieces: 7",
          "Type: Ready-to-cook dumplings with beef filling"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Beef Dumplings?",
        items: [
          "Stuffed with flavorful, tender beef",
          "Authentic chewy dumpling dough",
          "Quick to prepare: steam, boil, or pan-fry"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Delicious when served with ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          ", ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", or ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          "."
        ]
      },
      {
        type: "paragraph",
        text: "Perfect as a snack, appetizer, or part of a full meal, Zumra Beef Dumplings bring rich flavor and comforting texture to any occasion."
      },
      {
        type: "paragraph",
        segments: [
          "Complete your dumpling night with ",
          { text: "Chicken Dumplings", href: buildProductUrl("zumra-chicken-dumplings-200gm") },
          " and ",
          { text: "Chopsticks", href: buildProductUrl("zumra-chopsticks-25pcs-helpers-5pcs") },
          " for the full experience."
        ]
      }
    ]
  },
  {
    id: "zumra-vegetable-dumplings-200gm",
    name: "Zumra Vegetable Dumplings - 200 gm",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 90,
    description: "Chewy, flavorful, and 100% satisfying — Zumra Vegetable Dumplings bring the true taste of Asian street food to your table.",
    images: zumraVegetableDumplingsImages,
    itemDetails: zumraVegetableDumplingsItemDetails,
    recommendedProductIds: [
      "zumra-chicken-dumplings-200gm",
      "zumra-beef-dumplings-200gm",
      "zumra-dark-soy-sauce-150ml",
      "zumra-sriracha-sauce-250ml",
      "zumra-chinese-sweet-chili-sauce-280gm"
    ],
    longDescriptionTitle: "Zumra Vegetable Dumplings - 200 gm",
    longDescriptionIntro: "Chewy, flavorful, and 100% satisfying — Zumra Vegetable Dumplings bring the true taste of Asian street food to your table.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Filled with a delicious mix of fresh vegetables and wrapped in soft dumpling dough, these vegetable dumplings are perfect for a quick snack, appetizer, or a full meat-free meal."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 200 gm",
          "Number of Pieces: 7",
          "Type: Ready-to-cook dumplings with vegetable filling"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Vegetable Dumplings?",
        items: [
          "Stuffed with a fresh mix of seasoned vegetables",
          "Soft, chewy dough for that authentic bite",
          "Easy to steam, pan-fry, or boil",
          "Great with dipping sauces like Soy Sauce, Sriracha Sauce, or Sweet Chili Sauce"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Perfect with dipping sauces like ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          ", or ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          "."
        ]
      },
      {
        type: "paragraph",
        text: "Perfect for vegetarians or anyone craving a plant-based Asian treat, Zumra Vegetable Dumplings deliver taste, texture, and convenience in every bite."
      },
      {
        type: "paragraph",
        segments: [
          "Want to try more? Check out ",
          { text: "Chicken Dumplings", href: buildProductUrl("zumra-chicken-dumplings-200gm") },
          ", ",
          { text: "Beef Dumplings", href: buildProductUrl("zumra-beef-dumplings-200gm") },
          ", or complete your meal with ",
          { text: "Panko Bread Crumbs", href: buildProductUrl("zumra-panko-breadcrumbs") },
          " from Zumra!"
        ]
      }
    ]
  },
  {
    id: "zumra-shrimp-dumplings-200gm",
    name: "Zumra Shrimp Dumplings - 200 gm",
    category: "Frozen / Dumplings",
    filterGroup: "frozen",
    price: 145,
    description: "Chewy shrimp dumplings with fresh shrimp filling and soft, tender dough for an authentic Asian street food experience.",
    images: zumraShrimpDumplingsImages,
    itemDetails: zumraShrimpDumplingsItemDetails,
    recommendedProductIds: [
      "zumra-dark-soy-sauce-150ml",
      "zumra-pickled-ginger-150gm",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-chicken-dumplings-200gm",
      "zumra-beef-dumplings-200gm",
      "zumra-chopsticks-25pcs-helpers-5pcs"
    ],
    longDescriptionTitle: "Zumra Shrimp Dumplings - 200 gm",
    longDescriptionIntro: "Chewy, flavorful, and full of authentic taste - Zumra Shrimp Dumplings bring the essence of Asian street food straight to your plate.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Stuffed with fresh shrimp and wrapped in soft, tender dough, these shrimp dumplings are perfect as an appetizer, snack, or main dish."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 200 gm",
          "Type: Ready-to-cook dumplings",
          "Filling: Fresh shrimp"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Shrimp Dumplings?",
        items: [
          "Packed with juicy shrimp and savory seasoning",
          "Soft and chewy dough with a satisfying bite",
          "Quick and easy to prepare by steaming, boiling, or pan-frying",
          "Ideal with dipping sauces like soy, chili, or sesame"
        ]
      },
      {
        type: "paragraph",
        text: "Whether you're recreating your favorite street food experience or exploring new flavors, Zumra Shrimp Dumplings deliver authentic Asian delight in every bite."
      },
      {
        type: "paragraph",
        segments: [
          "Complete the experience with ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", ",
          { text: "Pickled Ginger", href: buildProductUrl("zumra-pickled-ginger-150gm") },
          ", or ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          " from Zumra for the perfect pairing."
        ]
      }
    ]
  },
  {
    id: "zumra-chopsticks-25pcs-helpers-5pcs",
    name: "Zumra Chopsticks - 25 Pcs + Helpers - 5 Pcs",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 110,
    description: "Lightweight disposable bamboo chopsticks with helper attachments for comfortable sushi nights, noodles, dumplings, and rice dishes.",
    images: zumraChopsticksImages,
    itemDetails: zumraChopsticksItemDetails,
    recommendedProductIds: [
      "zumra-sushi-kit",
      "zumra-sushi-nori-sheets",
      "bamboo-sushi-rolling-mat-27cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "zumra-chicken-dumplings-200gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "samyang-cream-carbonara-ramen-140gm"
    ],
    longDescriptionTitle: "Zumra Chopsticks - 25 Pcs + Helpers - 5 Pcs",
    longDescriptionIntro: "Complete your Asian dining experience with lightweight bamboo chopsticks designed for comfort, control, and tradition.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Perfect for everyday meals or sushi nights, this set includes 25 chopsticks and 5 chopstick helpers to assist beginners or kids in learning how to use them easily."
      },
      {
        type: "list",
        title: "Includes",
        items: [
          "25 bamboo chopsticks",
          "5 easy-use helpers / training aids"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Chopsticks?",
        items: [
          "Made of natural bamboo - lightweight, durable, and eco-friendly",
          "Designed for one-time use - hygienic and convenient",
          "Comes with helper attachments for easier grip and learning",
          "Perfect for sushi, noodles, dumplings, or rice dishes"
        ]
      },
      {
        type: "list",
        title: "How to Use Chopsticks",
        items: [
          "Hold the bottom chopstick between your thumb and ring finger",
          "Place the second chopstick between your thumb and index/middle finger",
          "Keep the bottom chopstick steady",
          "Move the top chopstick up and down to grab food",
          "Practice makes perfect - or use the included helper"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Enjoy them with ",
          { text: "Sushi Nori", href: buildProductUrl("zumra-sushi-nori-sheets") },
          ", ",
          { text: "Chicken Dumplings", href: buildProductUrl("zumra-chicken-dumplings-200gm") },
          ", or your next ",
          { text: "Sushi Kit", href: buildProductUrl("zumra-sushi-kit") },
          "."
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair them with Asian-style meals like ",
          { text: "Samyang Cream Carbonara Ramen", href: buildProductUrl("samyang-cream-carbonara-ramen-140gm") },
          " or ",
          { text: "Tteokbokki Rice Cakes", href: buildProductUrl("zumra-rice-cake-tteokbokki-250gm") },
          " for a complete table setup."
        ]
      }
    ]
  },
  {
    id: "bamboo-sushi-rolling-mat-27cm",
    name: "Bamboo Sushi Rolling Mat - 27 cm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 150,
    description: bambooSushiRollingMatDescription,
    images: bambooSushiRollingMatImages,
    itemDetails: getBambooSushiRollingMatItemDetails("Bamboo Sushi Rolling Mat - 27 cm", "27 cm x 27 cm"),
    searchKeywords: [
      "bamboo mat",
      "sushi mat",
      "rolling mat",
      "27 cm mat",
      "27x27 sushi mat",
      "makisu",
      "sushi rolling tool"
    ],
    recommendedProductIds: [
      "bamboo-sushi-rolling-mat-24x24cm",
      ...bambooSushiRollingMatRecommendedProductIds
    ],
    longDescriptionTitle: "Bamboo Sushi Rolling Mat - 27 cm",
    longDescriptionIntro: bambooSushiRollingMatDescription,
    descriptionBlocks: getBambooSushiRollingMatDescriptionBlocks(
      "27 cm x 27 cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "Bamboo Sushi Rolling Mat - 24*24 cm"
    )
  },
  {
    id: "bamboo-sushi-rolling-mat-24x24cm",
    name: "Bamboo Sushi Rolling Mat - 24*24 cm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 145,
    description: bambooSushiRollingMatDescription,
    images: bambooSushiRollingMatImages,
    itemDetails: getBambooSushiRollingMatItemDetails("Bamboo Sushi Rolling Mat - 24*24 cm", "24 cm x 24 cm"),
    searchKeywords: [
      "bamboo mat",
      "sushi mat",
      "rolling mat",
      "24 cm mat",
      "24x24 sushi mat",
      "24*24 sushi mat",
      "makisu",
      "sushi rolling tool"
    ],
    recommendedProductIds: [
      "bamboo-sushi-rolling-mat-27cm",
      ...bambooSushiRollingMatRecommendedProductIds
    ],
    longDescriptionTitle: "Bamboo Sushi Rolling Mat - 24*24 cm",
    longDescriptionIntro: bambooSushiRollingMatDescription,
    descriptionBlocks: getBambooSushiRollingMatDescriptionBlocks(
      "24 cm x 24 cm",
      "bamboo-sushi-rolling-mat-27cm",
      "Bamboo Sushi Rolling Mat - 27 cm"
    )
  },
  {
    id: "zumra-pickled-ginger-150gm",
    name: "Zumra Pickled Ginger - 150 gm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 117,
    description: "Refreshing pickled sushi ginger that cleanses the palate and pairs beautifully with homemade sushi recipes, noodles, and dipping sauces.",
    images: zumraPickledGingerImages,
    itemDetails: zumraPickledGingerItemDetails,
    recommendedProductIds: [
      "zumra-sushi-kit",
      "zumra-sushi-nori-sheets",
      "bamboo-sushi-rolling-mat-27cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chopsticks-25pcs-helpers-5pcs"
    ],
    longDescriptionTitle: "Zumra Pickled Ginger - 150 gm",
    longDescriptionIntro: "Sushi pickled ginger serves as a refreshing palate cleanser, making it an essential condiment for homemade sushi preparation and Asian dishes.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Enjoy the premium taste of Zumra pickled sushi ginger, made and seasoned with high-quality ingredients."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 150 gm"
        ]
      },
      {
        type: "paragraph",
        title: "Ingredients",
        text: "Sweet, thinly sliced ginger marinated in a solution of sugar and vinegar."
      },
      {
        type: "list",
        title: "How to use",
        items: [
          "Use it alongside homemade sushi preparations",
          "Chop and add to stir-fried dishes",
          "Add it to salads",
          "Pour the brine into noodle sauces for rich flavor"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair it with the ",
          { text: "Sushi Kit", href: buildProductUrl("zumra-sushi-kit") },
          ", ",
          { text: "Sushi Nori", href: buildProductUrl("zumra-sushi-nori-sheets") },
          ", ",
          { text: "Dark Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", or ",
          { text: "Chopsticks", href: buildProductUrl("zumra-chopsticks-25pcs-helpers-5pcs") },
          " for a complete homemade sushi setup."
        ]
      }
    ]
  },
  {
    id: "zumra-sushi-vinegar-150ml",
    name: "Zumra Sushi Vinegar - 150 ml",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 75,
    description: "Balanced sweet and tangy sushi vinegar for seasoning sushi rice, salads, light dressings, and Asian dishes.",
    images: zumraSushiVinegarImages,
    itemDetails: zumraSushiVinegarItemDetails,
    recommendedProductIds: [
      "zumra-sushi-kit",
      "zumra-sushi-nori-sheets",
      "bamboo-sushi-rolling-mat-27cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "zumra-premium-soy-sauce-150ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chopsticks-25pcs-helpers-5pcs",
      "zumra-pickled-ginger-150gm",
      "zumra-fresh-round-rice-paper-22cm",
      "samyang-cream-carbonara-ramen-140gm"
    ],
    longDescriptionTitle: "Zumra Sushi Vinegar - 150 ml",
    longDescriptionIntro: "A must-have for perfect sushi rice. Zumra Sushi Vinegar delivers a balanced blend of sweetness and tang, making it easy to prepare authentic sushi at home.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Whether you're seasoning rice or enhancing Asian dishes, this vinegar adds the perfect finishing touch with consistent flavor and quality."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 150 ml",
          "Brand: Zumra",
          "Type: Simple Product"
        ]
      },
      {
        type: "list",
        title: "Why You'll Love Zumra Sushi Vinegar",
        items: [
          "Balanced sweet and tangy flavor",
          "Ideal for seasoning sushi rice",
          "Easy to use for beginners and professionals",
          "Perfect for sushi, salads, and light dressings"
        ]
      },
      {
        type: "paragraph",
        title: "Pair it with",
        segments: [
          { text: "Sushi Rice", href: buildProductUrl("zumra-sushi-kit") },
          ", ",
          { text: "Nori Sheets", href: buildProductUrl("zumra-sushi-nori-sheets") },
          ", ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-premium-soy-sauce-150ml") },
          ", or ",
          { text: "Chopsticks", href: buildProductUrl("zumra-chopsticks-25pcs-helpers-5pcs") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-kimchi-200gm",
    name: "Zumra Kimchi - 200 gm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 180,
    description: "Traditional Korean fermented cabbage pickled with hot pepper and fish sauce for a tangy, spicy side dish rich in flavor and fiber.",
    images: zumraKimchiImages,
    itemDetails: zumraKimchiItemDetails,
    recommendedProductIds: [
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "samyang-cream-carbonara-ramen-140gm",
      "yopokki-korean-spicy-rice-cakes-120gm",
      "zumra-chicken-baozi-4-pieces",
      "zumra-beef-baozi-4-pieces",
      "zumra-veggies-baozi-4-pieces",
      "zumra-chicken-dumplings-200gm",
      "zumra-light-soy-sauce-625ml",
      "zumra-rice-cake-tteokbokki-250gm"
    ],
    longDescriptionTitle: "Zumra Kimchi - 200 gm",
    longDescriptionIntro: "For fans of bold, spicy flavors, Zumra Kimchi is a must-try.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "This traditional Korean fermented cabbage is pickled with hot pepper and fish sauce to create a tangy, fiery side dish packed with flavor and nutrition."
      },
      {
        type: "paragraph",
        text: "Naturally gluten-free, low in fat, and high in fiber, this kimchi is a delicious and healthy addition to rice, noodles, soups, or even enjoyed on its own."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 200 gm",
          "Type: Korean pickled cabbage",
          "Dietary Info: Gluten-free, low fat, high fiber"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Kimchi?",
        items: [
          "Authentic Korean flavor with a spicy kick",
          "Made from cabbage, chili, and fish sauce",
          "Rich in probiotics and fiber",
          "Perfect with rice, Udon Noodles, soups, or Baozi"
        ]
      },
      {
        type: "paragraph",
        title: "Pair it with",
        segments: [
          { text: "Udon Noodles", href: buildProductUrl("samyang-hot-chicken-korean-ramen-noodles-140gm") },
          ", ",
          { text: "Chicken Baozi", href: buildProductUrl("zumra-chicken-baozi-4-pieces") },
          ", ",
          { text: "Beef Baozi", href: buildProductUrl("zumra-beef-baozi-4-pieces") },
          ", or ",
          { text: "Veggies Baozi", href: buildProductUrl("zumra-veggies-baozi-4-pieces") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-fresh-round-rice-paper-22cm",
    name: "Zumra Fresh Round Rice Paper - 22 cm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 350,
    description: "Fresh round rice paper with a clean taste and smooth texture for spring rolls, summer rolls, and Asian appetizers.",
    images: zumraRicePaperImages,
    itemDetails: zumraRicePaperItemDetails,
    recommendedProductIds: [
      "zumra-shrimp-dumplings-200gm",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-pickled-ginger-150gm",
      "bamboo-sushi-rolling-mat-27cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "zumra-chopsticks-25pcs-helpers-5pcs",
      "zumra-sushi-nori-sheets"
    ],
    longDescriptionTitle: "Zumra Fresh Round Rice Paper - 22 cm",
    longDescriptionIntro: "Create light, fresh, and flavorful dishes with Zumra Fresh Round Rice Paper, crafted with care to bring authenticity and ease to your kitchen.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "With its clean taste and smooth texture, this rice paper is perfect for making Vietnamese spring rolls, summer rolls, or creative Asian appetizers."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 22 cm",
          "Weight: 340 gm",
          "Shape: Round"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Rice Paper?",
        items: [
          "Thin, flexible sheets ideal for rolling",
          "Neutral flavor that lets your fillings shine",
          "Perfect for fresh rolls, fried rolls, or even dessert wraps",
          "Easy to use - just soak, fill, and roll"
        ]
      },
      {
        type: "paragraph",
        text: "Whether you're preparing refreshing veggie rolls or wrapping up shrimp and noodles, Zumra Rice Paper helps you create beautiful, healthy meals in minutes."
      },
      {
        type: "paragraph",
        segments: [
          "Pair it with ",
          { text: "Shrimp Dumplings", href: buildProductUrl("zumra-shrimp-dumplings-200gm") },
          ", ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          ", or ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-sushi-kit",
    name: "Zumra Sushi Kit",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 460,
    description: "All-in-one sushi essentials with rice, seaweed, sauces, condiments, and bamboo tools for easy homemade sushi.",
    images: ["images/optimized/Zumra Sushi Kit.webp"],
    components: zumraSushiKitComponents,
    itemDetails: zumraSushiKitItemDetails,
    recommendedProductIds: [
      "bamboo-sushi-rolling-mat-27cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "zumra-sushi-nori-sheets",
      "zumra-sushi-vinegar-150ml",
      "zumra-premium-soy-sauce-150ml",
      "zumra-pickled-ginger-150gm",
      "zumra-chopsticks-25pcs-helpers-5pcs",
      "zumra-crab-sticks-surimi-45-250gm"
    ],
    longDescriptionTitle: "Zumra Sushi Kit",
    longDescriptionIntro: "Turn your kitchen into a sushi bar with the all-in-one Zumra Sushi Kit - the perfect bundle for anyone who wants to enjoy authentic, homemade sushi with ease.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "This premium sushi kit includes everything you need: from high-quality rice and seaweed sheets to essential sauces and condiments, along with bamboo tools that make rolling sushi fun and simple."
      },
      {
        type: "list",
        title: "What's Inside",
        items: zumraSushiKitComponents
      },
      {
        type: "list",
        title: "Why Choose Zumra Sushi Kit?",
        items: [
          "Complete starter set - no extra shopping needed",
          "Premium-quality ingredients for a true sushi flavor",
          "Easy and fun to use with friends or family",
          "Great for beginners and sushi lovers alike"
        ]
      },
      {
        type: "paragraph",
        text: "Whether you're preparing maki-style recipes, nigiri-style bites, or creative sushi-inspired dishes, Zumra Sushi Kit makes the process simple from the first sheet."
      }
    ]
  },
  {
    id: "zumra-sushi-nori-sheets",
    name: "Zumra Sushi Nori Sheets - 10 Sheets",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 190,
    description: "Zumra Sushi Nori - 10 Sheet",
    images: [
      "images/optimized/2-Zumra Sushi Nori Sheets - 10 Sheets Front.webp",
      "images/optimized/2-Zumra Sushi Nori Sheets - 10 Sheets-Back.webp"
    ],
    components: zumraSushiNoriComponents,
    itemDetails: zumraSushiNoriItemDetails,
    recommendedProductIds: [
      "bamboo-sushi-rolling-mat-27cm",
      "bamboo-sushi-rolling-mat-24x24cm",
      "zumra-sushi-vinegar-150ml",
      "zumra-premium-soy-sauce-150ml",
      "zumra-pickled-ginger-150gm",
      "zumra-crab-sticks-surimi-45-250gm",
      "zumra-chopsticks-25pcs-helpers-5pcs"
    ],
    longDescriptionTitle: "Zumra Sushi Nori - 10 Sheets",
    longDescriptionIntro: "Bring the taste of the ocean to your kitchen with Zumra Sushi Nori - a must-have for every homemade sushi lover.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "These toasted seaweed sheets deliver bold, umami-rich flavor for homemade sushi preparation, miso soups, salads, and rice bowls."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Quantity: 10 Sheets",
          "Type: Toasted Nori (Seaweed)"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Sushi Nori?",
        items: [
          "Authentic flavor and aroma for real Japanese & Korean cuisine",
          "Lightly toasted for improved texture and rollability",
          "Perfect sheet size for sushi beginners or quick meals",
          "Resealable pack ideal for casual use or testing new recipes"
        ]
      },
      {
        type: "list",
        title: "How to Use:",
        items: [
          "Lightly microwave the nori sheet to enhance aroma and crunch",
          "Gently rub a bit of sesame oil for extra flavor",
          "Spread sushi rice and your choice of fillings, then roll or shape"
        ]
      },
      {
        type: "paragraph",
        text: "Make your favorite norisushi recipes at home with ease - from classic maki to rice balls and more."
      },
      {
        type: "paragraph",
        segments: [
          "Pair it with ",
          { text: "Crab Sticks", href: buildProductUrl("zumra-crab-sticks-surimi-45-250gm") },
          " or enjoy a complete sushi-making experience with the ",
          { text: "Zumra Sushi Kit", href: buildProductUrl("zumra-sushi-kit") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-panko-breadcrumbs",
    name: "Zumra Panko Breadcrumbs - 200 gm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 85,
    description: "Zumra Panko Bread Crumbs - 200 gm",
    images: zumraPankoBreadcrumbsImages,
    itemDetails: getZumraPankoBreadcrumbsItemDetails("Zumra Panko Bread Crumbs - 200 gm", "200 gm"),
    longDescriptionTitle: "Zumra Panko Bread Crumbs - 200 gm",
    longDescriptionIntro: zumraPankoBreadcrumbsIntro,
    descriptionBlocks: getZumraPankoBreadcrumbsDescriptionBlocks("200 gm")
  },
  {
    id: "zumra-panko-breadcrumbs-1kg",
    name: "Zumra Panko Bread Crumbs - 1 kg",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 340,
    description: "Zumra Panko Bread Crumbs - 1 kg",
    images: zumraPankoBreadCrumbs1KgImages,
    itemDetails: getZumraPankoBreadcrumbsItemDetails("Zumra Panko Bread Crumbs - 1 kg", "1 kg"),
    longDescriptionTitle: "Zumra Panko Bread Crumbs - 1 kg",
    longDescriptionIntro: zumraPankoBreadcrumbsIntro,
    descriptionBlocks: getZumraPankoBreadcrumbsDescriptionBlocks("1 kg")
  },
  {
    id: "soly-smoked-salmon-200gm",
    name: "Soly Smoked Salmon - 200 gm",
    category: "Seafood",
    filterGroup: "seafood",
    price: 490,
    description: solySmokedSalmonDescription,
    images: solySmokedSalmonImages,
    itemDetails: getSolySmokedSalmonItemDetails("Soly Smoked Salmon - 200 gm", "200 gm"),
    longDescriptionTitle: "Soly Smoked Salmon - 200 gm",
    longDescriptionIntro: solySmokedSalmonDescription,
    descriptionBlocks: getSolySmokedSalmonDescriptionBlocks("200 gm")
  },
  {
    id: "soly-smoked-salmon-50gm",
    name: "Soly Smoked Salmon - 50 gm",
    category: "Seafood",
    filterGroup: "seafood",
    price: 200,
    description: solySmokedSalmonDescription,
    images: solySmokedSalmonImages,
    itemDetails: getSolySmokedSalmonItemDetails("Soly Smoked Salmon - 50 gm", "50 gm"),
    longDescriptionTitle: "Soly Smoked Salmon - 50 gm",
    longDescriptionIntro: solySmokedSalmonDescription,
    descriptionBlocks: getSolySmokedSalmonDescriptionBlocks("50 gm")
  },
  {
    id: "soly-smoked-salmon-100gm",
    name: "Soly Smoked Salmon - 100 gm",
    category: "Seafood",
    filterGroup: "seafood",
    price: 295,
    description: solySmokedSalmonDescription,
    images: solySmokedSalmonImages,
    itemDetails: getSolySmokedSalmonItemDetails("Soly Smoked Salmon - 100 gm", "100 gm"),
    longDescriptionTitle: "Soly Smoked Salmon - 100 gm",
    longDescriptionIntro: solySmokedSalmonDescription,
    descriptionBlocks: getSolySmokedSalmonDescriptionBlocks("100 gm")
  },
  {
    id: "bosphorus-shrimp-emirati-extra-large-peeled-deveined-30-40-400gm",
    name: bosphorusShrimpProductName,
    category: "Seafood",
    filterGroup: "seafood",
    price: 530,
    description: bosphorusShrimpDescription,
    images: bosphorusShrimpImages,
    itemDetails: bosphorusShrimpItemDetails,
    recommendedProductIds: [
      "bosphorus-shrimp-emirati-large-peeled-deveined-40-60-400gm",
      "bosphorus-shrimp-emirati-medium-peeled-deveined-60-80-400gm",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-panko-breadcrumbs-1kg"
    ],
    longDescriptionTitle: bosphorusShrimpProductName,
    longDescriptionIntro: bosphorusShrimpDescription,
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Brand: Bosphorus",
          "Weight: 400 gm",
          "Count: 30-40 Pieces",
          "Type: Peeled and deveined shrimp",
          "Product Type: Simple"
        ]
      },
      {
        type: "paragraph",
        title: "How to use?",
        text: bosphorusShrimpUsage
      },
      {
        type: "paragraph",
        title: "Preparation",
        text: bosphorusShrimpPreparation
      }
    ]
  },
  {
    id: "bosphorus-shrimp-emirati-large-peeled-deveined-40-60-400gm",
    name: bosphorusShrimpLargeProductName,
    category: "Seafood",
    filterGroup: "seafood",
    price: 510,
    description: bosphorusShrimpLargeDescription,
    images: bosphorusShrimpLargeImages,
    itemDetails: bosphorusShrimpLargeItemDetails,
    recommendedProductIds: [
      "bosphorus-shrimp-emirati-extra-large-peeled-deveined-30-40-400gm",
      "bosphorus-shrimp-emirati-medium-peeled-deveined-60-80-400gm",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-panko-breadcrumbs-1kg"
    ],
    longDescriptionTitle: bosphorusShrimpLargeProductName,
    longDescriptionIntro: bosphorusShrimpLargeDescription,
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Brand: Bosphorus",
          "Weight: 400 gm",
          "Count: 40-60 Pieces",
          "Type: Peeled and deveined shrimp",
          "Product Type: Simple"
        ]
      },
      {
        type: "paragraph",
        title: "How to use?",
        text: bosphorusShrimpUsage
      },
      {
        type: "paragraph",
        title: "Preparation",
        text: bosphorusShrimpPreparation
      }
    ]
  },
  {
    id: "bosphorus-shrimp-emirati-medium-peeled-deveined-60-80-400gm",
    name: bosphorusShrimpMediumProductName,
    category: "Seafood",
    filterGroup: "seafood",
    price: 475,
    description: bosphorusShrimpMediumDescription,
    images: bosphorusShrimpMediumImages,
    itemDetails: bosphorusShrimpMediumItemDetails,
    recommendedProductIds: [
      "bosphorus-shrimp-emirati-extra-large-peeled-deveined-30-40-400gm",
      "bosphorus-shrimp-emirati-large-peeled-deveined-40-60-400gm",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml"
    ],
    longDescriptionTitle: bosphorusShrimpMediumProductName,
    longDescriptionIntro: bosphorusShrimpMediumDescription,
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Brand: Bosphorus",
          "Weight: 400 gm",
          "Count: 60-80 Pieces",
          "Type: Peeled and deveined shrimp",
          "Product Type: Simple"
        ]
      },
      {
        type: "paragraph",
        title: "How to use?",
        text: bosphorusShrimpUsage
      },
      {
        type: "paragraph",
        title: "Preparation",
        text: bosphorusShrimpPreparation
      }
    ]
  },
  {
    id: "zumra-crab-sticks-surimi-45-250gm",
    name: "Zumra Crab Sticks - Surimi 45% - 250 gm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 135,
    description: "Take your recipes to the next level with Zumra Crab Sticks, made with 45% premium surimi to deliver the authentic texture and flavor of real crab leg meat.",
    images: [
      "images/optimized/crab-sticks-front.webp",
      "images/optimized/crab-sticks-back.webp",
      "images/optimized/crab-sticks-view-3.webp",
      "images/optimized/crab-sticks-view-4.webp",
      "images/optimized/crab-sticks-view-5.webp"
    ],
    itemDetails: zumraCrabSticksItemDetails,
    longDescriptionTitle: "Zumra Crab Sticks - Surimi 45% - 250 gm",
    longDescriptionIntro: "Take your recipes to the next level with Zumra Crab Sticks, made with 45% premium surimi to deliver the authentic texture and flavor of real crab leg meat.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Whether you're rolling sushi, tossing them into salads, or enjoying them as a light snack, these crab sticks offer a deliciously versatile option for every occasion."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 250 gm",
          "Surimi Content: 45%",
          "Usage: Ready to eat or cook"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Crab Sticks?",
        items: [
          "Realistic crab texture with rich, savory flavor",
          "Made with high-quality 45% surimi for a premium experience",
          "Perfect for homemade sushi preparation, salads, sandwiches, or enjoyed on their own",
          "Quick, convenient, and protein-rich"
        ]
      },
      {
        type: "paragraph",
        text: "From sushi nights to fresh salads or quick snacks, Zumra Crab Sticks are the flavorful, ready-to-use ingredient your kitchen needs."
      },
      {
        type: "paragraph",
        segments: [
          "Want to create the full experience? Pair with ",
          { text: "Sushi Nori", href: buildProductUrl("zumra-sushi-nori-sheets") },
          ", for a complete sushi night at home."
        ]
      }
    ]
  },
  {
    id: "zumra-dark-soy-sauce-150ml",
    name: "Zumra Dark Soy Sauce - 150 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 72,
    description: "Add a bold, savory boost to your meals with Zumra Dark Soy Sauce, a naturally brewed soy sauce crafted for both Asian and Western cooking.",
    images: [
      "images/optimized/6-Zumra Dark Soy Sauce - 150 ml-front.webp",
      "images/optimized/6-Zumra Dark Soy Sauce - 150 ml-back.webp",
      "images/optimized/6-Zumra Dark Soy Sauce - 150 ml-3nd.webp"
    ],
    itemDetails: zumraDarkSoySauceItemDetails,
    longDescriptionTitle: "Zumra Dark Soy Sauce - 150 ml",
    longDescriptionIntro: "Add a bold, savory boost to your meals with Zumra Dark Soy Sauce, a naturally brewed soy sauce crafted for both Asian and Western cooking.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "With its rich flavor and deep color, this all-purpose seasoning is ideal for stir-fries, marinades, dipping sauces, and slow-cooked dishes - all in a convenient 150 ml size, perfect for everyday use."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 150 ml",
          "Ingredients: Soy sauce (water, salt, soybean, wheat flour), caramel color, sugar, potassium sorbate added as a preservative, disodium 5-Inosinate and disodium 5-Guanylate as flavor enhancers."
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Soy Sauce?",
        items: [
          "Naturally brewed for premium taste and aroma",
          "Thick, dark texture ideal for enhancing sauces and glazes",
          "Adds deep umami flavor to both Asian and Western meals",
          "Small bottle - perfect for home cooks or table use"
        ]
      }
    ]
  },
  {
    id: "zumra-light-soy-sauce-625ml",
    name: "Zumra Light Soy Sauce - 625 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 150,
    description: "Naturally brewed light soy sauce with rich savory depth and balanced saltiness for marinades, stir-fries, dipping sauces, and everyday Asian cooking.",
    images: zumraLightSoySauceImages,
    itemDetails: zumraLightSoySauceItemDetails,
    recommendedProductIds: [
      "zumra-premium-soy-sauce-150ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-chicken-dumplings-200gm",
      "zumra-shrimp-dumplings-200gm",
      "zumra-fresh-round-rice-paper-22cm",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "zumra-sushi-nori-sheets"
    ],
    longDescriptionTitle: "Zumra Light Soy Sauce - 625 ml",
    longDescriptionIntro: "Enhance your cooking with the rich, savory taste of Zumra Light Soy Sauce, a naturally brewed condiment crafted for balance and depth.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Whether you're marinating, stir-frying, or dipping, this versatile soy sauce adds the perfect salty-smooth finish to your favorite recipes without overpowering other ingredients."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 625 ml",
          "Ingredients: Water, salt, 11% soybeans, wheat flour, monosodium glutamate, potassium sorbate (E202)"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Light Soy Sauce?",
        items: [
          "Naturally brewed for a deep, well-rounded flavor",
          "Ideal for marinades, stir-fries, and dipping sauces",
          "Balanced saltiness that complements a wide range of dishes",
          "Perfect for both traditional Asian cuisine and everyday meals"
        ]
      },
      {
        type: "paragraph",
        text: "Zumra Light Soy Sauce is your go-to kitchen essential for adding authentic taste and umami to every bite."
      },
      {
        type: "paragraph",
        title: "Looking for more essential sauces?",
        segments: [
          { text: "Dark Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          "."
        ]
      },
      {
        type: "paragraph",
        title: "How to Use",
        text: "Light soy sauce is extremely versatile in all sorts of cooking. It is widely used in cold appetizers, stir-fry dishes, soups, stews, dipping sauces, and marinades."
      },
      {
        type: "paragraph",
        text: "It can be used to add color and flavor to dishes when needed. Add it at the beginning of cooking when preparing Asian recipes."
      }
    ]
  },
  {
    id: "tai-hua-sweet-sauce-320ml",
    name: "Tai Hua Sweet Sauce - 320 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 150,
    description: "Premium Tai Hua sweet sauce with rich sweetness, deep color, and bold soy flavor for marinades, dipping sauces, cooking, and dressings.",
    images: taiHuaSweetSauceImages,
    itemDetails: taiHuaSweetSauceItemDetails,
    recommendedProductIds: [
      "zumra-light-soy-sauce-625ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "zumra-chicken-dumplings-200gm",
      "zumra-shrimp-dumplings-200gm",
      "zumra-fresh-round-rice-paper-22cm",
      "zumra-chopsticks-25pcs-helpers-5pcs",
      "zumra-sushi-nori-sheets"
    ],
    longDescriptionTitle: "Tai Hua Sweet Sauce - 320 ml",
    longDescriptionIntro: "Add a unique touch to your recipes with this premium sweet sauce from Tai Hua.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Use it in marinades, dipping sauces, cooking, or dressings. It's a versatile Asian sauce that adds rich sweetness, deep color, and bold flavor to many dishes."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 320 ml",
          "Brand: Tai Hua",
          "Type: Simple Product"
        ]
      },
      {
        type: "paragraph",
        title: "How to Use",
        text: "\"Kecap Manis\" is a sweet Indonesian soy sauce with a syrupy consistency. It adds sweetness, powerful color, and rich soy flavor."
      },
      {
        type: "list",
        title: "Use it in recipes such as:",
        items: [
          "Fried rice",
          "Salads",
          "Chicken marinades",
          "Stir-fries",
          "Dipping sauces"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Build out your sauce shelf with ",
          { text: "Light Soy Sauce", href: buildProductUrl("zumra-light-soy-sauce-625ml") },
          ", ",
          { text: "Dark Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "kikkoman-soy-sauce-table-pot-148ml",
    name: "Kikkoman Soy Sauce Table Pot - 148 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 357,
    description: "Premium Kikkoman soy sauce in a 148 ml table pot for deep savory flavor in glazes, dipping sauces, marinades, and Asian recipes.",
    images: kikkomanSoySauceTablePotImages,
    itemDetails: kikkomanSoySauceTablePotItemDetails,
    recommendedProductIds: [
      "zumra-premium-soy-sauce-150ml",
      "zumra-light-soy-sauce-625ml",
      "zumra-dark-soy-sauce-150ml",
      "tai-hua-sweet-sauce-320ml",
      "zumra-chicken-dumplings-200gm",
      "zumra-shrimp-dumplings-200gm",
      "zumra-fresh-round-rice-paper-22cm",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "zumra-kimchi-200gm",
      "yopokki-korean-spicy-rice-cakes-120gm",
      "zumra-chopsticks-25pcs-helpers-5pcs"
    ],
    longDescriptionTitle: "Kikkoman Soy Sauce Table Pot - 148 ml",
    longDescriptionIntro: "Add a unique touch to your recipes with this premium soy sauce from Kikkoman.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "It adds deep savory flavor to chicken, fish, meat, vegetables, and Asian recipes."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 148 ml",
          "Brand: Kikkoman",
          "Type: Simple Product"
        ]
      },
      {
        type: "paragraph",
        title: "How to Use",
        text: "Kikkoman soy sauce makes a brilliant glaze for roasted or pan-fried meat, fish, and vegetables. It adds shine as well as a deep, savory flavor."
      },
      {
        type: "paragraph",
        text: "Try mixing equal amounts with honey or maple syrup, brush it onto meat, then return it briefly to the oven to caramelize."
      },
      {
        type: "paragraph",
        text: "It also works perfectly as a dipping sauce for sushi ingredients, dumplings, spring rolls, and Asian-style dishes."
      },
      {
        type: "paragraph",
        title: "Pair it with",
        segments: [
          { text: "Dumplings", href: buildProductUrl("zumra-chicken-dumplings-200gm") },
          ", ",
          { text: "Rice Paper", href: buildProductUrl("zumra-fresh-round-rice-paper-22cm") },
          ", ",
          { text: "Udon Noodles", href: buildProductUrl("samyang-hot-chicken-korean-ramen-noodles-140gm") },
          ", or ",
          { text: "Kimchi", href: buildProductUrl("zumra-kimchi-200gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-premium-soy-sauce-150ml",
    name: "Zumra Premium Soy Sauce - 150 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 160,
    description: "Thick, rich naturally brewed soy sauce with deep umami flavor for dipping, marinades, sushi ingredients, and Asian-style cooking.",
    images: zumraPremiumSoySauceImages,
    itemDetails: zumraPremiumSoySauceItemDetails,
    recommendedProductIds: [
      "zumra-light-soy-sauce-625ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-chicken-dumplings-200gm",
      "zumra-shrimp-dumplings-200gm",
      "zumra-fresh-round-rice-paper-22cm",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "zumra-rice-cake-tteokbokki-250gm",
      "zumra-sushi-nori-sheets"
    ],
    longDescriptionTitle: "Zumra Premium Soy Sauce - 150 ml",
    longDescriptionIntro: "Unlock bold, balanced flavor with Zumra Premium Soy Sauce, your new go-to for elevating everyday meals.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "This premium soy sauce blend features a thick, rich texture and deep umami taste that enhances your dishes without overpowering them - perfect for Asian recipes and beyond."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 150 ml",
          "Type: Naturally brewed, thick soy sauce"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Premium Soy Sauce?",
        items: [
          "Rich, savory flavor that boosts all kinds of recipes",
          "Thick, aromatic consistency - ideal for dipping, marinating, or cooking",
          "Enhances natural food flavors without overwhelming them",
          "Small, convenient bottle perfect for home use or table serving"
        ]
      },
      {
        type: "paragraph",
        text: "From stir-fries and sushi ingredients to dressings and marinades, Zumra Premium Soy Sauce brings depth, balance, and authenticity to your cooking."
      },
      {
        type: "paragraph",
        title: "Want more flavor options?",
        segments: [
          { text: "Light Soy Sauce", href: buildProductUrl("zumra-light-soy-sauce-625ml") },
          " or ",
          { text: "Dark Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          "."
        ]
      },
      {
        type: "paragraph",
        title: "How to Use",
        text: "Premium soy sauce is mainly used as a dipping sauce for sushi ingredients, dumplings, spring rolls, marinades, and Asian-style dishes because of its strong and rich flavor."
      }
    ]
  },
  {
    id: "zumra-teriyaki-sauce-150ml",
    name: "Zumra Teriyaki Sauce - 150 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 70,
    description: "Zumra Teriyaki Sauce – 150 ml. Balanced Japanese-style teriyaki with sweet, savory, and umami notes — ideal for marinades, glazes, stir-fries, and everyday cooking.",
    images: [
      "images/optimized/7-Zumra Teriyaki Sauce - 150 ml-front.webp",
      "images/optimized/7-Zumra Teriyaki Sauce - 150 ml-2nd.webp"
    ],
    itemDetails: zumraTeriyakiSauceItemDetails,
    longDescriptionTitle: "Zumra Teriyaki Sauce - 150 ml",
    longDescriptionIntro: "Bring authentic teriyaki flavor to marinades, grilled meats, and stir-fries.",
    descriptionBlocks: [
      {
        type: "paragraph",
        title: "Overview",
        text: "Rich Japanese-style teriyaki with balanced sweet and savory notes. Versatile for marinades, glazing, stir-fries, and as a finishing sauce."
      },
      {
        type: "list",
        title: "Why You'll Love Zumra Teriyaki",
        items: [
          "Authentic sweet-and-savory teriyaki balance",
          "Great for marinades, grilled chicken, burgers, and stir-fries",
          "Adds depth to soups, casseroles, and sauces",
          "Handy 150 ml bottle for everyday use"
        ]
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Marinate meats, tofu, or vegetables before grilling or baking",
          "Brush as a glaze during grilling or roasting",
          "Stir into fried rice and stir-fries for instant seasoning",
          "Add a splash to soups or sauces for extra umami"
        ]
      },
      {
        type: "paragraph",
        text: "A versatile pantry staple that elevates everyday meals with authentic teriyaki flavor."
      }
    ]
  },
  {
    id: "zumra-chinese-sweet-chili-sauce-280gm",
    name: "Zumra Sweet Chili Sauce - 280 gm",
    category: "Sauces",
    filterGroup: "sauces",
    price: 116,
    description: "Nothing beats a sweet and spicy touch complementing the taste of your favorite food.",
    images: [
      "images/optimized/8-Zumra Chinese Sweet Chili Sauce - 280 gm-front.webp",
      "images/optimized/8-Zumra Chinese Sweet Chili Sauce - 280 gm-nd.webp"
    ],
    itemDetails: zumraSweetChiliSauceItemDetails,
    longDescriptionTitle: "Zumra Sweet Chili Sauce - 280 gm",
    longDescriptionIntro: "A versatile sweet chili sauce for seasoning or dipping.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Nothing beats a sweet and spicy touch complementing the taste of your favorite food."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 270 ml",
          "Ingredients: Water, sugar, starch, chili pepper, vinegar, garlic, xanthan E415, sweetener E951, E950, potassium sorbate"
        ]
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Use it as a dip or spread on toast and top with cheese before grilling.",
          "Mix a few tablespoons with cream cheese and stir into pasta.",
          "Pour over salmon fillets and cook in a foil bag for 20 minutes for a delicious sweet and spicy finish."
        ]
      }
    ]
  },
  {
    id: "zumra-sriracha-sauce-250ml",
    name: "Zumra Sriracha Sauce - 250 ml",
    category: "Sauces",
    filterGroup: "sauces",
    price: 74.5,
    description: "Bold medium-to-hot sriracha sauce in a 250 ml squeeze bottle for cooking, dipping, and drizzling.",
    images: ["images/optimized/9-Zumra Sriracha Sauce - 250 ml-front.webp"],
    itemDetails: zumraSrirachaSauceItemDetails,
    longDescriptionTitle: "Zumra Sriracha Sauce – 250 ml",
    longDescriptionIntro: "Add bold heat and flavor to every bite with Zumra Sriracha Sauce — made from premium red chilies blended into a smooth, vibrant sauce with just the right kick.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Packaged in a convenient squeeze bottle, this sriracha sauce is perfect for spicing up pasta, sandwiches, stir-fries, or using as a dipping sauce for your favorite snacks and appetizers."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 250 ml",
          "Texture: Smooth, thick chili sauce",
          "Heat Level: Medium to hot"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Sriracha Sauce?",
        items: [
          "Made from high-quality chili peppers",
          "Smooth, rich texture that clings perfectly to food",
          "Versatile: great for cooking, dipping, or drizzling",
          "Comes in an easy-to-use squeeze bottle for mess-free use"
        ]
      },
      {
        type: "paragraph",
        text: "Whether you're enhancing noodles, adding a kick to dumplings, or building your own spicy dipping sauce, Zumra Sriracha Sauce brings fire and flavor to your kitchen."
      }
    ]
  },
  {
    id: "zumra-boba-pearls-1kg",
    name: "Zumra Boba Pearls - 1 kg",
    category: "Beverages",
    filterGroup: "beverages",
    price: 340,
    description: "Premium 1 kg tapioca boba pearls for soft, chewy bubble tea, fruit teas, and iced drinks.",
    images: [
      "images/optimized/10-Zumra Boba Pearls - 1 kg.webp",
      "images/10-Zumra Boba Pearls - 1 kg-2nd.webp",
      "images/10-Zumra Boba Pearls - 1 kg-3rd.webp",
      "images/optimized/10-Zumra Boba Pearls - 1 kg-4th.webp"
    ],
    itemDetails: zumraBobaPearlsItemDetails,
    recommendedProductIds: [
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-teriyaki-sauce-150ml"
    ],
    longDescriptionTitle: "Zumra Boba Pearls – 1 kg",
    longDescriptionIntro: "Create the perfect bubble tea experience at home with Zumra Boba Pearls, made from high-quality tapioca for a soft, chewy texture and authentic flavor.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "These premium boba pearls are ideal for milk tea, fruit teas, or iced drinks — just cook, cool, and enjoy the café-style taste you love!"
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Type: Large tapioca pearls",
          "Weight: 1 kg",
          "Storage: Dry",
          "Country of Origin: Thailand",
          "Note: This product is not available for shipping outside Cairo."
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Boba Pearls?",
        items: [
          "Made from premium tapioca for the perfect chewy texture",
          "Ideal for classic bubble tea and creative cold drinks",
          "Easy to cook and ready in just a few steps",
          "Great for both home and business use"
        ]
      },
      {
        type: "list",
        title: "How to Cook:",
        items: [
          "1. Boil plenty of water (about 10 cups per 1 cup boba)",
          "2. Add boba and stir",
          "3. Let them boil for 20 minutes, stirring occasionally",
          "4. Drain and rinse with cold water",
          "5. Enjoy fresh for the best texture"
        ]
      },
      {
        type: "list",
        title: "How to Store Uncooked Boba:",
        items: [
          "Keep in an airtight container",
          "Store in a cool, dry place (do not refrigerate)"
        ]
      }
    ]
  },
  {
    id: "zumra-coconut-cream-20-22-fat-400ml",
    name: "Zumra Coconut Cream 20-22% Fat - 400 ml",
    category: "Canned Food / Pantry",
    filterGroup: "pantry",
    price: 120,
    description: "Rich, velvety coconut cream with 20-22% fat content for curries, soups, desserts, smoothies, and dairy-free cooking.",
    images: zumraCoconutCreamImages,
    itemDetails: zumraCoconutCreamItemDetails,
    recommendedProductIds: [
      "zumra-teriyaki-sauce-150ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-panko-breadcrumbs",
      "zumra-panko-breadcrumbs-1kg",
      "samyang-cream-carbonara-ramen-140gm",
      "samyang-buldak-habanero-lime-spicy-chicken-135gm"
    ],
    longDescriptionTitle: "Zumra Creamy Coconut Milk 20-22% Fat - 400 ml",
    longDescriptionIntro: "Discover a rich and healthy milk alternative with Zumra Creamy Coconut Milk, made from high-quality coconut and water to deliver a thick, velvety texture and deep tropical flavor. With 20-22% fat content, this creamy coconut milk is the perfect choice for anyone looking to add richness to their cooking without using dairy.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Product Details",
        items: [
          "Size: 400 ml",
          "Ingredients: Coconut, water",
          "Fat Content: 20-22%"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Creamy Coconut Milk?",
        items: [
          "Thick and creamy texture ideal for a wide range of recipes",
          "Natural alternative to cow milk - lactose-free and vegan-friendly",
          "Enhances the flavor of soups, curries, desserts, and smoothies",
          "Made from real coconut for an authentic taste and consistency"
        ]
      },
      {
        type: "paragraph",
        text: "Whether you're preparing Thai curry, creamy desserts, or plant-based smoothies, Zumra Creamy Coconut Milk delivers taste, texture, and quality in every drop."
      },
      {
        type: "list",
        title: "How to Use",
        items: [
          "Use it to make juices, shakes, and ice cream",
          "Add it into cakes and bakeries as a substitute for dairy products",
          "Stir into soups and curries for a thick and smooth texture"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair it with ",
          { text: "Panko Bread Crumbs", href: buildProductUrl("zumra-panko-breadcrumbs") },
          ", ",
          { text: "Teriyaki Sauce", href: buildProductUrl("zumra-teriyaki-sauce-150ml") },
          ", or ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          "."
        ]
      }
    ]
  },
  {
    id: "amr-sweet-corn-400gm",
    name: "AMR Sweet Corn - 400 gm",
    category: "Canned Food / Pantry",
    filterGroup: "pantry",
    price: 44.5,
    description: "Naturally sweet and tender AMR sweet corn kernels, ready to use in salads, sandwiches, side dishes, and quick meals.",
    images: amrSweetCornImages,
    itemDetails: amrSweetCornItemDetails,
    recommendedProductIds: [
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-sriracha-sauce-250ml",
      "zumra-teriyaki-sauce-150ml",
      "zumra-dark-soy-sauce-150ml",
      "zumra-fresh-round-rice-paper-22cm",
      "zumra-vegetable-dumplings-200gm",
      "zumra-coconut-cream-20-22-fat-400ml",
      "zumra-panko-breadcrumbs"
    ],
    longDescriptionTitle: "AMR Sweet Corn - 400 gm",
    longDescriptionIntro: "Try this delicious sweet corn from AMR and enjoy a delightful snack or addition to your main dishes. It's rich in vitamin C and antioxidants that support your health. Add it to your salads, sandwiches, or side dishes to enjoy its naturally sweet taste and nutritional benefits.",
    descriptionBlocks: [
      {
        type: "list",
        title: "Why You'll Love AMR Sweet Corn",
        items: [
          "Naturally sweet and tender kernels",
          "Rich in vitamins and antioxidants",
          "Perfect for salads, sandwiches, and side dishes",
          "Ready to use and easy to prepare"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair it with ready-to-use sauces like ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          ", ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          ", or ",
          { text: "Teriyaki Sauce", href: buildProductUrl("zumra-teriyaki-sauce-150ml") },
          "."
        ]
      }
    ]
  },
  {
    id: "yopokki-korean-spicy-rice-cakes-120gm",
    name: "Yopokki Korean Spicy Rice Cakes - 120 gm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 175,
    description: "Authentic Korean spicy rice cakes with chewy tteokbokki texture and bold sauce for a quick street-food snack or light meal.",
    images: yopokkiSpicyRiceCakesImages,
    itemDetails: yopokkiSpicyRiceCakesItemDetails,
    recommendedProductIds: [
      "zumra-kimchi-200gm",
      "samyang-hot-chicken-korean-ramen-noodles-140gm",
      "samyang-hot-chicken-jjajang-flavor-ramen-140gm",
      "zumra-chicken-baozi-4-pieces",
      "zumra-beef-baozi-4-pieces",
      "zumra-chicken-dumplings-200gm",
      "zumra-shrimp-dumplings-200gm",
      "zumra-dark-soy-sauce-150ml",
      "kikkoman-soy-sauce-table-pot-148ml",
      "zumra-chopsticks-25pcs-helpers-5pcs"
    ],
    longDescriptionTitle: "Yopokki Korean Spicy Rice Cakes - 120 gm",
    longDescriptionIntro: "Taste the heat of authentic Korean street food with spicy rice cakes (tteokbokki), a globally loved dish.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "These chewy rice cakes are coated in a bold, spicy sauce that delivers the perfect kick while maintaining the signature chewy texture."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 120 gm",
          "Brand: Yopokki",
          "Type: Simple Product"
        ]
      },
      {
        type: "list",
        title: "Why You'll Love Yopokki Spicy Rice Cakes",
        items: [
          "Authentic Korean tteokbokki with chewy rice cakes",
          "Bold, spicy flavor for a real street food experience",
          "Quick and easy to prepare - ready in minutes",
          "Convenient 120 gm pack, perfect for a snack or light meal"
        ]
      },
      {
        type: "paragraph",
        title: "Pair it with",
        segments: [
          { text: "Kimchi", href: buildProductUrl("zumra-kimchi-200gm") },
          ", ",
          { text: "Udon Noodles", href: buildProductUrl("samyang-hot-chicken-korean-ramen-noodles-140gm") },
          ", ",
          { text: "Chicken Baozi", href: buildProductUrl("zumra-chicken-baozi-4-pieces") },
          ", or ",
          { text: "Beef Baozi", href: buildProductUrl("zumra-beef-baozi-4-pieces") },
          "."
        ]
      }
    ]
  },
  {
    id: "zumra-rice-cake-tteokbokki-250gm",
    name: "Zumra Rice Cake (Tteokbokki) - 250 gm",
    category: "Sushi Essentials / Asian Ingredients",
    filterGroup: "essentials",
    price: 160,
    description: "Zumra Rice Cake (Tteokbokki) – 250 gm. Ready to dive into Korean street food? Make your favorite tteokbokki dish at home with Zumra Rice Cakes.",
    images: zumraRiceCakeImages,
    itemDetails: zumraRiceCakeItemDetails,
    recommendedProductIds: [
      "zumra-dark-soy-sauce-150ml",
      "zumra-sriracha-sauce-250ml",
      "zumra-chinese-sweet-chili-sauce-280gm",
      "zumra-teriyaki-sauce-150ml"
    ],
    longDescriptionTitle: "Zumra Rice Cake (Tteokbokki) - 250 gm",
    longDescriptionIntro: "Zumra Rice Cake (Tteokbokki) – 250 gm. Ready to dive into Korean street food? Make your favorite tteokbokki dish at home with Zumra Rice Cakes.",
    descriptionBlocks: [
      {
        type: "paragraph",
        text: "Zumra Rice Cake (Tteokbokki) – 250 gm. Ready to dive into Korean street food? Make your favorite tteokbokki dish at home with Zumra Rice Cakes, known for their chewy texture and authentic taste."
      },
      {
        type: "list",
        title: "Product Details",
        items: [
          "Weight: 250 gm",
          "Type: Korean-style rice cakes (Tteok)",
          "Brand: Zumra",
          "Model Name: Zumra Rice Cake (Tteokbokki) - 250 gm",
          "Product Type: Simple"
        ]
      },
      {
        type: "list",
        title: "Why Choose Zumra Tteokbokki Rice Cakes?",
        items: [
          "Soft and chewy texture, just like traditional Korean tteok",
          "Perfect for homemade spicy rice cake dishes",
          "Quick and easy to cook — ready in just a few steps",
          "Great for snacks, meals, or sharing the K-food experience with friends"
        ]
      },
      {
        type: "list",
        title: "How to Prepare",
        items: [
          "Bring a pot of water to boil",
          "Add rice cakes and cook for 30–60 seconds",
          "Drain and mix with your favorite tteokbokki sauce",
          "Stir well to coat and enjoy hot"
        ]
      },
      {
        type: "paragraph",
        segments: [
          "Pair with ",
          { text: "Soy Sauce", href: buildProductUrl("zumra-dark-soy-sauce-150ml") },
          ", ",
          { text: "Sriracha Sauce", href: buildProductUrl("zumra-sriracha-sauce-250ml") },
          ", or ",
          { text: "Sweet Chili Sauce", href: buildProductUrl("zumra-chinese-sweet-chili-sauce-280gm") },
          " for an authentic flavor boost."
        ]
      },
      {
        type: "list",
        title: "How to use?",
        items: [
          "Bring a pot of water to boil",
          "Cook the rice cakes for 30–60 seconds",
          "Drain the cakes and add them to the sauce",
          "Mix well to coat evenly"
        ]
      }
    ]
  }
];

const featuredProductIds = [
  "zumra-sushi-kit",
  "zumra-sushi-nori-sheets",
  "samyang-hot-carbonara-chicken-korean-ramen-130gm",
  "samyang-hot-chicken-korean-ramen-noodles-140gm",
  "zumra-chicken-dumplings-200gm",
  "zumra-shrimp-dumplings-200gm",
  "soly-smoked-salmon-200gm",
  "bosphorus-shrimp-emirati-extra-large-peeled-deveined-30-40-400gm",
  "zumra-dark-soy-sauce-150ml",
  "zumra-teriyaki-sauce-150ml",
  "zumra-boba-pearls-1kg",
  "amr-sweet-corn-400gm"
];

const featuredProductRanks = new Map(featuredProductIds.map((productId, index) => [productId, index + 1]));

const PRODUCT_IMAGE_WIDTHS = [320, 640, 960, 1200];
const DEFAULT_PRODUCT_IMAGE_SIZES = "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 360px";
const FALLBACK_PRODUCT_IMAGE = "images/optimized/Logo.webp";
const IMAGE_FILE_EXTENSION_PATTERN = /\.(?:avif|webp|jpe?g|png|gif|svg)(?:[?#].*)?$/i;
const OPTIMIZED_IMAGE_MANIFEST = `505:320,640,960,1200|10-Zumra Boba Pearls - 1 kg-2nd:320,640,960,1200|10-Zumra Boba Pearls - 1 kg:320,640,960|10-Zumra Boba Pearls - 1 kg-3rd:320,640,960,1200|10-Zumra Boba Pearls - 1 kg-4th:320,640,960,1200|11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm:320,640,960,1200|11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm-2nd:320,640,960,1200|11-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm-2nd-2:320,640,960,1200|12-Bosphorus Shrimp Emirati Extra Large Peeled And Deveined (30-40 Pieces) - 400 gm:320,640,960,1200|13-Bosphorus Emirati Medium Peeled And Deveined Shrimp (60-80 Pieces) - 400 gm:320,640,960,1200|14-Zumra Rice Cake (Tteokbokki) - 250 gm:320,640,960,1200|14-Zumra Rice Cake (Tteokbokki) - 250 gm-2nd:320,640,960,1200|14-Zumra Rice Cake (Tteokbokki) - 250 gm-3rd:320,640,960,1200|14-Zumra Rice Cake (Tteokbokki) - 250 gm-4th:320,640,960,1200|15-Samyang Hot Chicken Carbonara Korean Ramen Noodles - 130 gm:320,640,960,1200|15-Samyang Hot Chicken Carbonara Korean Ramen Noodles - 130 gm-2nd:320,640,960,1200|15-Samyang Hot Chicken Carbonara Korean Ramen Noodles - 130 gm-3rd:320,640,960,1200|16-Samyang Cream Carbonara Ramen - 140 gm:320,640,960,1200|17-Zumra Chicken Dumplings - 200 gm:320,640,960,1200|17-Zumra Chicken Dumplings - 200 gm-2nd:320,640,960,1200|17-Zumra Chicken Dumplings - 200 gm-3rd:320,640,960,1200|18-Zumra Beef Dumplings - 200 gm:320,640,960,1200|18-Zumra Beef Dumplings - 200 gm-2:320,640,960,1200|18-Zumra Beef Dumplings - 200 gm-2nd:320,640,960,1200|19-506:320,640,960,1200|2-Zumra Sushi Nori Sheets - 10 Sheets Front:320,640,960,1200|2-Zumra Sushi Nori Sheets - 10 Sheets-Back:320,640,960,1200|20-Zumra Shrimp Dumplings - 200 gm:320,640,960,1200|20-Zumra Shrimp Dumplings - 200 gm-2nd:320,640,960,1200|21-Zumra Pickled Ginger - 150 gm:320,640,960,1200|21-Zumra Pickled Ginger - 150 gm-2nd:320,640,960,1200|21-Zumra Pickled Ginger - 150 gm-3rd:320,640,960,1200|22-Zumra Vegetable Dumplings - 200 gm:320,640,960,1200|22-Zumra Vegetable Dumplings - 200 gm-2nd:320,640,960,1200|23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm:320,640,960,1200|23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm-2nd:320,640,960,1200|23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm-3rd:320,640,960,1200|23-Samyang Hot Chicken Korean Ramen Noodles - 140 gm-4th:320,640,960,1200|24-Samyang Hot Chicken and Cheese Korean Ramen Noodles - 140 gm:320,640,960,1200|24-Samyang Hot Chicken and Cheese Korean Ramen Noodles - 140 gm-2nd:320,640,960,1200|25-Zumra Fresh Round Rice Paper - 22 cm-2nd:320,640,960,1200|25-Zumra Fresh Round Rice Paper - 22 cm-3rd:320,640,960,1200|25-Zumra Fresh Round Rice Paper - 22 cm-4th:320,640,960,1200|25-Zumra Fresh Round Rice Paper - 22 cm-5th:320,640,960,1200|25-Zumra Round Rice Paper - 22 cm:320,640,960,1200|26-Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm:320,640,960,1200|26-Samyang Hot Chicken Jjajang Flavor Ramen - 140 gm-2nd:320,640,960,1200|27-Zumra Chicken Baozi - 4 Pieces:320,640,960,1200|27-Zumra Chicken Baozi - 4 Pieces-2nd:320,640,960,1200|27-Zumra Chicken Baozi - 4 Pieces-3rd:320,640,960,1200|28-Samyang Buldak Habanero Lime Spicy Chicken - 135 gm:320,640,960,1200|28-Samyang Buldak Habanero Lime Spicy Chicken - 135 gm-2nd:320,640,960,1200|28-Samyang Buldak Habanero Lime Spicy Chicken - 135 gm-3rd:320,640,960,1200|3-Zumra Panko Bread Crumbs - 1 kg-Back:320,640,960,1200|3-Zumra Panko Bread Crumbs - 1 kg-Front:320,640,960,1200|3-Zumra Panko Breadcrumbs - 200 gm-Back:320,640,960,1200|3-Zumra Panko Breadcrumbs - 200 gm-Front:320,640,960,1200|30-AMR Sweet Corn - 400 gm:320,640,960,1200|31-Zumra Premium Soy Sauce - 150 ml:320,640,960,1200|32-Zumra Light Soy Sauce - 625 ml:320,640,960,1200|32-Zumra Light Soy Sauce - 625 ml-2nd:320,640,960,1200|32-Zumra Light Soy Sauce - 625 ml-3rd:320,640,960,1200|33-Tai Hua Sweet Sauce - 320 ml:320,640,960,1200|33-Tai Hua Sweet Sauce - 320 ml-2nd:320,640,960,1200|34-Zumra Kimchi - 200 gm:320,640,960,1200|35-Kikkoman Soy Sauce Table Pot - 148 ml:320,640,960,1200|35-Kikkoman Soy Sauce Table Pot - 148 ml-2nd:320,640,960,1200|36-Yopokki Korean Spicy Rice Cakes - 120 gm:320,640,960,1200|36-Yopokki Korean Spicy Rice Cakes - 120 gm-2nd:320,640,960,1200|36-Yopokki Korean Spicy Rice Cakes - 120 gm-3rd:320,640,960,1200|37-Zumra Sushi Vinegar - 150 ml:320,640,960,1200|38-Tai Hua Light Soy Sauce - 320 ml:320,640,960,1200|39-Bamboo Sushi Rolling Mat - 27 cm:320,640,960,1200|39-Bamboo Sushi Rolling Mat - 27 cm-2nd:320,640,960,1200|39-Bamboo Sushi Rolling Mat - 27 cm-4th:320,640,960,1200|39-Bamboo Sushi Rolling Mat - 27 cm-5th:320,640,960,1200|39-Bamboo Sushi Rolling Mat - 27 cm-6th:320,640,960,1200|39-Bamboo Sushi Rolling Mat - 27 cm.3rd:320,640,960,1200|4-Smoked Salmon golden fish - 250gm-2nd:320,640,960,1200|4-Smoked Salmon golden fish - 250gm-3rd:320,640,960,1200|6-Zumra Dark Soy Sauce - 150 ml-3nd:320,640,960,1200|6-Zumra Dark Soy Sauce - 150 ml-back:320,640,960,1200|6-Zumra Dark Soy Sauce - 150 ml-front:320,640,960,1200|7-Zumra Teriyaki Sauce - 150 ml-2nd:320,640,960,1200|7-Zumra Teriyaki Sauce - 150 ml-front:320,640,960,1200|8-Zumra Chinese Sweet Chili Sauce - 280 gm-front:320,640,960,1200|8-Zumra Chinese Sweet Chili Sauce - 280 gm-nd:320,640,960,1200|9-Zumra Sriracha Sauce - 250 ml-front:320,640,960,1200|Logo:160,320,640|Zumra Sushi Kit:320,640,960,1200|about-img:320,640,960,1200|coconut-cream-front:320,640,960,1200|coconut-cream-side:320,640,960,1200|crab-sticks-back:320,640,960,1200|crab-sticks-front:320,640,960,1200|crab-sticks-view-3:320,640,960,1200|crab-sticks-view-4:320,640,960,1200|crab-sticks-view-5:320,640,960,1200|favicon:320,640,960,1200|hero-bg:768,1280,1920`;
const optimizedImageWidthsByBase = OPTIMIZED_IMAGE_MANIFEST.split("|").reduce((manifest, entry) => {
  const [baseName, widthsValue = ""] = entry.split(":");
  if (baseName) {
    manifest[baseName] = widthsValue.split(",")
      .map((width) => Number(width))
      .filter((width) => Number.isFinite(width) && width > 0);
  }

  return manifest;
}, {});

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeImagePath(imagePath) {
  return String(imagePath || "").trim().replace(/^\/+/, "");
}

function toRootImagePath(imagePath) {
  const normalizedPath = normalizeImagePath(imagePath);
  return normalizedPath ? `/${normalizedPath}` : "";
}

function getImageBaseName(imagePath) {
  const normalizedPath = normalizeImagePath(imagePath);
  if (!normalizedPath || !normalizedPath.startsWith("images/")) {
    return "";
  }

  const rawFileName = normalizedPath.split("/").pop();
  const fileName = decodeURIComponent(rawFileName);
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName = extensionIndex === -1 ? fileName : fileName.slice(0, extensionIndex);

  if (imagePath.startsWith("images/optimized/")) {
    return baseName.replace(/-(160|320|640|768|960|1200|1280|1920)$/, "");
  }

  return baseName;
}

function getOptimizedImageWidths(baseName, requestedWidths = PRODUCT_IMAGE_WIDTHS) {
  const availableWidths = optimizedImageWidthsByBase[baseName] || [];
  const requested = (Array.isArray(requestedWidths) && requestedWidths.length ? requestedWidths : PRODUCT_IMAGE_WIDTHS)
    .map((width) => Number(width))
    .filter((width) => Number.isFinite(width) && width > 0);

  return requested.filter((width) => availableWidths.includes(width));
}

function isImageFilePath(imagePath) {
  const path = String(imagePath || "").trim();
  return Boolean(path && !path.endsWith("/") && IMAGE_FILE_EXTENSION_PATTERN.test(path));
}

function encodeSrcsetUrl(imagePath) {
  return encodeURI(String(imagePath || "").trim()).replace(/,/g, "%2C");
}

function hasOptimizedImage(imagePath) {
  const baseName = getImageBaseName(imagePath);
  return Boolean(baseName && Object.prototype.hasOwnProperty.call(optimizedImageWidthsByBase, baseName));
}

export function getOptimizedImagePath(imagePath, width = 0) {
  const normalizedPath = normalizeImagePath(imagePath);
  if (!normalizedPath || !normalizedPath.startsWith("images/")) {
    return imagePath || "";
  }

  const baseName = getImageBaseName(normalizedPath);
  if (!baseName || !hasOptimizedImage(normalizedPath)) {
    return toRootImagePath(normalizedPath);
  }

  return width ? `/images/optimized/${baseName}-${width}.webp` : `/images/optimized/${baseName}.webp`;
}

export function getResponsiveImageSource(imagePath, widths = PRODUCT_IMAGE_WIDTHS) {
  const fallbackSource = imagePath || FALLBACK_PRODUCT_IMAGE;
  const fallback = toRootImagePath(fallbackSource);
  const baseName = getImageBaseName(fallback);
  const hasWebp = hasOptimizedImage(fallback);
  const safeWidths = hasWebp ? getOptimizedImageWidths(baseName, widths) : [];
  const optimized = hasWebp ? getOptimizedImagePath(fallback) : fallback;
  const srcset = safeWidths
    .map((width) => {
      const candidate = getOptimizedImagePath(fallback, width);
      return isImageFilePath(candidate) ? `${encodeSrcsetUrl(candidate)} ${width}w` : "";
    })
    .filter(Boolean)
    .join(", ");

  return {
    fallback,
    optimized,
    src: optimized,
    srcset,
    widths: safeWidths
  };
}

export function getProductImageSource(product, imageIndex = 0, widths = PRODUCT_IMAGE_WIDTHS) {
  const originalImages = Array.isArray(product?.originalImages) && product.originalImages.length
    ? product.originalImages
    : (Array.isArray(product?.images) ? product.images : []);
  const sourcePath = originalImages[imageIndex] || originalImages[0] || product?.image || FALLBACK_PRODUCT_IMAGE;

  return getResponsiveImageSource(sourcePath, widths);
}

export function getProductImageSources(product, widths = PRODUCT_IMAGE_WIDTHS) {
  const originalImages = Array.isArray(product?.originalImages) && product.originalImages.length
    ? product.originalImages
    : (Array.isArray(product?.images) ? product.images : []);
  const safeImages = originalImages.length ? originalImages : [product?.image || FALLBACK_PRODUCT_IMAGE];

  return safeImages.map((imagePath) => getResponsiveImageSource(imagePath, widths));
}

export function buildResponsiveImageMarkup({
  product = null,
  imagePath = "",
  imageIndex = 0,
  alt = "",
  width = 600,
  height = 600,
  loading = "lazy",
  decoding = "async",
  fetchpriority = "",
  sizes = DEFAULT_PRODUCT_IMAGE_SIZES,
  pictureClassName = "",
  imgClassName = ""
} = {}) {
  const source = product
    ? getProductImageSource(product, imageIndex)
    : getResponsiveImageSource(imagePath || FALLBACK_PRODUCT_IMAGE);
  const priorityAttribute = fetchpriority ? ` fetchpriority="${escapeAttribute(fetchpriority)}"` : "";
  const pictureClass = pictureClassName ? ` class="${escapeAttribute(pictureClassName)}"` : "";
  const imageClass = imgClassName ? ` class="${escapeAttribute(imgClassName)}"` : "";
  const sourceMarkup = source.srcset
    ? `<source type="image/webp" srcset="${escapeAttribute(source.srcset)}" sizes="${escapeAttribute(sizes)}">`
    : "";

  return `
    <picture${pictureClass}>
      ${sourceMarkup}
      <img src="${escapeAttribute(source.src || source.fallback)}" alt="${escapeAttribute(alt)}" width="${Number(width) || 600}" height="${Number(height) || 600}" loading="${escapeAttribute(loading)}" decoding="${escapeAttribute(decoding)}"${priorityAttribute}${imageClass}>
    </picture>
  `;
}

export function applyResponsiveImage(image, imagePath, {
  alt = "",
  width = 600,
  height = 600,
  loading = "lazy",
  decoding = "async",
  fetchpriority = "",
  sizes = DEFAULT_PRODUCT_IMAGE_SIZES
} = {}) {
  if (!image) {
    return null;
  }

  const sourceData = getResponsiveImageSource(imagePath || image.getAttribute("src") || FALLBACK_PRODUCT_IMAGE);
  let picture = image.parentElement && image.parentElement.tagName === "PICTURE"
    ? image.parentElement
    : null;

  if (!picture) {
    picture = document.createElement("picture");
    image.replaceWith(picture);
    picture.appendChild(image);
  }

  let source = picture.querySelector("source[type='image/webp']");
  if (!source) {
    source = document.createElement("source");
    source.type = "image/webp";
    picture.insertBefore(source, image);
  }

  if (sourceData.srcset) {
    source.srcset = sourceData.srcset;
    source.sizes = sizes;
  } else if (source) {
    source.remove();
  }

  image.src = sourceData.src || sourceData.fallback;
  image.alt = alt || image.alt || "Product image";
  image.width = Number(width) || image.width || 600;
  image.height = Number(height) || image.height || 600;
  image.loading = loading;
  image.decoding = decoding;

  if (fetchpriority) {
    image.setAttribute("fetchpriority", fetchpriority);
  } else {
    image.removeAttribute("fetchpriority");
  }

  return sourceData;
}

productCatalog.forEach((product, index) => {
  if (!Number.isFinite(Number(product.sortOrder))) {
    product.sortOrder = index + 1;
  }

  if (typeof product.isActive !== "boolean") {
    product.isActive = true;
  }

  if (!product.stockStatus) {
    product.stockStatus = "in_stock";
  }

  if (!Object.prototype.hasOwnProperty.call(product, "createdAt")) {
    product.createdAt = null;
  }

  if (!Object.prototype.hasOwnProperty.call(product, "updatedAt")) {
    product.updatedAt = null;
  }

  product.originalImages = (Array.isArray(product.images) ? product.images : [])
    .filter(Boolean);
  product.imageSources = getProductImageSources(product);
  product.images = product.originalImages.map((imagePath) => getOptimizedImagePath(imagePath));

  if (featuredProductRanks.has(product.id)) {
    product.featured = true;
    product.featuredRank = featuredProductRanks.get(product.id);
  }
});

const productMap = new Map(productCatalog.map((product) => [product.id, product]));

const productFilterMap = {
  "Noodles / Ramen": "noodles",
  Sauces: "sauces",
  "Frozen / Dumplings": "frozen",
  "Sushi Essentials / Asian Ingredients": "essentials",
  Seafood: "seafood",
  "Canned Food / Pantry": "pantry",
  Beverages: "beverages"
};

export function getAllProducts() {
  return productCatalog
    .slice()
    .sort((left, right) => (Number(left.sortOrder) || 9999) - (Number(right.sortOrder) || 9999));
}

export function getFeaturedProducts(limit) {
  const featuredProducts = productCatalog
    .filter((product) => product.featured)
    .sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999));
  const safeLimit = Number(limit) || 0;

  return safeLimit > 0 ? featuredProducts.slice(0, safeLimit) : featuredProducts;
}

export function getDefaultProduct() {
  return productMap.get("zumra-teriyaki-sauce-150ml") || productCatalog[0];
}

export function getDefaultProductId() {
  const defaultProduct = getDefaultProduct();
  return defaultProduct ? defaultProduct.id : "";
}

export function getProductById(productId) {
  return productMap.get(productId) || productMap.get(productAliases[productId]) || getDefaultProduct();
}

export function getExactProductById(productId) {
  return productMap.get(productId) || productMap.get(productAliases[productId]) || null;
}

export function getProductIdFromPageUrl(url = window.location.href) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    const queryProductId = parsedUrl.searchParams.get("product");
    if (queryProductId) {
      return queryProductId;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "products" && pathParts[1]) {
      return decodeURIComponent(pathParts[1]);
    }

    return getDefaultProductId();
  } catch (error) {
    return getDefaultProductId();
  }
}

export function getProductIdFromCard(cardElement) {
  const directValue = cardElement && cardElement.getAttribute("data-product-id");
  if (directValue) {
    return directValue;
  }

  const productUrl = cardElement && cardElement.getAttribute("data-product-url");
  if (!productUrl) {
    return getDefaultProductId();
  }

  return getProductIdFromPageUrl(productUrl);
}

export function formatPrice(value) {
  const amount = Number(value || 0).toFixed(2);
  return `EGP ${amount}`;
}

export function buildProductUrl(productId) {
  return `/products/${encodeURIComponent(productId)}`;
}

export function getProductFilterClass(product) {
  if (!product) {
    return "all";
  }

  return product.filterGroup || productFilterMap[product.category] || "all";
}

export function getProductSearchText(product) {
  if (!product) {
    return "";
  }

  const components = Array.isArray(product.components) ? product.components.join(" ") : "";
  const searchKeywords = Array.isArray(product.searchKeywords) ? product.searchKeywords.join(" ") : "";
  const aliases = getProductAliasTerms(product);
  const itemDetails = Array.isArray(product.itemDetails)
    ? product.itemDetails.map((detail) => `${detail.label} ${detail.value}`).join(" ")
    : "";

  return [
    product.name,
    product.category,
    product.description,
    product.id,
    components,
    searchKeywords,
    aliases,
    getDescriptionBlockText(product.descriptionBlocks),
    itemDetails
  ].join(" ").toLowerCase();
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getProductDetailValue(product, label) {
  if (!product || !Array.isArray(product.itemDetails)) {
    return "";
  }

  const detail = product.itemDetails.find((item) => normalizeSearchValue(item.label) === normalizeSearchValue(label));
  return detail ? detail.value : "";
}

function getDescriptionBlockText(blocks) {
  if (!Array.isArray(blocks)) {
    return "";
  }

  return blocks.map((block) => {
    const items = Array.isArray(block.items) ? block.items.join(" ") : "";
    const segments = Array.isArray(block.segments)
      ? block.segments.map((segment) => (typeof segment === "string" ? segment : segment.text || "")).join(" ")
      : "";
    return [block.title, block.text, items, segments].join(" ");
  }).join(" ");
}

function getRelatedSearchTerms(product) {
  if (!product) {
    return "";
  }

  const recommended = Array.isArray(product.recommendedProductIds)
    ? product.recommendedProductIds.map((productId) => {
      const relatedProduct = productMap.get(productId);
      return relatedProduct ? `${relatedProduct.name} ${relatedProduct.category}` : productId;
    }).join(" ")
    : "";

  return [
    product.filterGroup,
    getDescriptionBlockText(product.descriptionBlocks),
    recommended
  ].join(" ");
}

function getProductAliasTerms(product) {
  if (!product) {
    return "";
  }

  const explicitAliases = Array.isArray(product.aliases) ? product.aliases.join(" ") : "";
  const routeAliases = Object.keys(productAliases)
    .filter((alias) => productAliases[alias] === product.id)
    .map((alias) => alias.replace(/-/g, " "))
    .join(" ");

  return [explicitAliases, routeAliases].join(" ");
}

const SEARCH_INTENT_GROUPS = [
  {
    terms: ["sauce", "sauces", "condiment", "condiments", "dip", "dipping"],
    expansions: [
      "soy sauce",
      "light soy sauce",
      "dark soy sauce",
      "premium soy sauce",
      "teriyaki sauce",
      "sriracha sauce",
      "sweet chili sauce",
      "dipping sauce"
    ]
  },
  {
    terms: [
      "sushi tools",
      "sushi tool",
      "sushi making tools",
      "sushi supplies",
      "sushi accessories",
      "sushi starter"
    ],
    expansions: [
      "rolling mat",
      "bamboo mat",
      "makisu",
      "chopsticks",
      "helpers",
      "sushi kit"
    ]
  },
  {
    terms: ["seaweed", "sea weed", "seaweed sheets"],
    expansions: [
      "nori",
      "sushi nori",
      "nori sheets",
      "toasted nori"
    ]
  },
  {
    terms: ["noodle", "noodles", "instant noodles", "korean noodles"],
    expansions: [
      "ramen",
      "korean ramen",
      "samyang",
      "buldak"
    ]
  },
  {
    terms: ["spicy", "hot", "fiery"],
    expansions: [
      "hot chicken",
      "buldak",
      "sriracha",
      "chili",
      "habanero"
    ]
  }
];

function getSearchIntentExpansions(normalizedQuery, queryWords) {
  const expansions = [];
  SEARCH_INTENT_GROUPS.forEach((group) => {
    const matchesIntent = group.terms.some((term) => {
      const normalizedTerm = normalizeSearchValue(term);
      return normalizedTerm.indexOf(" ") === -1
        ? queryWords.includes(normalizedTerm)
        : normalizedQuery.indexOf(normalizedTerm) !== -1;
    });

    if (matchesIntent) {
      expansions.push(...group.expansions);
    }
  });

  return Array.from(new Set(expansions.map(normalizeSearchValue).filter(Boolean)));
}

function buildSearchQueryVariants(normalizedQuery) {
  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  const expansions = getSearchIntentExpansions(normalizedQuery, queryWords);
  const variants = [{
    query: normalizedQuery,
    queryWords,
    weight: 1
  }];

  expansions.forEach((expansion) => {
    variants.push({
      query: expansion,
      queryWords: expansion.split(" ").filter(Boolean),
      weight: 0.92
    });
  });

  if (expansions.length) {
    const expandedWords = Array.from(new Set([
      ...queryWords,
      ...expansions.join(" ").split(" ").filter(Boolean)
    ]));

    if (expandedWords.length <= 10) {
      variants.push({
        query: expandedWords.join(" "),
        queryWords: expandedWords,
        weight: 0.72
      });
    }
  }

  const seenQueries = new Set();
  return variants.filter((variant) => {
    if (!variant.query || seenQueries.has(variant.query)) {
      return false;
    }

    seenQueries.add(variant.query);
    return true;
  });
}

function isAdjacentTransposition(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length - 1; index += 1) {
    if (
      left[index] !== right[index]
      && left[index] === right[index + 1]
      && left[index + 1] === right[index]
      && left.slice(0, index) === right.slice(0, index)
      && left.slice(index + 2) === right.slice(index + 2)
    ) {
      return true;
    }
  }

  return false;
}

function scoreWordDistance(queryWord, candidateWord) {
  if (!queryWord || !candidateWord) {
    return 0;
  }

  if (candidateWord === queryWord) {
    return 44;
  }

  if (candidateWord.startsWith(queryWord) || queryWord.startsWith(candidateWord)) {
    return 34;
  }

  if (candidateWord.indexOf(queryWord) !== -1 || queryWord.indexOf(candidateWord) !== -1) {
    return 26;
  }

  if (Math.min(candidateWord.length, queryWord.length) <= 3) {
    return 0;
  }

  if (isAdjacentTransposition(queryWord, candidateWord)) {
    return 24;
  }

  if (Math.abs(candidateWord.length - queryWord.length) > 2) {
    return 0;
  }

  let previous = Array(candidateWord.length + 1).fill(0).map((_, index) => index);
  for (let i = 1; i <= queryWord.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= candidateWord.length; j += 1) {
      const cost = queryWord[i - 1] === candidateWord[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    previous = current;
  }

  const distance = previous[candidateWord.length];
  if (distance === 1) {
    return 24;
  }

  if (distance === 2 && queryWord.length > 4) {
    return 16;
  }

  return 0;
}

function getCachedSearchWords(field) {
  return field ? field.split(" ").filter(Boolean) : [];
}

function getProductSearchFields(product) {
  const components = Array.isArray(product.components) ? product.components.join(" ") : "";
  const searchKeywords = Array.isArray(product.searchKeywords) ? product.searchKeywords.join(" ") : "";
  const itemDetails = Array.isArray(product.itemDetails)
    ? product.itemDetails.map((detail) => `${detail.label} ${detail.value}`).join(" ")
    : "";

  return {
    name: normalizeSearchValue(product.name),
    category: normalizeSearchValue(product.category),
    brand: normalizeSearchValue(getProductDetailValue(product, "Brand")),
    model: normalizeSearchValue(getProductDetailValue(product, "Model Name")),
    aliases: normalizeSearchValue(getProductAliasTerms(product)),
    keywords: normalizeSearchValue([components, searchKeywords].join(" ")),
    details: normalizeSearchValue(itemDetails),
    description: normalizeSearchValue([
      product.description,
      product.longDescriptionTitle,
      product.longDescriptionIntro,
      getDescriptionBlockText(product.descriptionBlocks)
    ].join(" ")),
    related: normalizeSearchValue(getRelatedSearchTerms(product)),
    id: normalizeSearchValue(product.id)
  };
}

let cachedProductSearchIndex = null;

function getProductSearchIndex() {
  if (!cachedProductSearchIndex || cachedProductSearchIndex.length !== productCatalog.length) {
    cachedProductSearchIndex = productCatalog.map((product, index) => {
      const fields = getProductSearchFields(product);
      const fieldWords = Object.keys(fields).reduce((wordsByField, fieldName) => {
        wordsByField[fieldName] = getCachedSearchWords(fields[fieldName]);
        return wordsByField;
      }, {});

      return {
        product,
        index,
        fields,
        fieldWords
      };
    });
  }

  return cachedProductSearchIndex;
}

function scoreSearchField(query, queryWords, field, fieldWords, weights) {
  if (!field) {
    return 0;
  }

  if (field === query) {
    return weights.exact;
  }

  if (field.startsWith(query)) {
    return weights.startsWith;
  }

  if (field.indexOf(query) !== -1) {
    return weights.includes;
  }

  const words = Array.isArray(fieldWords) ? fieldWords : getCachedSearchWords(field);
  const wordStats = queryWords.reduce((stats, queryWord) => {
    const bestWordScore = words.reduce((best, fieldWord) => {
      return Math.max(best, scoreWordDistance(queryWord, fieldWord));
    }, 0);
    if (bestWordScore > 0) {
      stats.matches += 1;
      stats.total += bestWordScore;
      if (bestWordScore >= 34) {
        stats.strongMatches += 1;
      }
    }
    return stats;
  }, {
    matches: 0,
    strongMatches: 0,
    total: 0
  });

  if (!wordStats.matches) {
    return 0;
  }

  const coverage = wordStats.matches / queryWords.length;
  const averageWordStrength = wordStats.total / (queryWords.length * 44);
  const fullStrongMatchBonus = wordStats.strongMatches === queryWords.length ? 0.18 : 0;
  const wordWeight = weights.words || Math.max(120, Math.round(weights.includes * 0.78));
  const weightedScore = wordWeight * Math.min(1, (averageWordStrength * (0.55 + (coverage * 0.45))) + fullStrongMatchBonus);

  return Math.round(weightedScore);
}

function scoreSearchFieldVariants(queryVariants, field, fieldWords, weights) {
  return queryVariants.reduce((best, variant) => {
    const score = scoreSearchField(variant.query, variant.queryWords, field, fieldWords, weights);
    return Math.max(best, Math.round(score * variant.weight));
  }, 0);
}

function getExactNameRank(normalizedQuery, fields) {
  if (!fields.name) {
    return 0;
  }

  if (fields.name === normalizedQuery) {
    return 3;
  }

  if (fields.name.startsWith(normalizedQuery)) {
    return 2;
  }

  if (fields.name.indexOf(normalizedQuery) !== -1) {
    return 1;
  }

  return 0;
}

export function searchProductsDetailed(query) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return getAllProducts().map((product, index) => ({
      product,
      score: 1,
      strength: "featured",
      reason: "Featured product",
      index
    }));
  }

  const queryVariants = buildSearchQueryVariants(normalizedQuery);
  const scoredResults = getProductSearchIndex().map(({ product, index, fields, fieldWords }) => {
    const nameScore = scoreSearchFieldVariants(queryVariants, fields.name, fieldWords.name, {
      exact: 1000,
      startsWith: 820,
      includes: 660,
      words: 540
    });
    const categoryScore = scoreSearchFieldVariants(queryVariants, fields.category, fieldWords.category, {
      exact: 520,
      startsWith: 430,
      includes: 340,
      words: 280
    });
    const brandScore = scoreSearchFieldVariants(queryVariants, fields.brand, fieldWords.brand, {
      exact: 500,
      startsWith: 410,
      includes: 330,
      words: 260
    });
    const modelScore = scoreSearchFieldVariants(queryVariants, fields.model, fieldWords.model, {
      exact: 620,
      startsWith: 520,
      includes: 430,
      words: 440
    });
    const aliasScore = scoreSearchFieldVariants(queryVariants, fields.aliases, fieldWords.aliases, {
      exact: 460,
      startsWith: 380,
      includes: 310,
      words: 300
    });
    const keywordScore = scoreSearchFieldVariants(queryVariants, fields.keywords, fieldWords.keywords, {
      exact: 420,
      startsWith: 350,
      includes: 290,
      words: 300
    });
    const detailScore = scoreSearchFieldVariants(queryVariants, fields.details, fieldWords.details, {
      exact: 360,
      startsWith: 300,
      includes: 240,
      words: 250
    });
    const descriptionScore = scoreSearchFieldVariants(queryVariants, fields.description, fieldWords.description, {
      exact: 300,
      startsWith: 250,
      includes: 190,
      words: 220
    });
    const relatedScore = scoreSearchFieldVariants(queryVariants, fields.related, fieldWords.related, {
      exact: 250,
      startsWith: 210,
      includes: 160,
      words: 190
    });
    const idScore = scoreSearchFieldVariants(queryVariants, fields.id, fieldWords.id, {
      exact: 240,
      startsWith: 200,
      includes: 150,
      words: 170
    });

    const directScore = Math.max(nameScore, modelScore, brandScore, categoryScore, aliasScore, keywordScore, detailScore, descriptionScore, idScore);
    const score = Math.max(directScore, relatedScore);
    const exactNameRank = getExactNameRank(normalizedQuery, fields);
    const reason = exactNameRank >= 3 ? "Exact name match"
      : nameScore >= 660 ? "Name match"
      : modelScore >= 430 ? "Model match"
        : brandScore >= 330 ? "Brand match"
          : categoryScore >= 340 ? "Category match"
            : aliasScore >= 260 ? "Alias match"
              : keywordScore >= 230 ? "Keyword match"
                : detailScore >= 190 ? "Item detail match"
                  : descriptionScore >= 110 ? "Description match"
                    : relatedScore >= 90 ? "Related match"
                      : idScore >= 70 ? "Product match"
                        : "Close match";

    return {
      product,
      score,
      directScore,
      exactNameRank,
      strength: exactNameRank || score >= 500 ? "strong" : score >= 120 ? "related" : "weak",
      reason,
      index
    };
  }).filter((result) => result.score >= 70);

  return scoredResults.sort((a, b) => (
    b.exactNameRank - a.exactNameRank
    || b.score - a.score
    || b.directScore - a.directScore
    || a.index - b.index
  ));
}

export function searchProducts(query) {
  return searchProductsDetailed(query).map((result) => result.product);
}
