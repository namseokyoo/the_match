-- Dummy Data Generation Script for The Match
-- This script creates comprehensive dummy data for testing all features

-- 1. Create test users (if not exists) - using auth.users
-- Note: We'll use existing users or create profiles for demo purposes

-- 2. Insert dummy teams with various sports and descriptions
INSERT INTO public.teams (id, name, logo_url, description, captain_id, created_at)
VALUES
  -- 축구 팀들
  ('a1111111-1111-1111-1111-111111111111', 'FC 서울 드래곤즈', 'https://placehold.co/200x200/FF6B6B/FFFFFF?text=FC+Dragons', '서울 지역 최강 아마추어 축구팀입니다. 매주 주말 훈련하며 리그전 참여 중입니다.', NULL, NOW() - INTERVAL '3 months'),
  ('a2222222-2222-2222-2222-222222222222', '부산 웨이브 FC', 'https://placehold.co/200x200/4ECDC4/FFFFFF?text=Wave+FC', '부산의 열정적인 축구 동호회. 초보자도 환영합니다!', NULL, NOW() - INTERVAL '2 months'),
  ('a3333333-3333-3333-3333-333333333333', '인천 유나이티드', 'https://placehold.co/200x200/45B7D1/FFFFFF?text=Incheon+UTD', '인천 지역 직장인 축구팀. 20-40대 선수 모집 중!', NULL, NOW() - INTERVAL '1 month'),
  
  -- 농구 팀들
  ('b1111111-1111-1111-1111-111111111111', '강남 썬더스', 'https://placehold.co/200x200/F7DC6F/333333?text=Thunders', '강남 지역 농구 동호회. 주 2회 정기 모임 있습니다.', NULL, NOW() - INTERVAL '2 months'),
  ('b2222222-2222-2222-2222-222222222222', '한강 리버스', 'https://placehold.co/200x200/BB8FCE/FFFFFF?text=Rivers', '한강공원에서 활동하는 스트리트 농구팀', NULL, NOW() - INTERVAL '1 month'),
  ('b3333333-3333-3333-3333-333333333333', '서초 블레이저스', 'https://placehold.co/200x200/85C1E2/FFFFFF?text=Blazers', '3x3 농구 전문팀. 대회 참가 경험 다수', NULL, NOW() - INTERVAL '15 days'),
  
  -- 배구 팀들
  ('c1111111-1111-1111-1111-111111111111', '성북 스파이커스', 'https://placehold.co/200x200/F8B739/FFFFFF?text=Spikers', '혼성 배구팀입니다. 초보자 대환영!', NULL, NOW() - INTERVAL '1 month'),
  ('c2222222-2222-2222-2222-222222222222', '마포 네트워크', 'https://placehold.co/200x200/EC7063/FFFFFF?text=Network', '마포구 직장인 배구 동호회', NULL, NOW() - INTERVAL '20 days'),
  
  -- 야구 팀들
  ('d1111111-1111-1111-1111-111111111111', '용산 베어스', 'https://placehold.co/200x200/6C5CE7/FFFFFF?text=Bears', '사회인 야구팀. 주말리그 참가 중', NULL, NOW() - INTERVAL '2 months'),
  ('d2222222-2222-2222-2222-222222222222', '송파 이글스', 'https://placehold.co/200x200/00B894/FFFFFF?text=Eagles', '송파구 야구 동호회. 가족같은 분위기!', NULL, NOW() - INTERVAL '1 month')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert dummy players for teams
