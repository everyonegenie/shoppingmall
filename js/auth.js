// 공통 인증 유틸 — 모든 페이지에서 로드

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) { location.href = 'auth.html'; return null; }
  return user;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') { location.href = 'index.html'; return null; }
  return profile;
}

async function logout() {
  await supabase.auth.signOut();
  location.href = 'auth.html';
}

// 네비게이션 바 로그인 상태 반영
async function renderNav() {
  const user = await getCurrentUser();
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  if (user) {
    const profile = await getCurrentProfile();
    navAuth.innerHTML = `
      <a href="orders.html">주문내역</a>
      ${profile?.role === 'admin' ? '<a href="admin.html">관리자</a>' : ''}
      <button onclick="logout()" class="btn btn--outline btn--sm">로그아웃</button>
    `;
  } else {
    navAuth.innerHTML = `<a href="auth.html" class="btn btn--primary btn--sm">로그인</a>`;
  }
}
