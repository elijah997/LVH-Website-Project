/* =============================================
   Lake Victoria Hotel — Main JS (Redesigned)
   ============================================= */

/* =============================================
   PRELOADER
   ============================================= */
window.addEventListener('load', () => {
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 1400);
});


/* =============================================
   SCROLL PROGRESS BAR
   ============================================= */
const scrollBar = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
    if (!scrollBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollBar.style.width = pct + '%';
}, { passive: true });


/* =============================================
   HEADER SCROLL EFFECT
   ============================================= */
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });


/* =============================================
   WEB3FORMS CONFIGURATION
   Get your free access key at https://web3forms.com
   ============================================= */
var WEB3FORMS_KEY = '77dc82c6-1f2e-4171-8bde-e30fd86d6119';


/* =============================================
   SITE ANALYTICS — Track public user actions
   ============================================= */
var LVH_SITE_KEY = 'lvh_site_analytics';
var LVH_SITE_MAX = 500;

/* --- Visitor geolocation (IP-based) --- */
var _visitorCountry = '';
var _visitorCity = '';
var _visitorIp = '';
try {
    _visitorCountry = sessionStorage.getItem('lvh_visitor_country') || '';
    _visitorCity    = sessionStorage.getItem('lvh_visitor_city')    || '';
    _visitorIp      = sessionStorage.getItem('lvh_visitor_ip')      || '';
} catch (e) { /* private browsing / unavailable */ }

function lvhTrackEvent(eventName, details) {
    try {
        var events = JSON.parse(localStorage.getItem(LVH_SITE_KEY) || '[]');
        events.unshift({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            timestamp: new Date().toISOString(),
            event: eventName,
            page: location.pathname.split('/').pop() || 'index.html',
            details: details || '',
            ip: _visitorIp,
            country: _visitorCountry,
            city: _visitorCity
        });
        if (events.length > LVH_SITE_MAX) events.length = LVH_SITE_MAX;
        localStorage.setItem(LVH_SITE_KEY, JSON.stringify(events));
    } catch (e) { /* localStorage full or unavailable */ }
}

/* --- Seed mock analytics data (one-time, if empty) --- */
(function seedSiteAnalytics() {
    try {
        var existing = JSON.parse(localStorage.getItem(LVH_SITE_KEY) || '[]');
        if (existing.length > 0) return;

        var countries = [
            { name: 'Uganda', w: 25 }, { name: 'Kenya', w: 15 }, { name: 'UK', w: 12 },
            { name: 'USA', w: 12 }, { name: 'Germany', w: 8 }, { name: 'Tanzania', w: 7 },
            { name: 'Rwanda', w: 6 }, { name: 'South Africa', w: 6 }, { name: 'India', w: 5 },
            { name: 'France', w: 4 }
        ];
        var totalWeight = countries.reduce(function (s, c) { return s + c.w; }, 0);
        function pickCountry() {
            var r = Math.random() * totalWeight, acc = 0;
            for (var i = 0; i < countries.length; i++) {
                acc += countries[i].w;
                if (r <= acc) return countries[i].name;
            }
            return countries[0].name;
        }

        var eventTypes = [
            { name: 'page_view', weight: 40 },
            { name: 'room_book_click', weight: 15 },
            { name: 'booking_confirmed', weight: 10 },
            { name: 'availability_check', weight: 15 },
            { name: 'contact_enquiry', weight: 8 },
            { name: 'pdf_download', weight: 5 }
        ];
        var eventTotalW = eventTypes.reduce(function (s, e) { return s + e.weight; }, 0);
        function pickEvent() {
            var r = Math.random() * eventTotalW, acc = 0;
            for (var i = 0; i < eventTypes.length; i++) {
                acc += eventTypes[i].weight;
                if (r <= acc) return eventTypes[i].name;
            }
            return eventTypes[0].name;
        }

        var pages = ['index.html', 'bookings.html', 'about.html', 'dining.html', 'gallery.html', 'offers.html', 'contact.html'];
        function pickPage(eventName) {
            if (eventName === 'room_book_click' || eventName === 'booking_confirmed' || eventName === 'availability_check') return 'bookings.html';
            if (eventName === 'contact_enquiry') return 'contact.html';
            if (eventName === 'pdf_download') return 'bookings.html';
            return pages[Math.floor(Math.random() * pages.length)];
        }

        // Pool of realistic seed IPs (one per simulated visitor, reused across their events)
        var seedIps = [
            '41.210.32.14','102.0.5.43','105.163.2.88','197.157.220.9','41.74.18.201',
            '41.220.5.109','196.43.171.22','197.239.4.60','105.27.96.44','41.210.195.3',
            '212.102.44.87','86.9.73.201','31.184.192.11','46.29.114.66','89.101.220.4',
            '196.200.48.37','41.138.92.3','154.72.150.88','197.149.86.202','41.63.192.74'
        ];
        // Assign each seed visitor a stable IP so repeat visits share the same IP
        var numVisitors = 15;
        var visitorIps = seedIps.slice(0, numVisitors);
        var visitorCountries = visitorIps.map(function () { return pickCountry(); });
        function pickVisitor() { return Math.floor(Math.random() * numVisitors); }

        var seeded = [];
        var now = Date.now();
        for (var i = 0; i < 80; i++) {
            var daysAgo = Math.floor(Math.random() * 30);
            var hoursOffset = Math.floor(Math.random() * 24);
            var minsOffset = Math.floor(Math.random() * 60);
            var ts = new Date(now - daysAgo * 86400000 - hoursOffset * 3600000 - minsOffset * 60000);
            var evt = pickEvent();
            var v = pickVisitor();
            seeded.push({
                id: ts.getTime().toString(36) + Math.random().toString(36).substr(2, 4),
                timestamp: ts.toISOString(),
                event: evt,
                page: pickPage(evt),
                details: '',
                ip: visitorIps[v],
                country: visitorCountries[v],
                city: ''
            });
        }

        seeded.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
        localStorage.setItem(LVH_SITE_KEY, JSON.stringify(seeded));
    } catch (e) { /* silent */ }
})();

/* --- Track page view on every page load --- */
lvhTrackEvent('page_view');

/* --- Fetch visitor geolocation from IP (async, cached per session) --- */
(function fetchVisitorGeo() {
    // Skip if already cached this session
    if (_visitorCountry) return;
    // Only works over HTTP (not file://)
    if (window.location.protocol === 'file:') return;

    fetch('https://ipapi.co/json/')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data && data.country_name) {
                _visitorCountry = data.country_name;
                _visitorCity    = data.city || '';
                _visitorIp      = data.ip   || '';
                try {
                    sessionStorage.setItem('lvh_visitor_country', _visitorCountry);
                    sessionStorage.setItem('lvh_visitor_city',    _visitorCity);
                    sessionStorage.setItem('lvh_visitor_ip',      _visitorIp);
                } catch (e) { /* private browsing */ }

                // Retroactively patch the most recent page_view event with ip/country/city
                try {
                    var events = JSON.parse(localStorage.getItem(LVH_SITE_KEY) || '[]');
                    if (events.length > 0 && events[0].event === 'page_view' && !events[0].country) {
                        events[0].ip      = _visitorIp;
                        events[0].country = _visitorCountry;
                        events[0].city    = _visitorCity;
                        localStorage.setItem(LVH_SITE_KEY, JSON.stringify(events));
                    }
                } catch (e) { /* silent */ }
            }
        })
        .catch(function () { /* geo lookup failed — silent, non-critical */ });
})();


/* =============================================
   HERO SLIDER
   ============================================= */

// Rebuild slides from dashboard heroSlides data if available
(function applyHeroSlides() {
    const container = document.querySelector('.slider-container');
    if (!container) return;
    var _cfg = (typeof LVH_SITE_CONFIG !== 'undefined') ? LVH_SITE_CONFIG : {};
    let heroData = null;
    try {
        const raw = localStorage.getItem('lvh_dashboard');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.heroSlides && parsed.heroSlides.length) heroData = parsed.heroSlides;
        }
    } catch (e) { /* ignore */ }
    // Fall back to file-based config
    if (!heroData && _cfg.heroSlides && _cfg.heroSlides.length) heroData = _cfg.heroSlides;
    if (!heroData) return;

    // Remove existing slides and dots
    container.querySelectorAll('.slide').forEach(s => s.remove());
    const dotsWrap = container.querySelector('.slider-dots');
    if (dotsWrap) dotsWrap.innerHTML = '';

    // Build new slides
    heroData.forEach(function (s, i) {
        const div = document.createElement('div');
        div.className = 'slide' + (i === 0 ? ' active' : '');
        div.innerHTML =
            '<div class="slide-bg" style="background-image: url(\'' + s.image + '\')"></div>' +
            '<div class="slide-content">' +
                '<p class="slide-label">' + (s.label || '') + '</p>' +
                '<h1>' + (s.heading || '') + '</h1>' +
                '<p class="slide-sub"><em>' + (s.subtitle || '') + '</em></p>' +
                '<a href="' + (s.buttonLink || 'bookings.html') + '" class="btn btn-gold">' + (s.buttonText || 'Book Now') + '</a>' +
            '</div>';
        // Insert before nav buttons
        const firstBtn = container.querySelector('.slider-btn');
        container.insertBefore(div, firstBtn);

        // Add dot
        if (dotsWrap) {
            const dot = document.createElement('span');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dotsWrap.appendChild(dot);
        }
    });
})();

let slides     = document.querySelectorAll('.slide');
let dots       = document.querySelectorAll('.dot');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
let currentSlide = 0;
let autoTimer    = null;

function goTo(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide] && dots[currentSlide].classList.remove('active');

    // Reset Ken Burns on outgoing slide's bg
    const outBg = slides[currentSlide].querySelector('.slide-bg');
    if (outBg) {
        outBg.style.animation = 'none';
        outBg.offsetHeight; // force reflow
    }

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide] && dots[currentSlide].classList.add('active');

    // Restart Ken Burns on incoming slide's bg
    const inBg = slides[currentSlide].querySelector('.slide-bg');
    if (inBg) {
        inBg.style.animation = 'none';
        inBg.offsetHeight; // force reflow
        inBg.style.animation = '';
    }
}

function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(currentSlide + 1), 5500);
}

if (slides.length > 0) {
    prevBtn && prevBtn.addEventListener('click', () => { goTo(currentSlide - 1); startAuto(); });
    nextBtn && nextBtn.addEventListener('click', () => { goTo(currentSlide + 1); startAuto(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startAuto(); }));
    startAuto();
}


/* =============================================
   MOBILE NAVIGATION — SLIDE-IN DRAWER
   ============================================= */
const mobileToggle = document.getElementById('mobileToggle');
const mainNav      = document.getElementById('mainNav');
const navOverlay   = document.getElementById('navOverlay');
const navCloseBtn  = document.getElementById('navCloseBtn');
const hasDropdowns = document.querySelectorAll('.has-dropdown');

function openDrawer() {
    mainNav      && mainNav.classList.add('open');
    navOverlay   && navOverlay.classList.add('active');
    mobileToggle && mobileToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    mainNav      && mainNav.classList.remove('open');
    navOverlay   && navOverlay.classList.remove('active');
    mobileToggle && mobileToggle.classList.remove('active');
    document.body.style.overflow = '';
}

mobileToggle && mobileToggle.addEventListener('click', openDrawer);
navOverlay   && navOverlay.addEventListener('click', closeDrawer);
navCloseBtn  && navCloseBtn.addEventListener('click', closeDrawer);

// Mobile: tap parent link to expand sub-menu
hasDropdowns.forEach(item => {
    const parentLink = item.querySelector(':scope > a');
    parentLink && parentLink.addEventListener('click', e => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            item.classList.toggle('open');
        }
    });
});

// Close drawer when any leaf nav link is clicked
mainNav && mainNav.querySelectorAll('a:not(.has-dropdown > a)').forEach(link => {
    link.addEventListener('click', closeDrawer);
});


/* =============================================
   ACTIVE NAV LINK — URL-based (multi-page)
   ============================================= */
const navLinks   = document.querySelectorAll('.nav-link');
const currentFile = window.location.pathname.split('/').pop() || 'index.html';

navLinks.forEach(link => {
    const linkFile = (link.getAttribute('href') || '').split('#')[0];
    if (linkFile === currentFile) {
        link.classList.add('active');
    }
});


/* =============================================
   GALLERY LIGHTBOX  (filter-aware)
   ============================================= */
