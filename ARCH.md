# GOODS SHOP — 아키텍처 상세

## 파일 구조

```
shoppingmall/
├── index.html
├── auth.html
├── checkout.html
├── success.html
├── fail.html
├── orders.html
├── admin.html
├── css/
│   └── style.css          # CSS 변수 기반 미니멀 스타일
├── js/
│   ├── config.js          # SUPABASE_URL, ANON_KEY, TOSS_CLIENT_KEY, EDGE_FUNCTION_URL
│   ├── auth.js            # getCurrentUser, getCurrentProfile, requireAuth, requireAdmin, renderNav, logout
│   ├── products.js        # 장바구니(localStorage), 상품 렌더링
│   ├── checkout.js        # Toss 위젯 초기화, pending 주문 생성, requestPayment
│   ├── success.js         # Edge Function 호출로 결제 승인
│   ├── orders.js          # 내 주문 조회
│   └── admin.js           # 전체 주문 조회, 상품 CRUD
├── supabase/
│   └── functions/
│       └── confirm-payment/
│           └── index.ts   # Deno: Toss 승인 API → orders 업데이트
├── sql/
│   ├── schema.sql         # 테이블 DDL + RLS + 트리거
│   └── seed.sql           # 샘플 상품 5개
├── CLAUDE.md
└── ARCH.md
```

## DB 스키마

### `profiles`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | auth.users FK (PK) |
| email | text | |
| role | text | 'user' \| 'admin' |
| created_at | timestamptz | |

### `products`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| name | text | |
| description | text | |
| price | integer | 원 단위 |
| image_url | text | |
| stock | integer | |
| is_active | boolean | false면 목록 미노출 |

### `orders`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | auth.users FK |
| user_email | text | 비정규화 (user 삭제 후 참조용) |
| status | text | pending / paid / cancelled / failed |
| total_amount | integer | |
| toss_payment_key | text | 승인 후 저장 |
| toss_order_id | text | UNIQUE, 토스 요청 시 생성 |

### `order_items`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| order_id | uuid | orders FK |
| product_id | uuid | products FK |
| product_name | text | 비정규화 (상품 삭제 후 참조용) |
| quantity | integer | |
| price | integer | 결제 시점 단가 |

## RLS 요약

| 테이블 | 일반 유저 | 관리자 | 서비스 롤 |
|---|---|---|---|
| profiles | 본인 SELECT/UPDATE | 전체 SELECT | - |
| products | 전체 SELECT | 전체 CRUD | - |
| orders | 본인 SELECT/INSERT | 전체 SELECT | UPDATE (승인) |
| order_items | 본인 주문 SELECT/INSERT | 전체 SELECT | - |

## 결제 플로우

```
[checkout.html]
  1. Toss 위젯 렌더링 (PaymentWidget)
  2. Supabase → orders INSERT (status: 'pending', toss_order_id 생성)
  3. Supabase → order_items INSERT
  4. paymentWidget.requestPayment() 호출
       ↓ 결제 완료
[Toss → success.html?paymentKey=...&orderId=...&amount=...]
  5. success.js: Edge Function POST /confirm-payment
       ↓
[supabase/functions/confirm-payment/index.ts]
  6. POST https://api.tosspayments.com/v1/payments/confirm
  7. Supabase orders UPDATE (status: 'paid', toss_payment_key)
       ↓
[success.html]
  8. localStorage cart 삭제
  9. 완료 화면 표시
```

## Edge Function 배포

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# Edge Function 배포 (프로젝트 ref는 Dashboard > Settings > General)
supabase functions deploy confirm-payment --project-ref <YOUR_PROJECT_REF>

# 시크릿 설정 (토스 테스트 시크릿 키)
supabase secrets set TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R --project-ref <YOUR_PROJECT_REF>
```

Edge Function URL 형식: `https://<ref>.supabase.co/functions/v1/confirm-payment`

→ 이 URL을 `js/config.js`의 `EDGE_FUNCTION_URL`에 입력하거나, `SUPABASE_URL`을 올바르게 설정하면 자동 구성됨.

## 인증 흐름

- `requireAuth()` — 미로그인 시 `auth.html` 리다이렉트
- `requireAdmin()` — 비관리자 시 `index.html` 리다이렉트
- `renderNav()` — 로그인 상태에 따라 헤더 버튼 동적 렌더링
- 관리자 판별: `profiles.role === 'admin'`
- admin@admin.com 가입 시 트리거(`handle_new_user`)가 자동으로 role 설정

## 장바구니

- `localStorage['cart']` 에 `{ [productId]: { product, qty } }` 형태로 저장
- 로그인 없이도 담기 가능, 결제 클릭 시 로그인 요구
- 결제 성공 후 `localStorage.removeItem('cart')` 로 초기화