INSERT INTO public.players (id, name, email, team_id, position, jersey_number, stats, created_at)
VALUES
  -- FC 서울 드래곤즈 선수들
  ('p1111111-1111-1111-1111-111111111111', '김민수', 'minsu.kim@example.com', 'a1111111-1111-1111-1111-111111111111', '공격수', 9, '{"goals": 15, "assists": 8, "games": 20}'::jsonb, NOW() - INTERVAL '2 months'),
  ('p1111111-2222-2222-2222-222222222222', '이정호', 'jungho.lee@example.com', 'a1111111-1111-1111-1111-111111111111', '미드필더', 10, '{"goals": 8, "assists": 12, "games": 20}'::jsonb, NOW() - INTERVAL '2 months'),
  ('p1111111-3333-3333-3333-333333333333', '박성준', 'sungjun.park@example.com', 'a1111111-1111-1111-1111-111111111111', '수비수', 4, '{"goals": 2, "assists": 3, "games": 19}'::jsonb, NOW() - INTERVAL '2 months'),
  ('p1111111-4444-4444-4444-444444444444', '최영진', 'youngjin.choi@example.com', 'a1111111-1111-1111-1111-111111111111', '골키퍼', 1, '{"saves": 45, "cleanSheets": 8, "games": 20}'::jsonb, NOW() - INTERVAL '2 months'),
  
  -- 부산 웨이브 FC 선수들
  ('p2222222-1111-1111-1111-111111111111', '정우성', 'woosung.jung@example.com', 'a2222222-2222-2222-2222-222222222222', '공격수', 11, '{"goals": 12, "assists": 6, "games": 18}'::jsonb, NOW() - INTERVAL '1 month'),
  ('p2222222-2222-2222-2222-222222222222', '한지민', 'jimin.han@example.com', 'a2222222-2222-2222-2222-222222222222', '미드필더', 8, '{"goals": 5, "assists": 10, "games": 18}'::jsonb, NOW() - INTERVAL '1 month'),
  ('p2222222-3333-3333-3333-333333333333', '송강호', 'kangho.song@example.com', 'a2222222-2222-2222-2222-222222222222', '수비수', 3, '{"goals": 1, "assists": 2, "games": 17}'::jsonb, NOW() - INTERVAL '1 month'),
  
  -- 강남 썬더스 농구 선수들
  ('p3333333-1111-1111-1111-111111111111', '윤도현', 'dohyun.yoon@example.com', 'b1111111-1111-1111-1111-111111111111', '센터', 15, '{"points": 245, "rebounds": 120, "games": 15}'::jsonb, NOW() - INTERVAL '1 month'),
  ('p3333333-2222-2222-2222-222222222222', '김태희', 'taehee.kim@example.com', 'b1111111-1111-1111-1111-111111111111', '가드', 23, '{"points": 310, "assists": 85, "games": 15}'::jsonb, NOW() - INTERVAL '1 month'),
  ('p3333333-3333-3333-3333-333333333333', '이민호', 'minho.lee@example.com', 'b1111111-1111-1111-1111-111111111111', '포워드', 32, '{"points": 280, "rebounds": 95, "games": 15}'::jsonb, NOW() - INTERVAL '1 month'),
  
  -- 한강 리버스 농구 선수들
  ('p4444444-1111-1111-1111-111111111111', '박보검', 'bogum.park@example.com', 'b2222222-2222-2222-2222-222222222222', '가드', 7, '{"points": 225, "assists": 65, "games": 12}'::jsonb, NOW() - INTERVAL '20 days'),
  ('p4444444-2222-2222-2222-222222222222', '조인성', 'insung.jo@example.com', 'b2222222-2222-2222-2222-222222222222', '포워드', 24, '{"points": 195, "rebounds": 78, "games": 12}'::jsonb, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert various matches with different statuses and types
INSERT INTO public.matches (id, title, description, type, status, creator_id, max_participants, registration_deadline, start_date, end_date, rules, settings, created_at)
VALUES
  -- 진행 중인 경기들
  ('m1111111-1111-1111-1111-111111111111', 
   '2024 서울 아마추어 축구 리그', 
   '서울 지역 아마추어 축구팀들의 열정적인 리그전! 총 16개 팀이 참가하여 우승을 향해 경쟁합니다.',
   'league', 
   'in_progress', 
   (SELECT id FROM auth.users LIMIT 1), 
   16, 
   NOW() - INTERVAL '2 months', 
   NOW() - INTERVAL '1 month', 
   NOW() + INTERVAL '2 months',
   '{"matchDuration": "90분 (전후반 45분)", "substitutions": "무제한 교체", "yellowCards": "경고 2장 = 퇴장", "offside": "적용"}'::jsonb,
   '{"venue": "서울 월드컵 보조경기장", "matchDay": "매주 토요일", "startTime": "14:00"}'::jsonb,
   NOW() - INTERVAL '3 months'),
   
  ('m2222222-2222-2222-2222-222222222222', 
   '강남구 3X3 농구 토너먼트', 
   '강남구 주최 3X3 농구 대회. 우승팀에게는 상금 100만원!',
   'single_elimination', 
   'in_progress', 
   (SELECT id FROM auth.users LIMIT 1), 
   8, 
   NOW() - INTERVAL '1 month', 
   NOW() - INTERVAL '1 week', 
   NOW() + INTERVAL '1 week',
   '{"gameTime": "10분 단판", "scoring": "1점, 2점 슛", "winCondition": "21점 선취득점"}'::jsonb,
   '{"venue": "강남 스포츠 컴플렉스", "courtNumber": "3번 코트"}'::jsonb,
   NOW() - INTERVAL '2 months'),
   
  -- 모집 중인 경기들
  ('m3333333-3333-3333-3333-333333333333', 
   '2024 겨울 배구 리그', 
   '혼성 배구 리그입니다. 남녀 구분없이 즐겁게 운동하실 분들 모집합니다!',
   'round_robin', 
   'registration', 
   (SELECT id FROM auth.users LIMIT 1), 
   12, 
   NOW() + INTERVAL '2 weeks', 
   NOW() + INTERVAL '1 month', 
   NOW() + INTERVAL '3 months',
   '{"setCount": "5세트 (3선승)", "scoring": "25점 랠리포인트", "rotation": "포지션 로테이션 적용"}'::jsonb,
   '{"venue": "성북구 체육관", "matchDay": "매주 일요일", "entryFee": "팀당 10만원"}'::jsonb,
   NOW() - INTERVAL '1 week'),
   
  ('m4444444-4444-4444-4444-444444444444', 
   '송파구 야구 챔피언십', 
   '사회인 야구 최강팀을 가립니다. 더블 엘리미네이션 방식!',
   'double_elimination', 
   'registration', 
   (SELECT id FROM auth.users LIMIT 1), 
   16, 
   NOW() + INTERVAL '3 weeks', 
   NOW() + INTERVAL '1.5 months', 
   NOW() + INTERVAL '3 months',
   '{"innings": "9이닝", "mercyRule": "5회 10점차, 7회 7점차", "designatedHitter": "지명타자 허용"}'::jsonb,
   '{"venue": "잠실 야구장", "umpires": "공인 심판 배정", "equipment": "팀별 준비"}'::jsonb,
   NOW() - INTERVAL '3 days'),
   
  ('m5555555-5555-5555-5555-555555555555', 
   '전국 대학 축구 선수권', 
   '전국 대학축구팀 대상 토너먼트. 우승팀은 해외 전지훈련 기회!',
   'single_elimination', 
   'registration', 
   (SELECT id FROM auth.users LIMIT 1), 
   32, 
   NOW() + INTERVAL '1 month', 
   NOW() + INTERVAL '2 months', 
   NOW() + INTERVAL '3 months',
   '{"matchDuration": "90분", "extraTime": "연장 30분", "penalties": "승부차기 적용"}'::jsonb,
   '{"venue": "각 지역 대학 경기장", "broadcasting": "유튜브 생중계"}'::jsonb,
   NOW() - INTERVAL '1 day'),
   
  -- 완료된 경기들
  ('m6666666-6666-6666-6666-666666666666', 
   '2024 여름 비치발리볼 대회', 
   '해운대에서 펼쳐진 뜨거운 여름 비치발리볼 대회',
   'single_elimination', 
   'completed', 
   (SELECT id FROM auth.users LIMIT 1), 
   16, 
   NOW() - INTERVAL '4 months', 
   NOW() - INTERVAL '3 months', 
   NOW() - INTERVAL '2.5 months',
   '{"teamSize": "2인 1팀", "setCount": "3세트 2선승", "scoring": "21점"}'::jsonb,
   '{"venue": "해운대 해수욕장", "prize": "우승 50만원, 준우승 30만원"}'::jsonb,
   NOW() - INTERVAL '5 months'),
   
  ('m7777777-7777-7777-7777-777777777777', 
   '가을 탁구 마스터즈', 
   '개인전 탁구 대회. 초급/중급/고급 부문별 진행',
   'swiss', 
   'completed', 
   (SELECT id FROM auth.users LIMIT 1), 
   64, 
   NOW() - INTERVAL '3 months', 
   NOW() - INTERVAL '2 months', 
   NOW() - INTERVAL '1.5 months',
   '{"gameCount": "5게임 3선승", "scoring": "11점제", "service": "2구 교대"}'::jsonb,
   '{"venue": "올림픽공원 탁구장", "divisions": "초급/중급/고급"}'::jsonb,
   NOW() - INTERVAL '4 months')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert match participants (teams applying to matches)
INSERT INTO public.match_participants (id, match_id, team_id, status, applied_at, responded_at, notes)
VALUES
  -- 진행 중인 축구 리그 참가팀들
  ('mp111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'approved', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1.5 months', '서울 대표팀으로 참가합니다!'),
  ('mp111111-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'approved', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1.5 months', '부산에서 원정 옵니다!'),
  ('mp111111-3333-3333-3333-333333333333', 'm1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'approved', NOW() - INTERVAL '1.5 months', NOW() - INTERVAL '1.4 months', '열심히 하겠습니다'),
  
  -- 농구 토너먼트 참가팀들
  ('mp222222-1111-1111-1111-111111111111', 'm2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'approved', NOW() - INTERVAL '1 month', NOW() - INTERVAL '3 weeks', '우승 목표!'),
  ('mp222222-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'approved', NOW() - INTERVAL '1 month', NOW() - INTERVAL '3 weeks', '3X3 전문팀입니다'),
  ('mp222222-3333-3333-3333-333333333333', 'm2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'approved', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '2.5 weeks', NULL),
  
  -- 배구 리그 신청팀들 (모집 중)
  ('mp333333-1111-1111-1111-111111111111', 'm3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'pending', NOW() - INTERVAL '3 days', NULL, '혼성팀 신청합니다'),
  ('mp333333-2222-2222-2222-222222222222', 'm3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'approved', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', '참가비 입금 완료'),
  
  -- 야구 챔피언십 신청팀들
  ('mp444444-1111-1111-1111-111111111111', 'm4444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111', 'pending', NOW() - INTERVAL '1 day', NULL, '용산 베어스 참가 신청'),
  ('mp444444-2222-2222-2222-222222222222', 'm4444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'rejected', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', '선수 명단 미비로 반려')
ON CONFLICT (id) DO NOTHING;

-- 6. Create some games for the in-progress tournament
INSERT INTO public.games (id, match_id, round, game_number, team1_id, team2_id, status, scheduled_at, venue)
VALUES
  -- 축구 리그 경기들
  ('g1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 1, 1, 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'completed', NOW() - INTERVAL '3 weeks', '서울 월드컵 보조경기장'),
  ('g1111111-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 1, 2, 'a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'scheduled', NOW() + INTERVAL '1 week', '서울 월드컵 보조경기장'),
  ('g1111111-3333-3333-3333-333333333333', 'm1111111-1111-1111-1111-111111111111', 1, 3, 'a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'scheduled', NOW() + INTERVAL '2 weeks', '서울 월드컵 보조경기장'),
  
  -- 농구 토너먼트 경기들
  ('g2222222-1111-1111-1111-111111111111', 'm2222222-2222-2222-2222-222222222222', 1, 1, 'b1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'in_progress', NOW(), '강남 스포츠 컴플렉스'),
  ('g2222222-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222222', 1, 2, 'b3333333-3333-3333-3333-333333333333', NULL, 'scheduled', NOW() + INTERVAL '2 hours', '강남 스포츠 컴플렉스')
ON CONFLICT (id) DO NOTHING;

-- 7. Add some game results
INSERT INTO public.game_results (id, game_id, winner_id, team1_score, team2_score, verified)
VALUES
  ('gr111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 3, 2, true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create bracket nodes for single elimination tournament
INSERT INTO public.bracket_nodes (id, match_id, round, position, team1_id, team2_id, winner_id, game_id)
VALUES
  -- 농구 토너먼트 브라켓
  ('bn111111-1111-1111-1111-111111111111', 'm2222222-2222-2222-2222-222222222222', 1, 1, 'b1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', NULL, 'g2222222-1111-1111-1111-111111111111'),
  ('bn111111-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222222', 1, 2, 'b3333333-3333-3333-3333-333333333333', NULL, NULL, 'g2222222-2222-2222-2222-222222222222'),
  ('bn111111-3333-3333-3333-333333333333', 'm2222222-2222-2222-2222-222222222222', 2, 1, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. Add some team messages for collaboration
INSERT INTO public.team_messages (id, team_id, user_id, message, is_announcement)
VALUES
  ('tm111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), '이번 주 토요일 경기 있습니다. 모두 참석 부탁드려요!', true),
  ('tm111111-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), '경기 전 오후 1시에 모여서 워밍업 하겠습니다.', false),
  ('tm222222-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', (SELECT id FROM auth.users LIMIT 1), '오늘 경기 화이팅! 우승 가자!', false)
ON CONFLICT (id) DO NOTHING;

-- Update statistics
UPDATE public.teams SET created_at = created_at WHERE id IS NOT NULL;
UPDATE public.matches SET created_at = created_at WHERE id IS NOT NULL;
UPDATE public.players SET created_at = created_at WHERE id IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Dummy data successfully inserted!';
  RAISE NOTICE 'Created: 10 teams, 12 players, 7 matches, 10 match participants, 5 games, 1 game result, 3 bracket nodes, 3 team messages';
END $$;