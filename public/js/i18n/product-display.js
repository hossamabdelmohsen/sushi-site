import { getLanguage } from "./i18n.js?v=20260629productfix";
import { SUSHI_PRODUCT_TRANSLATIONS_AR } from "./product-translations-ar.js?v=20260629titlebidi";

const FALLBACK_PRODUCT_NAME = "Product";
const FALLBACK_PRODUCT_IMAGE = "images/optimized/Logo.webp";
const RTL_ISOLATE = "\u2067";
const LTR_ISOLATE = "\u2066";
const POP_ISOLATE = "\u2069";
const BIDI_CONTROL_PATTERN = /[\u2066-\u2069]/g;
const MIXED_TITLE_BRAND_PATTERN = /\b(?:Tai Hua|Bosphorus|Kikkoman|Samyang|Buldak|Yopokki|Zumra|ZUMRA|Soly|AMR)\b/g;
const MIXED_TITLE_QUANTITY_PATTERN = /\d+(?:[.,]\d+)?(?:\s*[-+]\s*\d+(?:[.,]\d+)?%?)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?(?:\s*%?\s*(?:جم|مل|كجم|سم|قطعة|قطع|أوراق|ورقة|كيس|أكياس|زوج|دهون|pcs?|sheets?|gm|g|kg|ml|cm))?/gi;

const CATEGORY_TRANSLATIONS_AR = {
  "Noodles / Ramen": "نودلز / رامن",
  Sauces: "صوصات",
  "Frozen / Dumplings": "مجمدات / دامبلنج",
  "Sushi Essentials / Asian Ingredients": "أساسيات السوشي / مكونات آسيوية",
  Seafood: "مأكولات بحرية",
  "Canned Food / Pantry": "معلبات / مؤن",
  Beverages: "مشروبات"
};

const DETAIL_LABEL_TRANSLATIONS_AR = {
  Brand: "العلامة التجارية",
  Storage: "التخزين",
  Packing: "التعبئة",
  "Country of origin": "بلد المنشأ",
  "Country of Origin": "بلد المنشأ",
  "Product Name": "اسم المنتج",
  "Model Name": "اسم الموديل",
  Type: "النوع",
  "Product Type": "نوع المنتج",
  Size: "الحجم",
  Weight: "الوزن",
  Count: "العدد",
  Ingredients: "المكونات",
  "Sauce Type": "نوع الصوص",
  "Fat Content": "نسبة الدهون",
  "Dietary Info": "معلومات غذائية",
  "Surimi Content": "نسبة السوريمي",
  Texture: "القوام",
  "Heat Level": "مستوى الحرارة",
  "Quick to prepare": "سريع التحضير",
  Versatile: "متعدد الاستخدامات",
  "Number of pieces": "عدد القطع",
  "No. of Pieces": "عدد القطع",
  Filling: "الحشوة",
  Flavor: "النكهة",
  Note: "ملاحظة",
  SHU: "درجة الحرارة SHU"
};

const DETAIL_VALUE_TRANSLATIONS_AR = {
  Dry: "جاف",
  Egypt: "مصر",
  China: "الصين",
  Thailand: "تايلاند",
  Simple: "منتج بسيط",
  "Simple Product": "منتج بسيط",
  "Carton 1 Piece": "كرتونة قطعة واحدة",
  "Large tapioca pearls": "حبيبات تابيوكا كبيرة",
  "This product is not available for shipping outside Cairo.": "هذا المنتج غير متاح للشحن خارج القاهرة.",
  "Smoked Salmon": "سلمون مدخن",
  Chicken: "دجاج",
  Beef: "لحم",
  Vegetables: "خضار",
  "Lime Spicy Chicken": "دجاج حار باللايم",
  "Naturally brewed, thick soy sauce": "صوص صويا طبيعي التخمير بقوام غني",
  "Water, salt, 11% soybeans, wheat flour, monosodium glutamate, potassium sorbate (E202)": "ماء، ملح، 11% فول صويا، دقيق قمح، جلوتامات أحادية الصوديوم، سوربات البوتاسيوم (E202)",
  "Coconut, water": "جوز هند، ماء"
};

const DESCRIPTION_TITLE_TRANSLATIONS_AR = {
  "product details": "تفاصيل المنتج",
  "what's inside": "محتويات الطقم",
  "how to use": "طريقة الاستخدام",
  "how to cook": "طريقة التحضير",
  "how to store uncooked boba": "طريقة تخزين البوبا غير المطهية",
  "want more flavor options": "تريد خيارات نكهة أكثر؟",
  "suitable for": "مناسب لـ",
  "uses": "استخدامات"
};

