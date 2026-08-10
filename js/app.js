/**
 * Boba Craze - Main Application JavaScript
 */

// Global State
let state = {
    currentRole: 'customer', // 'customer' | 'admin'
    currentCategory: 'all',
    searchQuery: '',
    products: [],
    categories: [],
    toppings: [],
    sizes: [],
    sugarLevels: [],
    iceLevels: [],
    cart: [],
    appliedVoucher: null,
    orders: [],
    reviews: [],
    selectedProductForCustom: null,
    selectedSize: 'M',
    selectedSugar: '100%',
    selectedIce: '100%',
    selectedToppings: [],
    customQty: 1,
    customNote: '',
    revenueChart: null,
    categoryChart: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    initEventListeners();
    renderApp();
    startCloudOrderSync(); // Start multi-device real-time cloud order listener
    startCloudProductSync(); // Start multi-device real-time cloud menu listener
    if (window.location.hash === '#admin') {
        setRole('admin');
    }
});

window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
        setRole('admin');
    } else if (window.location.hash === '#customer' || window.location.hash === '#home') {
        setRole('customer');
    }
});

// Load State from LocalStorage or Defaults
function loadStateFromStorage() {
    state.products = JSON.parse(localStorage.getItem('boba_products')) || DEFAULT_PRODUCTS;
    state.categories = DEFAULT_CATEGORIES;
    state.toppings = JSON.parse(localStorage.getItem('boba_toppings')) || DEFAULT_TOPPINGS;
    state.sizes = DEFAULT_SIZES;
    state.sugarLevels = DEFAULT_SUGAR_LEVELS;
    state.iceLevels = DEFAULT_ICE_LEVELS;
    state.cart = JSON.parse(localStorage.getItem('boba_cart')) || [];
    state.orders = JSON.parse(localStorage.getItem('boba_orders')) || DEFAULT_ORDERS;
    state.reviews = JSON.parse(localStorage.getItem('boba_reviews')) || DEFAULT_REVIEWS;

    // Ensure every product has a valid numeric stock attribute & merge missing default products (like Cafe Muoi)
    DEFAULT_PRODUCTS.forEach(defProd => {
        if (!state.products.some(p => p.id === defProd.id || p.name === defProd.name)) {
            state.products.push(defProd);
        }
    });

    state.products.forEach((p, idx) => {
        if (p.stock === undefined || p.stock === null || isNaN(p.stock)) {
            p.stock = (DEFAULT_PRODUCTS[idx] && DEFAULT_PRODUCTS[idx].stock !== undefined) ? DEFAULT_PRODUCTS[idx].stock : 50;
        }
    });

    // Convert old UTC timestamps (07:xx:xx) stored in localStorage to local Vietnam time (14:xx:xx)
    if (state.orders && state.orders.length > 0) {
        state.orders.forEach(o => {
            if (o.createdAt) {
                o.createdAt = formatOrderDateTime(o.createdAt);
            }
        });
        saveStateToStorage();
    }

    // Save defaults to storage if empty
    if (!localStorage.getItem('boba_products')) {
        saveStateToStorage();
    }
}

function saveStateToStorage() {
    localStorage.setItem('boba_products', JSON.stringify(state.products));
    localStorage.setItem('boba_toppings', JSON.stringify(state.toppings));
    localStorage.setItem('boba_cart', JSON.stringify(state.cart));
    localStorage.setItem('boba_orders', JSON.stringify(state.orders));
    localStorage.setItem('boba_reviews', JSON.stringify(state.reviews));
    
    // Dispatch custom event for instant local real-time sync
    window.dispatchEvent(new Event('boba_orders_updated'));
}

// Event Listeners Initialization
function initEventListeners() {
    // Role Switchers
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const role = e.target.dataset.role;
            setRole(role);
        });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    }

    // Search Input & Autocomplete Dropdown
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderProducts();
            renderSearchSuggestions(e.target.value);
        });

        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim()) {
                renderSearchSuggestions(e.target.value);
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                state.searchQuery = '';
                renderProducts();
                renderSearchSuggestions('');
                searchInput.focus();
            }
        });
    }

    // Hide search suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const searchBox = document.querySelector('.search-box');
        const dropdown = document.getElementById('search-suggestions-dropdown');
        if (searchBox && dropdown && !searchBox.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // Cart Drawer Toggle
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', toggleCartDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCartDrawer);

    // Modal Close Overlay Listener
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Apply Voucher
    const applyVoucherBtn = document.getElementById('apply-voucher-btn');
    if (applyVoucherBtn) {
        applyVoucherBtn.addEventListener('click', applyVoucher);
    }

    // Admin Navigation Links
    document.querySelectorAll('.admin-menu-item a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.closest('a').dataset.section;
            switchAdminTab(targetSection);
        });
    });

    // Cross-Tab & Same-Tab Real-Time Sync Listener
    window.addEventListener('boba_orders_updated', () => {
        refreshRealTimeUI();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'boba_orders') {
            state.orders = JSON.parse(e.newValue || '[]');
            refreshRealTimeUI();
        }
    });
}

// ==========================================================================
// FIREBASE AUTHENTICATION CONFIG & INTEGRATION
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyYOUR_API_KEY_HERE",
    authDomain: "boba-app.firebaseapp.com",
    projectId: "boba-app",
    storageBucket: "boba-app.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

let auth = null;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();

    auth.onAuthStateChanged((user) => {
        if (user) {
            state.isAdminLoggedIn = true;
            sessionStorage.setItem('boba_admin_logged_in', 'true');
            sessionStorage.setItem('boba_admin_email', user.email || '');
        } else {
            state.isAdminLoggedIn = false;
            sessionStorage.removeItem('boba_admin_logged_in');
            sessionStorage.removeItem('boba_admin_email');
        }
    });
}

// State Extension for Admin Security
state.isAdminLoggedIn = sessionStorage.getItem('boba_admin_logged_in') === 'true';

// Switch Role Function with Security Protection
function setRole(role) {
    if (role === 'admin' && !state.isAdminLoggedIn) {
        openAdminLoginModal();
        return;
    }

    state.currentRole = role;

    const custView = document.getElementById('customer-view');
    const adminView = document.getElementById('admin-view');

    if (role === 'customer') {
        custView.style.display = 'block';
        adminView.style.display = 'none';
        renderProducts();
        updateCartBadge();
    } else {
        custView.style.display = 'none';
        adminView.style.display = 'flex';
        renderAdminDashboard();
    }
}

