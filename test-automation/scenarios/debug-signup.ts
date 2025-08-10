import { chromium } from 'playwright';

const BASE_URL = 'https://the-match-five.vercel.app';

/**
 * 🔍 회원가입 디버깅 스크립트
 * - 실제 페이지 구조 분석
 * - 올바른 셀렉터 찾기
 * - 스크린샷으로 문제 확인
 */
async function debugSignupForm() {
    console.log('🔍 회원가입 폼 디버깅 시작...');
    
    const browser = await chromium.launch({ headless: false }); // 시각적으로 확인
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 회원가입 페이지로 이동
        console.log('📱 회원가입 페이지 접속...');
        await page.goto(`${BASE_URL}/signup`);
        await page.waitForLoadState('networkidle');
        
        // 페이지 스크린샷
        await page.screenshot({ path: 'debug-signup-page.png', fullPage: true });
        console.log('📸 페이지 스크린샷 저장: debug-signup-page.png');
        
        // 모든 input 요소들 찾기
        console.log('\n🔍 페이지의 모든 input 요소들:');
        const inputs = await page.locator('input').all();
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const id = await input.getAttribute('id');
            const placeholder = await input.getAttribute('placeholder');
            const type = await input.getAttribute('type');
            const name = await input.getAttribute('name');
            
            console.log(`Input ${i + 1}:`);
            console.log(`  - ID: ${id}`);
            console.log(`  - Type: ${type}`);
            console.log(`  - Placeholder: ${placeholder}`);
            console.log(`  - Name: ${name}`);
            console.log();
        }
        
        // 모든 button 요소들 찾기
        console.log('🔍 페이지의 모든 button 요소들:');
        const buttons = await page.locator('button').all();
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = await button.textContent();
            const type = await button.getAttribute('type');
            const className = await button.getAttribute('class');
            
            console.log(`Button ${i + 1}:`);
            console.log(`  - Text: ${text?.trim()}`);
            console.log(`  - Type: ${type}`);
            console.log(`  - Class: ${className}`);
            console.log();
        }
        
        // 폼 테스트
        console.log('🧪 실제 입력 테스트 시작...');
        
        // 이름 입력 테스트
        const nameSelectors = [
            'input#name',
            'input[name="name"]',
            'input[placeholder*="이름"]',
            'input[type="text"]'
        ];
        
        let nameSuccess = false;
        for (const selector of nameSelectors) {
            try {
                await page.fill(selector, '테스트사용자', { timeout: 2000 });
                console.log(`✅ 이름 입력 성공: ${selector}`);
                nameSuccess = true;
                break;
            } catch (error) {
                console.log(`❌ 이름 입력 실패: ${selector}`);
            }
        }
        
        if (!nameSuccess) {
            console.log('🚨 이름 입력이 모든 셀렉터에서 실패!');
        }
        
        // 이메일 입력 테스트
        const emailSelectors = [
            'input#email',
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="이메일"]'
        ];
        
        let emailSuccess = false;
        for (const selector of emailSelectors) {
            try {
                await page.fill(selector, 'debug@test.com', { timeout: 2000 });
                console.log(`✅ 이메일 입력 성공: ${selector}`);
                emailSuccess = true;
                break;
            } catch (error) {
                console.log(`❌ 이메일 입력 실패: ${selector}`);
            }
        }
        
        // 비밀번호 입력 테스트
        const passwordSelectors = [
            'input#password',
            'input[name="password"]',
            'input[type="password"]:first-of-type',
            'input[placeholder*="비밀번호"]:not([placeholder*="다시"])'
        ];
        
        let passwordSuccess = false;
        for (const selector of passwordSelectors) {
            try {
                await page.fill(selector, 'TestPassword123!', { timeout: 2000 });
                console.log(`✅ 비밀번호 입력 성공: ${selector}`);
                passwordSuccess = true;
                break;
            } catch (error) {
                console.log(`❌ 비밀번호 입력 실패: ${selector}`);
            }
        }
        
        // 비밀번호 확인 입력 테스트
        const confirmPasswordSelectors = [
            'input#confirmPassword',
            'input[name="confirmPassword"]',
            'input[type="password"]:last-of-type',
            'input[placeholder*="비밀번호를 다시"]',
            'input[placeholder*="확인"]'
        ];
        
        let confirmPasswordSuccess = false;
        for (const selector of confirmPasswordSelectors) {
            try {
                await page.fill(selector, 'TestPassword123!', { timeout: 2000 });
                console.log(`✅ 비밀번호 확인 입력 성공: ${selector}`);
                confirmPasswordSuccess = true;
                break;
            } catch (error) {
                console.log(`❌ 비밀번호 확인 입력 실패: ${selector}`);
            }
        }
        
        // 입력 완료 후 스크린샷
        await page.screenshot({ path: 'debug-signup-filled.png', fullPage: true });
        console.log('📸 입력 완료 스크린샷 저장: debug-signup-filled.png');
        
        // 제출 버튼 테스트
        const submitSelectors = [
            'button[type="submit"]:has-text("회원가입")',
            'button:has-text("회원가입")',
            'button[type="submit"]'
        ];
        
        let submitSuccess = false;
        for (const selector of submitSelectors) {
            try {
                await page.click(selector, { timeout: 2000 });
                console.log(`✅ 제출 버튼 클릭 성공: ${selector}`);
                submitSuccess = true;
                break;
            } catch (error) {
                console.log(`❌ 제출 버튼 클릭 실패: ${selector}`);
            }
        }
        
        if (submitSuccess) {
            console.log('⏳ 제출 후 5초 대기...');
            await page.waitForTimeout(5000);
            
            // 제출 후 스크린샷
            await page.screenshot({ path: 'debug-signup-after-submit.png', fullPage: true });
            console.log('📸 제출 후 스크린샷 저장: debug-signup-after-submit.png');
            
            // URL 변경 확인
            const currentUrl = page.url();
            console.log(`🌐 현재 URL: ${currentUrl}`);
            
            // 성공/실패 메시지 확인
            const successMessages = [
                'text="회원가입 완료"',
                'text="로그인 페이지로 이동"',
                'text="가입이 완료"'
            ];
            
            for (const message of successMessages) {
                const visible = await page.locator(message).isVisible();
                if (visible) {
                    console.log(`✅ 성공 메시지 발견: ${message}`);
                }
            }
            
            // 에러 메시지 확인
            const errorElements = await page.locator('.text-red-600, .text-red-800, .bg-red-50').all();
            if (errorElements.length > 0) {
                console.log('🚨 에러 메시지 발견:');
                for (const element of errorElements) {
                    const text = await element.textContent();
                    if (text?.trim()) {
                        console.log(`  - ${text.trim()}`);
                    }
                }
            }
        }
        
        console.log('\n📋 === 디버깅 요약 ===');
        console.log(`이름 입력: ${nameSuccess ? '✅' : '❌'}`);
        console.log(`이메일 입력: ${emailSuccess ? '✅' : '❌'}`);
        console.log(`비밀번호 입력: ${passwordSuccess ? '✅' : '❌'}`);
        console.log(`비밀번호 확인: ${confirmPasswordSuccess ? '✅' : '❌'}`);
        console.log(`제출 버튼: ${submitSuccess ? '✅' : '❌'}`);
        
        if (nameSuccess && emailSuccess && passwordSuccess && confirmPasswordSuccess) {
            console.log('🎉 모든 입력 필드가 정상 작동!');
        } else {
            console.log('🚨 일부 입력 필드에 문제가 있습니다.');
        }
        
    } catch (error) {
        console.error('💥 디버깅 중 오류:', error);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    debugSignupForm().catch(console.error);
}

export { debugSignupForm };