const TEXT_TRANSLATIONS_AR = {
  "Complete starter set - no extra shopping needed": "طقم متكامل للمبتدئين بدون الحاجة لشراء أدوات إضافية",
  "Premium-quality ingredients for a true sushi flavor": "مكونات بجودة ممتازة لطعم سوشي أصيل",
  "Easy and fun to use with friends or family": "سهل وممتع في الاستخدام مع الأصدقاء أو العائلة",
  "Great for beginners and sushi lovers alike": "مناسب للمبتدئين ومحبي السوشي",
  "Whether you're preparing maki-style recipes, nigiri-style bites, or creative sushi-inspired dishes, Zumra Sushi Kit makes the process simple from the first sheet.": "سواء كنت تحضر وصفات ماكي أو قطع نيجيري أو أطباقا مبتكرة مستوحاة من السوشي، يجعل طقم زومرا لتحضير السوشي التجربة سهلة من أول ورقة نوري.",
  "This premium sushi kit includes everything you need: from high-quality rice and seaweed sheets to essential sauces and condiments, along with bamboo tools that make rolling sushi fun and simple.": "يحتوي طقم السوشي المميز هذا على كل ما تحتاجه: من أرز عالي الجودة وأوراق نوري إلى الصوصات والإضافات الأساسية، مع أدوات بامبو تجعل لف السوشي سهلا وممتعا.",
  "Sweet Chili Sauce": "صوص تشيلي حلو",
  "Sriracha Sauce": "صوص سريراتشا",
  "Soy Sauce": "صوص الصويا",
  "Light Soy Sauce": "صوص صويا لايت",
  "Dark Soy Sauce": "صوص صويا داكن",
  "Teriyaki Sauce": "صوص ترياكي",
  "Sushi Kit": "طقم تحضير السوشي",
  "Sushi Nori": "نوري السوشي",
  "Udon Noodles": "نودلز أودون",
  "Panko Bread Crumbs": "بقسماط بانكو",
  "Chicken Dumplings": "دامبلنج دجاج",
  "Beef Baozi": "باوزي لحم",
  "Chicken Baozi": "باوزي دجاج",
  "Pickled Ginger": "زنجبيل مخلل",
  "Zumra Pickled Ginger": "زنجبيل مخلل زومرا",
  "Zumra Premium Soy Sauce": "صوص صويا زومرا بريميوم",
  "Zumra Sushi Nori أوراق": "أوراق نوري السوشي زومرا",
  "Zumra Sushi Nori Sheets": "أوراق نوري السوشي زومرا",
  "Zumra Sushi Vinegar": "خل السوشي زومرا",
  "Samyang Cream Carbonara Ramen": "رامن ساميانج كاربونارا كريمي",
  "Samyang Hot Cheese Ramen": "رامن ساميانج حار بالجبنة",
  "Samyang Hot Chicken Ramen": "رامن ساميانج دجاج حار",
  "Jjajang Ramen": "رامن جاجانج",
  "Noodles Ingredients": "مكونات النودلز",
  "Soup Ingredients": "مكونات الشوربة",
  "Powder Ingredients": "مكونات البودرة",
  "Why You'll Love This Sushi Mat": "لماذا ستفضل حصيرة السوشي هذه",
  "Why You'll Love Samyang Hot Chicken Ramen": "لماذا ستفضل رامن ساميانج دجاج حار",
  "Why You'll Love Samyang Hot Cheese Ramen": "لماذا ستفضل رامن ساميانج حار بالجبنة",
  "Why You'll Love Jjajang Ramen": "لماذا ستفضل رامن جاجانج",
  "Why You'll Love Habanero Lime Ramen": "لماذا ستفضل رامن هابانيرو لايم",
  "Why You'll Love Chicken Baozi": "لماذا ستفضل باوزي الدجاج",
  "Why You'll Love Beef Baozi": "لماذا ستفضل باوزي اللحم",
  "Why You'll Love AMR Sweet Corn": "لماذا ستفضل الذرة الحلوة AMR",
  "Why You'll Love Yopokki Spicy Rice Cakes": "لماذا ستفضل كعك الأرز الكوري الحار Yopokki",
  "Looking for more fiery ramen? Try": "تبحث عن رامن أكثر حرارة؟ جرب",
  "Looking for more baozi flavors? Try": "تبحث عن نكهات باوزي أخرى؟ جرب",
  "Looking for more baozi flavors? Try it with": "تبحث عن نكهات باوزي أخرى؟ جربه مع",
  "Looking for more essential sauces?": "تبحث عن صوصات أساسية أخرى؟",
  "Want more spicy adventures? Try": "تريد تجربة حارة أكثر؟ جرب",
  "Want to create the full experience? Pair with": "تريد تجربة كاملة؟ قدمه مع",
  "Pair it with flavorful sauces like": "قدمه مع صوصات غنية مثل",
  "Pair it with ready-to-use sauces like": "قدمه مع صوصات جاهزة للاستخدام مثل",
  "Pair it with the": "قدمه مع",
  "Pair them with Asian-style meals like": "قدمها مع وجبات آسيوية مثل",
  "Pair with": "قدمه مع",
  "Pair with dipping sauces like": "قدمه مع صوصات تغميس مثل",
  "Perfect with dipping sauces like": "مثالي مع صوصات تغميس مثل",
  "Complete your sushi setup with": "أكمل تجهيزات السوشي مع",
  "Need another size? View the": "تحتاج مقاسا آخر؟ شاهد",
  "Build out your sauce shelf with": "أكمل مجموعة الصوصات لديك مع",
  "or enjoy a complete sushi-making experience with the": "أو استمتع بتجربة تحضير سوشي كاملة مع",
  "for a complete homemade sushi setup.": "لتجهيز سوشي منزلي متكامل.",
  "for a complete table setup.": "لتجهيز مائدة متكاملة.",
  "for the full experience.": "للحصول على التجربة الكاملة.",
  "for an authentic flavor boost.": "لإضافة نكهة أصيلة.",
  "for an unbeatable finish.": "للمسة نهائية لا تقاوم.",
  "from Zumra for the perfect pairing.": "من زومرا لتقديم مثالي.",
  ", for a complete sushi night at home.": "، لليلة سوشي متكاملة في البيت.",
  ", or complete your meal with": "، أو أكمل وجبتك مع",
  ", or your next": "، أو مع",
  ". Enjoy with": ". استمتع به مع",
  "Cook noodles for 5 minutes in boiling water": "اطه النودلز لمدة 5 دقائق في ماء مغلي",
  "Cook noodles for 5 minutes in boiling water.": "اطه النودلز لمدة 5 دقائق في ماء مغلي.",
  "Remove most of the water from noodles then add the sauce": "صف معظم ماء النودلز ثم أضف الصوص",
  "Remove most of the water, then add the sauce.": "صف معظم الماء، ثم أضف الصوص.",
  "Stir fry for 30 seconds then serve": "قلبها على النار لمدة 30 ثانية ثم قدمها",
  "Stir fry for 30 seconds and serve.": "قلبها على النار لمدة 30 ثانية وقدمها.",
  "1. Boil plenty of water (about 10 cups per 1 cup boba)": "1. اغلي كمية وفيرة من الماء (حوالي 10 أكواب ماء لكل كوب بوبا)",
  "2. Add boba and stir": "2. أضف حبيبات البوبا وقلب",
  "3. Let them boil for 20 minutes, stirring occasionally": "3. اتركها تغلي لمدة 20 دقيقة مع التقليب من وقت لآخر",
  "4. Drain and rinse with cold water": "4. صفها واشطفها بالماء البارد",
  "5. Enjoy fresh for the best texture": "5. استمتع بها طازجة للحصول على أفضل قوام",
  "Keep in an airtight container": "احفظها في عبوة محكمة الغلق",
  "Store in a cool, dry place (do not refrigerate)": "تخزن في مكان بارد وجاف، ولا توضع في الثلاجة",
  "Smoked salmon is already cooked so it doesn't need any further cooking. It can be consumed straight off the package or can be served as slices on toast with cream cheese, in making sushi, or can be included in salads.": "السلمون المدخن مطهو بالفعل ولا يحتاج إلى أي طهي إضافي. يمكن تناوله مباشرة من العبوة، أو تقديمه كشرائح على التوست مع الجبنة الكريمية، أو استخدامه في تحضير السوشي، أو إضافته إلى السلطات.",
  "Peeled shrimp can be easily included in any recipe as for their infinite uses, they can be prepared in many ways; broiled, grilled, boiled, or sauteed. Use peeled shrimp also in making shrimp pasta.": "يمكن استخدام الجمبري المقشر بسهولة في وصفات كثيرة بفضل تعدد استخداماته؛ يمكن تحضيره مشويا أو على الجريل أو مسلوقا أو سوتيه. كما يمكن استخدامه في تحضير مكرونة الجمبري.",
  "To prepare peeled shrimp, bring water to a boil. Once boiling, add shrimp and cook until it turns orange or pink in color. Then drain and let it cool. It is now ready to be used in any recipe.": "لتحضير الجمبري المقشر، اغلي الماء ثم أضف الجمبري واطهه حتى يتحول لونه إلى البرتقالي أو الوردي. صفه واتركه يبرد، ثم يصبح جاهزا للاستخدام في أي وصفة.",
  "Peeled and deveined shrimp": "جمبري مقشر ومنظف",
  "Large tapioca pearls": "حبيبات تابيوكا كبيرة",
  "Ready-to-cook dumplings with chicken filling": "دامبلنج جاهز للطهي بحشوة دجاج",
  "Ready-to-cook steamed buns": "خبز باوزي جاهز للطهي بالبخار",
  "Fresh vegetable mix": "خليط خضار طازج",
  "Fresh shrimp": "جمبري طازج",
  "Natural fine bamboo woven with cotton thread": "بامبو طبيعي ناعم منسوج بخيط قطني",
  "Gluten-free, low fat, high fiber": "خال من الجلوتين، قليل الدهون، غني بالألياف",
  "Filled with fresh, flavorful chicken": "محشو بدجاج طازج وغني بالنكهة",
  "Authentic chewy dumpling dough": "عجينة دامبلنج أصلية بقوام مطاطي",
  "Easy to steam, pan-fry, or boil": "سهل التحضير بالبخار أو التحمير في المقلاة أو السلق",
  "Soft and fluffy dough filled with savory chicken": "عجينة طرية وهشة محشوة بدجاج شهي",
  "Soft and fluffy dough filled with juicy beef": "عجينة طرية وهشة محشوة بلحم غني بالعصارة",
  "Nutritious and flavorful - a perfect balance of protein and taste": "مغذ ومليء بالنكهة بتوازن مثالي بين البروتين والطعم",
  "Comes in a pack of 4 pieces, ideal for sharing or enjoying solo": "يأتي في عبوة من 4 قطع، مناسب للمشاركة أو للاستمتاع به بمفردك",
  "Best served with soy sauce for an authentic touch": "يفضل تقديمه مع صوص الصويا للمسة أصيلة",
  "With Chicken baozi, you'll get a hearty and wholesome snack that's both delicious and easy to prepare.": "مع باوزي الدجاج تحصل على سناك مشبع ولذيذ وسهل التحضير.",
  "With Beef baozi, you get a comforting and hearty bite of traditional Chinese street food right at your table.": "مع باوزي اللحم تحصل على لقمة دافئة ومشبعة من أجواء أكل الشارع الصيني على مائدتك.",
  "Chicken baozi - authentic Chinese steamed buns with fluffy dough and a savory chicken filling. A hearty, delicious bite of traditional Asian street food.": "باوزي دجاج: خبز صيني مطهو بالبخار بعجينة هشة وحشوة دجاج شهية. لقمة مشبعة ولذيذة من أكل الشارع الآسيوي التقليدي.",
  "Beef baozi - authentic Chinese steamed buns with soft dough and a savory beef filling. A comforting, flavorful bite of traditional Asian street food.": "باوزي لحم: خبز صيني مطهو بالبخار بعجينة طرية وحشوة لحم شهية. لقمة دافئة وغنية بالنكهة من أكل الشارع الآسيوي التقليدي.",
  "Traditional Asian-style soft buns": "خبز طري على الطريقة الآسيوية التقليدية",
  "Packed with fresh veggies for a wholesome, flavorful bite": "محشو بخضار طازجة للقمة غنية وصحية",
  "Great with dipping sauces like Soy Sauce, Sriracha Sauce, or Sweet Chili Sauce": "رائع مع صوصات التغميس مثل صوص الصويا أو سريراتشا أو التشيلي الحلو",
  "Packed with juicy shrimp and savory seasoning": "محشو بجمبري غني بالعصارة وتتبيلة شهية",
  "Ideal with dipping sauces like soy, chili, or sesame": "مثالي مع صوصات التغميس مثل الصويا أو التشيلي أو السمسم",
  "Perfect as a snack, appetizer, or part of a full meal, Zumra Beef Dumplings bring rich flavor and comforting texture to any occasion.": "مثالي كسناك أو مقبلات أو جزء من وجبة كاملة، دامبلنج اللحم من زومرا يضيف نكهة غنية وقواما مريحا لأي مناسبة.",
  "Perfect for vegetarians or anyone craving a plant-based Asian treat, Zumra Vegetable Dumplings deliver taste, texture, and convenience in every bite.": "مثالي للنباتيين أو لكل من يرغب في لقمة آسيوية نباتية، دامبلنج الخضار من زومرا يقدم الطعم والقوام والسهولة في كل قطعة.",
  "Stays crispy longer - doesn't get soggy after cooking": "يبقى مقرمشا لفترة أطول ولا يصبح طريا بعد الطهي",
  "Perfect for frying chicken, shrimp, or onion rings": "مثالي لقلي الدجاج أو الجمبري أو حلقات البصل",
  "Adds a crunchy topping to casseroles, gratins, and baked pasta": "يضيف طبقة مقرمشة للطواجن والغراتان والمكرونة المخبوزة",
  "Versatile and easy to use in everyday recipes": "متعدد الاستخدامات وسهل في الوصفات اليومية",
  "Coat chicken or cutlets before frying for a crunchy crust": "غلف الدجاج أو الشرائح قبل القلي للحصول على طبقة مقرمشة",
  "Mix into meatballs for a better, firmer texture": "اخلطه مع كرات اللحم للحصول على قوام أفضل وأكثر تماسكا",
  "Sprinkle over pasta or Vegetable Baozi before baking for added crisp": "رشه فوق المكرونة أو باوزي الخضار قبل الخبز لإضافة قرمشة",
  "1- Use breadcrumbs to bread cutlets and chicken for a crunchy taste.": "1- استخدم البقسماط لتغليف الشرائح والدجاج للحصول على طعم مقرمش.",
  "2- Add to meatballs for better texture": "2- أضفه إلى كرات اللحم للحصول على قوام أفضل",
  "3- Sprinkle on top of pasta and gratin to make a crunchy layer.": "3- رشه فوق المكرونة والغراتان لتكوين طبقة مقرمشة.",
  "Texture: Light, airy, and extra crispy": "القوام: خفيف وهش ومقرمش جدا",
  "Wheat flour, yeast, oil, salt": "دقيق قمح، خميرة، زيت، ملح",
  "wheat flour": "دقيق قمح",
  "modified tapioca starch": "نشا تابيوكا معدل",
  "refined palm oil": "زيت نخيل مكرر",
  "modified potato starch": "نشا بطاطس معدل",
  "refined salt": "ملح مكرر",
  "citric acid": "حمض الستريك",
  "green tea flavor oil": "زيت بنكهة الشاي الأخضر",
  "artificial chicken flavor powder": "بودرة نكهة دجاج صناعية",
  "soy sauce": "صوص صويا",
  "white sugar": "سكر أبيض",
  "red pepper powder": "بودرة فلفل أحمر",
  "chili pepper powder": "بودرة فلفل حار",
  "soybean oil": "زيت فول الصويا",
  "red pepper seed oil": "زيت بذور الفلفل الأحمر",
  "paprika extract": "مستخلص بابريكا",
  "decolorized chili extract": "مستخلص تشيلي منزوع اللون",
  "black pepper powder": "بودرة فلفل أسود",
  "garlic powder": "بودرة ثوم",
  "milk powder": "حليب بودرة",
  "mozzarella cheese powder": "بودرة جبنة موزاريلا",
  "pepper powder": "بودرة فلفل",
  "Cook noodles for 5 minutes in boiling water.": "اطه النودلز لمدة 5 دقائق في ماء مغلي.",
  "Made from premium wheat flour for thick and chewy noodles": "مصنوع من دقيق قمح ممتاز لنودلز سميكة ومطاطية",
  "Intense hot chicken flavor with a rich, savory soup base": "نكهة دجاج حار قوية مع قاعدة شوربة غنية وشهية",
  "Easy to cook - ready in just minutes": "سهل التحضير وجاهز خلال دقائق",
  "A 140 جم pack that satisfies your biggest cravings": "عبوة 140 جم تشبع رغبتك في وجبة قوية",
  "Crafted with quality ingredients like soy sauce, garlic, pepper, sesame, and a special chicken curry base, Samyang Hot Chicken delivers a balanced yet fiery taste.": "محضر بمكونات عالية الجودة مثل صوص الصويا والثوم والفلفل والسمسم وقاعدة كاري دجاج خاصة، ليمنحك رامن ساميانج دجاج حار بطعم متوازن وقوي الحرارة.",
  "Made with premium wheat flour noodles - thicker and chewier than regular ramen": "مصنوع من نودلز بدقيق قمح ممتاز، أكثر سماكة ومطاطية من الرامن العادي",
  "Unique blend of hot chicken spice and smooth, cheesy flavor": "مزيج مميز من توابل الدجاج الحار ونكهة جبنة ناعمة",
  "Easy to prepare - ready in just minutes for a quick, hearty meal": "سهل التحضير وجاهز خلال دقائق لوجبة سريعة ومشبعة",
  "Perfect 140 جم serving size, ideal for a filling lunch or late-night craving": "حصة 140 جم مثالية لغداء مشبع أو وجبة ليلية",
  "Whether you enjoy it as it is or elevate it with toppings like eggs, vegetables, or grilled chicken, Samyang Hot Cheese guarantees a mouthwatering Korean ramen experience.": "سواء تناولته كما هو أو أضفت إليه البيض أو الخضار أو الدجاج المشوي، يمنحك رامن ساميانج الحار بالجبنة تجربة رامن كورية شهية.",
  "Combines the authentic taste of Korean black bean with a spicy kick": "يجمع بين طعم الفاصوليا السوداء الكورية الأصيلة ولمسة حارة",
  "Premium-quality jjajang ramen made with chewy, thick noodles": "رامن جاجانج بجودة ممتازة ونودلز سميكة ومطاطية",
  "Bursting with flavor - sweet, savory, and perfectly balanced": "مليء بالنكهة، حلو ومالح بتوازن ممتاز",
  "Easy to prepare in minutes for a comforting, satisfying meal": "سهل التحضير خلال دقائق لوجبة دافئة ومشبعة",
  "A must-try for ramen lovers who enjoy rich sauces and bold tastes": "اختيار يستحق التجربة لمحبي الرامن والصوصات الغنية والنكهات القوية",
  "Jjajang ramen - spicy Samyang hot chicken noodles mixed with deep, savory Korean black bean sauce. Thick, chewy noodles and bold flavor ready in minutes.": "رامن جاجانج: نودلز ساميانج دجاج حار ممزوجة بصوص الفاصوليا السوداء الكوري الغني. نودلز سميكة ومطاطية ونكهة قوية جاهزة خلال دقائق.",
  "With 2,600 SHU of heat, jjajang ramen delivers the perfect punch - spicy enough to excite, but rich enough to keep you craving more. Whether you enjoy it solo or with your favorite toppings, this jjajang ramen will transport your taste buds straight to Korea.": "بدرجة حرارة 2600 SHU، يمنحك رامن جاجانج حرارة متوازنة: حار بما يكفي للإثارة وغني بما يكفي لتكرار التجربة. سواء تناولته وحده أو مع إضافاتك المفضلة، ينقلك هذا الرامن مباشرة إلى نكهات كوريا.",
  "Made with high-quality, chewy noodles that soak up every bit of flavor": "مصنوع من نودلز عالية الجودة ومطاطية تمتص النكهة بالكامل",
  "Combines spicy habanero heat with a tangy habanero lime twist": "يجمع حرارة الهابانيرو الحارة مع لمسة لايم منعشة",
  "Bold, zesty, and satisfying - a must-try for ramen enthusiasts": "نكهة قوية ومنعشة ومشبعة تستحق التجربة لمحبي الرامن",
  "Quick and easy to prepare, perfect for a cozy meal or a spicy snack": "سريع وسهل التحضير ومناسب لوجبة دافئة أو سناك حار",
  "Signature Samyang intensity with a refreshing habanero lime edge": "حدة ساميانج المعروفة مع لمسة هابانيرو لايم منعشة",
  "Savor the ultimate flavor fusion of spice and zest with habanero lime - the ramen that awakens your taste buds and keeps you coming back for more.": "استمتع بمزيج قوي من الحرارة والانتعاش مع هابانيرو لايم، رامن يوقظ الحواس ويجعلك ترغب في المزيد.",
  "Habanero lime - Samyang's fiery ramen combining intense habanero heat with a fresh lime kick. Chewy noodles, bold flavor, and a perfect spicy-zesty balance.": "هابانيرو لايم: رامن ساميانج الناري الذي يجمع حرارة الهابانيرو القوية مع لمسة لايم منعشة. نودلز مطاطية ونكهة جريئة وتوازن رائع بين الحار والمنعش.",
  "curry powder": "بودرة كاري",
  "whole milk powder": "حليب كامل الدسم بودرة",
  "butter powder": "بودرة زبدة",
  "curly parsley": "بقدونس مجعد",
  "Remove most of the water then add the sauce": "صف معظم الماء ثم أضف الصوص",
  "Stir fry for 30 seconds and serve": "قلبها على النار لمدة 30 ثانية وقدمها",
  "A 140 gm pack that satisfies your biggest cravings": "عبوة 140 جم تشبع رغبتك في وجبة قوية",
  "Perfect 140 gm serving size, ideal for a filling lunch or late-night craving": "حصة 140 جم مثالية لغداء مشبع أو وجبة ليلية",
  "Samyang Hot Chicken": "ساميانج دجاج حار",
  "Chicken baozi": "باوزي دجاج",
  "Vegetable Dumplings": "دامبلنج خضار",
  "Beef Dumplings": "دامبلنج لحم",
  "Shrimp Dumplings": "دامبلنج جمبري",
  "Tteokbokki Rice Cakes": "كعك أرز تيوكبوكي",
  "Sushi Rice": "أرز السوشي",
  "Rice Paper": "ورق أرز",
  "Crab Sticks": "أصابع كابوريا",
  "Zumra Sushi Kit": "طقم تحضير السوشي زومرا",
  "Bamboo Sushi Rolling Mat - 24*24 cm": "حصيرة بامبو للف السوشي - 24*24 سم",
  "Bamboo Sushi Rolling Mat - 27 cm": "حصيرة بامبو للف السوشي - 27 سم",
  "Whether you're hosting a dinner, craving comfort food, or prepping a quick lunch, Zumra Chicken Dumplings deliver flavor, texture, and authenticity in every bite.": "سواء كنت تستضيف عشاء أو ترغب في وجبة مريحة أو تحضر غداء سريعا، يقدم دامبلنج الدجاج من زومرا النكهة والقوام والأصالة في كل قطعة.",
  "Versatile cooking methods - air fry, pan fry, or steam for different textures": "طرق تحضير متعددة: في القلاية الهوائية أو المقلاة أو بالبخار للحصول على قوامات مختلفة",
  "Steam for a classic, pillowy-soft texture": "حضره بالبخار للحصول على قوام كلاسيكي طري وهش",
  "Air fry or pan fry for a crispier finish": "حضره في القلاية الهوائية أو المقلاة للحصول على لمسة مقرمشة",
  "Complete your meal with": "أكمل وجبتك مع",
  "Ready-to-cook dumplings with beef filling": "دامبلنج جاهز للطهي بحشوة لحم",
  "Ready-to-cook dumplings with vegetable filling": "دامبلنج جاهز للطهي بحشوة خضار",
  "Ready-to-cook dumplings": "دامبلنج جاهز للطهي",
  "steam, boil, or pan-fry": "بالبخار أو السلق أو التحمير في المقلاة",
  "Stuffed with flavorful, tender beef": "محشو بلحم طري وغني بالنكهة",
  "Quick to prepare: steam, boil, or pan-fry": "سريع التحضير: بالبخار أو السلق أو التحمير في المقلاة",
  "Delicious when served with": "لذيذ عند تقديمه مع",
  "Complete your dumpling night with": "أكمل ليلة الدامبلنج مع",
  "Stuffed with a fresh mix of seasoned vegetables": "محشو بخليط طازج من الخضار المتبلة",
  "Soft, chewy dough for that authentic bite": "عجينة طرية ومطاطية للقمة أصيلة",
  "Want to try more? Check out": "تريد تجربة المزيد؟ شاهد",
  "Soft and chewy dough with a satisfying bite": "عجينة طرية ومطاطية بقوام مشبع",
  "Quick and easy to prepare by steaming, boiling, or pan-frying": "سريع وسهل التحضير بالبخار أو السلق أو التحمير في المقلاة",
  "Whether you're recreating your favorite street food experience or exploring new flavors, Zumra Shrimp Dumplings deliver authentic Asian delight in every bite.": "سواء كنت تعيد تجربة أكل الشارع المفضلة لديك أو تكتشف نكهات جديدة، يقدم دامبلنج الجمبري من زومرا متعة آسيوية أصيلة في كل قطعة.",
  "Complete the experience with": "أكمل التجربة مع",
  "25 bamboo chopsticks": "25 زوج عيدان بامبو",
  "5 easy-use helpers / training aids": "5 أدوات مساعدة سهلة الاستخدام للتدريب",
  "Made of natural bamboo - lightweight, durable, and eco-friendly": "مصنوعة من بامبو طبيعي خفيف ومتين وصديق للبيئة",
  "Designed for one-time use - hygienic and convenient": "مصممة للاستخدام مرة واحدة، صحية وعملية",
  "Comes with helper attachments for easier grip and learning": "تأتي مع أدوات مساعدة لتسهيل الإمساك والتعلم",
  "Perfect for sushi, noodles, dumplings, or rice dishes": "مثالية للسوشي والنودلز والدامبلنج وأطباق الأرز",
  "How to Use Chopsticks": "طريقة استخدام عيدان الطعام",
  "Hold the bottom chopstick between your thumb and ring finger": "أمسك العود السفلي بين الإبهام والبنصر",
  "Place the second chopstick between your thumb and index/middle finger": "ضع العود الثاني بين الإبهام والسبابة أو الوسطى",
  "Keep the bottom chopstick steady": "حافظ على ثبات العود السفلي",
  "Move the top chopstick up and down to grab food": "حرك العود العلوي لأعلى وأسفل لالتقاط الطعام",
  "Practice makes perfect - or use the included helper": "الممارسة تجعل الاستخدام أسهل، ويمكنك استخدام الأداة المساعدة المرفقة",
  "Enjoy them with": "استمتع بها مع",
  "Natural fine bamboo provides a smooth, reliable rolling surface": "يوفر البامبو الطبيعي الناعم سطحا سلسا وموثوقا للف",
  "Cotton-thread weave gives the mat flexibility and control": "يمنح نسيج الخيط القطني الحصيرة مرونة وتحكما أفضل",
  "Ideal for homemade maki rolls, sushi nights, and beginner practice": "مثالية لرولات الماكي المنزلية وليالي السوشي وتدريب المبتدئين",
  "Easy to pair with nori sheets, sushi vinegar, rice, and dipping sauces": "سهلة الاستخدام مع أوراق النوري وخل السوشي والأرز وصوصات التغميس",
  "1. Lay out your bamboo mat with a piece of plastic wrap on top (optional)": "1. افرد حصيرة البامبو وضع فوقها قطعة تغليف بلاستيكي إذا رغبت",
  "2. Make sure that the dried seaweed (nori) has its rough side facing upward.": "2. تأكد أن الجانب الخشن من ورقة النوري متجه لأعلى.",
  "3. Spread rice evenly over the nori while leaving space at the top and bottom of the sheet.": "3. افرد الأرز بالتساوي فوق النوري مع ترك مساحة أعلى وأسفل الورقة.",
  "4. Start rolling while lightly pressing on the mat to make a perfect tight roll": "4. ابدأ اللف مع الضغط برفق على الحصيرة للحصول على رول متماسك",
  "Sweet, thinly sliced ginger marinated in a solution of sugar and vinegar.": "زنجبيل حلو مقطع شرائح رفيعة ومخلل في محلول من السكر والخل.",
  "Use it alongside homemade sushi preparations": "استخدمه بجانب تحضيرات السوشي المنزلية",
  "Chop and add to stir-fried dishes": "قطعه وأضفه إلى أطباق الستير فراي",
  "Pour the brine into noodle sauces for rich flavor": "أضف محلول التخليل إلى صوصات النودلز لنكهة غنية",
  "Why You'll Love Zumra Sushi Vinegar": "لماذا ستفضل خل السوشي زومرا",
  "Balanced sweet and tangy flavor": "نكهة متوازنة بين الحلاوة والحموضة",
  "Ideal for seasoning sushi rice": "مثالي لتتبيل أرز السوشي",
  "Easy to use for beginners and professionals": "سهل الاستخدام للمبتدئين والمحترفين",
  "Perfect for sushi, salads, and light dressings": "مثالي للسوشي والسلطات والتتبيلات الخفيفة",
  "Naturally gluten-free, low in fat, and high in fiber, this kimchi is a delicious and healthy addition to rice, noodles, soups, or even enjoyed on its own.": "هذا الكيمتشي خال طبيعيا من الجلوتين وقليل الدهون وغني بالألياف، وهو إضافة صحية ولذيذة للأرز والنودلز والشوربة أو حتى للاستمتاع به وحده.",
  "Korean pickled cabbage": "ملفوف كوري مخلل",
  "Authentic Korean flavor with a spicy kick": "نكهة كورية أصيلة مع لمسة حارة",
  "Made from cabbage, chili, and fish sauce": "مصنوع من الملفوف والتشيلي وصوص السمك",
  "Rich in probiotics and fiber": "غني بالبروبيوتيك والألياف",
  "Perfect with rice, Udon Noodles, soups, or Baozi": "مثالي مع الأرز ونودلز أودون والشوربة أو الباوزي",
  "Veggies Baozi": "باوزي خضار",
  "Thin, flexible sheets ideal for rolling": "أوراق رفيعة ومرنة مثالية للف",
  "Neutral flavor that lets your fillings shine": "نكهة حيادية تبرز طعم الحشوات",
  "Perfect for fresh rolls, fried rolls, or even dessert wraps": "مثالي للرولات الطازجة أو المقلية أو حتى لفائف الحلويات",
  "Easy to use - just soak, fill, and roll": "سهل الاستخدام: انقعه ثم احشه ولفه",
  "Whether you're preparing refreshing veggie rolls or wrapping up shrimp and noodles, Zumra Rice Paper helps you create beautiful, healthy meals in minutes.": "سواء كنت تحضر رولات خضار منعشة أو تلف الجمبري والنودلز، يساعدك ورق الأرز من زومرا على تحضير وجبات جميلة وصحية في دقائق.",
  "Zumra Sushi Nori - 10 Sheet": "نوري السوشي زومرا - 10 أوراق",
  "Toasted Nori (Seaweed)": "نوري محمص (أعشاب بحرية)",
  "Authentic flavor and aroma for real Japanese & Korean cuisine": "نكهة ورائحة أصيلة للمطبخ الياباني والكوري",
  "Lightly toasted for improved texture and rollability": "محمص بخفة لقوام أفضل وسهولة في اللف",
  "Perfect sheet size for sushi beginners or quick meals": "مقاس ورقة مثالي للمبتدئين أو الوجبات السريعة",
  "Resealable pack ideal for casual use or testing new recipes": "عبوة قابلة لإعادة الغلق مناسبة للاستخدام الخفيف أو تجربة وصفات جديدة",
  "Lightly microwave the nori sheet to enhance aroma and crunch": "سخن ورقة النوري قليلا في الميكروويف لتعزيز الرائحة والقرمشة",
  "Gently rub a bit of sesame oil for extra flavor": "ادهنها برفق بقليل من زيت السمسم لنكهة إضافية",
  "Spread sushi rice and your choice of fillings, then roll or shape": "افرد أرز السوشي والحشوات المفضلة لديك ثم لفها أو شكلها",
  "Make your favorite norisushi recipes at home with ease - from classic maki to rice balls and more.": "حضّر وصفات النوري والسوشي المفضلة لديك في البيت بسهولة، من الماكي الكلاسيكي إلى كرات الأرز وأكثر.",
  "Light, airy, and extra crispy": "خفيف وهش ومقرمش جدا",
  "Realistic crab texture with rich, savory flavor": "قوام قريب من الكابوريا مع نكهة غنية وشهية",
  "Made with high-quality 45% surimi for a premium experience": "مصنوع من سوريمي عالي الجودة بنسبة 45% لتجربة مميزة",
  "Perfect for homemade sushi preparation, salads, sandwiches, or enjoyed on their own": "مثالي لتحضير السوشي المنزلي والسلطات والسندويتشات أو تناوله كما هو",
  "Quick, convenient, and protein-rich": "سريع وعملي وغني بالبروتين",
  "From sushi nights to fresh salads or quick snacks, Zumra Crab Sticks are the flavorful, ready-to-use ingredient your kitchen needs.": "من ليالي السوشي إلى السلطات الطازجة أو السناك السريع، أصابع الكابوريا من زومرا مكون جاهز ولذيذ يحتاجه مطبخك.",
  "Soy sauce (water, salt, soybean, wheat flour), caramel color, sugar, potassium sorbate added as a preservative, disodium 5-Inosinate and disodium 5-Guanylate as flavor enhancers.": "صوص صويا (ماء، ملح، فول صويا، دقيق قمح)، لون كراميل، سكر، سوربات بوتاسيوم كمادة حافظة، ديسوديوم 5-إينوسينات وديسوديوم 5-جوانيلات كمحسنات نكهة.",
  "Naturally brewed for premium taste and aroma": "مخمر طبيعيا لطعم ورائحة مميزين",
  "Thick, dark texture ideal for enhancing sauces and glazes": "قوام داكن وسميك مثالي لتعزيز الصوصات والتلميع",
  "Adds deep umami flavor to both Asian and Western meals": "يضيف نكهة أومامي عميقة للأكلات الآسيوية والغربية",
  "Small bottle - perfect for home cooks or table use": "زجاجة صغيرة مثالية للطبخ المنزلي أو الاستخدام على المائدة",
  "Naturally brewed for a deep, well-rounded flavor": "مخمر طبيعيا لنكهة عميقة ومتوازنة",
  "Ideal for marinades, stir-fries, and dipping sauces": "مثالي للتتبيلات والستير فراي وصوصات التغميس",
  "Balanced saltiness that complements a wide range of dishes": "ملوحة متوازنة تناسب مجموعة واسعة من الأطباق",
  "Perfect for both traditional Asian cuisine and everyday meals": "مثالي للمطبخ الآسيوي التقليدي والوجبات اليومية",
  "Zumra Light Soy Sauce is your go-to kitchen essential for adding authentic taste and umami to every bite.": "صوص صويا زومرا لايت من أساسيات المطبخ لإضافة طعم أصيل وأومامي لكل لقمة.",
  "Light soy sauce is extremely versatile in all sorts of cooking. It is widely used in cold appetizers, stir-fry dishes, soups, stews, dipping sauces, and marinades.": "صوص الصويا اللايت متعدد الاستخدامات في أنواع كثيرة من الطبخ، ويستخدم في المقبلات الباردة وأطباق الستير فراي والشوربة واليخنات وصوصات التغميس والتتبيلات.",
  "It can be used to add color and flavor to dishes when needed. Add it at the beginning of cooking when preparing Asian recipes.": "يمكن استخدامه لإضافة اللون والنكهة للأطباق عند الحاجة. أضفه في بداية الطبخ عند تحضير الوصفات الآسيوية.",
  "\"Kecap Manis\" is a sweet Indonesian soy sauce with a syrupy consistency. It adds sweetness, powerful color, and rich soy flavor.": "\"كيكاب مانيس\" هو صوص صويا إندونيسي حلو بقوام شرابي، يضيف حلاوة ولونا قويا ونكهة صويا غنية.",
  "Use it in recipes such as:": "استخدمه في وصفات مثل:",
  "Fried rice": "أرز مقلي",
  "Chicken marinades": "تتبيلات الدجاج",
  "Stir-fries": "أطباق ستير فراي",
  "Dipping sauces": "صوصات تغميس",
  "Kikkoman soy sauce makes a brilliant glaze for roasted or pan-fried meat, fish, and vegetables. It adds shine as well as a deep, savory flavor.": "يصنع صوص صويا كيكومان طبقة تلميع رائعة للحوم والأسماك والخضار المشوية أو المحمرة في المقلاة، ويضيف لمعانا ونكهة عميقة وشهية.",
  "Try mixing equal amounts with honey or maple syrup, brush it onto meat, then return it briefly to the oven to caramelize.": "جرب خلطه بكميات متساوية مع العسل أو شراب القيقب، وادهن به اللحم ثم أعده قليلا إلى الفرن ليتكرمل.",
  "It also works perfectly as a dipping sauce for sushi ingredients, dumplings, spring rolls, and Asian-style dishes.": "يعمل أيضا بشكل ممتاز كصوص تغميس لمكونات السوشي والدامبلنج والسبرينج رول والأطباق الآسيوية.",
  "Rich Japanese-style teriyaki with balanced sweet and savory notes. Versatile for marinades, glazing, stir-fries, and as a finishing sauce.": "ترياكي غني على الطريقة اليابانية بتوازن بين الحلاوة والملوحة. مناسب للتتبيل والتلميع والستير فراي وكصوص نهائي.",
  "Why You'll Love Zumra Teriyaki": "لماذا ستفضل ترياكي زومرا",
  "Authentic sweet-and-savory teriyaki balance": "توازن ترياكي أصيل بين الحلاوة والملوحة",
  "Great for marinades, grilled chicken, burgers, and stir-fries": "رائع للتتبيلات والدجاج المشوي والبرجر والستير فراي",
  "Adds depth to soups, casseroles, and sauces": "يضيف عمقا للشوربة والطواجن والصوصات",
  "Handy 150 ml bottle for everyday use": "زجاجة 150 مل عملية للاستخدام اليومي",
  "Marinate meats, tofu, or vegetables before grilling or baking": "تبل اللحوم أو التوفو أو الخضار قبل الشوي أو الخبز",
  "Brush as a glaze during grilling or roasting": "استخدمه كطبقة تلميع أثناء الشوي أو التحميص",
  "Stir into fried rice and stir-fries for instant seasoning": "أضفه إلى الأرز المقلي والستير فراي لتتبيل سريع",
  "Add a splash to soups or sauces for extra umami": "أضف قليلا منه للشوربة أو الصوصات لمزيد من الأومامي",
  "A versatile pantry staple that elevates everyday meals with authentic teriyaki flavor.": "أساسي متعدد الاستخدامات يرفع طعم الوجبات اليومية بنكهة ترياكي أصيلة.",
  "Water, sugar, starch, chili pepper, vinegar, garlic, xanthan E415, sweetener E951, E950, potassium sorbate": "ماء، سكر، نشا، فلفل تشيلي، خل، ثوم، زانثان E415، محليات E951 وE950، سوربات بوتاسيوم",
  "Use it as a dip or spread on toast and top with cheese before grilling.": "استخدمه كتغميسة أو افرده على التوست مع الجبن قبل الشوي.",
  "Mix a few tablespoons with cream cheese and stir into pasta.": "اخلط بضع ملاعق مع الجبنة الكريمية وأضفها إلى المكرونة.",
  "Pour over salmon fillets and cook in a foil bag for 20 minutes for a delicious sweet and spicy finish.": "اسكبه فوق شرائح السلمون واطهها في كيس فويل لمدة 20 دقيقة للمسة حلوة وحارة لذيذة.",
  "Smooth, thick chili sauce": "صوص تشيلي ناعم وسميك",
  "Medium to hot": "متوسط إلى حار",
  "Made from high-quality chili peppers": "مصنوع من فلفل تشيلي عالي الجودة",
  "Smooth, rich texture that clings perfectly to food": "قوام ناعم وغني يلتصق بالطعام بشكل ممتاز",
  "Versatile: great for cooking, dipping, or drizzling": "متعدد الاستخدامات: رائع للطبخ أو التغميس أو الإضافة فوق الطعام",
  "great for cooking, dipping, or drizzling": "رائع للطبخ أو التغميس أو الإضافة فوق الطعام",
  "Comes in an easy-to-use squeeze bottle for mess-free use": "يأتي في زجاجة ضغط سهلة الاستخدام دون فوضى",
  "Whether you're enhancing noodles, adding a kick to dumplings, or building your own spicy dipping sauce, Zumra Sriracha Sauce brings fire and flavor to your kitchen.": "سواء كنت تعزز طعم النودلز أو تضيف لمسة حارة للدامبلنج أو تحضر صوص تغميس حارا، يضيف صوص سريراتشا زومرا الحرارة والنكهة إلى مطبخك.",
  "Thick and creamy texture ideal for a wide range of recipes": "قوام سميك وكريمي مثالي لمجموعة واسعة من الوصفات",
  "Natural alternative to cow milk - lactose-free and vegan-friendly": "بديل طبيعي لحليب الأبقار، خال من اللاكتوز ومناسب للنباتيين",
  "Enhances the flavor of soups, curries, desserts, and smoothies": "يعزز نكهة الشوربة والكاري والحلويات والسموذي",
  "Made from real coconut for an authentic taste and consistency": "مصنوع من جوز هند حقيقي لطعم وقوام أصيلين",
  "Whether you're preparing Thai curry, creamy desserts, or plant-based smoothies, Zumra Creamy Coconut Milk delivers taste, texture, and quality in every drop.": "سواء كنت تحضر كاري تايلندي أو حلويات كريمية أو سموذي نباتي، يقدم حليب جوز الهند الكريمي من زومرا الطعم والقوام والجودة في كل قطرة.",
  "Use it to make juices, shakes, and ice cream": "استخدمه لتحضير العصائر والميلك شيك والآيس كريم",
  "Add it into cakes and bakeries as a substitute for dairy products": "أضفه إلى الكيك والمخبوزات كبديل لمنتجات الألبان",
  "Stir into soups and curries for a thick and smooth texture": "أضفه إلى الشوربة والكاري للحصول على قوام سميك وناعم",
  "Naturally sweet and tender kernels": "حبات طرية وحلوة بطبيعتها",
  "Rich in vitamins and antioxidants": "غنية بالفيتامينات ومضادات الأكسدة",
  "Perfect for salads, sandwiches, and side dishes": "مثالية للسلطات والسندويتشات والأطباق الجانبية",
  "Ready to use and easy to prepare": "جاهزة للاستخدام وسهلة التحضير",
  "Authentic Korean tteokbokki with chewy rice cakes": "تيوكبوكي كوري أصيل بكعك أرز مطاطي",
  "Bold, spicy flavor for a real street food experience": "نكهة قوية وحارة لتجربة أكل شارع حقيقية",
  "Quick and easy to prepare - ready in minutes": "سريع وسهل التحضير وجاهز خلال دقائق",
  "Convenient 120 gm pack, perfect for a snack or light meal": "عبوة 120 جم عملية ومثالية لسناك أو وجبة خفيفة",
  "Korean-style rice cakes (Tteok)": "كعك أرز على الطريقة الكورية (تيوك)",
  "Soft and chewy texture, just like traditional Korean tteok": "قوام طري ومطاطي مثل التيوك الكوري التقليدي",
  "Perfect for homemade spicy rice cake dishes": "مثالي لتحضير أطباق كعك الأرز الحارة في البيت",
  "Quick and easy to cook — ready in just a few steps": "سريع وسهل الطهي وجاهز في خطوات بسيطة",
  "Great for snacks, meals, or sharing the K-food experience with friends": "رائع كسناك أو وجبة أو لمشاركة تجربة الأكل الكوري مع الأصدقاء",
  "Add rice cakes and cook for 30–60 seconds": "أضف كعك الأرز واطهه لمدة 30-60 ثانية",
  "Drain and mix with your favorite tteokbokki sauce": "صفه واخلطه مع صوص التيوكبوكي المفضل لديك",
  "Stir well to coat and enjoy hot": "قلب جيدا حتى يتغطى بالصوص واستمتع به ساخنا",
  "Cook the rice cakes for 30–60 seconds": "اطه كعك الأرز لمدة 30-60 ثانية",
  "Drain the cakes and add them to the sauce": "صف كعك الأرز وأضفه إلى الصوص",
  "Mix well to coat evenly": "اخلط جيدا حتى يتغطى بالتساوي"
};