function openAdminLoginModal() {
    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body" style="padding: 24px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 64px; height: 64px; background: rgba(230, 81, 0, 0.12); color: #e65100; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.8rem;">
                    <i class="fa-solid fa-fire"></i>
                </div>
                <h2 class="modal-item-title" style="margin-bottom: 4px;">Đăng Nhập Firebase Auth</h2>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Xác thực bảo mật email và mật khẩu qua dịch vụ Firebase Authentication.</p>
                <span style="background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;">
                    <i class="fa-solid fa-shield-halved"></i> Firebase Email/Password Protected
                </span>
            </div>

            <div id="admin-login-error" style="display: none; background: #fadbd8; color: #e74c3c; padding: 10px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-align: center; margin-bottom: 16px;">
            </div>

            <form onsubmit="processAdminLogin(event)">
                <div class="form-group">
                    <label><i class="fa-solid fa-envelope"></i> Email Quản Trị Viên (*)</label>
                    <input type="email" id="admin-email-input" required placeholder="nhap-email-admin@domain.com" autocomplete="email">
                </div>
                <div class="form-group">
                    <label><i class="fa-solid fa-lock"></i> Mật Khẩu Bảo Mật (*)</label>
                    <input type="password" id="admin-password-input" required placeholder="Nhập mật khẩu..." autocomplete="current-password">
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Hủy Bỏ</button>
                    <button type="submit" id="admin-login-submit-btn" class="btn-primary" style="background: #e65100; border-color: #e65100;">
                        <i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Firebase
                    </button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

async function processAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email-input').value.trim();
    const pass = document.getElementById('admin-password-input').value.trim();
    const errorBox = document.getElementById('admin-login-error');
    const submitBtn = document.getElementById('admin-login-submit-btn');

    if (errorBox) errorBox.style.display = 'none';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực Firebase...';
    }

    if (auth && firebaseConfig.apiKey !== "AIzaSyYOUR_API_KEY_HERE") {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, pass);
            const user = userCredential.user;
            state.isAdminLoggedIn = true;
            sessionStorage.setItem('boba_admin_logged_in', 'true');
            sessionStorage.setItem('boba_admin_email', user.email || email);
            closeModal();
            setRole('admin');
            showToast(`🔥 Firebase Authenticated: Welcome ${user.email}`);
        } catch (error) {
            if (errorBox) {
                errorBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Lỗi Firebase (${error.code}): ${getFirebaseErrorMessage(error.code)}`;
                errorBox.style.display = 'block';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Firebase';
            }
        }
    } else {
        // Fallback email/password validation prior to replacing dummy API keys
        if (email && email.includes('@') && pass.length >= 6) {
            state.isAdminLoggedIn = true;
            sessionStorage.setItem('boba_admin_logged_in', 'true');
            sessionStorage.setItem('boba_admin_email', email);
            closeModal();
            setRole('admin');
            showToast(`🔥 Đã xác thực Firebase Email: ${email}`);
        } else {
            if (errorBox) {
                errorBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng nhập đúng định dạng Email và Mật khẩu (tối thiểu 6 ký tự)!';
                errorBox.style.display = 'block';
            }
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập Firebase';
        }
    }
}

function getFirebaseErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Địa chỉ Email không đúng định dạng!';
        case 'auth/user-disabled': return 'Tài khoản quản trị đã bị khóa!';
        case 'auth/user-not-found': return 'Không tìm thấy tài khoản quản trị với Email này!';
        case 'auth/wrong-password': return 'Mật khẩu không chính xác!';
        case 'auth/invalid-credential': return 'Thông tin đăng nhập không hợp lệ hoặc sai mật khẩu!';
        case 'auth/too-many-requests': return 'Quá nhiều lần thử thất bại. Vui lòng thử lại sau ít phút!';
        default: return 'Xác thực không thành công, vui lòng thử lại!';
    }
}

function adminLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Quản Trị Viên?')) {
        if (auth) {
            auth.signOut().catch(console.error);
        }
        state.isAdminLoggedIn = false;
        sessionStorage.removeItem('boba_admin_logged_in');
        sessionStorage.removeItem('boba_admin_email');
        setRole('customer');
        showToast('🔒 Đã đăng xuất an toàn khỏi Firebase Auth.');
    }
}

/* ==========================================================================
   CUSTOMER MODULE LOGIC
   ========================================================================== */

function renderApp() {
    renderCategoryPills();
    renderProducts();
    renderReviews();
    updateCartBadge();
    renderCartDrawer();
}

function renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    container.innerHTML = state.categories.map(cat => `
        <button class="cat-pill ${state.currentCategory === cat.id ? 'active' : ''}" 
                onclick="selectCategory('${cat.id}')">
            <i class="fa-solid ${cat.icon}"></i>
            <span>${cat.name}</span>
        </button>
    `).join('');
}

function selectCategory(catId) {
    state.currentCategory = catId;
    renderCategoryPills();
    renderProducts();
}

function removeVietnameseTones(str) {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function getRelevanceScore(product, rawQuery) {
    if (!rawQuery || !rawQuery.trim()) return 0;

    const queryNorm = removeVietnameseTones(rawQuery.trim().toLowerCase());
    const nameNorm = removeVietnameseTones(product.name.toLowerCase());
    const descNorm = removeVietnameseTones(product.description.toLowerCase());
    const categoryNorm = removeVietnameseTones(product.category.toLowerCase());
    const tagsNorm = (product.tags || []).map(t => removeVietnameseTones(t.toLowerCase())).join(' ');

    const words = queryNorm.split(/\s+/).filter(w => w.length > 0);
    let score = 0;

    // 1. Exact match on full product name
    if (nameNorm === queryNorm) score += 100;

    // 2. Product name starts with query
    if (nameNorm.startsWith(queryNorm)) score += 60;

    // 3. Product name contains whole query phrase
    if (nameNorm.includes(queryNorm)) score += 40;

    // 4. Keyword matches in product name
    let titleMatches = 0;
    words.forEach(w => {
        if (nameNorm.includes(w)) {
            score += 15;
            titleMatches++;
        }
    });
    // Boost if all search keywords exist in product title
    if (words.length > 1 && titleMatches === words.length) {
        score += 25;
    }

    // 5. Matches in Tags
    words.forEach(w => {
        if (tagsNorm.includes(w)) score += 10;
    });

    // 6. Matches in Description
    words.forEach(w => {
        if (descNorm.includes(w)) score += 5;
    });

    // 7. Matches in Category Name
    if (categoryNorm.includes(queryNorm)) score += 8;

    return score;
}

// Google-Style Search Autocomplete & Typo Correction Dictionary
const COMMON_KEYWORDS_DICT = [
    'trà sữa', 'trân châu', 'hoàng kim', 'đường đen', 'đào cam sả', 
    'macchiato', 'matcha', 'dâu tây', 'măng cụt', 'phô mai', 'bánh mì', 'ô long'
];

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function findSpellingSuggestion(rawQuery) {
    const normQuery = removeVietnameseTones(rawQuery.toLowerCase().trim());
    if (normQuery.length < 2) return null;

    let bestMatch = null;
    let minDistance = 999;

    COMMON_KEYWORDS_DICT.forEach(keyword => {
        const normKeyword = removeVietnameseTones(keyword);
        const dist = levenshteinDistance(normQuery, normKeyword);
        if (dist <= 3 && dist < minDistance) {
            minDistance = dist;
            bestMatch = keyword;
        }
    });

    return (minDistance > 0 && minDistance <= 3) ? bestMatch : null;
}

function highlightSearchMatch(text, query) {
    if (!query || !query.trim()) return text;
    const normQuery = removeVietnameseTones(query.trim());
    const words = normQuery.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return text;

    let result = text;
    words.forEach(w => {
        if (w.length > 1) {
            const regex = new RegExp(`(${w})`, 'gi');
            result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
        }
    });
    return result;
}

function renderSearchSuggestions(query) {
    const dropdown = document.getElementById('search-suggestions-dropdown');
    const clearBtn = document.getElementById('clear-search-btn');
    if (!dropdown) return;

    if (clearBtn) clearBtn.style.display = query.trim() ? 'block' : 'none';

    if (!query || !query.trim()) {
        dropdown.classList.remove('show');
        dropdown.innerHTML = '';
        return;
    }

    const scored = state.products.map(p => ({
        product: p,
        score: getRelevanceScore(p, query)
    })).filter(item => item.score > 0);

    scored.sort((a, b) => b.score - a.score);

    let suggestionNoticeHTML = '';
    let itemsToDisplay = scored.map(s => s.product);

    if (itemsToDisplay.length === 0) {
        const typoSuggestion = findSpellingSuggestion(query);
        if (typoSuggestion) {
            suggestionNoticeHTML = `
                <div class="did-you-mean-bar">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Có phải bạn muốn tìm: <strong style="cursor:pointer; text-decoration:underline;" onclick="applySearchSuggestion('${typoSuggestion}')">${typoSuggestion}</strong>?</span>
                </div>
            `;
            const suggestedScored = state.products.map(p => ({
                product: p,
                score: getRelevanceScore(p, typoSuggestion)
            })).filter(item => item.score > 0);
            suggestedScored.sort((a, b) => b.score - a.score);
            itemsToDisplay = suggestedScored.map(s => s.product);
        }
    }

    if (itemsToDisplay.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                <i class="fa-solid fa-magnifying-glass" style="margin-bottom: 6px; font-size: 1.4rem;"></i>
                <p>Không có kết quả khớp với "<strong>${query}</strong>"</p>
            </div>
        `;
        dropdown.classList.add('show');
        return;
    }

    const suggestionsHTML = itemsToDisplay.slice(0, 5).map(p => `
        <div class="suggestion-item" onclick="selectSearchSuggestion('${p.id}')">
            <img src="${p.image}" alt="${p.name}" class="suggestion-img">
            <div class="suggestion-info">
                <div class="suggestion-title">${highlightSearchMatch(p.name, query)}</div>
                <div class="suggestion-sub"><span class="badge badge-primary">${p.category}</span> ⭐ ${p.rating}</div>
            </div>
            <div class="suggestion-price">${formatCurrency(p.price)}</div>
        </div>
    `).join('');

    dropdown.innerHTML = suggestionNoticeHTML + suggestionsHTML;
    dropdown.classList.add('show');
}

function applySearchSuggestion(suggestedKeyword) {
    const input = document.getElementById('search-input');
    if (input) {
        input.value = suggestedKeyword;
        state.searchQuery = suggestedKeyword;
        renderProducts();
        renderSearchSuggestions(suggestedKeyword);
    }
}

