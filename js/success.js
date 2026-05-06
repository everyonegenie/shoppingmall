async function handleSuccess() {
  const params = new URLSearchParams(location.search);
  const paymentKey = params.get('paymentKey');
  const orderId    = params.get('orderId');
  const amount     = Number(params.get('amount'));

  const msgEl = document.getElementById('result-msg');

  if (!paymentKey || !orderId || !amount) {
    msgEl.textContent = '잘못된 접근입니다.';
    return;
  }

  msgEl.textContent = '결제를 승인하는 중...';

  try {
    // Edge Function 호출 (Authorization 헤더 포함)
    const { data: { session } } = await sb.auth.getSession();
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const result = await res.json();

    if (!res.ok) {
      document.getElementById('result-icon').textContent = '❌';
      document.getElementById('result-title').textContent = '결제 승인 실패';
      msgEl.textContent = result.error || '결제 승인 중 오류가 발생했습니다.';
      return;
    }

    // 장바구니 비우기
    localStorage.removeItem('cart');

    document.getElementById('result-icon').textContent = '✅';
    document.getElementById('result-title').textContent = '결제 완료!';
    msgEl.textContent = `${result.orderName || orderId} 주문이 완료되었습니다.`;
    document.getElementById('result-actions').style.display = '';

  } catch (err) {
    document.getElementById('result-icon').textContent = '❌';
    document.getElementById('result-title').textContent = '오류 발생';
    msgEl.textContent = '네트워크 오류가 발생했습니다. 주문 내역에서 확인해주세요.';
  }
}