const COMPONENT_TRANSLATIONS_AR = {
  "Sushi Vinegar - 150 ml": "خل سوشي - 150 مل",
  "Zumra Premium Soy Sauce - 50 ml": "صوص صويا زومرا بريميوم - 50 مل",
  "He Shun Yuan Teriyaki Sauce - 50 ml": "صوص ترياكي هي شون يوان - 50 مل",
  "ZUMRA Wasabi - 4 Sachets": "واسابي زومرا - 4 أكياس",
  "Zumra Pickled Ginger - 150 gm": "زنجبيل مخلل زومرا - 150 جم",
  "Zumra Sushi Nori - 10 Sheets": "نوري السوشي زومرا - 10 أوراق",
  "Japanese Sushi Rice - 500 gm": "أرز سوشي ياباني - 500 جم",
  "Zumra Bamboo Chopsticks + Helpers - 3 pcs": "عيدان بامبو زومرا مع أدوات مساعدة - 3 قطع",
  "Bamboo Sushi Rolling Mat - 24 cm": "حصيرة بامبو للف السوشي - 24 سم",
  "Number of sheets: 10": "عدد الأوراق: 10"
};

const REPLACEMENTS_AR = [
  [/\b1 kg\b/gi, "1 كجم"],
  [/\bkg\b/gi, "كجم"],
  [/\bgm\b/gi, "جم"],
  [/\bml\b/gi, "مل"],
  [/\bcm\b/gi, "سم"],
  [/\bpcs\b/gi, "قطع"],
  [/\bPcs\b/g, "قطع"],
  [/\bPieces\b/g, "قطعة"],
  [/\bSheets\b/g, "أوراق"],
  [/\bSheet\b/g, "ورقة"]
];

