async function loadOrders() {
  const user = await requireAuth();
  if (!user) return;

  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = '<tr><td colspan="5"><div class="spinner"></div></td></tr>';

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !orders?.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <p>주문 내역이 없습니다.</p>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const items = o.order_items || [];
    const itemText = items.map(i => `${i.product_name} × ${i.quantity}`).join(', ');
    const date = new Date(o.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' });
    return `
      <tr>
        <td style="font-size:.8rem;color:var(--gray-400)">${date}</td>
        <td>${itemText || '-'}</td>
        <td><span class="badge badge--${o.status}">${statusLabel(o.status)}</span></td>
        <td style="font-weight:600">₩${o.total_amount.toLocaleString()}</td>
        <td style="font-size:.8rem;color:var(--gray-400)">${o.toss_order_id || ''}</td>
      </tr>`;
  }).join('');
}

function statusLabel(s) {
  return { pending:'결제 대기', paid:'결제 완료', cancelled:'취소', failed:'실패' }[s] || s;
}
