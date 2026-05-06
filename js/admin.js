async function initAdmin() {
  const profile = await requireAdmin();
  if (!profile) return;

  await loadAllOrders();
  await loadAdminProducts();
}

// ── 전체 주문 내역 ──────────────────────────────
async function loadAllOrders() {
  const tbody = document.getElementById('admin-orders-body');
  tbody.innerHTML = '<tr><td colspan="6"><div class="spinner"></div></td></tr>';

  const { data: orders, error } = await sb
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error || !orders?.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>주문이 없습니다.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const items = (o.order_items || []).map(i => `${i.product_name} × ${i.quantity}`).join(', ');
    const date = new Date(o.created_at).toLocaleString('ko-KR');
    return `
      <tr>
        <td style="font-size:.8rem;color:var(--gray-400)">${date}</td>
        <td>${o.user_email || '-'}</td>
        <td>${items || '-'}</td>
        <td><span class="badge badge--${o.status}">${statusLabel(o.status)}</span></td>
        <td style="font-weight:600">₩${o.total_amount.toLocaleString()}</td>
        <td style="font-size:.75rem;color:var(--gray-400);word-break:break-all">${o.toss_order_id || ''}</td>
      </tr>`;
  }).join('');
}

// ── 상품 관리 ────────────────────────────────────
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-body');
  tbody.innerHTML = '<tr><td colspan="5"><div class="spinner"></div></td></tr>';

  const { data: products } = await sb.from('products').select('*').order('created_at', { ascending: true });

  if (!products?.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><p>상품이 없습니다.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>₩${p.price.toLocaleString()}</td>
      <td>${p.stock}</td>
      <td><span class="badge badge--${p.is_active ? 'paid' : 'cancelled'}">${p.is_active ? '판매중' : '숨김'}</span></td>
      <td>
        <button class="btn btn--secondary btn--sm" onclick="editProduct('${p.id}')">수정</button>
        <button class="btn btn--danger btn--sm" style="margin-left:4px" onclick="deleteProduct('${p.id}')">삭제</button>
      </td>
    </tr>`).join('');

  window._adminProducts = products;
}

async function saveProduct(e) {
  e.preventDefault();
  const id    = document.getElementById('prod-id').value;
  const data  = {
    name:        document.getElementById('prod-name').value.trim(),
    description: document.getElementById('prod-desc').value.trim(),
    price:       parseInt(document.getElementById('prod-price').value),
    image_url:   document.getElementById('prod-img').value.trim(),
    stock:       parseInt(document.getElementById('prod-stock').value),
    is_active:   document.getElementById('prod-active').checked,
  };

  let error;
  if (id) {
    ({ error } = await sb.from('products').update(data).eq('id', id));
  } else {
    ({ error } = await sb.from('products').insert(data));
  }

  if (error) { alert('저장 실패: ' + error.message); return; }

  resetProductForm();
  await loadAdminProducts();
}

function editProduct(id) {
  const p = (window._adminProducts || []).find(x => x.id === id);
  if (!p) return;
  document.getElementById('prod-id').value      = p.id;
  document.getElementById('prod-name').value    = p.name;
  document.getElementById('prod-desc').value    = p.description || '';
  document.getElementById('prod-price').value   = p.price;
  document.getElementById('prod-img').value     = p.image_url || '';
  document.getElementById('prod-stock').value   = p.stock;
  document.getElementById('prod-active').checked = p.is_active;
  document.getElementById('prod-form-title').textContent = '상품 수정';
  document.getElementById('prod-cancel').style.display = '';
  document.querySelector('[data-section="products"]').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) { alert('삭제 실패: ' + error.message); return; }
  await loadAdminProducts();
}

function resetProductForm() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-form-title').textContent = '상품 추가';
  document.getElementById('prod-cancel').style.display = 'none';
  document.getElementById('prod-active').checked = true;
}

function switchAdminTab(tab) {
  ['orders', 'products'].forEach(t => {
    document.getElementById(`section-${t}`).style.display = t === tab ? '' : 'none';
    document.getElementById(`tab-${t}`).classList.toggle('btn--primary', t === tab);
    document.getElementById(`tab-${t}`).classList.toggle('btn--secondary', t !== tab);
  });
}

function statusLabel(s) {
  return { pending:'결제 대기', paid:'결제 완료', cancelled:'취소', failed:'실패' }[s] || s;
}
