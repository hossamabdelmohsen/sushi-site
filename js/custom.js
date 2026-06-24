// to get current year
function getYear() {
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    document.querySelector("#displayYear").innerHTML = currentYear;
}

getYear();

function initStickyHeader() {
    var header = document.querySelector(".header_section");
    if (!header) {
        return;
    }

    var navbar = header.querySelector(".custom_nav-container");
    var root = document.documentElement;
    var syncHeaderHeight = function () {
        root.style.setProperty("--site-header-height", header.offsetHeight + "px");
    };
    var updateHeaderState = function () {
        var isScrolled = window.scrollY > 12;
        header.classList.toggle("is_scrolled", isScrolled);
        if (navbar) {
            navbar.classList.toggle("scrolled", isScrolled);
        }
    };

    var onScroll = function () {
        if (onScroll.ticking) {
            return;
        }

        onScroll.ticking = true;
        window.requestAnimationFrame(function () {
            updateHeaderState();
            onScroll.ticking = false;
        });
    };

    syncHeaderHeight();
    updateHeaderState();

    window.addEventListener("resize", syncHeaderHeight);
    window.addEventListener("scroll", onScroll, { passive: true });

    if (window.ResizeObserver) {
        var headerObserver = new ResizeObserver(function () {
            syncHeaderHeight();
        });
        headerObserver.observe(header);
    }
}

document.addEventListener("DOMContentLoaded", initStickyHeader);

function initCategoryPillHints() {
    var supportsReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var filterMenus = Array.prototype.slice.call(document.querySelectorAll(".food_section .filters_menu"));

    if (!filterMenus.length) {
        return;
    }

    filterMenus.forEach(function (menu) {
        if (!menu || menu.dataset.scrollHintReady === "true") {
            return;
        }

        menu.dataset.scrollHintReady = "true";

        var wrapper = menu.parentElement;
        if (!wrapper || !wrapper.classList.contains("category-pills-wrapper")) {
            wrapper = document.createElement("div");
            wrapper.className = "category-pills-wrapper";
            menu.parentNode.insertBefore(wrapper, menu);
            wrapper.appendChild(menu);
        }

        var pills = Array.prototype.slice.call(menu.querySelectorAll("li"));
        pills.forEach(function (pill, index) {
            pill.style.setProperty("--pill-stagger-index", String(index + 1));
        });

        menu.classList.add("pill-intro-ready");

        var updateScrollState = function () {
            var isAtEnd = menu.scrollLeft + menu.clientWidth >= menu.scrollWidth - 10;
            wrapper.classList.toggle("scrolled-end", menu.scrollWidth <= menu.clientWidth + 10 || isAtEnd);
        };

        var stopHintAnimations = function () {
            wrapper.classList.add("pill-has-interacted");
        };

        menu.addEventListener("scroll", updateScrollState, { passive: true });
        menu.addEventListener("pointerdown", stopHintAnimations, { passive: true, once: true });
        menu.addEventListener("keydown", stopHintAnimations, { once: true });
        window.addEventListener("resize", updateScrollState);
        pills.forEach(function (pill) {
            pill.addEventListener("click", stopHintAnimations);
        });

        updateScrollState();

        if (supportsReducedMotion || menu.scrollWidth <= menu.clientWidth + 24) {
            wrapper.classList.add("pill-has-interacted");
            return;
        }

        window.setTimeout(function () {
            if (wrapper.classList.contains("pill-has-interacted")) {
                return;
            }

            menu.scrollTo({ left: 120, behavior: "smooth" });

            window.setTimeout(function () {
                if (wrapper.classList.contains("pill-has-interacted")) {
                    return;
                }

                menu.scrollTo({ left: 0, behavior: "smooth" });
            }, 900);
        }, 800);
    });
}

document.addEventListener("DOMContentLoaded", initCategoryPillHints);

function initHeroCarousel() {
    var $heroCarousel = $("#customCarousel1");
    var resumeTimer = null;
    var resumeDelay = 2000;
    var interactionState = {
        hover: false,
        touch: false,
        focus: false
    };

    if (!$heroCarousel.length || typeof $heroCarousel.carousel !== "function") {
        return;
    }

    $heroCarousel.carousel({
        interval: 5000,
        ride: "carousel",
        pause: false,
        wrap: true
    });

    $heroCarousel.carousel("cycle");

    var hasActiveInteraction = function () {
        return interactionState.hover || interactionState.touch || interactionState.focus;
    };

    var pauseSlider = function () {
        window.clearTimeout(resumeTimer);
        $heroCarousel.addClass("is-interacting");
        $heroCarousel.carousel("pause");
    };

    var scheduleResume = function () {
        window.clearTimeout(resumeTimer);

        if (hasActiveInteraction()) {
            return;
        }

        resumeTimer = window.setTimeout(function () {
            if (hasActiveInteraction()) {
                return;
            }

            $heroCarousel.removeClass("is-interacting");
            $heroCarousel.carousel("cycle");
        }, resumeDelay);
    };

    $heroCarousel.on("mouseenter", function () {
        interactionState.hover = true;
        pauseSlider();
    });

    $heroCarousel.on("mouseleave", function () {
        interactionState.hover = false;
        scheduleResume();
    });

    $heroCarousel.on("touchstart", function () {
        interactionState.touch = true;
        pauseSlider();
    });

    $heroCarousel.on("touchend touchcancel", function () {
        interactionState.touch = false;
        scheduleResume();
    });

    $heroCarousel.on("focusin", function () {
        interactionState.focus = true;
        pauseSlider();
    });

    $heroCarousel.on("focusout", function () {
        window.setTimeout(function () {
            interactionState.focus = $heroCarousel.has(document.activeElement).length > 0;
            scheduleResume();
        }, 0);
    });

    $heroCarousel.find("[data-slide], [data-slide-to]").on("click", function () {
        pauseSlider();
        scheduleResume();
    });
}

