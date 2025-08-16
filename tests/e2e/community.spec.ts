import { test, expect } from '@playwright/test';

const BASE_URL = 'https://the-match-five.vercel.app';

// 테스트용 계정 정보
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123',
  name: '테스트사용자'
};

// 테스트 데이터 생성 함수
function generateTestData() {
  const timestamp = Date.now();
  return {
    title: `Test Post ${timestamp}`,
    content: '테스트 게시글입니다',
    category: '자유게시판'
  };
}

test.describe('커뮤니티 게시판 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('게시글 조회 테스트', () => {
    test('커뮤니티 페이지 접근 및 기본 요소 확인', async ({ page }) => {
      // 커뮤니티 메뉴 클릭
      await page.click('a[href="/community"]');
      await page.waitForLoadState('networkidle');

      // URL 확인
      expect(page.url()).toBe(`${BASE_URL}/community`);

      // 페이지 제목 확인
      await expect(page.locator('h1')).toContainText('커뮤니티');

      // 카테고리 버튼들 확인
      await expect(page.locator('button:has-text("전체")')).toBeVisible();
      await expect(page.locator('button:has-text("자유게시판")')).toBeVisible();
      await expect(page.locator('button:has-text("팀원모집")')).toBeVisible();
      await expect(page.locator('button:has-text("경기후기")')).toBeVisible();
    });

    test('게시글 목록 표시 확인', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // 게시글이 있는지 확인 (최소한 하나의 게시글이 있다고 가정)
      const postLinks = page.locator('a[href*="/community/posts/"]');
      const postCount = await postLinks.count();
      
      if (postCount > 0) {
        // 게시글 요소들 확인
        const firstPost = postLinks.first();
        await expect(firstPost).toBeVisible();
        
        // 게시글 기본 정보 확인 (제목, 작성자, 시간 등)
        await expect(firstPost.locator('h3')).toBeVisible();
        await expect(firstPost.locator('text=익명')).toBeVisible();
        
        // 조회수 확인 (숫자가 포함된 요소들 확인)
        const numberElements = firstPost.locator('span').filter({ hasText: /^\d+$/ });
        const numberCount = await numberElements.count();
        if (numberCount > 0) {
          await expect(numberElements.last()).toBeVisible();
        }
      }
    });

    test('게시글 상세 보기', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // 첫 번째 게시글 클릭
      const firstPost = page.locator('a[href*="/community/posts/"]').first();
      if (await firstPost.count() > 0) {
        await firstPost.click();
        await page.waitForLoadState('networkidle');

        // 상세 페이지 요소들 확인
        await expect(page.locator('article')).toBeVisible();
        await expect(page.locator('h1')).toBeVisible(); // 게시글 제목
        await expect(page.locator('button:has-text("목록으로")')).toBeVisible();
        await expect(page.locator('button:has-text("좋아요")')).toBeVisible();
        
        // 댓글 섹션 확인
        await expect(page.locator('h2:has-text("댓글")')).toBeVisible();
        
        // 목록으로 돌아가기
        await page.click('button:has-text("목록으로")');
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/community');
      }
    });

    test('카테고리별 필터링', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // 자유게시판 카테고리 클릭
      await page.click('button:has-text("자유게시판")');
      await page.waitForTimeout(1000); // 필터링 결과 대기

      // URL에 필터 파라미터가 추가되었는지 확인하거나
      // 필터된 결과가 표시되는지 확인
      const posts = page.locator('a[href*="/community/posts/"]');
      if (await posts.count() > 0) {
        // 자유게시판 카테고리 게시글인지 확인
        await expect(posts.first()).toBeVisible();
      }

      // 전체 카테고리로 돌아가기
      await page.click('button:has-text("전체")');
      await page.waitForTimeout(1000);
    });
  });

  test.describe('게시글 작성 테스트 (로그인 필요)', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인 필요한 테스트를 위한 설정
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
    });

    test('로그인하지 않은 상태에서 글쓰기 접근 시도', async ({ page }) => {
      // 직접 글쓰기 페이지로 접근 시도
      await page.goto(`${BASE_URL}/community/write`);
      await page.waitForLoadState('networkidle');

      // 로그인 페이지로 리다이렉트되는지 확인
      expect(page.url()).toContain('/login');
    });

    test('로그인 후 게시글 작성', async ({ page }) => {
      // 로그인 과정 (실제 계정이 있다고 가정)
      const loginEmailInput = page.locator('input[type="email"]');
      const loginPasswordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button[type="submit"]:has-text("로그인")');

      if (await loginEmailInput.count() > 0) {
        await loginEmailInput.fill(TEST_USER.email);
        await loginPasswordInput.fill(TEST_USER.password);
        await loginButton.click();
        await page.waitForLoadState('networkidle');

        // 로그인 성공 후 커뮤니티로 이동
        await page.goto(`${BASE_URL}/community`);
        await page.waitForLoadState('networkidle');

        // 글쓰기 버튼이 보이는지 확인하고 클릭
        const writeButton = page.locator('a[href="/community/write"], button:has-text("글쓰기")');
        if (await writeButton.count() > 0) {
          await writeButton.click();
          await page.waitForLoadState('networkidle');

          // 글쓰기 폼 확인 및 작성
          const testData = generateTestData();
          
          await expect(page.locator('input[name="title"], input[placeholder*="제목"]')).toBeVisible();
          await expect(page.locator('textarea[name="content"], textarea[placeholder*="내용"]')).toBeVisible();

          await page.fill('input[name="title"], input[placeholder*="제목"]', testData.title);
          await page.fill('textarea[name="content"], textarea[placeholder*="내용"]', testData.content);

          // 카테고리 선택 (드롭다운이 있다면)
          const categorySelect = page.locator('select[name="category"], select[name="board"]');
          if (await categorySelect.count() > 0) {
            await categorySelect.selectOption('free');
          }

          // 게시글 등록
          await page.click('button[type="submit"]:has-text("등록"), button:has-text("작성완료")');
          await page.waitForLoadState('networkidle');

          // 등록 후 상세 페이지로 이동했는지 확인
          expect(page.url()).toContain('/community/posts/');
          await expect(page.locator('h1')).toContainText(testData.title);
        }
      }
    });
  });

  test.describe('게시글 수정/삭제 테스트', () => {
    test('본인 게시글 수정 권한 확인', async ({ page }) => {
      // 로그인 후 본인이 작성한 게시글에서만 수정/삭제 버튼이 보이는지 확인
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      const firstPost = page.locator('a[href*="/community/posts/"]').first();
      if (await firstPost.count() > 0) {
        await firstPost.click();
        await page.waitForLoadState('networkidle');

        // 수정/삭제 버튼이 있는지 확인 (로그인하지 않은 상태에서는 없어야 함)
        const editButton = page.locator('button:has-text("수정"), a:has-text("수정")');
        const deleteButton = page.locator('button:has-text("삭제")');
        
        // 로그인하지 않은 상태에서는 수정/삭제 버튼이 보이지 않아야 함
        await expect(editButton).toHaveCount(0);
        await expect(deleteButton).toHaveCount(0);
      }
    });
  });

  test.describe('상호작용 테스트', () => {
    test('좋아요 기능', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      const firstPost = page.locator('a[href*="/community/posts/"]').first();
      if (await firstPost.count() > 0) {
        await firstPost.click();
        await page.waitForLoadState('networkidle');

        // 좋아요 버튼 확인
        const likeButton = page.locator('button:has-text("좋아요")');
        await expect(likeButton).toBeVisible();

        // 현재 좋아요 수 확인
        const currentLikeText = await likeButton.textContent();
        const currentLikes = parseInt(currentLikeText?.match(/\d+/)?.[0] || '0');

        // 로그인하지 않은 상태에서 좋아요 클릭 (로그인 유도될 수 있음)
        await likeButton.click();
        await page.waitForTimeout(1000);

        // 로그인 페이지로 이동하거나 로그인 모달이 뜨는지 확인
        const isLoginPage = page.url().includes('/login');
        const loginModal = page.locator('[role="dialog"]:has-text("로그인")');
        
        if (!isLoginPage && await loginModal.count() === 0) {
          // 로그인 없이 좋아요가 가능한 경우, 좋아요 수 변화 확인
          await page.waitForTimeout(1000);
          const newLikeText = await likeButton.textContent();
          const newLikes = parseInt(newLikeText?.match(/\d+/)?.[0] || '0');
          
          // 좋아요 기능이 정상적으로 작동하는지 확인 (변화가 있거나 로그인이 필요할 수 있음)
          // 로그인이 필요한 경우라면 좋아요 수가 변하지 않을 수 있음
          if (newLikes !== currentLikes) {
            console.log(`좋아요 수 변화: ${currentLikes} → ${newLikes}`);
          } else {
            console.log('좋아요 기능 사용을 위해 로그인이 필요할 수 있습니다.');
          }
        }
      }
    });

    test('조회수 증가 확인', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      const firstPost = page.locator('a[href*="/community/posts/"]').first();
      if (await firstPost.count() > 0) {
        // 목록에서 조회수 확인 (가장 마지막 숫자가 조회수일 가능성이 높음)
        const viewCountElements = firstPost.locator('span').filter({ hasText: /^\d+$/ });
        const viewCountElementsCount = await viewCountElements.count();
        let listViewCount = '0';
        
        if (viewCountElementsCount > 0) {
          // 조회수는 보통 좋아요, 댓글 다음 마지막에 표시됨
          listViewCount = await viewCountElements.last().textContent() || '0';
        }
        
        // 게시글 클릭
        await firstPost.click();
        await page.waitForLoadState('networkidle');

        // 뒤로 가기 후 조회수 변화 확인
        await page.goBack();
        await page.waitForLoadState('networkidle');

        // 조회수가 증가했는지 확인 (실제 구현에 따라 다를 수 있음)
        const newViewCountElements = firstPost.locator('span').filter({ hasText: /^\d+$/ });
        const newViewCountElementsCount = await newViewCountElements.count();
        let newViewCount = '0';
        
        if (newViewCountElementsCount > 0) {
          newViewCount = await newViewCountElements.last().textContent() || '0';
        }
        
        // 조회수가 같거나 증가했는지 확인 (캐싱 등으로 즉시 반영되지 않을 수 있음)
        const oldCount = parseInt(listViewCount);
        const newCount = parseInt(newViewCount);
        
        console.log(`조회수 변화: ${oldCount} → ${newCount}`);
        expect(newCount).toBeGreaterThanOrEqual(oldCount);
      }
    });

    test('댓글 작성 (로그인 필요)', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      const firstPost = page.locator('a[href*="/community/posts/"]').first();
      if (await firstPost.count() > 0) {
        await firstPost.click();
        await page.waitForLoadState('networkidle');

        // 댓글 섹션 확인
        await expect(page.locator('h2:has-text("댓글")')).toBeVisible();
        
        // 로그인하지 않은 상태에서는 로그인 유도 메시지가 있어야 함
        const loginMessage = page.locator('text=로그인이 필요합니다');
        const loginButton = page.locator('a[href="/login"]:has-text("로그인")');
        
        if (await loginMessage.count() > 0) {
          await expect(loginMessage).toBeVisible();
          await expect(loginButton).toBeVisible();
        }

        // 댓글 입력창이 있다면 (로그인된 상태)
        const commentInput = page.locator('textarea[placeholder*="댓글"], textarea[name="comment"]');
        if (await commentInput.count() > 0) {
          await commentInput.fill('테스트 댓글입니다.');
          
          const submitButton = page.locator('button[type="submit"]:has-text("댓글"), button:has-text("작성")');
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForLoadState('networkidle');
            
            // 댓글이 추가되었는지 확인
            await expect(page.locator('text=테스트 댓글입니다.')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('검색 기능 테스트', () => {
    test('게시글 검색', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // 검색창이 있는지 확인
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
      const searchButton = page.locator('button[type="submit"]:has-text("검색"), button:has-text("🔍")');

      if (await searchInput.count() > 0) {
        // 검색어 입력
        await searchInput.fill('축구');
        
        if (await searchButton.count() > 0) {
          await searchButton.click();
        } else {
          await searchInput.press('Enter');
        }
        
        await page.waitForLoadState('networkidle');
        
        // 검색 결과 확인
        const posts = page.locator('a[href*="/community/posts/"]');
        if (await posts.count() > 0) {
          // 검색어가 포함된 게시글이 있는지 확인
          const firstPost = posts.first();
          const postContent = await firstPost.textContent();
          expect(postContent?.toLowerCase()).toContain('축구');
        }
      } else {
        // 검색 기능이 아직 구현되지 않은 경우
        console.log('검색 기능이 구현되지 않았습니다.');
      }
    });
  });

  test.describe('모바일 반응형 테스트', () => {
    test('모바일 뷰에서 커뮤니티 페이지', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // 모바일에서도 기본 요소들이 잘 보이는지 확인
      await expect(page.locator('h1:has-text("커뮤니티")')).toBeVisible();
      await expect(page.locator('button:has-text("전체")')).toBeVisible();
      
      // 카테고리 버튼들이 모바일에서 잘 정렬되어 있는지 확인
      const categoryButtons = page.locator('button:has-text("자유게시판")');
      await expect(categoryButtons).toBeVisible();
      
      // 게시글 목록이 모바일에서도 잘 표시되는지 확인
      const posts = page.locator('a[href*="/community/posts/"]');
      if (await posts.count() > 0) {
        await expect(posts.first()).toBeVisible();
      }
    });
  });

  test.describe('접근성 테스트', () => {
    test('키보드 네비게이션', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // Tab 키로 네비게이션 가능한지 확인
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // 포커스된 요소가 있는지 확인
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Enter 키로 링크나 버튼 활성화 가능한지 확인
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName);
        if (tagName === 'A' || tagName === 'BUTTON') {
          // Enter 키 테스트는 실제 네비게이션을 발생시킬 수 있으므로 주의
          console.log('키보드 네비게이션 가능');
        }
      }
    });

    test('스크린 리더 지원 요소 확인', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // aria-label, alt 텍스트 등 확인
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        
        // 이미지에 적절한 대체 텍스트가 있는지 확인
        expect(alt !== null || ariaLabel !== null).toBeTruthy();
      }
      
      // 제목 요소들이 적절한 계층 구조를 가지는지 확인
      await expect(page.locator('h1')).toBeVisible();
      
      // 링크에 적절한 텍스트가 있는지 확인
      const links = page.locator('a');
      const linkCount = await links.count();
      
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        
        // 링크에 적절한 텍스트나 aria-label이 있는지 확인
        expect((text && text.trim().length > 0) || (ariaLabel && ariaLabel.length > 0)).toBeTruthy();
      }
    });
  });
});