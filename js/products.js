// 상품 데이터 글로벌 맵: { id → product }
const productMap = {};

// 장바구니: { productId: { product, qty } }
let cart = JSON.parse(localStorage.getItem('cart') || '{}');

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function getCartTotal() {
  return Object.values(cart).reduce((s, { product, qty }) => s + product.price * qty, 0);
}

function getCartCount() {
  return Object.values(cart).reduce((s, { qty }) => s + qty, 0);
}

function addToCart(productId) {
  const product = productMap[productId];
  if (!product) return;
  if (cart[productId]) {
    cart[productId].qty++;
  } else {
    cart[productId] = { product, qty: 1 };
  }
  saveCart();
  updateCartBar();
  renderProducts();
}

function removeFromCart(productId) {
  if (!cart[productId]) return;
  cart[productId].qty--;
  if (cart[productId].qty <= 0) delete cart[productId];
  saveCart();
  updateCartBar();
  renderProducts();
}

function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  const count = getCartCount();
  if (!bar) return;
  if (count === 0) { bar.classList.remove('visible'); return; }
  bar.classList.add('visible');
  document.getElementById('cart-count').textContent = count + '개 상품';
  document.getElementById('cart-total').textContent = getCartTotal().toLocaleString() + '원';
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<div class="spinner"></div>';

  const { data: products, error } = await sb
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Products load error:', error);
    grid.innerHTML = '<p class="empty-state">상품을 불러오지 못했습니다.</p>';
    return;
  }

  products.forEach(p => { productMap[p.id] = p; });
  window._products = products;
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const products = window._products || [];

  if (!products.length) {
    grid.innerHTML = '<p class="empty-state">등록된 상품이 없습니다.</p>';
    return;
  }

  const html = products.map(function(p) {
    const inCart = cart[p.id];
    const qty = inCart ? inCart.qty : 0;
    const outOfStock = p.stock <= 0;
    const imgSrc = p.image_url || 'https://via.placeholder.com/400';
    const price = Number(p.price).toLocaleString();
    const desc = p.description || '';

    let footer = '';
    if (outOfStock) {
      footer = '<span style="font-size:.8rem;color:var(--gray-400)">품절</span>';
    } else if (qty === 0) {
      footer = '<button class="btn btn--primary btn--sm" onclick="addToCart(\'' + p.id + '\')">담기</button>';
    } else {
      footer = '<div class="qty-control">'
        + '<button onclick="removeFromCart(\'' + p.id + '\')">−</button>'
        + '<span>' + qty + '</span>'
        + '<button onclick="addToCart(\'' + p.id + '\')">+</button>'
        + '</div>';
    }

    return '<div class="card product-card">'
      + '<img class="product-card__img" src="' + imgSrc + '" alt="상품이미지" loading="lazy">'
      + '<div class="product-card__body">'
      + '<div class="product-card__name">' + p.name + '</div>'
      + '<div class="product-card__desc">' + desc + '</div>'
      + '<div class="product-card__price">₩' + price + '</div>'
      + '<div class="product-card__footer">' + footer + '</div>'
      + '</div>'
      + '</div>';
  });

  grid.innerHTML = html.join('');
}

function goCheckout() {
  if (getCartCount() === 0) return;
  const user = window._currentUser;
  if (!user) { location.href = 'auth.html'; return; }
  location.href = 'checkout.html';
}