function isArabic(language) {
  return language === "ar";
}

function hasArabicText(value) {
  return /[\u0600-\u06FF]/.test(String(value || ""));
}

function wrapLtrIsolate(value) {
  return `${LTR_ISOLATE}${value}${POP_ISOLATE}`;
}

function isolateMixedDirectionTitle(value, language) {
  const source = String(value || "").replace(BIDI_CONTROL_PATTERN, "");
  if (!isArabic(language) || !hasArabicText(source)) {
    return source;
  }

  const isolated = source
    .replace(MIXED_TITLE_BRAND_PATTERN, (match) => wrapLtrIsolate(match))
    .replace(MIXED_TITLE_QUANTITY_PATTERN, (match) => wrapLtrIsolate(match));

  return `${RTL_ISOLATE}${isolated}${POP_ISOLATE}`;
}

function getTranslation(productId, language) {
  if (!isArabic(language) || !productId) {
    return null;
  }

  return SUSHI_PRODUCT_TRANSLATIONS_AR[productId] || null;
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((copy, key) => {
      copy[key] = cloneValue(value[key]);
      return copy;
    }, {});
  }

  return value;
}

function hasDisplayValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getTextTranslation(source) {
  const value = String(source || "");
  return TEXT_TRANSLATIONS_AR[value] || TEXT_TRANSLATIONS_AR[value.trim()];
}

