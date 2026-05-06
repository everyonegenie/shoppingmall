let paymentWidget = null;
let paymentMethodsWidget = null;
let agreementWidget = null;

async function initCheckout() {
  const user = await requireAuth();
  if (!user) return;
  window._checkoutUser = user;

  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const items = Object.values(cart);

  if (!items.length) { location.href = 'index.html'; return; }

  renderOrderSummary(items);
  await initTossWidget(items, user);
}

function renderOrderSummary(items) {
  const list = document.getElementById('order-items');
  const totalEl = document.getElementById('order-total-amount');
  let total = 0;

  list.innerHTML = items.map(({ product, qty }) => {
    const subtotal = product.price * qty;
    total += subtotal;
    return `<div class="order-item">
      <span>${product.name} × ${qty}</span>
      <span>₩${subtotal.toLocaleString()}</span>
    </div>`;
  }).join('');

  totalEl.textContent = '₩' + total.toLocaleString();
  window._checkoutTotal = total;
}

async function initTossWidget(items, user) {
  const total = window._checkoutTotal;

  // 토스 위젯 초기화
  paymentWidget = await PaymentWidget(TOSS_CLIENT_KEY, user.id);
  paymentMethodsWidget = paymentWidget.renderPaymentMethods(
    '#payment-method',
    { value: total },
    { variantKey: 'DEFAULT' }
  );
  agreementWidget = paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });

  document.getElementById('pay-btn').disabled = false;
}

async function requestPayment() {
  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.textContent = '처리 중...';

  const cart = JSON.parse(localStorage.getItem('cart') || '{}');
  const items = Object.values(cart);
  const total = window._checkoutTotal;
  const user  = window._checkoutUser;

  // 고유 주문 ID 생성
  const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const orderName = items.length === 1
    ? items[0].product.name
    : `${items[0].product.name} 외 ${items.length - 1}건`;

  // Supabase 에 pending 주문 먼저 저장
  const { error: orderErr } = await supabase.from('orders').insert({
    user_id: user.id,
    user_email: user.email,
    status: 'pending',
    total_amount: total,
    toss_order_id: orderId,
  });

  if (orderErr) {
    alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
    btn.disabled = false;
    btn.textContent = '결제하기';
    return;
  }

  // order_items 저장
  const { data: order } = await supabase.from('orders').select('id').eq('toss_order_id', orderId).single();
  if (order) {
    await supabase.from('order_items').insert(
      items.map(({ product, qty }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        price: product.price,
      }))
    );
  }

  // 토스 결제 요청
  try {
    await paymentWidget.requestPayment({
      orderId,
      orderName,
      successUrl: SITE_URL + '/success.html',
      failUrl: SITE_URL + '/fail.html',
      customerEmail: user.email,
    });
  } catch (err) {
    // 사용자가 결제 취소한 경우 등
    btn.disabled = false;
    btn.textContent = '결제하기';
  }
}
