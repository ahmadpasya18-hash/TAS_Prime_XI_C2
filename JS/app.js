const productGrid = document.getElementById('productGrid');
const homeProductGrid = document.getElementById('homeProductGrid');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const historyList = document.getElementById('historyList');
const profileCard = document.getElementById('profileCard');
const pageButtons = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const searchInput = document.getElementById('searchInput');
const refreshButton = document.getElementById('refreshButton');
const checkoutButton = document.getElementById('checkoutButton');
const splashScreen = document.getElementById('splashScreen');
const appShell = document.getElementById('appShell');

let products = [];
let cart = JSON.parse(localStorage.getItem('buSuryatiCart') || '[]');
let history = JSON.parse(localStorage.getItem('buSuryatiHistory') || '[]');
let currentCategory = 'all';

function animateButton(element) {
  element.classList.add('pulse');
  setTimeout(() => {
    element.classList.remove('pulse');
  }, 500);
}

function setActivePage(pageName) {
  pages.forEach((page) => {
    page.classList.toggle('page-active', page.dataset.page === pageName);
  });
  pageButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === pageName);
  });
}

function prettyQuantity(count) {
  return `${count} item${count !== 1 ? 's' : ''}`;
}

function updateCartUI() {
  cartList.innerHTML = '';
  if (cart.length === 0) {
    cartList.innerHTML = '<p class="empty-state">Keranjang kosong. Tambahkan produk untuk mulai memilih.</p>';
  } else {
    cart.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'cart-item';
      card.innerHTML = `
        <div>
          <h4>${item.name}</h4>
          <p>${item.price} • ${item.quantity}x</p>
        </div>
        <div class="cart-item-action">
          <button class="icon-button" data-action="remove" data-id="${item.id}">−</button>
        </div>`;
      cartList.appendChild(card);
    });
  }
  cartTotal.textContent = prettyQuantity(cart.reduce((acc, item) => acc + item.quantity, 0));
}

function updateHistoryUI() {
  historyList.innerHTML = '';
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-state">Belum ada riwayat pesanan. Pesan dulu yuk!</p>';
    return;
  }
  history.slice().reverse().forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <h4>${entry.title}</h4>
      <p>${entry.detail}</p>
      <p><small>${new Date(entry.time).toLocaleString('id-ID')}</small></p>`;
    historyList.appendChild(item);
  });
}

function renderProducts(list) {
  productGrid.innerHTML = '';
  if (!list.length) {
    productGrid.innerHTML = '<p class="empty-state">Produk tidak ditemukan. Coba kata kunci lain.</p>';
    return;
  }
  list.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.produk_image}" alt="${product.produk_name}" loading="lazy" />
      <h4>${product.produk_name}</h4>
      <p>${product.produk_category} • Stok ${product.produk_stock}</p>
      <div class="price-row">
        <span class="price">${product.produk_price}</span>
        <button class="primary-button pulse-on-click" data-action="add" data-id="${product.produk_id}">Tambah</button>
      </div>`;
    productGrid.appendChild(card);
  });
}

function renderHomeProducts() {
  const filtered = currentCategory === 'all' ? products : products.filter(p => p.produk_category === currentCategory);
  homeProductGrid.innerHTML = '';
  if (!filtered.length) {
    homeProductGrid.innerHTML = '<p class="empty-state">Tidak ada produk di kategori ini.</p>';
    return;
  }
  filtered.slice(0, 6).forEach((product) => { // Show only first 6 for home
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.produk_image}" alt="${product.produk_name}" loading="lazy" />
      <h4>${product.produk_name}</h4>
      <p>${product.produk_category} • Stok ${product.produk_stock}</p>
      <div class="price-row">
        <span class="price">${product.produk_price}</span>
        <button class="primary-button pulse-on-click" data-action="add" data-id="${product.produk_id}">Tambah</button>
      </div>`;
    homeProductGrid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find((item) => item.produk_id === productId);
  if (!product) return;
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.produk_id,
      name: product.produk_name,
      price: product.produk_price,
      quantity: 1,
    });
  }
  localStorage.setItem('buSuryatiCart', JSON.stringify(cart));
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  localStorage.setItem('buSuryatiCart', JSON.stringify(cart));
  updateCartUI();
}

function checkout() {
  if (cart.length === 0) {
    alert('Keranjang masih kosong. Tambahkan produk terlebih dahulu.');
    return;
  }
  const summary = cart.map((item) => `${item.quantity} x ${item.name}`).join(', ');
  history.push({
    title: 'Pesanan Baru',
    detail: summary,
    time: Date.now(),
  });
  cart = [];
  localStorage.setItem('buSuryatiCart', JSON.stringify(cart));
  localStorage.setItem('buSuryatiHistory', JSON.stringify(history));
  updateCartUI();
  updateHistoryUI();
  if (confirm('Pesanan jadi! Mau lihat riwayat sekarang?')) {
    setActivePage('history');
  }
}

async function loadData() {
  try {
    const [productRes, mitraRes] = await Promise.all([
      fetch('DATA/Tabel Produk_rows.json'),
      fetch('DATA/Tabel Mitra_rows.json'),
    ]);
    products = await productRes.json();
    const mitra = await mitraRes.json();
    renderProducts(products);
    renderHomeProducts();
    fillProfile(mitra[0]);
  } catch (error) {
    productGrid.innerHTML = '<p class="empty-state">Gagal memuat produk. Pastikan file JSON tersedia.</p>';
    homeProductGrid.innerHTML = '<p class="empty-state">Gagal memuat produk.</p>';
    console.error(error);
  }
}

function fillProfile(data) {
  if (!data) return;
  document.getElementById('ownerName').textContent = data.owner_name;
  document.getElementById('ownerEmail').textContent = data.email_owner;
  document.getElementById('ownerAddress').textContent = data.address_owner;
  document.getElementById('ownerCategory').textContent = data.kategori;
}

function setupListeners() {
  pageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActivePage(button.dataset.target);
      animateButton(button);
    });
  });

  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    animateButton(target);
    if (action === 'add') addToCart(id);
    if (action === 'remove') removeFromCart(id);
  });

  document.body.addEventListener('click', (event) => {
    const categoryBtn = event.target.closest('.category-btn');
    if (!categoryBtn) return;
    const category = categoryBtn.dataset.category;
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    categoryBtn.classList.add('active');
    currentCategory = category;
    renderHomeProducts();
    animateButton(categoryBtn);
  });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = products.filter((product) =>
      product.produk_name.toLowerCase().includes(query) ||
      product.produk_category.toLowerCase().includes(query) ||
      product.sekolah.toLowerCase().includes(query)
    );
    renderProducts(filtered);
  });

  refreshButton.addEventListener('click', () => {
    animateButton(refreshButton);
    loadData();
  });

  checkoutButton.addEventListener('click', () => {
    animateButton(checkoutButton);
    checkout();
  });

  cartList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove"]');
    if (button) {
      animateButton(button);
    }
  });
}

window.addEventListener('load', () => {
  setTimeout(() => {
    splashScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
  }, 1400);
  loadData();
  updateCartUI();
  updateHistoryUI();
  setupListeners();
});