const galleryItems  = document.querySelectorAll('.gallery-item');
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev  = document.getElementById('lightboxPrev');
const lightboxNext  = document.getElementById('lightboxNext');
let lbIndex = 0;

function getVisibleImages() {
    return Array.from(galleryItems)
        .filter(item => !item.classList.contains('hidden'))
        .map(item => {
            const img = item.querySelector('img');
            return { src: img ? img.src : '', alt: img ? img.alt : '' };
        });
}

function openLightbox(visibleIndex) {
    lbIndex = visibleIndex;
    const images = getVisibleImages();
    if (!images[lbIndex]) return;
    lightboxImg.src = images[lbIndex].src;
    lightboxImg.alt = images[lbIndex].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
}

function lightboxGo(dir) {
    const images = getVisibleImages();
    if (images.length === 0) return;
    lbIndex = (lbIndex + dir + images.length) % images.length;
    lightboxImg.src = images[lbIndex].src;
    lightboxImg.alt = images[lbIndex].alt;
}

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        if (item.classList.contains('hidden')) return;
        const visibleItems = Array.from(galleryItems).filter(i => !i.classList.contains('hidden'));
        openLightbox(visibleItems.indexOf(item));
    });
});

lightboxClose && lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev  && lightboxPrev.addEventListener('click', () => lightboxGo(-1));
lightboxNext  && lightboxNext.addEventListener('click', () => lightboxGo(1));

lightbox && lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', e => {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lightboxGo(-1);
    if (e.key === 'ArrowRight') lightboxGo(1);
});


/* =============================================
   GALLERY FILTER TABS
   ============================================= */
const filterBtns = document.querySelectorAll('.gf-btn');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        galleryItems.forEach(item => {
            const match = filter === 'all' || item.dataset.category === filter;
            item.classList.toggle('hidden', !match);
        });
    });
});


/* =============================================
   DATE PICKER DEFAULTS
   ============================================= */
const checkInInput  = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');

if (checkInInput && checkOutInput) {
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const toISO = d => d.toISOString().split('T')[0];

    checkInInput.value  = toISO(today);
    checkInInput.min    = toISO(today);
    checkOutInput.value = toISO(tomorrow);
    checkOutInput.min   = toISO(tomorrow);

    checkInInput.addEventListener('change', () => {
        const chosen  = new Date(checkInInput.value);
        const nextDay = new Date(chosen);
        nextDay.setDate(chosen.getDate() + 1);
        checkOutInput.min = toISO(nextDay);
        if (new Date(checkOutInput.value) <= chosen) {
            checkOutInput.value = toISO(nextDay);
        }
    });
}


/* =============================================
   FORM SUBMISSIONS
   ============================================= */
// Contact page form — shows inline success message
const contactForm = document.getElementById('contactForm');
const cfSuccess   = document.getElementById('cfSuccess');
const cfSubmitBtn = document.getElementById('cfSubmitBtn');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        function cfShowSuccess() {
            if (cfSubmitBtn) {
                cfSubmitBtn.disabled = true;
                cfSubmitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                cfSubmitBtn.style.background  = 'var(--green)';
                cfSubmitBtn.style.borderColor = 'var(--green)';
            }
            if (cfSuccess) cfSuccess.style.display = 'flex';
            setTimeout(function () {
                contactForm.reset();
                if (cfSubmitBtn) {
                    cfSubmitBtn.disabled = false;
                    cfSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                    cfSubmitBtn.style.background  = '';
                    cfSubmitBtn.style.borderColor = '';
                }
                if (cfSuccess) cfSuccess.style.display = 'none';
            }, 4000);
        }

        if (WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY') {
            cfSubmitBtn.disabled = true;
            cfSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            // Gather contact data
            var cfName    = document.getElementById('cf-name').value;
            var cfEmail   = document.getElementById('cf-email').value;
            var cfPhone   = document.getElementById('cf-phone').value || 'Not provided';
            var cfEnquiry = document.getElementById('cf-subject').value || 'General Enquiry';
            var cfMsg     = document.getElementById('cf-message').value;
            var cfDate    = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            // Build formatted table message
            var ln  = '\n';
            var div = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
            var sep = '──────────────────────────────────────────';

            var cfBody = ''
            + div + ln
            + '       LAKE VICTORIA HOTEL' + ln
            + '       Contact Enquiry Receipt' + ln
            + div + ln
            + ln
            + '  SENDER INFORMATION' + ln
            + sep + ln
            + '  Name           │  ' + cfName + ln
            + '  Email          │  ' + cfEmail + ln
            + '  Phone          │  ' + cfPhone + ln
            + sep + ln
            + ln
            + '  ENQUIRY DETAILS' + ln
            + sep + ln
            + '  Type           │  ' + cfEnquiry + ln
            + '  Received       │  ' + cfDate + ln
            + sep + ln
            + ln
            + '  MESSAGE' + ln
            + sep + ln
            + '  ' + cfMsg.replace(/\n/g, '\n  ') + ln
            + sep + ln
            + ln
            + div + ln
            + '  Lake Victoria Hotel · Entebbe, Uganda' + ln
            + '  P.O.Box 15, Entebbe. Plot 23-31, Circular Road' + ln
            + '  Tel: +256 312 310 100 · WhatsApp: +256 772 268 040' + ln
            + '  reservations@lvhotel.co.ug' + ln
            + div;

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject:    'New Enquiry: ' + cfEnquiry + ' — ' + cfName,
                    from_name:  'Lake Victoria Hotel Website',
                    replyto:    cfEmail,
                    message:    cfBody
                })
            }).then(function (res) { return res.json(); })
              .then(function (data) {
                  if (data.success) {
                      lvhTrackEvent('contact_enquiry', cfEnquiry + ' | ' + cfName);
                      cfShowSuccess();
                  } else {
                      throw new Error(data.message);
                  }
              }).catch(function () {
                  if (cfSubmitBtn) {
                      cfSubmitBtn.disabled = false;
                      cfSubmitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to Send';
                      cfSubmitBtn.style.background  = '#ef4444';
                      cfSubmitBtn.style.borderColor = '#ef4444';
                  }
                  setTimeout(function () {
                      if (cfSubmitBtn) {
                          cfSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                          cfSubmitBtn.style.background  = '';
                          cfSubmitBtn.style.borderColor = '';
                      }
                  }, 3000);
              });
        } else {
            lvhTrackEvent('contact_enquiry', 'Enquiry submitted (offline)');
            cfShowSuccess();
        }
    });
}

// All other forms (availability checker)
document.querySelectorAll('form:not(#contactForm):not(#bookingModalForm):not(#inquiryForm)').forEach(form => {
    form.addEventListener('submit', e => {
        e.preventDefault();
        // Track availability check forms
        if (form.classList.contains('avail-form') || form.closest('.bw-card') || form.querySelector('[name="check-in"], [name="checkin"]')) {
            lvhTrackEvent('availability_check', 'Availability checked');
        }
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;
        const original        = btn.innerHTML;
        btn.innerHTML         = '✓ Sent!';
        btn.style.background  = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        btn.disabled          = true;
        setTimeout(() => {
            btn.innerHTML         = original;
            btn.style.background  = '';
            btn.style.borderColor = '';
            btn.disabled          = false;
        }, 2800);
    });
});



/* =============================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const href   = link.getAttribute('href');
        const target = href && href !== '#' ? document.querySelector(href) : null;
        if (!target) return;
        e.preventDefault();
        const headerH = document.getElementById('header')?.offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});


/* =============================================
   ANIMATED STAT COUNTERS
   ============================================= */
function animateCounter(el) {
    const target   = +el.dataset.target;
    const duration = 1800;
    const startTime = performance.now();

    const update = now => {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));


/* =============================================
   BACK TO TOP BUTTON + PROGRESS RING
   ============================================= */
const backToTopBtn   = document.getElementById('backToTop');
const progressRingEl = document.getElementById('progressRingFill');
const CIRCUMFERENCE  = 2 * Math.PI * 20; // radius = 20

window.addEventListener('scroll', () => {
    if (!backToTopBtn) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = docHeight > 0 ? scrollTop / docHeight : 0;

    backToTopBtn.classList.toggle('visible', scrollTop > 400);

    if (progressRingEl) {
        progressRingEl.style.strokeDashoffset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
    }
}, { passive: true });

backToTopBtn && backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* =============================================
   MOBILE STICKY BOOK BAR — hide near footer
   ============================================= */
const mobileBookBar = document.getElementById('mobileBookBar');
const footerEl      = document.querySelector('.footer');

if (mobileBookBar && footerEl) {
    const barObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            mobileBookBar.style.display = entry.isIntersecting ? 'none' : '';
        });
    }, { threshold: 0.1 });
    barObserver.observe(footerEl);
}


/* =============================================
   SCROLL REVEAL — staggered fade-up
   ============================================= */