function translateUnits(value) {
  return REPLACEMENTS_AR.reduce((text, [pattern, replacement]) => {
    return text.replace(pattern, replacement);
  }, String(value || ""));
}

function getFallbackName(product) {
  return String(product?.name || product?.title || product?.id || product?.slug || FALLBACK_PRODUCT_NAME);
}

function getSafeImages(product) {
  const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
  return images.length ? images : [product?.image || FALLBACK_PRODUCT_IMAGE].filter(Boolean);
}

function translateComponent(component) {
  const source = String(component || "");
  return COMPONENT_TRANSLATIONS_AR[source] || getTextTranslation(source) || translateUnits(source);
}

function translateDetailValue(value, product, translation) {
  const source = String(value || "");

  if (DETAIL_VALUE_TRANSLATIONS_AR[source]) {
    return DETAIL_VALUE_TRANSLATIONS_AR[source];
  }

  if (
    source === product?.name
    || source === product?.longDescriptionTitle
    || source === product?.id
  ) {
    return translation?.name || source;
  }

  return COMPONENT_TRANSLATIONS_AR[source] || getTextTranslation(source) || translateUnits(source);
}

function normalizeLabelKey(label) {
  return String(label || "").trim().replace(/[:?]+$/g, "").toLowerCase();
}

function getTranslatedDetailValueForLabel(sourceLabel, translatedDetails) {
  if (!translatedDetails) {
    return undefined;
  }

  if (Array.isArray(translatedDetails)) {
    const match = translatedDetails.find((detail) => normalizeLabelKey(detail?.label) === normalizeLabelKey(sourceLabel));
    return hasDisplayValue(match?.value) ? match.value : undefined;
  }

  if (translatedDetails && typeof translatedDetails === "object") {
    const directKey = Object.keys(translatedDetails).find((key) => normalizeLabelKey(key) === normalizeLabelKey(sourceLabel));
    return directKey ? translatedDetails[directKey] : undefined;
  }

  return undefined;
}