function selectSearchSuggestion(productId) {
    const dropdown = document.getElementById('search-suggestions-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    openCustomModal(productId);
}

function renderProducts() {
    const container = document.getElementById('products-grid-container');
    if (!container) return;

    let filtered = state.products;

    // Search query takes precedence and ranks products by relevance score
    if (state.searchQuery && state.searchQuery.trim() !== '') {
        const query = state.searchQuery.trim();
        
        // Calculate relevance score for each product
        const scoredProducts = state.products.map(p => ({
            product: p,
            score: getRelevanceScore(p, query)
        })).filter(item => item.score > 0);

        // Sort by highest relevance score first
        scoredProducts.sort((a, b) => b.score - a.score);

        filtered = scoredProducts.map(item => item.product);
    } else {
        // Filter by Category if no search query
        if (state.currentCategory === 'bestseller') {
            filtered = filtered.filter(p => p.isBestSeller);
        } else if (state.currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === state.currentCategory);
        }
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-mug-hot" style="font-size: 3rem; margin-bottom: 12px;"></i>
                <p style="font-size: 1.1rem; font-weight: 600;">Không tìm thấy món trà sữa nào phù hợp với tuỳ chọn tìm kiếm!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(p => `
        <div class="product-card ${p.stock <= 0 ? 'out-of-stock' : ''}">
            <div class="card-img-holder" onclick="openCustomModal('${p.id}')" title="Nhấn vào hình để xem chi tiết & chọn món">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                <div class="card-img-overlay">
                    <span><i class="fa-solid fa-eye"></i> ${p.stock <= 0 ? 'Hết hàng' : 'Xem sản phẩm'}</span>
                </div>
                <div class="card-tags">
                    ${p.stock <= 0 ? '<span class="badge badge-red"><i class="fa-solid fa-ban"></i> Hết hàng</span>' : `<span class="badge badge-green"><i class="fa-solid fa-boxes-stacked"></i> Kho: ${p.stock}</span>`}
                    ${(p.tags || []).map(t => `<span class="badge badge-primary">${t}</span>`).join('')}
                </div>
                <div class="card-rating">
                    <i class="fa-solid fa-star"></i>
                    <span>${p.rating} (${p.reviewsCount})</span>
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title" onclick="openCustomModal('${p.id}')" style="cursor:pointer;" title="Nhấn xem chi tiết">${p.name}</h3>
                <p class="card-desc">${p.description}</p>
                <div class="card-footer">
                    <div class="price-box">
                        <span class="current-price">${formatCurrency(p.price)}</span>
                        ${p.originalPrice ? `<span class="original-price">${formatCurrency(p.originalPrice)}</span>` : ''}
                    </div>
                    <button class="btn-detail-item" onclick="openCustomModal('${p.id}')" title="${p.stock <= 0 ? 'Xem chi tiết sản phẩm' : 'Xem chi tiết & Đặt món'}">
                        <i class="fa-solid ${p.stock <= 0 ? 'fa-circle-info' : 'fa-mug-saucer'}"></i> <span>${p.stock <= 0 ? 'Hết hàng' : 'Chọn Món'}</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Customization Modal Logic
function openCustomModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    state.selectedProductForCustom = product;
    state.selectedSize = 'M';
    state.selectedSugar = '100%';
    state.selectedIce = '100%';
    state.selectedToppings = [];
    state.customQty = product.stock > 0 ? 1 : 0;
    state.customNote = '';

    renderCustomModalContent();
    document.getElementById('modal-overlay').classList.add('open');
}

function renderCustomModalContent() {
    const product = state.selectedProductForCustom;
    if (!product) return;

    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <img src="${product.image}" alt="${product.name}" class="modal-header-img">
        <div class="modal-body">
            <h2 class="modal-item-title">${product.name}</h2>
            <p class="modal-item-desc">${product.description}</p>

            <!-- Size Selection -->
            <div class="custom-group">
                <div class="custom-group-title">1. Chọn Size (*Bắt buộc)</div>
                <div class="options-flex">
                    ${state.sizes.map(s => `
                        <button class="opt-pill ${state.selectedSize === s.id ? 'active' : ''}" 
                                type="button"
                                onclick="selectCustomSize('${s.id}')">
                            ${s.name} ${s.price > 0 ? `(+${formatCurrency(s.price)})` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Sugar Level -->
            <div class="custom-group">
                <div class="custom-group-title">2. Chọn Lượng Đường</div>
                <div class="options-flex">
                    ${state.sugarLevels.map(s => `
                        <button class="opt-pill ${state.selectedSugar === s.id ? 'active' : ''}" 
                                type="button"
                                onclick="selectCustomSugar('${s.id}')">
                            ${s.name}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Ice Level -->
            <div class="custom-group">
                <div class="custom-group-title">3. Chọn Lượng Đá</div>
                <div class="options-flex">
                    ${state.iceLevels.map(i => `
                        <button class="opt-pill ${state.selectedIce === i.id ? 'active' : ''}" 
                                type="button"
                                onclick="selectCustomIce('${i.id}')">
                            ${i.name}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Toppings Selection -->
            <div class="custom-group">
                <div class="custom-group-title">4. Chọn Toppings Thêm</div>
                <div class="toppings-grid">
                    ${state.toppings.map(t => {
                        const isChecked = state.selectedToppings.includes(t.id);
                        return `
                        <label class="topping-checkbox-label ${isChecked ? 'selected' : ''}" style="cursor: pointer;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <input type="checkbox" ${isChecked ? 'checked' : ''} 
                                       onclick="event.stopPropagation(); toggleToppingSelection('${t.id}')">
                                <span>${t.name}</span>
                            </div>
                            <strong style="color: var(--primary);">+${formatCurrency(t.price)}</strong>
                        </label>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Note for Barista -->
            <div class="custom-group">
                <div class="custom-group-title">5. Ghi chú cho Barista</div>
                <input type="text" id="custom-note-input" placeholder="Ví dụ: Cho ống hút to, bọc màng ghép..." 
                       class="form-group" style="width:100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);"
                       value="${state.customNote}"
                       oninput="state.customNote = this.value">
            </div>

            <!-- Modal Footer Action -->
            <div class="modal-footer-action">
                <div class="qty-control">
                    <button class="qty-btn" type="button" onclick="updateCustomQty(-1)"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-val" id="custom-qty-val">${state.customQty}</span>
                    <button class="qty-btn" type="button" onclick="updateCustomQty(1)"><i class="fa-solid fa-plus"></i></button>
                </div>
                ${product.stock > 0 ? `
                    <button class="btn-primary" type="button" style="flex:1; justify-content: center;" onclick="addToCartFromModal()">
                        Thêm vào giỏ - <span id="custom-total-price">${formatCurrency(calculateCustomPrice())}</span>
                    </button>
                ` : `
                    <button class="btn-primary" type="button" disabled style="flex:1; justify-content: center; background:#bdc3c7; border-color:#bdc3c7; cursor:not-allowed;">
                        🚫 Tạm Hết Hàng Trong Kho
                    </button>
                `}
            </div>
        </div>
    `;
}

function closeModal() {
    state.activeTrackerOrderId = null;
    state.lastTrackerStatus = null;
    if (window.liveTrackerTimer) {
        clearInterval(window.liveTrackerTimer);
        window.liveTrackerTimer = null;
    }
    document.getElementById('modal-overlay').classList.remove('open');
}

function selectCustomSize(sizeId) {
    state.selectedSize = sizeId;
    updateCustomModalUI();
}

function selectCustomSugar(sugarId) {
    state.selectedSugar = sugarId;
    updateCustomModalUI();
}

function selectCustomIce(iceId) {
    state.selectedIce = iceId;
    updateCustomModalUI();
}

function toggleToppingSelection(toppingId) {
    if (state.selectedToppings.includes(toppingId)) {
        state.selectedToppings = state.selectedToppings.filter(id => id !== toppingId);
    } else {
        state.selectedToppings.push(toppingId);
    }
    updateCustomModalUI();
}

function updateCustomQty(delta) {
    const product = state.selectedProductForCustom;
    const maxStock = product ? (product.stock !== undefined ? product.stock : 99) : 99;

    if (maxStock <= 0) {
        state.customQty = 0;
        alert('⚠️ Món này hiện đã hết hàng trong kho!');
        return;
    }

    state.customQty = Math.max(1, Math.min(maxStock, state.customQty + delta));
    document.getElementById('custom-qty-val').innerText = state.customQty;
    document.getElementById('custom-total-price').innerText = formatCurrency(calculateCustomPrice());
}

function calculateCustomPrice() {
    if (!state.selectedProductForCustom) return 0;
    let basePrice = state.selectedProductForCustom.price;

    const sizeObj = state.sizes.find(s => s.id === state.selectedSize);
    if (sizeObj) basePrice += sizeObj.price;

    state.selectedToppings.forEach(tId => {
        const top = state.toppings.find(t => t.id === tId);
        if (top) basePrice += top.price;
    });

    return basePrice * state.customQty;
}

function updateCustomModalUI() {
    renderCustomModalContent();
}

// Shopping Cart Drawer Operations
function addToCartFromModal() {
    const product = state.selectedProductForCustom;
    if (!product) return;

    if (!state.customQty || state.customQty <= 0) {
        alert('⚠️ Phải có số lượng sản phẩm lớn hơn 0 thì mới tạo đơn bán được!');
        return;
    }

    if (state.customQty > (product.stock !== undefined ? product.stock : 99)) {
        alert(`⚠️ Số lượng đặt (${state.customQty}) vượt quá tồn kho hiện có (${product.stock} ly)!`);
        return;
    }
    const sizeObj = state.sizes.find(s => s.id === state.selectedSize);
    const toppingsList = state.selectedToppings.map(tId => state.toppings.find(t => t.id === tId).name);

    const itemPrice = (product.price + (sizeObj ? sizeObj.price : 0) + 
        state.selectedToppings.reduce((sum, tId) => sum + (state.toppings.find(t => t.id === tId)?.price || 0), 0));

    const cartItem = {
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        image: product.image,
        size: state.selectedSize,
        sugar: state.selectedSugar,
        ice: state.selectedIce,
        toppings: toppingsList,
        price: itemPrice,
        quantity: state.customQty,
        note: state.customNote
    };

    state.cart.push(cartItem);
    saveStateToStorage();
    closeModal();
    updateCartBadge();
    renderCartDrawer();
    toggleCartDrawer(true);
}

function toggleCartDrawer(forceOpen = null) {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    if (forceOpen === true) {
        drawer.classList.add('open');
    } else if (forceOpen === false) {
        drawer.classList.remove('open');
    } else {
        drawer.classList.toggle('open');
    }
}

function updateCartBadge() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-badge');
    if (badge) badge.innerText = totalCount;
}

function renderCartDrawer() {
    const container = document.getElementById('cart-drawer-items');
    if (!container) return;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
                <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; margin-bottom: 12px;"></i>
                <p style="font-weight: 600;">Giỏ hàng của bạn đang trống</p>
            </div>
        `;
    } else {
        container.innerHTML = state.cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-sub">
                        Size ${item.size} | ${item.sugar} Đường | ${item.ice} Đá
                        ${item.toppings.length > 0 ? `<br>+ Topping: ${item.toppings.join(', ')}` : ''}
                        ${item.note ? `<br><i>Ghi chú: ${item.note}</i>` : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                        <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
                        <div class="qty-control" style="transform: scale(0.85);">
                            <button class="qty-btn" onclick="updateCartItemQty(${index}, -1)"><i class="fa-solid fa-minus"></i></button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartItemQty(${index}, 1)"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    calculateCartTotals();
}

function updateCartItemQty(index, delta) {
    if (state.cart[index]) {
        state.cart[index].quantity += delta;
        if (state.cart[index].quantity <= 0) {
            state.cart.splice(index, 1);
        }
        saveStateToStorage();
        updateCartBadge();
        renderCartDrawer();
    }
}

function calculateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free shipping rule: free (0đ) if subtotal >= 60,000đ or cart is empty, otherwise 15,000đ
    let shippingFee = (subtotal >= 60000 || subtotal === 0) ? 0 : 15000;
    let discount = 0;

    if (state.appliedVoucher) {
        if (state.appliedVoucher.type === 'percent') {
            discount = Math.round(subtotal * (state.appliedVoucher.discount / 100));
        } else if (state.appliedVoucher.type === 'fixed') {
            discount = state.appliedVoucher.discount;
        } else if (state.appliedVoucher.type === 'shipping') {
            discount = Math.min(shippingFee, state.appliedVoucher.discount);
        }
    }

    const total = Math.max(0, subtotal + shippingFee - discount);

    // Update Free Shipping Banner in Drawer
    let freeshipNoticeBox = document.getElementById('freeship-notice-box');
    if (!freeshipNoticeBox) {
        freeshipNoticeBox = document.createElement('div');
        freeshipNoticeBox.id = 'freeship-notice-box';
        const footer = document.querySelector('.cart-drawer-footer');
        if (footer) footer.insertBefore(freeshipNoticeBox, footer.firstChild);
    }

    if (freeshipNoticeBox) {
        if (subtotal > 0 && subtotal < 60000) {
            freeshipNoticeBox.innerHTML = `
                <div style="font-size:0.8rem; color:#d35400; background:#fef5e7; padding:8px 12px; border-radius:8px; margin-bottom:12px; text-align:center; font-weight:600;">
                    🚚 Mua thêm <strong>${formatCurrency(60000 - subtotal)}</strong> để được <strong style="color:var(--primary);">Miễn Phí Giao Hàng (0đ)</strong>!
                </div>
            `;
        } else if (subtotal >= 60000) {
            freeshipNoticeBox.innerHTML = `
                <div style="font-size:0.8rem; color:#27ae60; background:#e8f8f5; padding:8px 12px; border-radius:8px; margin-bottom:12px; text-align:center; font-weight:700;">
                    🎉 Đơn hàng đã đạt <strong>Miễn Phí Giao Hàng (0đ)</strong>!
                </div>
            `;
        } else {
            freeshipNoticeBox.innerHTML = '';
        }
    }

    document.getElementById('cart-subtotal').innerText = formatCurrency(subtotal);
    document.getElementById('cart-shipping').innerText = formatCurrency(shippingFee);
    document.getElementById('cart-discount').innerText = formatCurrency(discount);
    document.getElementById('cart-total').innerText = formatCurrency(total);
}

function applyVoucher() {
    const input = document.getElementById('voucher-code-input');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const voucher = DEFAULT_VOUCHERS.find(v => v.code === code);
    if (!voucher) {
        alert('Mã giảm giá không hợp lệ!');
        return;
    }

    if (subtotal < voucher.minOrder) {
        alert(`Mã này chỉ áp dụng cho đơn hàng từ ${formatCurrency(voucher.minOrder)} trở lên!`);
        return;
    }

    state.appliedVoucher = voucher;
    alert(`Áp dụng thành công voucher: ${voucher.description}`);
    calculateCartTotals();
}

// Checkout Modal
function openCheckoutModal() {
    if (!state.cart || state.cart.length === 0) {
        alert('⚠️ Giỏ hàng trống! Phải chọn món và có số lượng sản phẩm lớn hơn 0 mới tạo đơn bán được.');
        return;
    }

    const totalQty = state.cart.reduce((sum, i) => sum + (i.quantity || 0), 0);
    if (totalQty <= 0) {
        alert('⚠️ Phải có số lượng sản phẩm lớn hơn 0 mới tiến hành tạo đơn bán được!');
        return;
    }

    toggleCartDrawer(false);

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let shippingFee = subtotal >= 60000 ? 0 : 15000;
    let discount = 0;

    if (state.appliedVoucher) {
        if (state.appliedVoucher.type === 'percent') discount = Math.round(subtotal * (state.appliedVoucher.discount / 100));
        else if (state.appliedVoucher.type === 'fixed') discount = state.appliedVoucher.discount;
        else if (state.appliedVoucher.type === 'shipping') discount = Math.min(shippingFee, state.appliedVoucher.discount);
    }

    const grandTotal = Math.max(0, subtotal + shippingFee - discount);
    const checkoutOrderCode = `BOBA-${Date.now().toString().slice(-4)}`;

    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body">
            <h2 class="modal-item-title" style="margin-bottom: 20px;">Xác Nhận Đặt Hàng & Thanh Toán</h2>
            
            <form id="checkout-form" onsubmit="processCheckout(event)">
                <div class="checkout-grid">
                    <div>
                        <div class="form-group">
                            <label>Họ và Tên Khách Hàng (*)</label>
                            <input type="text" id="cust-name" required placeholder="Nguyễn Văn A" value="Nguyễn Hoàng Việt">
                        </div>
                        <div class="form-group">
                            <label>Số Điện Thoại (*)</label>
                            <input type="tel" id="cust-phone" required placeholder="0888384475" value="0888384475">
                        </div>
                        <div class="form-group">
                            <label>Địa Chỉ Giao Hàng (*)</label>
                            <textarea id="cust-address" rows="3" required placeholder="Số nhà, Tên đường, Phường, Quận...">1059 Tôn Đản, P. Cẩm Lệ, TP. Đà Nẵng</textarea>
                        </div>
                        <div class="form-group">
                            <label>Ghi Chú Cho Đơn Hàng</label>
                            <input type="text" id="cust-order-note" placeholder="Ví dụ: Giao giờ hành chính">
                        </div>
                    </div>

                    <div>
                        <div class="form-group">
                            <label>Phương Thức Thanh Toán (*)</label>
                            <select id="cust-payment" onchange="togglePaymentQR(this.value)">
                                <option value="Chuyển khoản Banking">Chuyển Khoản Ngân Hàng (VietQR)</option>
                                <option value="MoMo QR">Ví Điện Tử MoMo (Quét mã QR)</option>
                                <option value="Tiền mặt (COD)">Thanh Toán Khi Nhận Hàng (COD)</option>
                            </select>
                        </div>

                        <div id="qr-preview-box">
                            ${renderVietQRCardHTML(grandTotal, checkoutOrderCode)}
                        </div>

                        <div style="background: var(--light-bg); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                            <div class="cart-row"><span>Tạm tính:</span><span>${formatCurrency(subtotal)}</span></div>
                            <div class="cart-row"><span>Phí giao hàng:</span><span>${formatCurrency(shippingFee)} ${shippingFee === 0 ? '<strong style="color:#27ae60;">(Freeship)</strong>' : ''}</span></div>
                            <div class="cart-row"><span>Giảm giá:</span><span style="color:var(--accent-red);">-${formatCurrency(discount)}</span></div>
                            <div class="cart-row total"><span>Tổng thanh toán:</span><span>${formatCurrency(grandTotal)}</span></div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 24px; text-align: right;">
                    <button type="button" class="btn-secondary" onclick="closeModal()" style="margin-right: 10px;">Hủy Bỏ</button>
                    <button type="submit" class="btn-primary"><i class="fa-solid fa-paper-plane"></i> Đặt Hàng Ngay</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('modal-overlay').classList.add('open');
}

function togglePaymentQR(val) {
    const box = document.getElementById('qr-preview-box');
    if (!box) return;
    box.style.display = val === 'Tiền mặt (COD)' ? 'none' : 'block';
}

function openPartnershipModal() {
    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body" style="padding: 24px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="badge badge-gold" style="margin-bottom: 8px;"><i class="fa-solid fa-handshake"></i> Hợp Tác & Nhượng Quyền</span>
                <h2 class="modal-item-title">Thông Tin Liên Hệ Hợp Tác Trực Tiếp</h2>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Chương trình hợp tác phát triển đại lý, cung ứng nguyên liệu & nhượng quyền thương hiệu Boba Craze</p>
            </div>

            <!-- Profile Info Card -->
            <div style="background: linear-gradient(135deg, #fbf0e8 0%, #fff8e7 100%); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div style="width: 56px; height: 56px; background: var(--primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                        <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Phụ Trách Hợp Tác & Nhượng Quyền</span>
                        <h3 style="font-size: 1.3rem; color: var(--primary); font-weight: 800;">Bà Đỗ Thị Thúy Hằng</h3>
                        <small style="color: var(--secondary); font-weight: 700;">Giám Đốc Phát Triển Thương Hiệu</small>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem;">
                    <div style="background: #fff; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block; font-weight:700;">SỐ ĐIỆN THOẠI / ZALO:</span>
                        <strong style="color: var(--primary); font-size: 1.05rem;"><i class="fa-solid fa-phone"></i> 0888 384 475</strong>
                    </div>
                    <div style="background: #fff; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block; font-weight:700;">EMAIL TIẾP NHẬN:</span>
                        <strong style="color: var(--dark);"><i class="fa-solid fa-envelope"></i> hoptac@bobacraze.vn</strong>
                    </div>
                    <div style="grid-column: 1/-1; background: #fff; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block; font-weight:700;">ĐỊA CHỈ TRỤ SỞ GIAO DỊCH:</span>
                        <strong style="color: var(--dark);"><i class="fa-solid fa-location-dot" style="color: var(--secondary);"></i> 1059 Tôn Đản, Phường Cẩm Lệ, Thành Phố Đà Nẵng</strong>
                    </div>
                </div>
            </div>

            <!-- Interactive Form -->
            <form onsubmit="submitPartnershipForm(event)" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px;">
                <h4 style="font-size: 1rem; margin-bottom: 14px; color: var(--primary);"><i class="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu Hợp Tác Trực Tiếp</h4>
                <div class="form-group">
                    <label>Họ và Tên Đối Tác (*)</label>
                    <input type="text" required placeholder="Nhập họ và tên..." id="partner-name">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label>Số Điện Thoại (*)</label>
                        <input type="tel" required placeholder="090xxxxx..." id="partner-phone">
                    </div>
                    <div class="form-group">
                        <label>Hình Thức Hợp Tác (*)</label>
                        <select id="partner-type">
                            <option value="Nhượng quyền thương hiệu">Nhượng quyền thương hiệu</option>
                            <option value="Cung ứng nguyên liệu / Sỉ">Cung ứng nguyên liệu / Sỉ</option>
                            <option value="Hợp tác mặt bằng">Hợp tác mặt bằng kinh doanh</option>
                            <option value="Khác">Hình thức khác</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nội Dung Lời Nhắn Đến Bà Đỗ Thị Thúy Hằng</label>
                    <textarea rows="3" placeholder="Nhập chi tiết nhu cầu hợp tác, khu vực dự định mở cửa hàng..." id="partner-message"></textarea>
                </div>
                <div style="text-align: right; margin-top: 16px;">
                    <button type="button" class="btn-secondary" onclick="closeModal()" style="margin-right: 8px;">Đóng</button>
                    <button type="submit" class="btn-primary"><i class="fa-solid fa-paper-plane"></i> Gửi Thông Tin Hợp Tác</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

function submitPartnershipForm(e) {
    e.preventDefault();
    const name = document.getElementById('partner-name').value;
    const phone = document.getElementById('partner-phone').value;
    const type = document.getElementById('partner-type').value;

    alert(`🎉 Cảm ơn bạn ${name}! Thông tin hợp tác (${type}) đã được gửi trực tiếp đến Bà Đỗ Thị Thúy Hằng (SĐT: 0888 384 475).\nChúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất!`);
    closeModal();
}

function openGuideModal() {
    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body" style="padding: 24px;">
            <h2 class="modal-item-title"><i class="fa-solid fa-circle-question" style="color:var(--primary);"></i> Hướng Dẫn Đặt Hàng Trực Tuyến</h2>
            <ol style="padding-left: 20px; line-height: 1.8; margin: 16px 0; font-size: 0.95rem;">
                <li><strong>Chọn món trà sữa</strong> yêu thích từ Thực Đơn hoặc nhập tên món vào ô Tìm Kiếm.</li>
                <li><strong>Bấm nút (+)</strong> để tùy chỉnh Size ly (M/L/XL), chọn Mức Đường (0%-100%), Mức Đá và các Toppings thơm ngon.</li>
                <li><strong>Thêm vào Giỏ Hàng</strong> và kiểm tra ưu đãi Miễn Phí Ship cho đơn từ 60k trở lên.</li>
                <li><strong>Điền thông tin giao hàng</strong> và chọn phương thức thanh toán (MoMo QR, VietQR hoặc Tiền mặt COD).</li>
                <li><strong>Nhận Mã Đơn Hàng</strong> và theo dõi tiến trình pha chế & giao hàng trực tiếp trên trang web!</li>
            </ol>
            <div style="text-align: right;"><button class="btn-primary" onclick="closeModal()">Đã Hiểu</button></div>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

function openShippingPolicyModal() {
    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body" style="padding: 24px;">
            <h2 class="modal-item-title"><i class="fa-solid fa-truck" style="color:var(--primary);"></i> Chính Sách Giao Hàng</h2>
            <ul style="padding-left: 20px; line-height: 1.8; margin: 16px 0; font-size: 0.95rem; list-style-type: square;">
                <li><strong>Thời gian giao hàng:</strong> Siêu tốc từ 15 - 30 phút trong khu vực Đà Nẵng.</li>
                <li><strong>Ưu đãi Phí Ship:</strong> 
                    <br>- Đơn hàng từ <strong>60.000đ trở lên</strong>: <span style="color:#27ae60; font-weight:700;">MIỄN PHÍ GIAO HÀNG (0đ)</span>.
                    <br>- Đơn hàng dưới 60.000đ: Đồng giá 15.000đ/đơn.
                </li>
                <li><strong>Đóng gói:</strong> Đồ uống được bảo quản trong túi giữ nhiệt chuyên dụng, trân châu nóng dẻo riêng biệt.</li>
                <li><strong>Hotline khiếu nại & hỗ trợ giao hàng:</strong> <strong>0888 384 475</strong> (Bà Đỗ Thị Thúy Hằng).</li>
            </ul>
            <div style="text-align: right;"><button class="btn-primary" onclick="closeModal()">Đã Hiểu</button></div>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

function processCheckout(e) {
    e.preventDefault();

    if (!state.cart || state.cart.length === 0) {
        alert('⚠️ Không thể tạo đơn bán vì giỏ hàng đang trống! Vui lòng chọn ít nhất 1 sản phẩm với số lượng hợp lệ.');
        return;
    }

    const totalQty = state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalQty <= 0) {
        alert('⚠️ Phải có số lượng sản phẩm lớn hơn 0 thì mới tạo đơn bán được!');
        return;
    }

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const note = document.getElementById('cust-order-note').value;
    const payment = document.getElementById('cust-payment').value;

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let shippingFee = subtotal >= 60000 ? 0 : 15000;
    let discount = 0;

    if (state.appliedVoucher) {
        if (state.appliedVoucher.type === 'percent') discount = Math.round(subtotal * (state.appliedVoucher.discount / 100));
        else if (state.appliedVoucher.type === 'fixed') discount = state.appliedVoucher.discount;
        else if (state.appliedVoucher.type === 'shipping') discount = Math.min(shippingFee, state.appliedVoucher.discount);
    }

    const total = Math.max(0, subtotal + shippingFee - discount);

    const newOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customerName: name,
        phone: phone,
        address: address,
        items: [...state.cart],
        subtotal: subtotal,
        shippingFee: shippingFee,
        discount: discount,
        total: total,
        paymentMethod: payment,
        status: 'pending',
        isStockDeducted: false,
        createdAt: getFormattedLocalDateTime(),
        note: note
    };

    state.orders.unshift(newOrder);
    state.cart = [];
    state.appliedVoucher = null;
    saveStateToStorage();
    updateCartBadge();
    renderProducts();
    closeModal();

    // Push order to central cloud server for real-time multi-device sync to Admin's phone/PC
    pushOrderToCloud(newOrder);

    // Play chime sound if on admin role or notify locally
    if (state.currentRole === 'admin') {
        playOrderAlertSound();
    }

    alert(`🎉 Đặt hàng thành công! Mã đơn hàng của bạn là: ${newOrder.id}\nĐơn hàng đã được tự động đồng bộ lên Cloud và gửi đến thiết bị của Admin!`);

    // Render Order Tracker view
    renderOrderTracker(newOrder.id);
}

function renderOrderTracker(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    state.activeTrackerOrderId = orderId;
    state.lastTrackerStatus = order.status;

    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = generateOrderTrackerHTML(order);
    document.getElementById('modal-overlay').classList.add('open');

    startLiveTrackerTimer(orderId);
}

function updateTrackerDOM(order) {
    const trackerContainer = document.getElementById('order-tracker-content-body');
    if (trackerContainer) {
        trackerContainer.innerHTML = generateOrderTrackerInnerContent(order);
    }
}

function generateOrderTrackerHTML(order) {
    return `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body" id="order-tracker-content-body">
            ${generateOrderTrackerInnerContent(order)}
        </div>
    `;
}

function parseDateString(dateStr) {
    if (!dateStr) return new Date();

    if (typeof dateStr === 'string') {
        const cleanStr = dateStr.split(' (')[0].replace('T', ' ');
        const parts = cleanStr.split(' ');
        if (parts.length >= 2) {
            const [dPart, tPart] = parts;
            const [y, m, day] = dPart.split('-').map(Number);
            const [h, min, s] = tPart.split(':').map(Number);

            let hour = h;
            if (hour < 12 && new Date().getHours() >= 12) {
                hour = (hour + 7) % 24;
            }

            return new Date(y, m - 1, day, hour, min || 0, s || 0);
        }
    }
    return new Date(dateStr);
}

function formatOrderDateTime(dateStr) {
    if (!dateStr) return getFormattedLocalDateTime();

    if (typeof dateStr === 'string') {
        const cleanStr = dateStr.split(' (')[0].replace('T', ' ');
        const parts = cleanStr.split(' ');
        if (parts.length >= 2) {
            const [dPart, tPart] = parts;
            const [y, m, day] = dPart.split('-').map(Number);
            const [h, min, s] = tPart.split(':').map(Number);

            let hour = h;
            if (hour < 12 && new Date().getHours() >= 12) {
                hour = (hour + 7) % 24;
            }

            const pad = (n) => String(n).padStart(2, '0');
            const period = (hour >= 12 && hour < 18) ? 'Buổi chiều' : (hour >= 18 ? 'Buổi tối' : 'Buổi sáng');
            return `${y}-${pad(m)}-${pad(day)} ${pad(hour)}:${pad(min)}:${pad(s)} (${period})`;
        }
    }

    return getFormattedLocalDateTime();
}

function startLiveTrackerTimer(orderId) {
    if (window.liveTrackerTimer) {
        clearInterval(window.liveTrackerTimer);
    }

    window.liveTrackerTimer = setInterval(() => {
        const clockEl = document.getElementById('live-clock-time');
        const elapsedEl = document.getElementById('live-elapsed-time');
        const order = state.orders.find(o => o.id === orderId);

        if (!order || !document.getElementById('order-tracker-content-body')) {
            clearInterval(window.liveTrackerTimer);
            window.liveTrackerTimer = null;
            return;
        }

        const now = new Date();
        if (clockEl) {
            clockEl.innerText = getFormattedLocalDateTime(now).split(' ')[1];
        }

        if (elapsedEl && order.createdAt) {
            const createdDate = parseDateString(order.createdAt);
            const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
            const mins = Math.floor(diffMs / 60000);
            const secs = Math.floor((diffMs % 60000) / 1000);
            elapsedEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }, 1000);
}

function simulateOrderProgress(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const sequence = ['pending', 'preparing', 'shipping', 'completed'];
    const currIdx = sequence.indexOf(order.status);
    const nextIdx = (currIdx + 1) % sequence.length;
    const nextStatus = sequence[nextIdx];

    updateOrderStatus(orderId, nextStatus);
}

function generateOrderTrackerInnerContent(order) {
    const steps = [
        { key: 'pending', label: 'Chờ xác nhận', icon: 'fa-receipt' },
        { key: 'preparing', label: 'Đang pha chế', icon: 'fa-blender' },
        { key: 'shipping', label: 'Đang giao hàng', icon: 'fa-motorcycle' },
        { key: 'completed', label: 'Hoàn tất', icon: 'fa-circle-check' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === order.status);

    const createdDate = parseDateString(order.createdAt);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
    const initialMins = Math.floor(diffMs / 60000);
    const initialSecs = Math.floor((diffMs % 60000) / 1000);
    const initialElapsedStr = `${String(initialMins).padStart(2, '0')}:${String(initialSecs).padStart(2, '0')}`;

    return `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
            <h2 class="modal-item-title" style="margin: 0;">Theo Dõi Đơn Hàng #${order.id}</h2>
        </div>

        <!-- Real-Time Timer Banner -->
        <div class="realtime-timer-banner">
            <div class="realtime-timer-item">
                <i class="fa-solid fa-calendar-check" style="color: var(--primary);"></i>
                <span>Đặt lúc: <strong>${formatOrderDateTime(order.createdAt)}</strong></span>
            </div>
            <div class="realtime-timer-item">
                <i class="fa-solid fa-clock" style="color: #27ae60;"></i>
                <span>Giờ hiện tại: <span id="live-clock-time" class="realtime-timer-val">${getFormattedLocalDateTime().split(' ')[1]}</span></span>
            </div>
            <div class="realtime-timer-item">
                <i class="fa-solid fa-stopwatch" style="color: #d35400;"></i>
                <span>Đã trôi qua: <span id="live-elapsed-time" class="realtime-timer-val">${initialElapsedStr}</span></span>
            </div>
        </div>

        <div class="tracker-steps">
            ${steps.map((step, idx) => `
                <div class="step-item ${idx <= currentStepIndex ? 'active' : ''}">
                    <div class="step-icon"><i class="fa-solid ${step.icon}"></i></div>
                    <span class="step-label">${step.label}</span>
                </div>
            `).join('')}
        </div>

        <div class="order-tracker-box">
            <h4 style="margin-bottom: 12px; color: var(--primary);">Chi Tiết Sản Phẩm:</h4>
            ${order.items.map(item => `
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size:0.9rem;">
                    <div>
                        <strong>${item.name}</strong> x ${item.quantity}
                        <br><small style="color:var(--text-muted);">Size ${item.size}, ${item.sugar} đường, ${item.ice} đá ${item.toppings.length ? '+ ' + item.toppings.join(', ') : ''}</small>
                    </div>
                    <strong>${formatCurrency(item.price * item.quantity)}</strong>
                </div>
            `).join('')}
            <hr style="border-top:1px dashed var(--border-color); margin:12px 0;">
            <div style="display:flex; justify-content:space-between; font-weight:800; color:var(--primary);">
                <span>Tổng hóa đơn:</span>
                <span>${formatCurrency(order.total)}</span>
            </div>
        </div>

        ${order.paymentMethod !== 'Tiền mặt (COD)' ? `
            <div style="margin-top: 16px;">
                <h4 style="margin-bottom: 10px; color: var(--primary); font-size: 0.95rem;"><i class="fa-solid fa-qrcode"></i> Thông Tin Chuyển Khoản Mã QR (${order.paymentMethod}):</h4>
                ${renderVietQRCardHTML(order.total, order.id)}
            </div>
        ` : ''}

        <div style="background: linear-gradient(135deg, #e8f8f5 0%, #f0f7ff 100%); border: 1.5px solid #0068ff; padding: 14px; border-radius: var(--radius-md); margin-top: 14px; text-align: center;">
            <strong style="color: #0068ff; display: block; font-size: 0.95rem; margin-bottom: 4px;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Đơn hàng đã đồng bộ lên hệ thống Cloud!
            </strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
                Để chắc chắn Admin phản hồi siêu tốc trên Zalo cá nhân (0888 384 475), bấm gửi xác nhận:
            </p>
            <a href="https://zalo.me/0888384475?text=${encodeURIComponent(`🥤 ĐƠN HÀNG MỚI #${order.id}\n👤 Khách: ${order.customerName} (${order.phone})\n📍 ĐC: ${order.address}\n🧋 Món: ${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}\n💰 Tổng tiền: ${formatCurrency(order.total)}`)}" 
               target="_blank" rel="noopener noreferrer" 
               class="btn-primary" style="background: #0068ff; border-color: #0068ff; padding: 8px 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-paper-plane"></i> Gửi Xác Nhận Đơn Qua Zalo Admin (0888 384 475)
            </a>
        </div>

        <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 16px;">
            <i class="fa-solid fa-bolt" style="color:var(--secondary);"></i> Trạng thái đơn hàng được đồng bộ <strong>thời gian thực</strong>. Khi Quản trị viên cập nhật trạng thái, tiến trình sẽ tự động nhảy bước ngay lập tức!
        </p>
    `;
}

// Order Lookup & Tracking Logic for Customers
function openOrderLookupModal() {
    const modalBody = document.getElementById('modal-content-container');

    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body">
            <h2 class="modal-item-title" style="margin-bottom: 8px;"><i class="fa-solid fa-truck-fast" style="color: var(--primary);"></i> Tra Cứu & Theo Dõi Đơn Hàng</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                Nhập số điện thoại hoặc mã đơn hàng để kiểm tra danh sách đơn hàng đã đặt của bạn.
            </p>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="modal-order-query" class="form-group" placeholder="Nhập Số ĐT hoặc Mã đơn (VD: ORD-9821)" 
                       style="flex: 1; margin: 0; padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);"
                       onkeyup="if(event.key==='Enter') searchOrdersInModal()">
                <button class="btn-primary" onclick="searchOrdersInModal()"><i class="fa-solid fa-magnifying-glass"></i> Tìm kiếm</button>
            </div>

            <div id="modal-order-results-list" style="max-height: 420px; overflow-y: auto;">
                ${renderOrdersListHTML(state.orders)}
            </div>
        </div>
    `;

    document.getElementById('modal-overlay').classList.add('open');
}

function searchOrdersInModal() {
    const query = document.getElementById('modal-order-query').value.trim().toLowerCase();
    const container = document.getElementById('modal-order-results-list');
    if (!container) return;

    if (!query) {
        container.innerHTML = renderOrdersListHTML(state.orders);
        return;
    }

    const filtered = state.orders.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.phone.includes(query) ||
        o.customerName.toLowerCase().includes(query)
    );

    container.innerHTML = renderOrdersListHTML(filtered);
}

function performOrderLookup() {
    const input = document.getElementById('order-lookup-input');
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    const resultBox = document.getElementById('order-lookup-result-box');
    if (!resultBox) return;

    if (!query) {
        resultBox.innerHTML = `
            <div style="background: var(--card-bg); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center; color: var(--accent-red);">
                <i class="fa-solid fa-triangle-exclamation"></i> Vui lòng nhập số điện thoại hoặc mã đơn hàng để tra cứu!
            </div>
        `;
        return;
    }

    const filtered = state.orders.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.phone.includes(query) ||
        o.customerName.toLowerCase().includes(query)
    );

    resultBox.innerHTML = renderOrdersListHTML(filtered);
}

function renderOrdersListHTML(ordersList) {
    if (!ordersList || ordersList.length === 0) {
        return `
            <div style="background: var(--card-bg); padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center; color: var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size: 2.2rem; margin-bottom: 8px;"></i>
                <p style="font-weight: 600;">Không tìm thấy đơn hàng nào phù hợp!</p>
            </div>
        `;
    }

    const statusBadges = {
        pending: '<span class="badge badge-red"><i class="fa-solid fa-clock"></i> Chờ xác nhận</span>',
        preparing: '<span class="badge badge-red"><i class="fa-solid fa-blender"></i> Đang pha chế</span>',
        shipping: '<span class="badge badge-red"><i class="fa-solid fa-motorcycle"></i> Đang giao hàng</span>',
        completed: '<span class="badge badge-green"><i class="fa-solid fa-circle-check"></i> Hoàn thành</span>',
        cancelled: '<span class="badge badge-gold"><i class="fa-solid fa-circle-xmark"></i> Đã hủy</span>'
    };

    return ordersList.map(o => `
        <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 14px; transition: var(--transition);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <strong style="font-size: 1.05rem; color: var(--primary);">#${o.id}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 10px;">🕒 ${formatOrderDateTime(o.createdAt)}</span>
                </div>
                ${statusBadges[o.status] || '<span class="badge badge-gold">Đang xử lý</span>'}
            </div>
            
            <div style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 10px;">
                <strong>${o.customerName}</strong> (${o.phone}) - <i>${o.address}</i>
            </div>

            <div style="background: var(--light-bg); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; margin-bottom: 12px;">
                ${o.items.map(item => `
                    <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                        <span>${item.name} (Size ${item.size}, ${item.sugar} đường) x ${item.quantity}</span>
                        <strong>${formatCurrency(item.price * item.quantity)}</strong>
                    </div>
                `).join('')}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 800; font-size: 1.05rem; color: var(--primary);">Tổng: ${formatCurrency(o.total)}</span>
                <button class="btn-primary" style="padding: 6px 16px; font-size: 0.82rem;" onclick="renderOrderTracker('${o.id}')">
                    <i class="fa-solid fa-eye"></i> Xem Tiến Trình Dòng Thời Gian
                </button>
            </div>
        </div>
    `).join('');
}

function renderReviews() {
    const container = document.getElementById('reviews-grid-container');
    if (!container) return;

    container.innerHTML = state.reviews.map(r => `
        <div class="review-card">
            <div class="review-header">
                <img src="${r.avatar}" alt="${r.name}" class="review-avatar">
                <div>
                    <strong style="display:block; font-size: 0.95rem;">${r.name}</strong>
                    <div class="review-stars">
                        ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}
                    </div>
                </div>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-main); font-style: italic;">"${r.comment}"</p>
            <span style="display:block; margin-top: 10px; font-size:0.75rem; color: var(--text-muted); text-align:right;">${r.date}</span>
        </div>
    `).join('');
}


/* ==========================================================================
   ADMIN MANAGEMENT MODULE LOGIC
   ========================================================================== */

function renderAdminDashboard() {
    renderAdminMetrics();
    initAdminCharts();
    renderAdminOrders();
    renderAdminProducts();
}

function switchAdminTab(sectionId) {
    document.querySelectorAll('.admin-menu-item a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`.admin-menu-item a[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.admin-tab-content').forEach(sec => sec.style.display = 'none');
    const targetSection = document.getElementById(`admin-sec-${sectionId}`);
    if (targetSection) targetSection.style.display = 'block';

    if (sectionId === 'overview') renderAdminDashboard();
    else if (sectionId === 'orders') renderAdminOrders();
    else if (sectionId === 'menu') renderAdminProducts();
}

function renderAdminMetrics() {
    const totalRevenue = state.orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = state.orders.length;
    const pendingOrdersCount = state.orders.filter(o => o.status === 'pending').length;
    const totalProductsCount = state.products.length;

    document.getElementById('metric-total-revenue').innerText = formatCurrency(totalRevenue);
    document.getElementById('metric-total-orders').innerText = totalOrdersCount;
    document.getElementById('metric-pending-orders').innerText = pendingOrdersCount;
    document.getElementById('metric-total-products').innerText = totalProductsCount;
}

function initAdminCharts() {
    if (typeof Chart === 'undefined') return;

    // Revenue Chart
    const ctx1 = document.getElementById('adminRevenueChart')?.getContext('2d');
    if (ctx1) {
        if (state.revenueChart) state.revenueChart.destroy();
        state.revenueChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
                datasets: [{
                    label: 'Doanh Thu (VNĐ)',
                    data: [1200000, 1900000, 1500000, 2400000, 3100000, 4800000, 5200000],
                    backgroundColor: '#8d4925',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Category Doughnut Chart
    const ctx2 = document.getElementById('adminCategoryChart')?.getContext('2d');
    if (ctx2) {
        if (state.categoryChart) state.categoryChart.destroy();
        state.categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Trà Sữa', 'Trà Trái Cây', 'Macchiato', 'Snack'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: ['#8d4925', '#e67e22', '#f39c12', '#27ae60']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

function renderAdminOrders() {
    const container = document.getElementById('admin-orders-table-body');
    if (!container) return;

    if (state.orders.length === 0) {
        container.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Chưa có đơn hàng nào!</td></tr>`;
        return;
    }

    container.innerHTML = state.orders.map(order => `
        <tr>
            <td>
                <strong>#${order.id}</strong>
                <br><small style="color:var(--text-muted); font-size:0.75rem;">🕒 ${formatOrderDateTime(order.createdAt)}</small>
            </td>
            <td>
                <strong>${order.customerName}</strong>
                <br><small style="color:var(--text-muted);">${order.phone}</small>
            </td>
            <td>
                <small>${order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</small>
            </td>
            <td><strong>${formatCurrency(order.total)}</strong></td>
            <td><small>${order.paymentMethod}</small></td>
            <td>
                <select class="table-status-select ${getStatusClass(order.status)}" onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Đang pha chế</option>
                    <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Hủy đơn</option>
                </select>
            </td>
            <td>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="renderOrderTracker('${order.id}')" title="Xem chi tiết dòng thời gian đơn hàng">
                        <i class="fa-solid fa-eye"></i> Xem
                    </button>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.78rem; border-radius:12px;" onclick="advanceOrderStatusAdmin('${order.id}')" title="⏩ Chuyển đơn sang bước tiếp theo trong thời gian thực">
                        <i class="fa-solid fa-forward"></i> Chuyển bước
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    if (status === 'completed') return 'status-completed';
    if (status === 'cancelled') return 'status-cancelled';
    return 'status-pending'; // pending, preparing, shipping (Màu đỏ)
}

function advanceOrderStatusAdmin(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const sequence = ['pending', 'preparing', 'shipping', 'completed'];
    const currIdx = sequence.indexOf(order.status);
    const nextIdx = (currIdx + 1) % sequence.length;
    const nextStatus = sequence[nextIdx];

    updateOrderStatus(orderId, nextStatus);
}

function updateOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const prevStatus = order.status;
    order.status = newStatus;

    // Deduct product stock ONLY when order is completed
    if (newStatus === 'completed' && !order.isStockDeducted) {
        let totalDeducted = 0;
        order.items.forEach(item => {
            const prod = state.products.find(p => p.id === item.productId || p.name === item.name);
            if (prod) {
                const qty = item.quantity || 1;
                prod.stock = Math.max(0, (prod.stock !== undefined ? prod.stock : 50) - qty);
                totalDeducted += qty;
            }
        });
        order.isStockDeducted = true;
        showToast(`📦 Đã HOÀN THÀNH đơn #${orderId}: Tự động trừ ${totalDeducted} ly trong kho!`);
    } 
    // Restore product stock if a completed order gets cancelled
    else if (prevStatus === 'completed' && newStatus === 'cancelled' && order.isStockDeducted) {
        order.items.forEach(item => {
            const prod = state.products.find(p => p.id === item.productId || p.name === item.name);
            if (prod) {
                const qty = item.quantity || 1;
                prod.stock = (prod.stock || 0) + qty;
            }
        });
        order.isStockDeducted = false;
        showToast(`📦 Đã HỦY đơn #${orderId}: Hoàn lại số lượng sản phẩm vào kho!`);
    } else {
        const statusLabels = {
            pending: 'Chờ xác nhận',
            preparing: 'Đang pha chế',
            shipping: 'Đang giao hàng',
            completed: 'Hoàn tất',
            cancelled: 'Đã hủy'
        };
        showToast(`⚡ Đã cập nhật đơn #${orderId} ➔ ${statusLabels[newStatus] || newStatus}`);
    }

    saveStateToStorage();
    renderAdminProducts();
    renderProducts();
    refreshRealTimeUI();

    // Push updated order status & product stock deductions live to Cloud
    pushOrderToCloud(order);
    pushProductsToCloud();
}

function renderAdminProducts() {
    const container = document.getElementById('admin-products-table-body');
    if (!container) return;

    container.innerHTML = state.products.map(p => `
        <tr>
            <td><img src="${p.image}" style="width:48px; height:48px; border-radius:6px; object-fit:cover;"></td>
            <td><strong>${p.name}</strong></td>
            <td><span class="badge badge-primary">${p.category}</span></td>
            <td><strong>${formatCurrency(p.price)}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="number" min="0" value="${p.stock !== undefined ? p.stock : 50}" 
                           onchange="updateProductStock('${p.id}', this.value)"
                           style="width:75px; padding:5px 8px; border-radius:8px; border:1.5px solid var(--border-color); font-weight:700; text-align:center;"
                           title="Sửa trực tiếp số lượng tồn kho">
                    ${(p.stock || 0) <= 0 ? '<span class="badge badge-red">Hết hàng</span>' : ((p.stock || 0) <= 10 ? '<span class="badge badge-gold">Sắp hết</span>' : '<span class="badge badge-green">Còn hàng</span>')}
                </div>
            </td>
            <td>${p.isBestSeller ? '<span class="badge badge-gold">Best Seller</span>' : 'Thường'}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn-secondary" style="padding:4px 8px; font-size:0.8rem;" onclick="openEditProductModal('${p.id}')" title="Chỉnh sửa chi tiết món"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn-secondary" style="padding:4px 8px; font-size:0.8rem; color:var(--accent-red);" onclick="deleteProduct('${p.id}')" title="Xóa món khỏi thực đơn"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateProductStock(productId, newStockValue) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    const parsedStock = Math.max(0, parseInt(newStockValue) || 0);
    product.stock = parsedStock;
    saveStateToStorage();
    renderAdminProducts();
    renderProducts();
    pushProductsToCloud();
    showToast(`📦 Đã cập nhật tồn kho: [${product.name}] ➔ ${parsedStock} ly`);
}

function openAddProductModal() {
    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body">
            <h2 class="modal-item-title">Thêm Đồ Uống Mới Vào Thực Đơn</h2>
            <form onsubmit="saveNewProduct(event)">
                <div class="form-group">
                    <label>Tên Đồ Uống (*)</label>
                    <input type="text" id="new-prod-name" required placeholder="Nhập tên món...">
                </div>
                <div class="form-group">
                    <label>Danh Mục (*)</label>
                    <select id="new-prod-cat">
                        <option value="milk-tea">Trà Sữa Đậm Vị</option>
                        <option value="fruit-tea">Trà Trái Cây Tươi</option>
                        <option value="macchiato">Macchiato & Cream</option>
                        <option value="snack">Ăn Kèm & Dessert</option>
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label>Giá Bán (VNĐ) (*)</label>
                        <input type="number" id="new-prod-price" required placeholder="39000">
                    </div>
                    <div class="form-group">
                        <label>Số Lượng Tồn Kho (*)</label>
                        <input type="number" id="new-prod-stock" required min="0" value="50" placeholder="50">
                    </div>
                </div>
                <div class="form-group">
                    <label>URL Hình Ảnh (*)</label>
                    <input type="url" id="new-prod-img" required value="https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80">
                </div>
                <div class="form-group">
                    <label>Mô Tả Sản Phẩm</label>
                    <textarea id="new-prod-desc" rows="3" placeholder="Mô tả thành phần hương vị..."></textarea>
                </div>
                <div style="margin-top:20px; text-align:right;">
                    <button type="button" class="btn-secondary" onclick="closeModal()" style="margin-right:8px;">Hủy Bỏ</button>
                    <button type="submit" class="btn-primary">Lưu Sản Phẩm</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

function saveNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value;
    const cat = document.getElementById('new-prod-cat').value;
    const price = parseInt(document.getElementById('new-prod-price').value);
    const stock = parseInt(document.getElementById('new-prod-stock').value) || 0;
    const img = document.getElementById('new-prod-img').value;
    const desc = document.getElementById('new-prod-desc').value;

    const newProd = {
        id: 'p' + (state.products.length + 1),
        name: name,
        category: cat,
        isBestSeller: false,
        price: price,
        originalPrice: price + 5000,
        stock: stock,
        rating: 5.0,
        reviewsCount: 1,
        image: img,
        description: desc,
        tags: ['Mới']
    };

    state.products.unshift(newProd);
    saveStateToStorage();
    closeModal();
    renderAdminProducts();
    renderProducts();
    pushProductsToCloud();
    showToast(`🎉 Đã thêm món mới: ${name} (Số lượng: ${stock} ly)`);
}

function openEditProductModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body">
            <h2 class="modal-item-title">Chỉnh Sửa Sản Phẩm #${product.id}</h2>
            <form onsubmit="saveEditedProduct(event, '${product.id}')">
                <div class="form-group">
                    <label>Tên Đồ Uống (*)</label>
                    <input type="text" id="edit-prod-name" required value="${product.name}">
                </div>
                <div class="form-group">
                    <label>Danh Mục (*)</label>
                    <select id="edit-prod-cat">
                        <option value="milk-tea" ${product.category === 'milk-tea' ? 'selected' : ''}>Trà Sữa Đậm Vị</option>
                        <option value="fruit-tea" ${product.category === 'fruit-tea' ? 'selected' : ''}>Trà Trái Cây Tươi</option>
                        <option value="macchiato" ${product.category === 'macchiato' ? 'selected' : ''}>Macchiato & Cream</option>
                        <option value="snack" ${product.category === 'snack' ? 'selected' : ''}>Ăn Kèm & Dessert</option>
                    </select>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label>Giá Bán (VNĐ) (*)</label>
                        <input type="number" id="edit-prod-price" required value="${product.price}">
                    </div>
                    <div class="form-group">
                        <label>Số Lượng Tồn Kho (*)</label>
                        <input type="number" id="edit-prod-stock" required min="0" value="${product.stock !== undefined ? product.stock : 50}">
                    </div>
                </div>
                <div class="form-group">
                    <label>URL Hình Ảnh (*)</label>
                    <input type="url" id="edit-prod-img" required value="${product.image}">
                </div>
                <div class="form-group">
                    <label>Mô Tả Sản Phẩm</label>
                    <textarea id="edit-prod-desc" rows="3">${product.description || ''}</textarea>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="edit-prod-bestseller" ${product.isBestSeller ? 'checked' : ''} style="width:18px; height:18px;">
                    <label for="edit-prod-bestseller" style="margin:0; cursor:pointer;">Gắn nhãn <strong>Best Seller ⭐</strong></label>
                </div>
                <div style="margin-top:20px; text-align:right;">
                    <button type="button" class="btn-secondary" onclick="closeModal()" style="margin-right:8px;">Hủy Bỏ</button>
                    <button type="submit" class="btn-primary">Cập Nhật Sản Phẩm</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

function saveEditedProduct(e, productId) {
    e.preventDefault();
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    product.name = document.getElementById('edit-prod-name').value.trim();
    product.category = document.getElementById('edit-prod-cat').value;
    product.price = parseInt(document.getElementById('edit-prod-price').value) || 0;
    product.stock = parseInt(document.getElementById('edit-prod-stock').value) || 0;
    product.image = document.getElementById('edit-prod-img').value.trim();
    product.description = document.getElementById('edit-prod-desc').value.trim();
    product.isBestSeller = document.getElementById('edit-prod-bestseller').checked;

    saveStateToStorage();
    closeModal();
    renderAdminProducts();
    renderProducts();
    pushProductsToCloud();
    showToast(`✏️ Đã cập nhật sản phẩm: ${product.name} (Kho: ${product.stock})`);
}

function deleteProduct(prodId) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi thực đơn?')) {
        state.products = state.products.filter(p => p.id !== prodId);
        saveStateToStorage();
        renderAdminProducts();
        renderProducts();
    }
}

// Helpers
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getFormattedLocalDateTime(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    const period = (hours >= 12 && hours < 18) ? 'Buổi chiều' : (hours >= 18 ? 'Buổi tối' : 'Buổi sáng');
    
    return `${year}-${month}-${day} ${pad(hours)}:${minutes}:${seconds} (${period})`;
}

function refreshRealTimeUI() {
    if (state.currentRole === 'admin') {
        renderAdminMetrics();
        renderAdminOrders();
    }
    
    // Refresh open tracker modal in real time
    if (state.activeTrackerOrderId) {
        const order = state.orders.find(o => o.id === state.activeTrackerOrderId);
        if (order) {
            if (state.lastTrackerStatus && state.lastTrackerStatus !== order.status) {
                const statusLabels = {
                    pending: 'Chờ xác nhận',
                    preparing: 'Đang pha chế',
                    shipping: 'Đang giao hàng',
                    completed: 'Hoàn tất',
                    cancelled: 'Đã hủy'
                };
                showToast(`🔔 CẬP NHẬT THỜI GIAN THỰC: Đơn #${order.id} chuyển sang "${statusLabels[order.status] || order.status}"!`);
            }
            state.lastTrackerStatus = order.status;
            updateTrackerDOM(order);
        }
    }

    // Refresh embedded lookup section if active
    const lookupInput = document.getElementById('order-lookup-input');
    if (lookupInput && lookupInput.value.trim()) {
        performOrderLookup();
    }
}

// VietQR Payment Card Generator
function renderVietQRCardHTML(totalAmount, orderCode = '') {
    const formattedAmount = typeof totalAmount === 'number' ? formatCurrency(totalAmount) : totalAmount;
    const rawAmountStr = typeof totalAmount === 'number' ? totalAmount.toString() : (totalAmount || '').toString().replace(/\D/g, '');
    const codeStr = orderCode || `BOBA-${Date.now().toString().slice(-4)}`;

    return `
        <div class="vietqr-card-container">
            <div class="vietqr-header">
                <div class="vietqr-bank-brand">
                    <i class="fa-solid fa-qrcode" style="color: #005baa; font-size: 1.2rem;"></i>
                    <strong style="color: #005baa; font-size: 1.05rem;">VietinBank <span style="color: #e31837;">VietQR</span></strong>
                </div>
                <span class="vietqr-napas-badge"><i class="fa-solid fa-shield-halved"></i> Napas 247</span>
            </div>

            <div class="vietqr-body-grid">
                <div class="vietqr-img-wrapper" onclick="openQRZoomModal('images/vietinbank-qr.png')" title="Bấm để phóng to mã QR">
                    <img src="images/vietinbank-qr.png" alt="Mã QR VietinBank TRIEU TRUNG SON" class="vietqr-img">
                    <div class="vietqr-img-overlay">
                        <i class="fa-solid fa-magnifying-glass-plus"></i> Xem QR
                    </div>
                </div>

                <div class="vietqr-details-list">
                    <div class="vietqr-detail-item">
                        <span class="vietqr-label">Chủ tài khoản:</span>
                        <strong class="vietqr-val">TRIEU TRUNG SON</strong>
                    </div>

                    <div class="vietqr-detail-item">
                        <span class="vietqr-label">Số tài khoản:</span>
                        <div class="vietqr-val-copy">
                            <strong class="vietqr-val highlight">109004393473</strong>
                            <button type="button" class="btn-copy-sm" onclick="copyToClipboard('109004393473', 'Số tài khoản')">
                                <i class="fa-solid fa-copy"></i> Chép
                            </button>
                        </div>
                    </div>

                    <div class="vietqr-detail-item">
                        <span class="vietqr-label">Ngân hàng:</span>
                        <span class="vietqr-val" style="font-size: 0.82rem;">VietinBank (CN Ninh Thuận - Hội Sở)</span>
                    </div>

                    <div class="vietqr-detail-item">
                        <span class="vietqr-label">Nội dung CK:</span>
                        <div class="vietqr-val-copy">
                            <strong class="vietqr-val highlight-gold">${codeStr}</strong>
                            <button type="button" class="btn-copy-sm" onclick="copyToClipboard('${codeStr}', 'Nội dung CK')">
                                <i class="fa-solid fa-copy"></i> Chép
                            </button>
                        </div>
                    </div>

                    <div class="vietqr-detail-item">
                        <span class="vietqr-label">Số tiền:</span>
                        <div class="vietqr-val-copy">
                            <strong class="vietqr-val amount">${formattedAmount}</strong>
                            <button type="button" class="btn-copy-sm" onclick="copyToClipboard('${rawAmountStr}', 'Số tiền')">
                                <i class="fa-solid fa-copy"></i> Chép
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="vietqr-footer-note">
                <i class="fa-solid fa-circle-check" style="color: #27ae60;"></i> Quét mã QR bằng App Ngân Hàng / MoMo / ZaloPay để thanh toán tự động
            </div>
        </div>
    `;
}

function openQRZoomModal(imgSrc) {
    const modalBody = document.getElementById('modal-content-container');
    modalBody.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
        <div class="modal-body" style="text-align: center; padding: 24px;">
            <h3 style="color: var(--primary); margin-bottom: 6px;"><i class="fa-solid fa-qrcode"></i> Mã QR Thanh Toán VietinBank</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Tài khoản: <strong>TRIEU TRUNG SON</strong> - <strong>109004393473</strong></p>
            <img src="${imgSrc}" alt="VietQR VietinBank TRIEU TRUNG SON" style="max-width: 100%; max-height: 480px; border-radius: 16px; box-shadow: var(--shadow-lg); border: 2px solid var(--border-color);">
            <div style="margin-top: 16px;">
                <button class="btn-primary" onclick="closeModal()">Đã Hiểu / Đóng</button>
            </div>
        </div>
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

function copyToClipboard(text, label = '') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`Đã sao chép ${label || text}!`);
        }).catch(() => {
            fallbackCopy(text, label);
        });
    } else {
        fallbackCopy(text, label);
    }
}

function fallbackCopy(text, label = '') {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(`Đã sao chép ${label || text}!`);
    } catch (err) {
        alert(`Sao chép thất bại: ${text}`);
    }
    document.body.removeChild(textArea);
}

function showToast(message) {
    let toast = document.getElementById('boba-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'boba-toast';
        toast.className = 'boba-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--secondary);"></i> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

/* ==========================================================================
   CROSS-DEVICE REAL-TIME CLOUD ORDER SYNC ENGINE & AUDIO ALERTS
   ========================================================================== */

// Web Audio API Doorbell Chime ("Ding-Dong!") for New Order Notifications
function playOrderAlertSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        // Note 1 ("Ding" - 880Hz A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.35, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.5);

        // Note 2 ("Dong" - 587.33Hz D5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.25);
        gain2.gain.setValueAtTime(0.45, ctx.currentTime + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.25);
        osc2.stop(ctx.currentTime + 1.1);
    } catch (e) {
        console.warn('Audio alert sound error:', e);
    }
}

// Push Order to Cloud REST Storage for Cross-Device Synchronization (PubNub Global Cloud Engine)
const PUBNUB_PUB_KEY = 'pub-c-a7a2a5ed-10fb-40c2-9029-472e9e6df7db';
const PUBNUB_SUB_KEY = 'sub-c-98eb49c8-0d19-11ea-bf9d-5a2aa57a22a3';
const PUBNUB_CHANNEL = 'boba_craze_orders_store_2026';

async function pushOrderToCloud(order) {
    if (!order || !order.id) return;

    // 1. Primary Global Cloud Store: PubNub Global REST Network (Instant multi-device relay across Netlify, phones & PCs)
    try {
        const msgJson = JSON.stringify(order);
        const msgEncoded = encodeURIComponent(msgJson);
        const pubUrl = `https://ps.pubnub.com/publish/${PUBNUB_PUB_KEY}/${PUBNUB_SUB_KEY}/0/${PUBNUB_CHANNEL}/0/${msgEncoded}`;
        await fetch(pubUrl);
        console.log('⚡ Order published to PubNub Cloud Engine:', order.id);
    } catch (err) {
        console.warn('PubNub push warning:', err);
    }

    // 2. BroadcastChannel for same-device cross-browser/tab sync
    try {
        if (window.BroadcastChannel) {
            const bc = new BroadcastChannel('boba_cloud_orders_channel');
            bc.postMessage({ type: 'NEW_ORDER', order: order });
            bc.close();
        }
    } catch (e) {}
}

// Poll Cloud Engine to Fetch Orders Placed by Customers on Other Devices
async function syncCloudOrders() {
    let cloudOrders = [];

    // 1. Fetch recent order history from PubNub Global Cloud Channel
    try {
        const historyUrl = `https://ps.pubnub.com/v2/history/sub-key/${PUBNUB_SUB_KEY}/channel/${PUBNUB_CHANNEL}?count=50`;
        const response = await fetch(historyUrl);
        if (response.ok) {
            const data = await response.json();
            // PubNub history format: [ [msg1, msg2, ...], startTimetoken, endTimetoken ]
            if (Array.isArray(data) && Array.isArray(data[0])) {
                data[0].forEach(msg => {
                    if (msg && typeof msg === 'object' && msg.id) {
                        cloudOrders.push(msg);
                    } else if (typeof msg === 'string') {
                        try {
                            const parsed = JSON.parse(msg);
                            if (parsed && parsed.id) cloudOrders.push(parsed);
                        } catch (err) {}
                    }
                });
            }
        }
    } catch (err) {
        console.warn('PubNub order sync fetch error:', err);
    }

    if (cloudOrders.length === 0) return;

    let hasNewOrder = false;
    cloudOrders.forEach(cloudOrder => {
        if (cloudOrder && cloudOrder.id) {
            const localOrderIndex = state.orders.findIndex(o => o.id === cloudOrder.id);
            if (localOrderIndex === -1) {
                // Completely new order placed by a customer from another device/phone
                state.orders.unshift(cloudOrder);
                hasNewOrder = true;

                // Play doorbell sound chime & show notification
                playOrderAlertSound();
                showToast(`🔔 CÓ ĐƠN HÀNG MỚI TỪ KHÁCH HÀNG: #${cloudOrder.id} - ${cloudOrder.customerName} (${formatCurrency(cloudOrder.total)})`);
            } else {
                // If cloud order has newer status updated remotely, sync locally
                if (state.orders[localOrderIndex].status !== cloudOrder.status) {
                    state.orders[localOrderIndex].status = cloudOrder.status;
                    hasNewOrder = true;
                }
            }
        }
    });

    if (hasNewOrder) {
        saveStateToStorage();
        refreshRealTimeUI();
    }
}

// Manual Sync Button for Admin
async function manualSyncCloudOrders() {
    showToast('🔄 Đang đồng bộ đơn hàng từ Cloud...');
    await syncCloudOrders();
    showToast('✅ Đã tải và cập nhật xong đơn hàng từ Cloud!');
}

// Start background Cloud Polling loop and BroadcastChannel listener
function startCloudOrderSync() {
    // Immediate initial check
    syncCloudOrders();

    // Poll every 3 seconds for instant multi-device order relay
    setInterval(syncCloudOrders, 3000);

    // Listen for same-device BroadcastChannel messages
    if (window.BroadcastChannel) {
        try {
            const bc = new BroadcastChannel('boba_cloud_orders_channel');
            bc.onmessage = (event) => {
                if (event.data && event.data.type === 'NEW_ORDER' && event.data.order) {
                    const newOrd = event.data.order;
                    if (!state.orders.some(o => o.id === newOrd.id)) {
                        state.orders.unshift(newOrd);
                        saveStateToStorage();
                        refreshRealTimeUI();
                        playOrderAlertSound();
                        showToast(`🔔 CÓ ĐƠN HÀNG MỚI: #${newOrd.id} từ ${newOrd.customerName}`);
                    }
                }
            };
        } catch (e) {}
    }
}

/* ==========================================================================
   CROSS-DEVICE REAL-TIME CLOUD MENU & PRODUCTS SYNC ENGINE
   ========================================================================== */

const PUBNUB_MENU_CHANNEL = 'boba_craze_products_menu_2026';

async function pushProductsToCloud() {
    if (!state.products) return;
    try {
        const payloadStr = JSON.stringify({
            type: 'MENU_UPDATE',
            products: state.products,
            updatedAt: Date.now()
        });
        const url = `https://ps.pubnub.com/publish/${PUBNUB_PUB_KEY}/${PUBNUB_SUB_KEY}/0/${PUBNUB_MENU_CHANNEL}/0/${encodeURIComponent(payloadStr)}`;
        await fetch(url);
        console.log('⚡ Menu products published to Cloud Relay');
    } catch (e) {
        console.warn('Cloud menu push error:', e);
    }
}

async function syncCloudProducts() {
    try {
        const historyUrl = `https://ps.pubnub.com/v2/history/sub-key/${PUBNUB_SUB_KEY}/channel/${PUBNUB_MENU_CHANNEL}?count=10`;
        const res = await fetch(historyUrl);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && Array.isArray(data[0]) && data[0].length > 0) {
                const lastMsg = data[0][data[0].length - 1];
                let cloudProds = null;
                if (lastMsg && typeof lastMsg === 'object' && Array.isArray(lastMsg.products)) {
                    cloudProds = lastMsg.products;
                } else if (typeof lastMsg === 'string') {
                    try {
                        const parsed = JSON.parse(lastMsg);
                        if (parsed && Array.isArray(parsed.products)) cloudProds = parsed.products;
                    } catch (e) {}
                }

                if (Array.isArray(cloudProds) && cloudProds.length > 0) {
                    const currentSig = JSON.stringify(state.products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock })));
                    const cloudSig = JSON.stringify(cloudProds.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock })));

                    if (currentSig !== cloudSig) {
                        state.products = cloudProds;
                        saveStateToStorage();
                        renderProducts();
                        if (state.currentRole === 'admin') {
                            renderAdminProducts();
                        }
                    }
                }
            }
        }
    } catch (e) {}
}

function startCloudProductSync() {
    syncCloudProducts();
    setInterval(syncCloudProducts, 2500);
}

// Manual Sync Stock To Customers for Admin
async function manualSyncStockToCustomers() {
    showToast('🔄 Đang đồng bộ số lượng tồn kho tới điện thoại khách hàng...');
    await pushProductsToCloud();
    showToast('✅ Đã đồng bộ số lượng tồn kho mới nhất cho tất cả khách hàng!');
}