// Inject base reveal styles once
const revealStyle = document.createElement('style');
revealStyle.textContent = `
    .rv {
        opacity: 0;
        transform: translateY(26px);
        transition: opacity 0.65s ease, transform 0.65s ease;
    }
    .rv.rv-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(revealStyle);

const revealSelectors = [
    '.deal-card', '.gallery-item', '.info-card',
    '.room-card', '.testi-card', '.stats-banner-item',
    '.icon-box', '.booking-card', '.footer-col',
    '.about-image-wrap', '.about-content'
];

const revealEls = document.querySelectorAll(revealSelectors.join(','));

revealEls.forEach(el => el.classList.add('rv'));

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el       = entry.target;
        const siblings = Array.from(el.parentElement?.children || [el]);
        const idx      = siblings.filter(s => s.classList.contains('rv')).indexOf(el);
        el.style.transitionDelay = `${Math.min(idx, 5) * 90}ms`;
        el.classList.add('rv-in');
        revealObserver.unobserve(el);
    });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

revealEls.forEach(el => revealObserver.observe(el));


/* =============================================
   BOOKING MODAL (bookings.html)
   ============================================= */

// Load site configuration — site-config.js (file) is the permanent base,
// localStorage is an optional override layer for live dashboard edits.
var _siteConfig = (typeof LVH_SITE_CONFIG !== 'undefined') ? LVH_SITE_CONFIG : {};

let dashData = null;
var _dashWasSeeded = false;
try {
    const raw = localStorage.getItem('lvh_dashboard');
    if (raw) dashData = JSON.parse(raw);
} catch (e) { /* parse error — fall through */ }

// Build final config: start from file-based config, overlay localStorage if present
if (!dashData) {
    _dashWasSeeded = true;
    dashData = {
        extraAdultFee:  _siteConfig.extraAdultFee  || 30,
        childChargeAge: _siteConfig.childChargeAge || 10,
        childFee:       _siteConfig.childFee       || 30,
        newsFeeds:      _siteConfig.newsFeeds      || [],
        heroSlides:     _siteConfig.heroSlides     || [],
        rates:          _siteConfig.rates          || {},
        blocked:        _siteConfig.blocked        || {},
        content:        _siteConfig.content        || {},
        roomNames:      _siteConfig.roomNames      || {},
        customRooms:    _siteConfig.customRooms    || [],
        guestRating:    _siteConfig.guestRating    || { average: 0, count: 0 },
        facilities:     _siteConfig.facilities     || [],
        packages:       _siteConfig.packages       || [],
        featuredTestimonials: _siteConfig.featuredTestimonials || [],
        messages:       _siteConfig.messages       || []
    };
    try { localStorage.setItem('lvh_dashboard', JSON.stringify(dashData)); } catch (e) {}
} else {
    // Ensure all keys present — file config fills any gaps
    if (!dashData.newsFeeds || !dashData.newsFeeds.length) dashData.newsFeeds = _siteConfig.newsFeeds || [];
    if (!dashData.heroSlides || !dashData.heroSlides.length) dashData.heroSlides = _siteConfig.heroSlides || [];
    if (!dashData.facilities || !dashData.facilities.length) dashData.facilities = _siteConfig.facilities || [];
    if (!dashData.packages  || !dashData.packages.length)   dashData.packages   = _siteConfig.packages   || [];
    if (!dashData.childChargeAge) dashData.childChargeAge = _siteConfig.childChargeAge || 10;
    if (!dashData.childFee)       dashData.childFee       = _siteConfig.childFee       || 30;
    if (!dashData.extraAdultFee)  dashData.extraAdultFee  = _siteConfig.extraAdultFee  || 30;
    if (!dashData.customRooms)    dashData.customRooms    = _siteConfig.customRooms    || [];
    if (!dashData.roomNames)      dashData.roomNames      = _siteConfig.roomNames      || {};
    if (!dashData.rates || !Object.keys(dashData.rates).length) dashData.rates = _siteConfig.rates || {};
    if (!dashData.content || !Object.keys(dashData.content).length) dashData.content = _siteConfig.content || {};
    if (!dashData.blocked)        dashData.blocked        = _siteConfig.blocked        || {};
    if (!dashData.guestRating)    dashData.guestRating    = _siteConfig.guestRating    || { average: 0, count: 0 };
    try { localStorage.setItem('lvh_dashboard', JSON.stringify(dashData)); } catch (e) {}
}

// Map bookings.html room names → dashboard keys (handles mismatches)
function dashKey(roomName) {
    const map = { 'Standard Single Room': 'Standard Single', 'Executive Twin Room': 'Executive Twin' };
    return map[roomName] || roomName;
}

// Apply dashboard rates & content to room cards
function applyDashRates(data) {
    if (!data || !data.rates) return;
    document.querySelectorAll('.room-book-btn').forEach(btn => {
        const key = dashKey(btn.dataset.room);
        const newRate = data.rates[key];
        if (newRate !== undefined) {
            btn.dataset.price = '$' + newRate + '/night';
        }
    });
    document.querySelectorAll('.room-card').forEach(card => {
        const btn = card.querySelector('.room-book-btn');
        const priceLabel = card.querySelector('.room-card-price');
        if (btn && priceLabel) {
            const key = dashKey(btn.dataset.room);
            const newRate = data.rates[key];
            if (newRate !== undefined) {
                priceLabel.textContent = 'From $' + newRate + '/night';
            }
        }
    });
}

// Apply from localStorage immediately
applyDashRates(dashData);

// Fallback: if localStorage was empty (seeded defaults), try IndexedDB backup for richer data
if (_dashWasSeeded) {
    (function tryIDBFallback() {
        try {
            var req = indexedDB.open('lvh_hotel_db', 1);
            req.onupgradeneeded = function () { req.result.createObjectStore('dashboard'); };
            req.onsuccess = function () {
                var db = req.result;
                var tx = db.transaction('dashboard', 'readonly');
                var get = tx.objectStore('dashboard').get('lvh_dashboard');
                get.onsuccess = function () {
                    if (get.result) {
                        var backup = JSON.parse(get.result);
                        dashData = backup;
                        // Restore to localStorage so future loads are instant
                        localStorage.setItem('lvh_dashboard', JSON.stringify(backup));
                        applyDashRates(backup);
                        applyDashContent(backup);
                        applyDashNames(backup);
                        applyNewsMarquee(backup);
                        applyNewsFeeds(backup);
                        applyGuestReviews(backup);
                        applyOffersPage(backup);
                        applyManagementTeam(backup);
                        applySurroundings(backup);
                        renderCustomRoomCards(backup);
                        if (typeof bindRoomBookButtons === 'function') bindRoomBookButtons();
                    }
                };
            };
        } catch (e) { /* IndexedDB not available */ }
    })();
}

// Update room card content (images, descriptions, features) from dashboard
function applyDashContent(data) {
    if (!data || !data.content) return;
    document.querySelectorAll('.room-card').forEach(function (card) {
        var btn = card.querySelector('.room-book-btn');
        if (!btn) return;
        var key = dashKey(btn.dataset.room);
        var info = data.content[key];
        if (!info) return;

        // Image (strip any wrapping quotes from localStorage paths)
        var img = card.querySelector('.room-card-img img');
        if (img && info.image) {
            var cleanSrc = info.image.replace(/^["']+|["']+$/g, '');
            img.src = cleanSrc;
            img.alt = key;
        }

        // Description
        var desc = card.querySelector('.room-card-body > p');
        if (desc && info.description) desc.textContent = info.description;

        // Features (3 spans: bed, size, guests)
        var features = card.querySelectorAll('.room-card-features span');
        if (features.length >= 3) {
            if (info.bedType)   features[0].innerHTML = '<i class="fas fa-bed"></i> ' + info.bedType;
            if (info.roomSize)  features[1].innerHTML = '<i class="fas fa-expand-arrows-alt"></i> ' + info.roomSize;
            if (info.maxGuests) features[2].innerHTML = '<i class="fas fa-users"></i> ' + info.maxGuests;
        }
    });
}
applyDashContent(dashData);

// Apply room display name overrides from dashboard
function applyDashNames(data) {
    if (!data || !data.roomNames) return;
    var names = data.roomNames;

    // Build anchor-to-key map for nav/footer links
    var anchorKeyMap = {
        'ministerial': 'Ministerial Suite',
        'presidential': 'Presidential Suite',
        'executive-king': 'Executive King',
        'standard': 'Standard Single',
        'family': 'Family Room',
        'executive-twin': 'Executive Twin',
        'junior': 'Junior Suite'
    };

    // Room card headings + alt text
    document.querySelectorAll('.room-card').forEach(function (card) {
        var btn = card.querySelector('.room-book-btn');
        if (!btn) return;
        var key = dashKey(btn.dataset.room);
        var displayName = names[key];
        if (!displayName) return;

        var h3 = card.querySelector('.room-card-body > h3');
        if (h3) h3.textContent = displayName;

        var img = card.querySelector('.room-card-img img');
        if (img) img.alt = displayName;
    });

    // Nav dropdown links (bookings.html sub-nav)
    document.querySelectorAll('.dropdown-menu a[href^="#"]').forEach(function (a) {
        var anchor = a.getAttribute('href').replace('#', '');
        var key = anchorKeyMap[anchor];
        if (key && names[key]) a.textContent = names[key];
    });

    // Footer "Room Types" links
    document.querySelectorAll('.footer-col a[href^="#"]').forEach(function (a) {
        var anchor = a.getAttribute('href').replace('#', '');
        var key = anchorKeyMap[anchor];
        if (key && names[key]) {
            // Preserve the chevron icon
            var icon = a.querySelector('i');
            a.textContent = ' ' + names[key];
            if (icon) a.prepend(icon);
        }
    });
}
applyDashNames(dashData);

// Populate news marquee ticker from dashboard data
function applyNewsMarquee(data) {
    var marquee = document.getElementById('newsMarquee');
    var content = document.getElementById('newsMarqueeContent');
    if (!marquee || !content) return;

    var feeds = (data && data.newsFeeds) ? data.newsFeeds : [];
    if (!feeds.length) {
        marquee.style.display = 'none';
        return;
    }

    marquee.style.display = '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Build single set of items — each links to its news card on offers page
    var html = feeds.map(function (item) {
        var d = new Date(item.date);
        var dateStr = months[d.getMonth()] + ' ' + d.getDate();
        var anchor = 'news-' + (item.id || '');
        return '<a href="offers.html#' + anchor + '" class="news-marquee-item">' +
                '<span class="nmi-badge">' + (item.category || 'News') + '</span>' +
                '<span class="nmi-title">' + (item.title || '') + '</span>' +
                '<span class="nmi-date">' + dateStr + '</span>' +
            '</a>' +
            '<span class="news-marquee-sep"></span>';
    }).join('');

    // Duplicate for seamless infinite loop
    content.innerHTML = html + html;
}
applyNewsMarquee(dashData);

// Populate news feeds section from dashboard data
function applyNewsFeeds(data) {
    var section = document.getElementById('newsSection');
    var grid = document.getElementById('newsGrid');
    if (!section || !grid) return;

    var feeds = (data && data.newsFeeds) ? data.newsFeeds : [];
    if (!feeds.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    var items = feeds.slice(0, 3);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    grid.innerHTML = items.map(function (item, idx) {
        var d = new Date(item.date);
        var dateStr = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
        var cls = 'news-card' + (idx === 0 ? ' featured' : '');
        var imgSrc = (item.image || '').replace(/^["']+|["']+$/g, '');

        var anchorId = 'news-' + (item.id || idx);
        return '<div class="' + cls + '" id="' + anchorId + '" style="background-image:url(\'' + imgSrc + '\')">' +
            '<div class="news-card-overlay"></div>' +
            '<div class="news-card-body">' +
                '<span class="news-card-badge">' + (item.category || 'Hotel News') + '</span>' +
                '<div class="news-card-date">' + dateStr + '</div>' +
                '<h3 class="news-card-title">' + (item.title || '') + '</h3>' +
                '<p class="news-card-excerpt">' + (item.excerpt || '') + '</p>' +
            '</div>' +
        '</div>';
    }).join('');
}
applyNewsFeeds(dashData);

// Static fallback testimonials (the 3 original hardcoded cards)
var STATIC_TESTIMONIALS = [
    { name: 'James M.', country: 'United Kingdom', text: 'A truly exceptional stay. The staff were incredibly attentive, the rooms beautifully appointed, and the views over Lake Victoria simply breathtaking. We will definitely return.', stars: 5 },
    { name: 'Sarah K.', country: 'Germany', text: 'The views over Lake Victoria are incredible. Waking up each morning to see the lake shimmering in sunlight was a dream. The restaurant\'s cuisine was absolutely world-class.', stars: 5 },
    { name: 'Ahmed R.', country: 'United Arab Emirates', text: 'The perfect blend of history and modern comfort. Knowing that this hotel has hosted royalty gives it a truly special character. Highly recommend for business or leisure.', stars: 4.5 }
];

// Populate homepage testimonials from dashboard-featured messages or file config
function applyGuestReviews(data) {
    var grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    // Priority 1: live dashboard messages marked as featured
    var featured = [];
    if (data && data.messages) {
        featured = data.messages.filter(function (m) { return m.showOnHomepage; }).slice(0, 3);
    }

    // Priority 2: file-based config (persists across cache clears)
    var fileFeatured = (_siteConfig && _siteConfig.featuredTestimonials) ? _siteConfig.featuredTestimonials : [];

    var items;
    if (featured.length > 0) {
        // Use live dashboard messages
        items = featured.map(function (m) {
            var starCount = (m._type === 'feedback' && m._rating) ? m._rating : 5;
            var text = (m.body || m.preview || '');
            text = text.replace(/\n\nRating:[\s\S]*$/, '').trim();
            if (text.length > 180) text = text.substring(0, 177) + '...';
            var parts = (m.sender || '').split(/\s+/);
            var ini = parts.length >= 2
                ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                : (m.sender || 'G').substring(0, 2).toUpperCase();
            return { name: m.sender, country: m._country || 'Valued Guest', text: text, stars: starCount, initials: ini };
        });
    } else if (fileFeatured.length > 0) {
        // Use file-based featured testimonials
        items = fileFeatured.map(function (t) {
            var parts = t.name.split(/\s+/);
            var ini = parts.length >= 2
                ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                : t.name.substring(0, 2).toUpperCase();
            return { name: t.name, country: t.country, text: t.text, stars: t.stars, initials: ini };
        });
    } else {
        // Fallback: static hardcoded testimonials
        items = STATIC_TESTIMONIALS.map(function (t) {
            var parts = t.name.split(/\s+/);
            var ini = parts.length >= 2
                ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                : t.name.substring(0, 2).toUpperCase();
            return { name: t.name, country: t.country, text: t.text, stars: t.stars, initials: ini };
        });
    }

    grid.innerHTML = items.map(function (item) {
        // Build star HTML
        var starsHtml = '';
        for (var s = 1; s <= 5; s++) {
            if (s <= Math.floor(item.stars)) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (s - 0.5 <= item.stars) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }

        return '<div class="testi-card">' +
            '<div class="testi-stars">' + starsHtml + '</div>' +
            '<div class="testi-quote">&ldquo;</div>' +
            '<p class="testi-text">' + item.text + '</p>' +
            '<div class="testi-author">' +
                '<div class="testi-avatar">' + item.initials + '</div>' +
                '<div><strong>' + item.name + '</strong><span>' + item.country + '</span></div>' +
            '</div>' +
        '</div>';
    }).join('');
}
applyGuestReviews(dashData);

// Populate Offers page facilities and packages from dashboard data
function applyOffersPage(data) {
    var dealsGrid = document.getElementById('offersDealsGrid');
    var pkgsGrid  = document.getElementById('offersPackagesGrid');

    if (dealsGrid && data && data.facilities && data.facilities.length) {
        dealsGrid.innerHTML = data.facilities.map(function (fac) {
            return '<div class="deal-card">' +
                '<div class="deal-img">' +
                    '<img src="' + (fac.image || '') + '" alt="' + (fac.title || '') + '" loading="lazy">' +
                    '<div class="deal-overlay-glass">' +
                        '<span class="deal-tag">' + (fac.tag || '') + '</span>' +
                        '<div class="deal-glass-body">' +
                            '<h3>' + (fac.title || '') + '</h3>' +
                            '<p>' + (fac.description || '') + '</p>' +
                            '<a href="' + (fac.link || 'contact.html') + '" class="discover-link">' + (fac.linkText || 'Enquire') + ' <i class="fas fa-long-arrow-alt-right"></i></a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    if (pkgsGrid && data && data.packages && data.packages.length) {
        pkgsGrid.innerHTML = data.packages.map(function (pkg) {
            var badge = pkg.badge ? '<span class="package-badge">' + pkg.badge + '</span>' : '';
            var includes = (pkg.includes || []).map(function (item) {
                return '<li><i class="fas fa-check"></i> ' + item + '</li>';
            }).join('');
            return '<div class="package-card">' +
                '<div class="package-img">' +
                    '<img src="' + (pkg.image || '') + '" alt="' + (pkg.title || '') + '" loading="lazy">' +
                    badge +
                '</div>' +
                '<div class="package-body">' +
                    '<h3>' + (pkg.title || '') + '</h3>' +
                    '<p>' + (pkg.description || '') + '</p>' +
                    '<ul class="package-includes">' + includes + '</ul>' +
                    '<a href="contact.html" class="btn btn-gold">Enquire Now</a>' +
                '</div>' +
            '</div>';
        }).join('');
    }
}
applyOffersPage(dashData);

function applyManagementTeam(data) {
    var grid = document.getElementById('mgmtTeamGrid');
    if (!grid) return;
    var team = data && data.managementTeam;
    if (!team || !team.length) return;
    grid.innerHTML = team.map(function (m) {
        return '<div class="mgmt-card">' +
            '<div class="mgmt-img"><img src="' + (m.image || '') + '" alt="' + (m.name || '') + '" loading="lazy"></div>' +
            '<div class="mgmt-body">' +
                '<h3>' + (m.name || '') + '</h3>' +
                '<span class="mgmt-role">' + (m.role || '') + '</span>' +
                '<p>' + (m.bio || '') + '</p>' +
            '</div>' +
        '</div>';
    }).join('');
}
applyManagementTeam(dashData);

function applySurroundings(data) {
    var grid = document.getElementById('surroundingsGrid');
    if (!grid) return;
    var items = data && (data.surroundings || (_siteConfig && _siteConfig.surroundings));
    if (!items || !items.length) return;
    grid.innerHTML = items.map(function (s) {
        return '<div class="surrounding-card">' +
            '<div class="surrounding-icon"><i class="fas ' + (s.icon || 'fa-map-marker-alt') + '"></i></div>' +
            '<div class="surrounding-body">' +
                '<h4>' + (s.title || '') + '</h4>' +
                '<p>' + (s.description || '') + '</p>' +
            '</div>' +
        '</div>';
    }).join('');
}
applySurroundings(dashData);

// Apply uploaded menu files from dashboard data to dining.html
function applyDiningMenu(data) {
    var menuCats = ['food', 'drinks', 'snacks', 'desserts', 'mains', 'starters'];
    var files = data && (data.menuFiles || (_siteConfig && _siteConfig.menuFiles));

    menuCats.forEach(function (key) {
        var btn = document.getElementById('menuBtn-' + key);
        if (!btn) return;
        var file = files && files[key];
        if (file && file.data) {
            btn.classList.remove('no-file');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                try {
                    var parts = file.data.split(',');
                    var byteStr = atob(parts[1]);
                    var ab = new ArrayBuffer(byteStr.length);
                    var ia = new Uint8Array(ab);
                    for (var i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
                    var blob = new Blob([ab], { type: file.type || 'application/octet-stream' });
                    var url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
                } catch (err) {
                    window.open(file.data, '_blank');
                }
            });
        } else {
            btn.classList.add('no-file');
        }
    });
}
applyDiningMenu(dashData);

// Render custom room cards added via dashboard
function renderCustomRoomCards(data) {
    if (!data || !data.customRooms || !data.customRooms.length) return;
    var grid = document.querySelector('.room-cards-grid');
    if (!grid) return;

    data.customRooms.forEach(function (room) {
        var key = room.key;
        var rate = (data.rates && data.rates[key]) || room.defaultRate || 100;
        var content = (data.content && data.content[key]) || {};
        var displayName = (data.roomNames && data.roomNames[key]) || key;
        var anchorId = key.toLowerCase().replace(/\s+/g, '-');

        var card = document.createElement('div');
        card.className = 'room-card';
        card.id = anchorId;

        card.innerHTML =
            '<div class="room-card-img">' +
                '<img src="' + (content.image || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80') + '" alt="' + displayName + '" loading="lazy">' +
                '<span class="room-card-price">From $' + rate + '/night</span>' +
            '</div>' +
            '<div class="room-card-body">' +
                '<h3>' + displayName + '</h3>' +
                '<p>' + (content.description || key + ' — a comfortable and elegant room.') + '</p>' +
                '<div class="room-card-features">' +
                    '<span><i class="fas fa-bed"></i> ' + (content.bedType || 'Double Bed') + '</span>' +
                    '<span><i class="fas fa-expand-arrows-alt"></i> ' + (content.roomSize || '30 m²') + '</span>' +
                    '<span><i class="fas fa-users"></i> ' + (content.maxGuests || '2 Guests') + '</span>' +
                '</div>' +
                '<button class="btn btn-gold room-book-btn" data-room="' + key + '" data-price="$' + rate + '/night">Book Now</button>' +
            '</div>';

        grid.appendChild(card);

        // Add nav dropdown link for this room type
        var navDropdown = document.querySelector('.has-dropdown a[href="bookings.html"]');
        if (navDropdown) {
            var dropdownUl = navDropdown.closest('.has-dropdown').querySelector('.dropdown');
            if (dropdownUl) {
                var navLi = document.createElement('li');
                navLi.innerHTML = '<a href="#' + anchorId + '">' + displayName + '</a>';
                dropdownUl.appendChild(navLi);
            }
        }

        // Add footer Room Types link
        var footerCols = document.querySelectorAll('.footer-col');
        footerCols.forEach(function (col) {
            var h4 = col.querySelector('h4');
            if (h4 && h4.textContent.trim() === 'Room Types') {
                var ul = col.querySelector('ul');
                if (ul) {
                    var li = document.createElement('li');
                    li.innerHTML = '<a href="#' + anchorId + '"><i class="fas fa-chevron-right fa-xs"></i> ' + displayName + '</a>';
                    ul.appendChild(li);
                }
            }
        });
    });
}
renderCustomRoomCards(dashData);

// ── Live Clock (bookings page) ──
(function () {
    var blcTime = document.getElementById('blcTime');
    var blcDate = document.getElementById('blcDate');
    if (!blcTime || !blcDate) return;

    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
    var days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    function tick() {
        // East Africa Time = UTC+3
        var now = new Date();
        var utc = now.getTime() + now.getTimezoneOffset() * 60000;
        var eat = new Date(utc + 3 * 3600000);

        var h  = eat.getHours();
        var m  = eat.getMinutes();
        var s  = eat.getSeconds();
        var ap = h >= 12 ? 'PM' : 'AM';
        var h12 = h % 12 || 12;

        blcTime.textContent =
            (h12 < 10 ? '0' : '') + h12 + ':' +
            (m  < 10 ? '0' : '') + m  + ':' +
            (s  < 10 ? '0' : '') + s  + ' ' + ap;

        blcDate.textContent =
            days[eat.getDay()] + ', ' +
            months[eat.getMonth()] + ' ' +
            eat.getDate() + ', ' +
            eat.getFullYear();
    }

    tick();
    setInterval(tick, 1000);
})();

const bookingModal    = document.getElementById('bookingModal');
const bmOverlay       = document.getElementById('bookingModalOverlay');
const bmCloseBtn      = document.getElementById('bookingModalClose');
const bmForm          = document.getElementById('bookingModalForm');
const bmRoomName      = document.getElementById('bmRoomName');
const bmRoomPrice     = document.getElementById('bmRoomPrice');
const bmCheckIn       = document.getElementById('bmCheckIn');
const bmCheckOut      = document.getElementById('bmCheckOut');
const bmSubmitBtn     = document.getElementById('bmSubmitBtn');
const bmSuccess       = document.getElementById('bmSuccess');
const bmSurcharge     = document.getElementById('bmSurcharge');
const bmAdultsSelect  = document.getElementById('bmAdults');
const roomBookBtns    = document.querySelectorAll('.room-book-btn');

// Rooms that charge $30 extra for a second adult
var surchargeRooms = ['Standard Single Room', 'Junior Suite', 'Executive Twin Room', 'Executive King'];
var EXTRA_ADULT_FEE = (dashData && dashData.extraAdultFee) || 30;

function getInternalRoom() {
    return (bookingModal && bookingModal.dataset.internalRoom) || (bmRoomName ? bmRoomName.textContent : '');
}

// Toast notification for booking modal alerts
var _bmToastTimer = null;
function showBmToast(message, type, icon, duration) {
    var existing = document.getElementById('lvhBmToast');
    if (existing) existing.remove();
    if (_bmToastTimer) clearTimeout(_bmToastTimer);
    var toast = document.createElement('div');
    toast.id = 'lvhBmToast';
    toast.className = 'lvh-bm-toast' + (type ? ' ' + type : '');
    toast.innerHTML = '<i class="fas ' + (icon || 'fa-info-circle') + '"></i><span>' + message + '</span>';
    document.body.appendChild(toast);
    _bmToastTimer = setTimeout(function () {
        toast.style.animation = 'bm-toast-out 0.3s ease forwards';
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
    }, duration || 4500);
}

function updateSurchargeNotice(fromUserChange) {
    if (!bmSurcharge || !bmAdultsSelect || !bmRoomName) return;
    var room = getInternalRoom();
    var show = parseInt(bmAdultsSelect.value) >= 2 && surchargeRooms.indexOf(room) !== -1;
    bmSurcharge.style.display = show ? 'inline-block' : 'none';
    bmSurcharge.textContent = '+ $' + EXTRA_ADULT_FEE + ' extra adult';
    if (show && fromUserChange) {
        showBmToast(
            'An extra adult fee of <strong>$' + EXTRA_ADULT_FEE + ' per night</strong> will be added for 2+ adults in this room type.',
            'warning',
            'fa-exclamation-circle',
            5500
        );
    }
}

if (bmAdultsSelect) bmAdultsSelect.addEventListener('change', function () { updateSurchargeNotice(true); });

// Children age inputs — dynamically generated when children > 0
var bmChildrenSelect = document.getElementById('bmChildren');
var bmChildAges      = document.getElementById('bmChildAges');
var bmChildAgesList  = document.getElementById('bmChildAgesList');
var childFreeRooms   = ['Ministerial Suite', 'Junior Suite', 'Family Room', 'Presidential Suite'];
var CHILD_CHARGE_AGE = (dashData && dashData.childChargeAge) || 10;
var CHILD_FEE        = (dashData && dashData.childFee) || 30;

// Update child info text to reflect dashboard-configured values
(function updateChildInfoText() {
    var infoEl = document.getElementById('bmChildAgesInfo');
    if (infoEl) infoEl.innerHTML = 'Children below ' + CHILD_CHARGE_AGE + ' years stay free. Ages ' + CHILD_CHARGE_AGE + '+ are charged <strong>$' + CHILD_FEE + ' extra per night</strong>.';
    var noteEl = document.getElementById('rcChildNoteText');
    if (noteEl) noteEl.textContent = 'Children below ' + CHILD_CHARGE_AGE + ' yrs stay free. Children ' + CHILD_CHARGE_AGE + ' yrs+ are charged $' + CHILD_FEE + ' extra/night.';
})();

function buildChildAgeInputs() {
    if (!bmChildAges || !bmChildAgesList || !bmChildrenSelect) return;
    var count = parseInt(bmChildrenSelect.value);
    var room  = getInternalRoom();
    var exempt = childFreeRooms.indexOf(room) !== -1;

    if (count === 0 || exempt) {
        bmChildAges.style.display = 'none';
        bmChildAgesList.innerHTML = '';
        return;
    }

    bmChildAges.style.display = 'block';
    bmChildAgesList.innerHTML = '';

    for (var i = 0; i < count; i++) {
        var item = document.createElement('div');
        item.className = 'bm-child-age-item';

        var lbl = document.createElement('label');
        lbl.textContent = 'Child ' + (i + 1) + ' Age';

        var sel = document.createElement('select');
        sel.className = 'bm-child-age-select';
        sel.dataset.index = i;

        // Placeholder
        var placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = 'Select age';
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        sel.appendChild(placeholderOpt);

        for (var age = 0; age <= 17; age++) {
            var opt = document.createElement('option');
            opt.value = age;
            opt.textContent = age + (age === 0 ? ' (infant)' : age === 1 ? ' year' : ' years');
            sel.appendChild(opt);
        }

        var badge = document.createElement('div');
        badge.className = 'bm-child-age-charge';
        badge.id = 'childBadge' + i;

        sel.addEventListener('change', (function (badgeEl) {
            return function () {
                this.classList.remove('bm-child-age-error');
                var a = parseInt(this.value);
                if (isNaN(a)) { badgeEl.textContent = ''; badgeEl.className = 'bm-child-age-charge'; return; }
                if (a >= CHILD_CHARGE_AGE) {
                    badgeEl.textContent = '+ $' + CHILD_FEE + '/night';
                    badgeEl.className = 'bm-child-age-charge charged';
                } else {
                    badgeEl.textContent = 'Free';
                    badgeEl.className = 'bm-child-age-charge free';
                }
                // Hide warning if all ages now filled
                var allDone = true;
                bmChildAgesList.querySelectorAll('.bm-child-age-select').forEach(function (s) {
                    if (s.value === '') allDone = false;
                });
                if (allDone) {
                    var w = document.getElementById('bmChildAgeWarn');
                    if (w) w.style.display = 'none';
                }
            };
        })(badge));

        item.appendChild(lbl);
        item.appendChild(sel);
        item.appendChild(badge);
        bmChildAgesList.appendChild(item);
    }
}

// Validate that every child has an age selected — returns true if valid
function validateChildAges() {
    if (!bmChildAgesList || !bmChildrenSelect) return true;
    var count = parseInt(bmChildrenSelect.value);
    var room  = getInternalRoom();
    var exempt = childFreeRooms.indexOf(room) !== -1;
    if (count === 0 || exempt) return true;

    var selects = bmChildAgesList.querySelectorAll('.bm-child-age-select');
    var allFilled = true;
    selects.forEach(function (s) {
        if (s.value === '') {
            allFilled = false;
            s.classList.add('bm-child-age-error');
        } else {
            s.classList.remove('bm-child-age-error');
        }
    });
    return allFilled;
}

// Count how many children are 10+ (chargeable)
function getChargeableChildren() {
    var selects = bmChildAgesList ? bmChildAgesList.querySelectorAll('.bm-child-age-select') : [];
    var count = 0;
    selects.forEach(function (s) {
        var age = parseInt(s.value);
        if (!isNaN(age) && age >= CHILD_CHARGE_AGE) count++;
    });
    return count;
}

if (bmChildrenSelect) bmChildrenSelect.addEventListener('change', buildChildAgeInputs);

function openBookingModal(roomName, roomPrice, internalName) {
    if (!bookingModal) return;
    // Store internal key for surcharge/child-free/blocked lookups
    bookingModal.dataset.internalRoom = internalName || roomName;
    if (bmRoomName)  bmRoomName.textContent  = roomName;
    if (bmRoomPrice) bmRoomPrice.textContent = roomPrice;

    // Set date defaults (today / tomorrow)
    if (bmCheckIn && bmCheckOut) {
        const today    = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const toISO = d => d.toISOString().split('T')[0];

        bmCheckIn.value  = toISO(today);
        bmCheckIn.min    = toISO(today);
        bmCheckOut.value = toISO(tomorrow);
        bmCheckOut.min   = toISO(tomorrow);
    }

    // Reset form & show it, hide receipt, success, blocked notice & send error
    if (bmForm)    bmForm.style.display    = '';
    if (bmReceipt) bmReceipt.style.display = 'none';
    if (bmSuccess) bmSuccess.style.display = 'none';
    const bmNotice = document.getElementById('bmBlockedNotice');
    if (bmNotice)  bmNotice.style.display  = 'none';
    const bmSendErr = document.getElementById('bmSendError');
    if (bmSendErr) bmSendErr.style.display = 'none';
    if (bmSubmitBtn) {
        bmSubmitBtn.disabled  = false;
        bmSubmitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Booking';
        bmSubmitBtn.style.background  = '';
        bmSubmitBtn.style.borderColor = '';
        bmSubmitBtn.style.opacity     = '';
        bmSubmitBtn.style.cursor      = '';
    }

    // Reset guests to defaults and update notices
    if (bmAdultsSelect)   bmAdultsSelect.value   = '1';
    if (bmChildrenSelect) bmChildrenSelect.value = '0';
    var bmAgeWarnReset = document.getElementById('bmChildAgeWarn');
    if (bmAgeWarnReset) bmAgeWarnReset.style.display = 'none';
    updateSurchargeNotice(false);
    buildChildAgeInputs();
    // Reset confirm button
    if (rcConfirmBtn) {
        rcConfirmBtn.disabled  = false;
        rcConfirmBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Booking';
    }

    bookingModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    if (!bookingModal) return;
    bookingModal.classList.remove('open');
    document.body.style.overflow = '';
    if (bmForm) bmForm.reset();
}

// Open — attach click to each room card button (re-query to include custom cards)
function bindRoomBookButtons() {
    document.querySelectorAll('.room-book-btn').forEach(function (btn) {
        if (btn._bookBound) return; // avoid double-binding
        btn._bookBound = true;
        btn.addEventListener('click', function () {
            var internalKey = btn.dataset.room || 'Room';
            lvhTrackEvent('room_book_click', internalKey);
            var card = btn.closest('.room-card');
            var h3 = card ? card.querySelector('.room-card-body > h3') : null;
            var displayName = (h3 && h3.textContent) || internalKey;
            openBookingModal(displayName, btn.dataset.price || '', internalKey);
        });
    });
}
bindRoomBookButtons();

// Close — X button, overlay, Escape
bmCloseBtn && bmCloseBtn.addEventListener('click', closeBookingModal);
bmOverlay  && bmOverlay.addEventListener('click', closeBookingModal);

document.addEventListener('keydown', e => {
    if (bookingModal && bookingModal.classList.contains('open') && e.key === 'Escape') {
        closeBookingModal();
    }
});

// Date sync — check-out must be after check-in
if (bmCheckIn && bmCheckOut) {
    bmCheckIn.addEventListener('change', () => {
        const chosen  = new Date(bmCheckIn.value);
        const nextDay = new Date(chosen);
        nextDay.setDate(chosen.getDate() + 1);
        const toISO = d => d.toISOString().split('T')[0];
        bmCheckOut.min = toISO(nextDay);
        if (new Date(bmCheckOut.value) <= chosen) {
            bmCheckOut.value = toISO(nextDay);
        }
    });
}

// Blocked date checking
const bmBlockedNotice = document.getElementById('bmBlockedNotice');

function getDateRange(startStr, endStr) {
    const dates = [];
    const start = new Date(startStr);
    const end   = new Date(endStr);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

function getBlockedDatesInRange() {
    if (!dashData || !dashData.blocked || !bmRoomName || !bmCheckIn || !bmCheckOut) return [];
    const roomKey = dashKey(getInternalRoom());
    const blocked = dashData.blocked[roomKey];
    if (!blocked || blocked.length === 0) return [];

    const range = getDateRange(bmCheckIn.value, bmCheckOut.value);
    return range.filter(d => blocked.indexOf(d) !== -1);
}

function checkBlockedDates() {
    return getBlockedDatesInRange().length > 0;
}

function formatBlockedDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function updateBlockedNotice() {
    if (!bmBlockedNotice) return;
    var blockedDates = getBlockedDatesInRange();
    var hasBlocked = blockedDates.length > 0;
    bmBlockedNotice.style.display = hasBlocked ? 'flex' : 'none';

    // Populate date chips
    var datesList = document.getElementById('bmBlockedDatesList');
    if (datesList) {
        datesList.innerHTML = blockedDates.map(function (d) {
            return '<span class="bm-blocked-date-chip"><i class="fas fa-times-circle"></i> ' + formatBlockedDate(d) + '</span>';
        }).join('');
    }

    // Disable/enable submit button
    if (bmSubmitBtn) {
        bmSubmitBtn.disabled = hasBlocked;
        if (hasBlocked) {
            bmSubmitBtn.style.opacity = '0.5';
            bmSubmitBtn.style.cursor = 'not-allowed';
        } else {
            bmSubmitBtn.style.opacity = '';
            bmSubmitBtn.style.cursor = '';
        }
    }
}

// Real-time blocked date feedback on date input changes
if (bmCheckIn)  bmCheckIn.addEventListener('change', updateBlockedNotice);
if (bmCheckOut) bmCheckOut.addEventListener('change', updateBlockedNotice);

// Receipt elements
var bmReceipt    = document.getElementById('bmReceipt');
var rcBackBtn    = document.getElementById('rcBackBtn');
var rcConfirmBtn = document.getElementById('rcConfirmBtn');

// Helper: format ISO date for display
function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Helper: extract numeric rate from price string like "$150/night"
function parseRate(priceStr) {
    var m = priceStr.match(/[\d,.]+/);
    return m ? parseFloat(m[0].replace(/,/g, '')) : 0;
}

// Tax rates
var VAT_RATE     = 0.18;
var SERVICE_RATE = 0.05;

// Step 1: Form submit shows the confirmation receipt
if (bmForm) {
    bmForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Prevent submission if blocked dates exist in range
        if (checkBlockedDates()) {
            if (bmBlockedNotice) bmBlockedNotice.style.display = 'flex';
            return;
        }

        // Prevent submission if children selected but ages not filled
        if (!validateChildAges()) {
            var ageWarn = document.getElementById('bmChildAgeWarn');
            if (ageWarn) ageWarn.style.display = 'flex';
            if (bmChildAges) bmChildAges.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        var ageWarnHide = document.getElementById('bmChildAgeWarn');
        if (ageWarnHide) ageWarnHide.style.display = 'none';

        // Gather data for receipt preview
        var bkRoom     = bmRoomName  ? bmRoomName.textContent  : 'Room';
        var bkRoomKey  = getInternalRoom();
        var bkPrice    = bmRoomPrice ? bmRoomPrice.textContent : '';
        var bkIn       = bmCheckIn   ? bmCheckIn.value         : '';
        var bkOut      = bmCheckOut  ? bmCheckOut.value        : '';
        var bkAdults   = document.getElementById('bmAdults').value;
        var bkChildren = document.getElementById('bmChildren').value;
        var bkGuests   = bkAdults + ' Adult' + (bkAdults > 1 ? 's' : '') + (bkChildren > 0 ? ', ' + bkChildren + ' Child' + (bkChildren > 1 ? 'ren' : '') : '');

        var bkNights = '';
        if (bkIn && bkOut) {
            var diff = Math.round((new Date(bkOut) - new Date(bkIn)) / 86400000);
            bkNights = diff > 0 ? diff + (diff === 1 ? ' Night' : ' Nights') : '';
        }

        var hasSurcharge = parseInt(bkAdults) >= 2 && surchargeRooms.indexOf(bkRoomKey) !== -1;

        // Populate receipt fields
        document.getElementById('rcRoom').textContent    = bkRoom;
        document.getElementById('rcRate').textContent    = bkPrice + ' / night';
        document.getElementById('rcCheckIn').textContent  = fmtDate(bkIn) + '  (from 2:00 PM)';
        document.getElementById('rcCheckOut').textContent = fmtDate(bkOut) + '  (by 11:00 AM)';
        document.getElementById('rcNights').textContent   = bkNights || '—';
        document.getElementById('rcGuests').textContent   = bkGuests;
        document.getElementById('rcName').textContent     = document.getElementById('bmName').value;
        document.getElementById('rcEmail').textContent    = document.getElementById('bmEmail').value;
        document.getElementById('rcPhone').textContent    = document.getElementById('bmPhone').value;

        var rcSurchargeRow = document.getElementById('rcSurchargeRow');
        if (rcSurchargeRow) {
            rcSurchargeRow.style.display = hasSurcharge ? 'flex' : 'none';
            if (hasSurcharge) document.getElementById('rcSurcharge').textContent = '+ $' + EXTRA_ADULT_FEE + ' / night';
        }

        // Compute billing
        var nightCount   = 0;
        if (bkIn && bkOut) {
            nightCount = Math.round((new Date(bkOut) - new Date(bkIn)) / 86400000);
            if (nightCount < 1) nightCount = 1;
        }
        var roomRate       = parseRate(bkPrice);
        var roomSubtotal   = roomRate * nightCount;
        var surchargeAmt   = hasSurcharge ? EXTRA_ADULT_FEE * nightCount : 0;
        var exempt         = childFreeRooms.indexOf(bkRoomKey) !== -1;
        var chargeKids     = exempt ? 0 : getChargeableChildren();
        var childChargeAmt = chargeKids * CHILD_FEE * nightCount;
        var netAmount      = roomSubtotal + surchargeAmt + childChargeAmt;
        var vatAmount      = Math.round(netAmount * VAT_RATE * 100) / 100;
        var serviceAmt     = Math.round(netAmount * SERVICE_RATE * 100) / 100;
        var totalAmount    = Math.round((netAmount + vatAmount + serviceAmt) * 100) / 100;

        document.getElementById('rcSubtotal').textContent = '$' + roomSubtotal.toFixed(2);
        var rcSurchargeTotal = document.getElementById('rcSurchargeTotal');
        if (rcSurchargeTotal) {
            rcSurchargeTotal.style.display = hasSurcharge ? 'flex' : 'none';
            if (hasSurcharge) document.getElementById('rcSurchargeAmt').textContent = '$' + surchargeAmt.toFixed(2);
        }
        var rcChildChargeRow = document.getElementById('rcChildChargeRow');
        if (rcChildChargeRow) {
            rcChildChargeRow.style.display = childChargeAmt > 0 ? 'flex' : 'none';
            if (childChargeAmt > 0) document.getElementById('rcChildChargeAmt').textContent = '$' + childChargeAmt.toFixed(2);
        }
        document.getElementById('rcVat').textContent     = '$' + vatAmount.toFixed(2);
        document.getElementById('rcService').textContent = '$' + serviceAmt.toFixed(2);
        document.getElementById('rcTotal').textContent   = '$' + totalAmount.toFixed(2);

        // Children info on receipt — show ages summary
        var rcChildNote = document.getElementById('rcChildNote');
        if (rcChildNote) {
            if (parseInt(bkChildren) > 0 && !exempt) {
                var ageSelects = bmChildAgesList ? bmChildAgesList.querySelectorAll('.bm-child-age-select') : [];
                var ageParts = [];
                ageSelects.forEach(function (s, i) {
                    var a = parseInt(s.value);
                    if (!isNaN(a)) {
                        ageParts.push('Child ' + (i + 1) + ': ' + a + ' yrs' + (a >= CHILD_CHARGE_AGE ? ' (+$' + CHILD_FEE + '/night)' : ' (free)'));
                    }
                });
                rcChildNote.querySelector('span').innerHTML = ageParts.join('<br>');
                rcChildNote.style.display = 'flex';
            } else {
                rcChildNote.style.display = 'none';
            }
        }

        // Show receipt, hide form
        bmForm.style.display = 'none';
        if (bmReceipt) bmReceipt.style.display = 'block';
    });
}

// Step 2: "Edit Details" — go back to the form
if (rcBackBtn) {
    rcBackBtn.addEventListener('click', function () {
        if (bmReceipt) bmReceipt.style.display = 'none';
        if (bmForm)    bmForm.style.display    = '';
    });
}

// Download PDF receipt
var rcDownloadBtn = document.getElementById('rcDownloadBtn');
if (rcDownloadBtn) {
    rcDownloadBtn.addEventListener('click', function () {
        if (typeof window.jspdf === 'undefined') { alert('PDF library is loading. Please try again.'); return; }

        var jsPDF = window.jspdf.jsPDF;
        var doc   = new jsPDF({ unit: 'mm', format: 'a4' });
        var pw    = doc.internal.pageSize.getWidth();
        var mx    = 20;           // margin x
        var cw    = pw - mx * 2;  // content width
        var y     = 0;

        // Brand colours (RGB)
        var greenDark = [30, 77, 51];
        var gold      = [201, 168, 76];
        var cream     = [245, 240, 232];
        var dark      = [26, 26, 26];
        var gray      = [136, 136, 136];
        var red       = [192, 57, 43];
        var white     = [255, 255, 255];

        // ── HEADER BAR ──
        doc.setFillColor.apply(doc, greenDark);
        doc.rect(0, 0, pw, 38, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, gold);
        doc.text('★', pw / 2, 12, { align: 'center' });

        doc.setFontSize(18);
        doc.setTextColor.apply(doc, white);
        doc.text('LAKE VICTORIA', pw / 2, 20, { align: 'center' });

        // gold line under name
        doc.setDrawColor.apply(doc, gold);
        doc.setLineWidth(0.4);
        doc.line(pw / 2 - 15, 23, pw / 2 + 15, 23);

        doc.setFontSize(7);
        doc.setTextColor.apply(doc, gold);
        doc.text('HOTEL  •  ENTEBBE', pw / 2, 27, { align: 'center' });

        // Gold gradient bar
        doc.setFillColor.apply(doc, gold);
        doc.rect(0, 38, pw, 1.5, 'F');

        y = 48;

        // ── TITLE ──
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, gold);
        doc.text('BOOKING PREVIEW', pw / 2, y, { align: 'center' });
        y += 5;

        doc.setFontSize(16);
        doc.setTextColor.apply(doc, greenDark);
        doc.text('Review Your Booking', pw / 2, y, { align: 'center' });
        y += 6;

        doc.setFontSize(8);
        doc.setTextColor.apply(doc, gray);
        var today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        doc.text('Generated ' + today, pw / 2, y, { align: 'center' });
        y += 10;

        // ── HELPER: section header ──
        function sectionHeader(title) {
            doc.setFillColor.apply(doc, cream);
            doc.roundedRect(mx, y, cw, 7, 1, 1, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, gray);
            doc.text(title, mx + 4, y + 4.8);
            y += 10;
        }

        // ── HELPER: data row ──
        function dataRow(label, value, color) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor.apply(doc, gray);
            doc.text(label, mx + 4, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor.apply(doc, color || dark);
            doc.text(value || '', pw - mx - 4, y, { align: 'right' });
            // subtle line
            doc.setDrawColor(230, 225, 215);
            doc.setLineWidth(0.2);
            doc.line(mx, y + 2, pw - mx, y + 2);
            y += 7;
        }

        // ── HELPER: ornamental divider ──
        function ornament() {
            doc.setFontSize(7);
            doc.setTextColor.apply(doc, gold);
            doc.text('◆   ◆   ◆', pw / 2, y, { align: 'center' });
            y += 7;
        }

        // ── ROOM DETAILS ──
        // Dark green room card
        doc.setFillColor.apply(doc, greenDark);
        doc.roundedRect(mx, y, cw, 18, 2, 2, 'F');

        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255, 0.5);
        doc.text('ROOM TYPE', mx + 6, y + 6);
        doc.setFontSize(13);
        doc.setTextColor.apply(doc, white);
        doc.text(document.getElementById('rcRoom').textContent || '', mx + 6, y + 12.5);

        doc.setFontSize(13);
        doc.setTextColor.apply(doc, gold);
        var rateText = document.getElementById('rcRate').textContent || '';
        doc.text(rateText, pw - mx - 6, y + 10, { align: 'right' });
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255, 0.4);
        doc.text('per night', pw - mx - 6, y + 14, { align: 'right' });

        y += 24;

        // Extra adult surcharge
        var rcSurchargeEl = document.getElementById('rcSurchargeRow');
        if (rcSurchargeEl && rcSurchargeEl.style.display !== 'none') {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor.apply(doc, red);
            doc.text('+ Extra adult surcharge: $' + EXTRA_ADULT_FEE + '/night', mx + 4, y);
            y += 7;
        }

        ornament();

        // ── STAY DETAILS ──
        sectionHeader('STAY DETAILS');
        dataRow('Check-in', document.getElementById('rcCheckIn').textContent);
        dataRow('Check-out', document.getElementById('rcCheckOut').textContent);
        dataRow('Duration', document.getElementById('rcNights').textContent);
        dataRow('Guests', document.getElementById('rcGuests').textContent);

        // Child ages if present
        var rcChildEl = document.getElementById('rcChildNote');
        if (rcChildEl && rcChildEl.style.display !== 'none') {
            var childText = rcChildEl.querySelector('span');
            if (childText) {
                var lines = childText.textContent.split('\n');
                for (var ci = 0; ci < lines.length; ci++) {
                    if (lines[ci].trim()) {
                        var parts = lines[ci].split(':');
                        if (parts.length === 2) {
                            var isCharged = parts[1].indexOf('+$') !== -1;
                            dataRow(parts[0].trim(), parts[1].trim(), isCharged ? red : [44, 110, 73]);
                        }
                    }
                }
            }
        }

        y += 2;
        ornament();

        // ── GUEST INFORMATION ──
        sectionHeader('GUEST INFORMATION');
        dataRow('Name', document.getElementById('rcName').textContent);
        dataRow('Email', document.getElementById('rcEmail').textContent);
        dataRow('Phone', document.getElementById('rcPhone').textContent);

        y += 2;
        ornament();

        // ── BILLING SUMMARY ──
        sectionHeader('BILLING SUMMARY');
        dataRow('Room Subtotal', document.getElementById('rcSubtotal').textContent);

        var surTotalEl = document.getElementById('rcSurchargeTotal');
        if (surTotalEl && surTotalEl.style.display !== 'none') {
            dataRow('Extra Adult', document.getElementById('rcSurchargeAmt').textContent, red);
        }

        var childChargeEl = document.getElementById('rcChildChargeRow');
        if (childChargeEl && childChargeEl.style.display !== 'none') {
            dataRow('Children (' + CHILD_CHARGE_AGE + '+ yrs)', document.getElementById('rcChildChargeAmt').textContent, red);
        }

        dataRow('VAT (18%)', document.getElementById('rcVat').textContent);
        dataRow('Service Charge (5%)', document.getElementById('rcService').textContent);

        // Total bar
        y += 1;
        doc.setFillColor.apply(doc, greenDark);
        doc.roundedRect(mx, y, cw, 12, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor.apply(doc, white);
        doc.text('TOTAL', mx + 6, y + 7.5);
        doc.setFontSize(14);
        doc.setTextColor.apply(doc, gold);
        doc.text(document.getElementById('rcTotal').textContent || '', pw - mx - 6, y + 7.5, { align: 'right' });

        y += 20;

        // ── NOTICE ──
        doc.setFillColor(240, 250, 244);
        doc.roundedRect(mx, y, cw, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, greenDark);
        doc.text('This is a booking preview. Submit the booking to receive an official confirmation.', pw / 2, y + 5.5, { align: 'center', maxWidth: cw - 12 });
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, gray);
        doc.text('Questions? reservations@lvhotel.co.ug  |  +256 312 310 100  |  WhatsApp: +256 772 268 040', pw / 2, y + 10.5, { align: 'center' });

        y += 18;

        // ── PAYMENT NOTICE ──
        doc.setFillColor(255, 248, 225);
        doc.setDrawColor.apply(doc, gold);
        doc.setLineWidth(0.4);
        doc.roundedRect(mx, y, cw, 9, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor.apply(doc, [122, 99, 32]);
        doc.text('All payments are made at the premises/Hotel.', pw / 2, y + 5.8, { align: 'center' });

        y += 15;

        // ── FOOTER BAR ──
        var footY = doc.internal.pageSize.getHeight() - 18;
        doc.setFillColor.apply(doc, greenDark);
        doc.rect(0, footY, pw, 18, 'F');

        doc.setFontSize(8);
        doc.setTextColor.apply(doc, gold);
        doc.text('LAKE VICTORIA HOTEL', pw / 2, footY + 6, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255, 0.45);
        doc.text('P.O.Box 15, Entebbe. Plot 23-31, Circular Road, Entebbe, Uganda', pw / 2, footY + 10.5, { align: 'center' });
        doc.setTextColor(255, 255, 255, 0.35);
        doc.text('+256 312 310 100  •  reservations@lvhotel.co.ug  •  WhatsApp: +256 772 268 040', pw / 2, footY + 14.5, { align: 'center' });

        // Save
        var roomName = (document.getElementById('rcRoom').textContent || 'booking').replace(/\s+/g, '-');
        doc.save('LVH-Booking-' + roomName + '.pdf');
        lvhTrackEvent('pdf_download', roomName);
    });
}

// Step 3: "Submit Booking" — actually send the email
if (rcConfirmBtn) {
    rcConfirmBtn.addEventListener('click', function () {
        var bmSendError = document.getElementById('bmSendError');
        if (bmSendError) bmSendError.style.display = 'none';

        function bmShowSuccess() {
            if (bmReceipt) bmReceipt.style.display = 'none';
            bmForm.style.display = 'none';
            if (bmSuccess) bmSuccess.style.display = 'flex';
            setTimeout(function () {
                closeBookingModal();
                bmForm.style.display = '';
                if (bmSuccess) bmSuccess.style.display = 'none';
            }, 4000);
        }

        // Gather booking data
        var bkRoom     = bmRoomName  ? bmRoomName.textContent  : 'Room';
        var bkRoomKey  = getInternalRoom();
        var bkPrice    = bmRoomPrice ? bmRoomPrice.textContent : '';
        var bkIn       = bmCheckIn   ? bmCheckIn.value         : '';
        var bkOut      = bmCheckOut  ? bmCheckOut.value        : '';
        var bkAdults   = document.getElementById('bmAdults').value;
        var bkChildren = document.getElementById('bmChildren').value;
        var bkName     = document.getElementById('bmName').value;
        var bkEmail    = document.getElementById('bmEmail').value;
        var bkPhone    = document.getElementById('bmPhone').value;

        var bkNights = '';
        if (bkIn && bkOut) {
            var diff = Math.round((new Date(bkOut) - new Date(bkIn)) / 86400000);
            bkNights = diff > 0 ? diff + (diff === 1 ? ' Night' : ' Nights') : '';
        }

        var bkRef    = 'LVH-' + Date.now().toString(36).toUpperCase();
        var bkGuests = bkAdults + ' Adult' + (bkAdults > 1 ? 's' : '') + (bkChildren > 0 ? ', ' + bkChildren + ' Child' + (bkChildren > 1 ? 'ren' : '') : '');
        var hasSurcharge = parseInt(bkAdults) >= 2 && surchargeRooms.indexOf(bkRoomKey) !== -1;
        var surchargeLine = hasSurcharge ? '  Extra Adult    │  + $' + EXTRA_ADULT_FEE + '/night' + '\n' : '';

        // Compute billing for email
        var nightCount = 0;
        if (bkIn && bkOut) {
            nightCount = Math.round((new Date(bkOut) - new Date(bkIn)) / 86400000);
            if (nightCount < 1) nightCount = 1;
        }
        var roomRate       = parseRate(bkPrice);
        var roomSubtotal   = roomRate * nightCount;
        var surchargeAmt   = hasSurcharge ? EXTRA_ADULT_FEE * nightCount : 0;
        var exempt         = childFreeRooms.indexOf(bkRoomKey) !== -1;
        var chargeKids     = exempt ? 0 : getChargeableChildren();
        var childChargeAmt = chargeKids * CHILD_FEE * nightCount;
        var netAmount      = roomSubtotal + surchargeAmt + childChargeAmt;
        var vatAmount      = Math.round(netAmount * VAT_RATE * 100) / 100;
        var serviceAmt     = Math.round(netAmount * SERVICE_RATE * 100) / 100;
        var totalAmount    = Math.round((netAmount + vatAmount + serviceAmt) * 100) / 100;

        // Build child age details for email
        var childAgeLines = '';
        if (parseInt(bkChildren) > 0 && !exempt) {
            var ageSelects = bmChildAgesList ? bmChildAgesList.querySelectorAll('.bm-child-age-select') : [];
            ageSelects.forEach(function (s, i) {
                var a = parseInt(s.value);
                if (!isNaN(a)) {
                    childAgeLines += '  Child ' + (i + 1) + ' Age    │  ' + a + ' yrs' + (a >= CHILD_CHARGE_AGE ? ' (+$' + CHILD_FEE + '/night)' : ' (free)') + '\n';
                }
            });
        }

        var ln  = '\n';
        var div = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        var sep = '──────────────────────────────────────────';

        var bkBody = ''
        + div + ln
        + '       LAKE VICTORIA HOTEL' + ln
        + '       Booking Confirmation' + ln
        + div + ln
        + ln
        + '  REFERENCE: ' + bkRef + ln
        + ln
        + '  ROOM DETAILS' + ln
        + sep + ln
        + '  Room Type      │  ' + bkRoom + ln
        + '  Rate           │  ' + bkPrice + ' / night' + ln
        + surchargeLine
        + sep + ln
        + ln
        + '  STAY DETAILS' + ln
        + sep + ln
        + '  Check-in       │  ' + fmtDate(bkIn) + '  (from 2:00 PM)' + ln
        + '  Check-out      │  ' + fmtDate(bkOut) + '  (by 11:00 AM)' + ln
        + '  Duration       │  ' + (bkNights || '—') + ln
        + '  Guests         │  ' + bkGuests + ln
        + childAgeLines
        + sep + ln
        + ln
        + '  GUEST INFORMATION' + ln
        + sep + ln
        + '  Name           │  ' + bkName + ln
        + '  Email          │  ' + bkEmail + ln
        + '  Phone          │  ' + bkPhone + ln
        + sep + ln
        + ln
        + '  BILLING SUMMARY' + ln
        + sep + ln
        + '  Room Subtotal  │  $' + roomSubtotal.toFixed(2) + ln
        + (hasSurcharge ? '  Extra Adult    │  $' + surchargeAmt.toFixed(2) + ln : '')
        + (childChargeAmt > 0 ? '  Children (' + CHILD_CHARGE_AGE + '+)  │  $' + childChargeAmt.toFixed(2) + ln : '')
        + '  VAT (18%)      │  $' + vatAmount.toFixed(2) + ln
        + '  Service (5%)   │  $' + serviceAmt.toFixed(2) + ln
        + sep + ln
        + '  TOTAL          │  $' + totalAmount.toFixed(2) + ln
        + div + ln
        + ln
        + '  Our reservations team will confirm availability' + ln
        + '  and send payment details within 24 hours.' + ln
        + ln
        + div + ln
        + '  Lake Victoria Hotel · Entebbe, Uganda' + ln
        + '  P.O.Box 15, Entebbe. Plot 23-31, Circular Road' + ln
        + '  Tel: +256 312 310 100 · WhatsApp: +256 772 268 040' + ln
            + '  reservations@lvhotel.co.ug' + ln
        + div;

        if (WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY') {
            rcConfirmBtn.disabled = true;
            rcConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            // Build guest auto-reply confirmation
            var autoReply = ''
            + 'Dear ' + bkName.split(' ')[0] + ',' + ln
            + ln
            + 'Thank you for choosing Lake Victoria Hotel!' + ln
            + 'We have received your booking request. Details below:' + ln
            + ln
            + div + ln
            + '  BOOKING REFERENCE: ' + bkRef + ln
            + div + ln
            + ln
            + '  Room          │  ' + bkRoom + ln
            + '  Rate          │  ' + bkPrice + ' / night' + ln
            + '  Check-in      │  ' + fmtDate(bkIn) + '  (from 2:00 PM)' + ln
            + '  Check-out     │  ' + fmtDate(bkOut) + '  (by 11:00 AM)' + ln
            + '  Duration      │  ' + (bkNights || '—') + ln
            + '  Guests        │  ' + bkGuests + ln
            + childAgeLines
            + ln
            + sep + ln
            + '  BILLING SUMMARY' + ln
            + sep + ln
            + '  Room Subtotal │  $' + roomSubtotal.toFixed(2) + ln
            + (hasSurcharge ? '  Extra Adult   │  $' + surchargeAmt.toFixed(2) + ln : '')
            + (childChargeAmt > 0 ? '  Children (' + CHILD_CHARGE_AGE + '+) │  $' + childChargeAmt.toFixed(2) + ln : '')
            + '  VAT (18%)     │  $' + vatAmount.toFixed(2) + ln
            + '  Service (5%)  │  $' + serviceAmt.toFixed(2) + ln
            + sep + ln
            + '  TOTAL         │  $' + totalAmount.toFixed(2) + ln
            + sep + ln
            + ln
            + 'NEXT STEPS' + ln
            + '  Our reservations team will confirm availability' + ln
            + '  and send payment details within 24 hours.' + ln
            + ln
            + '  All payments are made at the premises.' + ln
            + ln
            + div + ln
            + '  Lake Victoria Hotel · Entebbe, Uganda' + ln
            + '  P.O.Box 15, Entebbe. Plot 23-31, Circular Road' + ln
            + '  Tel: +256 312 310 100' + ln
            + '  WhatsApp: +256 772 268 040' + ln
            + '  Email: reservations@lvhotel.co.ug' + ln
            + div;

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject:    'New Booking: ' + bkRoom + ' — ' + fmtDate(bkIn),
                    from_name:  'Lake Victoria Hotel Bookings',
                    replyto:    bkEmail,
                    email:      bkEmail,
                    _autoresponse: autoReply,
                    message:    bkBody
                })
            }).then(function (res) { return res.json(); })
              .then(function (data) {
                  if (data.success) {
                      lvhTrackEvent('booking_confirmed', bkRoom + ' | ' + bkName + ' | ' + fmtDate(bkIn) + ' - ' + fmtDate(bkOut));
                      bmShowSuccess();
                  } else {
                      throw new Error(data.message);
                  }
              }).catch(function (err) {
                  console.error('Booking send error:', err);
                  if (bmReceipt) bmReceipt.style.display = 'none';
                  if (bmForm)    bmForm.style.display    = '';
                  if (bmSendError) bmSendError.style.display = 'flex';
                  rcConfirmBtn.disabled = false;
                  rcConfirmBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Booking';
              });
        } else {
            lvhTrackEvent('booking_confirmed', bkRoom + ' | ' + bkName + ' | ' + fmtDate(bkIn) + ' - ' + fmtDate(bkOut));
            bmShowSuccess(); // fallback when key not configured
        }
    });
}


/* =============================================
   FEEDBACK WIDGET — Floating button + modal
   ============================================= */
(function initFeedbackWidget() {
    var fbBtn     = document.getElementById('feedbackBtn');
    var fbOverlay = document.getElementById('feedbackOverlay');
    var fbModal   = document.getElementById('feedbackModal');
    var fbClose   = document.getElementById('feedbackClose');
    var fbStars   = document.getElementById('fbStars');
    var fbLabel   = document.getElementById('fbRatingLabel');
    var fbNameEl    = document.getElementById('fbName');
    var fbRoomRefEl = document.getElementById('fbRoomRef');
    var fbEmailEl   = document.getElementById('fbEmail');
    var fbMsgEl     = document.getElementById('fbMessage');
    var fbSubmit  = document.getElementById('fbSubmitBtn');
    var fbForm    = document.getElementById('feedbackForm');
    var fbSuccess = document.getElementById('feedbackSuccess');

    if (!fbBtn || !fbModal) return;

    var LVH_FEEDBACK_KEY = 'lvh_feedback';
    var selectedRating = 0;
    var ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    // Build 5 star icons
    if (fbStars) {
        var starsHtml = '';
        for (var i = 1; i <= 5; i++) {
            starsHtml += '<i class="far fa-star" data-rating="' + i + '"></i>';
        }
        fbStars.innerHTML = starsHtml;
    }

    // Star hover preview
    var starEls = fbStars ? fbStars.querySelectorAll('i') : [];

    function highlightStars(n, cls) {
        starEls.forEach(function (s, idx) {
            if (idx < n) {
                s.classList.add(cls);
                s.className = s.className.replace('far', 'fas');
            } else {
                s.classList.remove(cls);
                if (idx >= selectedRating) {
                    s.className = s.className.replace('fas', 'far');
                }
            }
        });
    }

    starEls.forEach(function (star) {
        star.addEventListener('mouseenter', function () {
            var r = parseInt(star.dataset.rating);
            highlightStars(r, 'hovered');
            if (fbLabel) fbLabel.textContent = ratingLabels[r] || '';
        });

        star.addEventListener('mouseleave', function () {
            // Reset to selected state
            starEls.forEach(function (s, idx) {
                s.classList.remove('hovered');
                if (idx < selectedRating) {
                    s.className = s.className.replace('far', 'fas');
                    s.classList.add('active');
                } else {
                    s.className = s.className.replace('fas', 'far');
                    s.classList.remove('active');
                }
            });
            if (fbLabel) fbLabel.textContent = selectedRating > 0 ? ratingLabels[selectedRating] : '';
        });

        star.addEventListener('click', function () {
            selectedRating = parseInt(star.dataset.rating);
            starEls.forEach(function (s, idx) {
                s.classList.remove('hovered');
                if (idx < selectedRating) {
                    s.className = s.className.replace('far', 'fas');
                    s.classList.add('active');
                } else {
                    s.className = s.className.replace('fas', 'far');
                    s.classList.remove('active');
                }
            });
            if (fbLabel) fbLabel.textContent = ratingLabels[selectedRating];
        });
    });

    // Open / close
    function openFeedback() {
        fbOverlay && fbOverlay.classList.add('active');
        fbModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeFeedback() {
        fbOverlay && fbOverlay.classList.remove('active');
        fbModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    fbBtn.addEventListener('click', openFeedback);
    if (fbClose) fbClose.addEventListener('click', closeFeedback);
    if (fbOverlay) fbOverlay.addEventListener('click', closeFeedback);

    // Reset form
    function resetForm() {
        selectedRating = 0;
        starEls.forEach(function (s) {
            s.className = s.className.replace('fas', 'far');
            s.classList.remove('active', 'hovered');
        });
        if (fbLabel)   fbLabel.textContent = '';
        if (fbNameEl)    fbNameEl.value = '';
        if (fbRoomRefEl) fbRoomRefEl.value = '';
        if (fbEmailEl)   fbEmailEl.value = '';
        if (fbMsgEl)   fbMsgEl.value = '';
        if (fbForm)    fbForm.style.display = '';
        if (fbSuccess) fbSuccess.style.display = 'none';
    }

    // Submit
    if (fbSubmit) {
        fbSubmit.addEventListener('click', function () {
            // Validate
            var name    = (fbNameEl    && fbNameEl.value.trim())    || '';
            var roomRef = (fbRoomRefEl && fbRoomRefEl.value.trim()) || '';
            var msg     = (fbMsgEl     && fbMsgEl.value.trim())     || '';
            var email   = (fbEmailEl   && fbEmailEl.value.trim())   || '';

            if (selectedRating === 0 || !name || !msg) {
                fbModal.classList.add('fb-shake');
                setTimeout(function () { fbModal.classList.remove('fb-shake'); }, 400);
                return;
            }

            // Save to localStorage
            var entry = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
                name: name,
                roomRef: roomRef,
                email: email,
                rating: selectedRating,
                message: msg,
                page: location.pathname.split('/').pop() || 'index.html',
                timestamp: new Date().toISOString()
            };

            // Save raw feedback as backup
            var fbSaved = false;
            try {
                var arr = JSON.parse(localStorage.getItem(LVH_FEEDBACK_KEY) || '[]');
                arr.push(entry);
                localStorage.setItem(LVH_FEEDBACK_KEY, JSON.stringify(arr));
                fbSaved = true;
            } catch (e) {
                console.error('[LVH Feedback] Failed to save to lvh_feedback:', e);
            }

            // Save directly into dashboard data so it appears in Messages immediately
            var dashSaved = false;
            try {
                var dashStore = JSON.parse(localStorage.getItem('lvh_dashboard') || 'null');
                if (dashStore) {
                    var stars = '';
                    for (var si = 1; si <= 5; si++) stars += (si <= entry.rating ? '\u2605' : '\u2606');
                    var nextMsgId = (dashStore.messages || []).reduce(function (mx, m) { return Math.max(mx, m.id || 0); }, 0) + 1;
                    var dashMsg = {
                        id: nextMsgId,
                        sender: entry.name,
                        subject: 'Guest Feedback \u2014 ' + entry.rating + '\u2605',
                        preview: entry.message.substring(0, 80) + (entry.message.length > 80 ? '...' : ''),
                        body: entry.message + '\n\nRating: ' + stars + ' (' + entry.rating + '/5)' +
                              (entry.roomRef ? '\nRoom / Walk-in: ' + entry.roomRef : '') +
                              (entry.email ? '\nEmail: ' + entry.email : '') +
                              '\nPage: ' + entry.page,
                        time: entry.timestamp,
                        read: false,
                        _feedbackId: entry.id,
                        _rating: entry.rating,
                        _type: 'feedback',
                        showOnHomepage: false,
                        _country: ''
                    };
                    if (!dashStore.messages) dashStore.messages = [];
                    dashStore.messages.unshift(dashMsg);
                    // Update guest rating
                    var gr = dashStore.guestRating || { average: 0, count: 0 };
                    var nc = gr.count + 1;
                    dashStore.guestRating = { average: Math.round(((gr.average * gr.count) + entry.rating) / nc * 10) / 10, count: nc };
                    localStorage.setItem('lvh_dashboard', JSON.stringify(dashStore));
                    dashSaved = true;
                } else {
                    console.warn('[LVH Feedback] No dashboard data in localStorage — creating fresh entry');
                    // Create minimal dashboard data with this feedback
                    var freshDash = { messages: [], guestRating: { average: entry.rating, count: 1 } };
                    var stars2 = '';
                    for (var si2 = 1; si2 <= 5; si2++) stars2 += (si2 <= entry.rating ? '\u2605' : '\u2606');
                    freshDash.messages.push({
                        id: 1,
                        sender: entry.name,
                        subject: 'Guest Feedback \u2014 ' + entry.rating + '\u2605',
                        preview: entry.message.substring(0, 80) + (entry.message.length > 80 ? '...' : ''),
                        body: entry.message + '\n\nRating: ' + stars2 + ' (' + entry.rating + '/5)' +
                              (entry.roomRef ? '\nRoom / Walk-in: ' + entry.roomRef : '') +
                              (entry.email ? '\nEmail: ' + entry.email : '') +
                              '\nPage: ' + entry.page,
                        time: entry.timestamp,
                        read: false,
                        _feedbackId: entry.id,
                        _rating: entry.rating,
                        _type: 'feedback',
                        showOnHomepage: false,
                        _country: ''
                    });
                    localStorage.setItem('lvh_dashboard', JSON.stringify(freshDash));
                    dashSaved = true;
                }
            } catch (e) {
                console.error('[LVH Feedback] Failed to save to lvh_dashboard:', e);
            }

            console.log('[LVH Feedback] Saved — lvh_feedback:', fbSaved, '| lvh_dashboard:', dashSaved, '| Entry:', entry.id, entry.name, entry.rating + '★');

            // Track event
            lvhTrackEvent('guest_feedback', name + ' \u2014 ' + selectedRating + '\u2605');

            // Show success
            if (fbForm)    fbForm.style.display = 'none';
            if (fbSuccess) fbSuccess.style.display = '';

            // Auto-close after 3s
            setTimeout(function () {
                closeFeedback();
                setTimeout(resetForm, 400);
            }, 3000);
        });
    }
})();

/* =============================================
   Inquiry Widget
   ============================================= */
(function () {
    var inqBtn     = document.getElementById('inquiryBtn');
    var inqOverlay = document.getElementById('inquiryOverlay');
    var inqModal   = document.getElementById('inquiryModal');
    var inqClose   = document.getElementById('inquiryClose');
    var inqForm    = document.getElementById('inquiryForm');
    var inqSuccess = document.getElementById('inquirySuccess');
    var inqSubmit  = document.getElementById('inqSubmitBtn');

    if (!inqBtn || !inqModal) return;

    function openInquiry() {
        inqOverlay && inqOverlay.classList.add('active');
        inqModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeInquiry() {
        inqOverlay && inqOverlay.classList.remove('active');
        inqModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function resetInquiry() {
        var nameEl    = document.getElementById('inqName');
        var emailEl   = document.getElementById('inqEmail');
        var phoneEl   = document.getElementById('inqPhone');
        var subjectEl = document.getElementById('inqSubject');
        var msgEl     = document.getElementById('inqMessage');
        if (nameEl)    nameEl.value    = '';
        if (emailEl)   emailEl.value   = '';
        if (phoneEl)   phoneEl.value   = '';
        if (subjectEl) subjectEl.value = '';
        if (msgEl)     msgEl.value     = '';
        if (inqForm)    inqForm.style.display    = '';
        if (inqSuccess) inqSuccess.style.display = 'none';
        if (inqSubmit) {
            inqSubmit.disabled = false;
            inqSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Send Inquiry';
        }
    }

    inqBtn.addEventListener('click', openInquiry);
    if (inqClose)   inqClose.addEventListener('click', closeInquiry);
    if (inqOverlay) inqOverlay.addEventListener('click', closeInquiry);

    if (inqSubmit) {
        inqSubmit.addEventListener('click', function () {
            var name    = (document.getElementById('inqName')    && document.getElementById('inqName').value.trim())    || '';
            var email   = (document.getElementById('inqEmail')   && document.getElementById('inqEmail').value.trim())   || '';
            var phone   = (document.getElementById('inqPhone')   && document.getElementById('inqPhone').value.trim())   || 'Not provided';
            var subject = (document.getElementById('inqSubject') && document.getElementById('inqSubject').value.trim()) || 'General Inquiry';
            var msg     = (document.getElementById('inqMessage') && document.getElementById('inqMessage').value.trim()) || '';

            if (!name || !email || !msg) {
                inqModal.classList.add('inq-shake');
                setTimeout(function () { inqModal.classList.remove('inq-shake'); }, 400);
                return;
            }

            function showInqSuccess() {
                if (inqForm)    inqForm.style.display    = 'none';
                if (inqSuccess) inqSuccess.style.display = '';
                setTimeout(function () {
                    closeInquiry();
                    setTimeout(resetInquiry, 400);
                }, 3000);
            }

            // Save to dashboard messages
            try {
                var dashStore = JSON.parse(localStorage.getItem('lvh_dashboard') || 'null');
                var inqDate = new Date().toISOString();
                var msgBody = 'Inquiry Type: ' + subject + '\nName: ' + name + '\nEmail: ' + email + '\nPhone: ' + phone + '\n\nMessage:\n' + msg;
                var newMsg = {
                    id: Date.now(),
                    sender: name,
                    subject: 'Inquiry: ' + subject + ' — ' + name,
                    preview: msg.substring(0, 80) + (msg.length > 80 ? '...' : ''),
                    body: msgBody,
                    time: inqDate,
                    read: false,
                    _type: 'inquiry',
                    showOnHomepage: false,
                    _country: ''
                };
                if (dashStore) {
                    if (!dashStore.messages) dashStore.messages = [];
                    dashStore.messages.unshift(newMsg);
                    localStorage.setItem('lvh_dashboard', JSON.stringify(dashStore));
                }
            } catch (e) {
                console.error('[LVH Inquiry] Failed to save to dashboard:', e);
            }

            lvhTrackEvent('contact_enquiry', 'Inquiry: ' + subject + ' | ' + name);

            // Send via Web3Forms if configured
            if (typeof WEB3FORMS_KEY !== 'undefined' && WEB3FORMS_KEY !== 'YOUR_ACCESS_KEY') {
                inqSubmit.disabled = true;
                inqSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

                var ln  = '\n';
                var div = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
                var sep = '──────────────────────────────────────────';
                var cfDate = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                var body = div + ln
                    + '       LAKE VICTORIA HOTEL' + ln
                    + '       Guest Inquiry' + ln
                    + div + ln + ln
                    + '  SENDER DETAILS' + ln + sep + ln
                    + '  Name     │  ' + name + ln
                    + '  Email    │  ' + email + ln
                    + '  Phone    │  ' + phone + ln
                    + sep + ln + ln
                    + '  INQUIRY' + ln + sep + ln
                    + '  Type     │  ' + subject + ln
                    + '  Received │  ' + cfDate + ln
                    + sep + ln + ln
                    + '  MESSAGE' + ln + sep + ln
                    + '  ' + msg.replace(/\n/g, '\n  ') + ln
                    + sep + ln + ln
                    + div + ln
                    + '  Lake Victoria Hotel · Entebbe, Uganda' + ln
                    + '  Tel: +256 312 310 100 · WhatsApp: +256 772 268 040' + ln
                    + '  reservations@lvhotel.co.ug' + ln
                    + div;

                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        access_key: WEB3FORMS_KEY,
                        subject:    'Guest Inquiry: ' + subject + ' — ' + name,
                        from_name:  'Lake Victoria Hotel Website',
                        replyto:    email,
                        message:    body
                    })
                }).then(function (r) { return r.json(); })
                  .then(function (d) {
                      if (d.success) { showInqSuccess(); }
                      else { throw new Error(d.message); }
                  }).catch(function () {
                      inqSubmit.disabled = false;
                      inqSubmit.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed — Try Again';
                      setTimeout(function () {
                          inqSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Send Inquiry';
                      }, 3000);
                  });
            } else {
                showInqSuccess();
            }
        });
    }
})();