function localizeItemDetails(product, translation, language) {
  const itemDetails = Array.isArray(product?.itemDetails) ? product.itemDetails : [];
  if (!itemDetails.length) {
    return [];
  }

  if (!isArabic(language)) {
    return cloneValue(itemDetails);
  }

  return itemDetails
    .filter((detail) => detail && detail.label && detail.value)
    .map((detail) => ({
      label: DETAIL_LABEL_TRANSLATIONS_AR[detail.label] || detail.label,
      value: translateDetailValue(detail.value, product, translation)
    }));
}

function normalizeTranslationItemDetails(translatedDetails, product, translation, language) {
  if (!hasDisplayValue(translatedDetails)) {
    return localizeItemDetails(product, translation, language);
  }

  const sourceDetails = Array.isArray(product?.itemDetails) ? product.itemDetails : [];
  if (!sourceDetails.length) {
    if (Array.isArray(translatedDetails)) {
      return cloneValue(translatedDetails);
    }

    return Object.keys(translatedDetails).map((label) => ({
      label,
      value: translatedDetails[label]
    }));
  }

  return sourceDetails
    .filter((detail) => detail && detail.label && detail.value)
    .map((detail, index) => {
      const translatedByLabel = getTranslatedDetailValueForLabel(detail.label, translatedDetails);
      const translatedByIndex = Array.isArray(translatedDetails) ? translatedDetails[index] : null;
      const value = hasDisplayValue(translatedByLabel)
        ? translatedByLabel
        : hasDisplayValue(translatedByIndex?.value)
          ? translatedByIndex.value
          : translateDetailValue(detail.value, product, translation);

      return {
        label: DETAIL_LABEL_TRANSLATIONS_AR[detail.label] || detail.label,
        value
      };
    });
}

