-- 샘플 상품 5개
insert into public.products (name, description, price, image_url, stock) values
  ('로고 후드티', '브랜드 로고가 새겨진 오버핏 후드티. 소재: 코튼 80% 폴리 20%', 49000, 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400', 50),
  ('에코백', '일상에서 편하게 쓸 수 있는 캔버스 에코백. A4 서류 수납 가능', 18000, 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400', 100),
  ('키링', '아크릴 소재 브랜드 캐릭터 키링. 가방 포인트 아이템', 9000, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 200),
  ('스티커 팩', '다양한 디자인 스티커 10종 세트. 다이어리·노트북 꾸미기용', 6000, 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400', 300),
  ('머그컵', '브랜드 로고 머그컵 340ml. 전자레인지·식기세척기 사용 가능', 22000, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', 80);

-- admin 계정 안내
-- auth.html 에서 admin@admin.com / superadmin 으로 회원가입하면
-- handle_new_user 트리거가 자동으로 role = 'admin' 을 부여합니다.