$(document).ready(initHeroCarousel);

var sushiBoxGrid = null;
var sushiBoxFilterState = {
    category: "*",
    search: "",
    searchProductIds: null
};
var sushiBoxMobileGridQuery = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;

function getSushiBoxGridItems() {
    return $(".grid .all");
}

function getSushiBoxGridItemProductId(item) {
    var $item = $(item);
    return String(
        $item.attr("data-product-id")
        || $item.find("[data-product-id]").first().attr("data-product-id")
        || ""
    );
}

function matchesSushiBoxGridFilters(item) {
    var $item = $(item);
    var matchesCategory = sushiBoxFilterState.category === "*" || $item.is(sushiBoxFilterState.category);
    var haystack = String($item.attr("data-search") || $item.text() || "").toLowerCase();
    var productId = getSushiBoxGridItemProductId(item);
    var hasSmartSearchIds = Array.isArray(sushiBoxFilterState.searchProductIds);
    var matchesSearch = !sushiBoxFilterState.search
        || (hasSmartSearchIds
            ? sushiBoxFilterState.searchProductIds.indexOf(productId) !== -1
            : haystack.indexOf(sushiBoxFilterState.search) !== -1);

    return matchesCategory && matchesSearch;
}

function clearManualSushiBoxGridFilters() {
    getSushiBoxGridItems().each(function () {
        this.hidden = false;
    });
}

function applyManualSushiBoxGridFilters() {
    getSushiBoxGridItems().each(function () {
        this.hidden = !matchesSushiBoxGridFilters(this);
    });
}

function shouldUseCssProductGrid() {
    return sushiBoxMobileGridQuery && sushiBoxMobileGridQuery.matches;
}

function destroySushiBoxGrid() {
    if (sushiBoxGrid && typeof sushiBoxGrid.isotope === "function") {
        sushiBoxGrid.isotope("destroy");
    }

    sushiBoxGrid = null;
}

function resetSushiBoxCssGridLayout() {
    $(".grid").removeAttr("style");
    getSushiBoxGridItems().each(function () {
        this.style.position = "";
        this.style.left = "";
        this.style.top = "";
        this.style.right = "";
        this.style.bottom = "";
        this.style.transform = "";
        this.style.width = "";
        this.style.height = "";
        this.style.marginTop = "";
    });
}

function initSushiBoxGrid() {
    var $grid = $(".grid");

    if (!$grid.length || !$.fn.isotope) {
        return;
    }

    clearManualSushiBoxGridFilters();
    sushiBoxGrid = $grid.isotope({
        itemSelector: ".all",
        layoutMode: "fitRows",
        percentPosition: true
    });
}

function applySushiBoxGridFilters() {
    if (sushiBoxGrid) {
        clearManualSushiBoxGridFilters();
        sushiBoxGrid.isotope({
            filter: function () {
                return matchesSushiBoxGridFilters(this);
            }
        });
        return;
    }

    applyManualSushiBoxGridFilters();
}

function syncSushiBoxGridMode() {
    if (!$(".grid").length) {
        return;
    }

    if (shouldUseCssProductGrid() || !$.fn.isotope) {
        destroySushiBoxGrid();
        resetSushiBoxCssGridLayout();
        applyManualSushiBoxGridFilters();
        return;
    }

    if (!sushiBoxGrid) {
        initSushiBoxGrid();
    }

    applySushiBoxGridFilters();
}

window.SushiBoxGridFilters = {
    setCategory: function (filterValue) {
        sushiBoxFilterState.category = filterValue || "*";
        applySushiBoxGridFilters();
    },
    setSearch: function (query, productIds) {
        sushiBoxFilterState.search = String(query || "").trim().toLowerCase();
        sushiBoxFilterState.searchProductIds = sushiBoxFilterState.search && Array.isArray(productIds)
            ? productIds.map(function (productId) {
                return String(productId || "");
            })
            : null;
        applySushiBoxGridFilters();
    },
    refresh: applySushiBoxGridFilters
};

// isotope js
$(window).on('load', function () {
    $('.filters_menu li').click(function () {
        $('.filters_menu li').removeClass('active');
        $(this).addClass('active');

        var data = $(this).attr('data-filter');
        window.SushiBoxGridFilters.setCategory(data);
    });

    syncSushiBoxGridMode();
});

if (sushiBoxMobileGridQuery) {
    if (typeof sushiBoxMobileGridQuery.addEventListener === "function") {
        sushiBoxMobileGridQuery.addEventListener("change", syncSushiBoxGridMode);
    } else if (typeof sushiBoxMobileGridQuery.addListener === "function") {
        sushiBoxMobileGridQuery.addListener(syncSushiBoxGridMode);
    }
}

// nice select
$(document).ready(function() {
    if ($.fn.niceSelect) {
        $('select').niceSelect();
    }
  });

// client section owl carousel
if ($.fn.owlCarousel) {
    $(".client_owl-carousel").owlCarousel({
        loop: true,
        margin: 0,
        dots: false,
        nav: true,
        navText: [],
        autoplay: true,
        autoplayHoverPause: true,
        navText: [
            '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            '<i class="fa fa-angle-right" aria-hidden="true"></i>'
        ],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            1000: {
                items: 2
            }
        }
    });
}

// product card click behavior
document.addEventListener("DOMContentLoaded", function () {
    var cards = document.querySelectorAll(".product-card");
    cards.forEach(function (card) {
        card.addEventListener("click", function (event) {
            if (event.target.closest("a, button, input, textarea, select, label")) {
                return;
            }
            var url = card.getAttribute("data-product-url");
            if (url) {
                window.location.href = url;
            }
        });
    });
});