function buildFallbackArabicDescriptionBlocks(displayProduct) {
  const intro = displayProduct.longDescriptionIntro || displayProduct.description;
  if (!intro) {
    return [];
  }

  return [
    {
      type: "paragraph",
      text: intro
    }
  ];
}

function translateDescriptionTitle(title, product, translation) {
  const source = String(title || "").trim();
  if (!source) {
    return source;
  }

  const normalized = normalizeLabelKey(source);
  if (DESCRIPTION_TITLE_TRANSLATIONS_AR[normalized]) {
    return DESCRIPTION_TITLE_TRANSLATIONS_AR[normalized];
  }

  const textTranslation = getTextTranslation(source);
  if (textTranslation) {
    return textTranslation;
  }

  if (normalized.startsWith("why choose")) {
    return `لماذا تختار ${translation?.name || product?.name || "هذا المنتج"}؟`;
  }

  return translateUnits(source);
}

function translateDescriptionListItem(item, product, translation) {
  const source = String(item || "");
  const separatorIndex = source.indexOf(":");

  if (separatorIndex > 0) {
    const label = source.slice(0, separatorIndex).trim();
    const value = source.slice(separatorIndex + 1).trim();
    const translatedLabel = DETAIL_LABEL_TRANSLATIONS_AR[label] || translateDescriptionTitle(label, product, translation);
    const translatedValue = translateDetailValue(value, product, translation);
    return `${translatedLabel}: ${translatedValue}`;
  }

  return DETAIL_VALUE_TRANSLATIONS_AR[source] || COMPONENT_TRANSLATIONS_AR[source] || getTextTranslation(source) || translateUnits(source);
}

