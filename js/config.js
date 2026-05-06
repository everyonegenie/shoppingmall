// ──────────────────────────────────────────────
// Supabase 설정
// Supabase Dashboard > Settings > API 에서 복사
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://ooajhypfqimdbaeilltb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYWpoeXBmcWltZGJhZWlsbHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTIzMTYsImV4cCI6MjA5MjkyODMxNn0.-nprRb3r2t5US3FphO7dshMG6vayOq7zBr_tkVv07sM';

// Edge Function URL (Supabase Dashboard > Edge Functions 에서 확인)
// 예: https://xxxx.supabase.co/functions/v1/confirm-payment
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/confirm-payment`;

// ──────────────────────────────────────────────
// Toss Payments 테스트 클라이언트 키
// 본인 계정 키가 있으면 아래 값을 교체하세요.
// ──────────────────────────────────────────────
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eo0';

// GitHub Pages URL (success/fail 리다이렉트용)
const SITE_URL = 'https://everyonegenie.github.io/shoppingmall';

// UMD 번들이 전역 'supabase' 를 이미 선언하므로 클라이언트는 'sb' 로 명명
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