function translateDescriptionSegment(segment, product, translation) {
  if (typeof segment === "string") {
    const source = segment;
    if (source.trim().toLowerCase() === "or") {
      return source.replace(/or/i, "أو");
    }
    return getTextTranslation(source) || translateUnits(source);
  }

  if (!segment || typeof segment !== "object") {
    return cloneValue(segment);
  }

  return {
    ...cloneValue(segment),
    text: translateDetailValue(segment.text, product, translation)
  };
}

function isCompatibleDescriptionBlock(sourceBlock, translatedBlock, product, translation) {
  if (!sourceBlock || !translatedBlock || sourceBlock.type !== translatedBlock.type) {
    return false;
  }

  if (!sourceBlock.title) {
    return true;
  }

  return String(translatedBlock.title || "").trim() === translateDescriptionTitle(sourceBlock.title, product, translation);
}

function localizeDescriptionBlock(sourceBlock, translatedBlock, product, translation) {
  const compatibleTranslation = isCompatibleDescriptionBlock(sourceBlock, translatedBlock, product, translation)
    ? translatedBlock
    : null;
  const localizedBlock = cloneValue(sourceBlock);

  if (sourceBlock.title) {
    localizedBlock.title = translateDescriptionTitle(sourceBlock.title, product, translation);
  }

  if (sourceBlock.type === "list") {
    const sourceItems = Array.isArray(sourceBlock.items) ? sourceBlock.items : [];
    const translatedItems = Array.isArray(compatibleTranslation?.items) ? compatibleTranslation.items : [];
    localizedBlock.items = sourceItems.map((item, index) => (
      hasDisplayValue(translatedItems[index])
        ? translatedItems[index]
        : translateDescriptionListItem(item, product, translation)
    ));
    return localizedBlock;
  }

  if (Array.isArray(sourceBlock.segments)) {
    const translatedSegments = Array.isArray(compatibleTranslation?.segments) ? compatibleTranslation.segments : [];
    localizedBlock.segments = sourceBlock.segments.map((segment, index) => (
      hasDisplayValue(translatedSegments[index])
        ? cloneValue(translatedSegments[index])
        : translateDescriptionSegment(segment, product, translation)
    ));
    return localizedBlock;
  }

  if (hasDisplayValue(compatibleTranslation?.text)) {
    localizedBlock.text = compatibleTranslation.text;
  } else if (sourceBlock.text) {
    localizedBlock.text = getTextTranslation(sourceBlock.text) || translateUnits(sourceBlock.text);
  }

  return localizedBlock;
}

function normalizeTranslationDescriptionBlocks(sourceBlocks, translatedBlocks, product, translation, language) {
  const safeSourceBlocks = Array.isArray(sourceBlocks) ? sourceBlocks.filter(Boolean) : [];

  if (!isArabic(language)) {
    return cloneValue(safeSourceBlocks);
  }

  if (!safeSourceBlocks.length) {
    return Array.isArray(translatedBlocks) && translatedBlocks.length ? cloneValue(translatedBlocks) : [];
  }

  const safeTranslatedBlocks = Array.isArray(translatedBlocks) ? translatedBlocks : [];
  return safeSourceBlocks.map((block, index) => localizeDescriptionBlock(block, safeTranslatedBlocks[index], product, translation));
}

function mergeTranslatedArrayByIndex(sourceArray, translatedArray, fallbackMapper = cloneValue) {
  if (Array.isArray(sourceArray) && sourceArray.length) {
    const safeTranslatedArray = Array.isArray(translatedArray) ? translatedArray : [];
    return sourceArray.map((item, index) => (
      hasDisplayValue(safeTranslatedArray[index]) ? cloneValue(safeTranslatedArray[index]) : fallbackMapper(item)
    ));
  }

  return hasDisplayValue(translatedArray) ? cloneValue(translatedArray) : cloneValue(sourceArray || []);
}

function mergeTranslatedField(displayProduct, translation, fieldName) {
  if (translation && hasDisplayValue(translation[fieldName])) {
    displayProduct[fieldName] = cloneValue(translation[fieldName]);
  }
}

export function getProductDisplayData(product, language = getLanguage()) {
  const source = product || {};
  const productId = String(source.id || source.slug || "");
  const translation = getTranslation(productId, language);
  const displayProduct = {
    ...source,
    id: productId,
    slug: String(source.slug || productId),
    name: getFallbackName(source),
    description: String(source.description || ""),
    category: String(source.category || ""),
    price: Number.isFinite(Number(source.price)) ? Number(source.price) : 0,
    images: getSafeImages(source)
  };

  if (Array.isArray(source.originalImages)) {
    displayProduct.originalImages = source.originalImages.filter(Boolean);
  }

  if (!translation) {
    return displayProduct;
  }

  [
    "name",
    "description",
    "longDescriptionTitle",
    "longDescriptionIntro",
    "storage",
    "whyChooseTitle",
    "storyTitle",
    "storyLead",
    "fullDescription"
  ].forEach((fieldName) => mergeTranslatedField(displayProduct, translation, fieldName));

  displayProduct.category = translation.category || CATEGORY_TRANSLATIONS_AR[source.category] || source.category || "";
  displayProduct.components = mergeTranslatedArrayByIndex(source.components, translation.components, translateComponent);
  displayProduct.ingredients = mergeTranslatedArrayByIndex(source.ingredients, translation.ingredients, (item) => translateUnits(item));
  displayProduct.howToUse = mergeTranslatedArrayByIndex(source.howToUse, translation.howToUse, (item) => translateUnits(item));
  displayProduct.storageInstructions = mergeTranslatedArrayByIndex(source.storageInstructions, translation.storageInstructions, (item) => translateUnits(item));
  displayProduct.whyChoose = mergeTranslatedArrayByIndex(source.whyChoose, translation.whyChoose, (item) => translateUnits(item));
  displayProduct.storyBlocks = normalizeTranslationDescriptionBlocks(source.storyBlocks, translation.storyBlocks, source, translation, language);
  displayProduct.descriptionBlocks = normalizeTranslationDescriptionBlocks(source.descriptionBlocks, translation.descriptionBlocks, source, translation, language);

  displayProduct.itemDetails = normalizeTranslationItemDetails(
    translation.itemDetails,
    source,
    translation,
    language
  );

  if (!hasDisplayValue(displayProduct.descriptionBlocks)) {
    displayProduct.descriptionBlocks = buildFallbackArabicDescriptionBlocks(displayProduct);
  }

  displayProduct.name = isolateMixedDirectionTitle(displayProduct.name || getFallbackName(source), language);
  if (displayProduct.longDescriptionTitle) {
    displayProduct.longDescriptionTitle = isolateMixedDirectionTitle(displayProduct.longDescriptionTitle, language);
  }
  displayProduct.description = displayProduct.description || source.description || "";
  displayProduct.images = getSafeImages(displayProduct);
  displayProduct.slug = displayProduct.slug || productId || displayProduct.id;

  return displayProduct;
}

export function getProductDisplayName(product, language = getLanguage()) {
  return getProductDisplayData(product, language).name;
}
