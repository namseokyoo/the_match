import { chromium, Browser, Page } from 'playwright';

const BASE_URL = 'https://the-match-five.vercel.app';

/**
 * 🎯 간단한 테스트 데이터 생성기
 * - 안정적인 순차 실행
 * - 팀과 경기 생성 집중
 * - 사용자 친화적인 데이터
 */
class SimpleDataGenerator {
    private browser?: Browser;
    private page?: Page;
    
    async generateTestData(): Promise<void> {
        console.log('🎯 간단한 테스트 데이터 생성 시작');
        
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();
        
        try {
            // 1. 기존 사용자로 로그인해서 팀 생성
            await this.createTestTeams();
            
            // 2. 새로운 사용자 몇명 더 생성
            await this.createAdditionalUsers();
            
            console.log('✅ 테스트 데이터 생성 완료!');
        } catch (error) {
            console.error('❌ 데이터 생성 실패:', error);
        } finally {
            await this.browser?.close();
        }
    }
    
    private async createTestTeams(): Promise<void> {
        console.log('👥 테스트 팀 생성 중...');
        
        const teams = [
            { name: '개발자 축구단', desc: '코딩하다가 지친 개발자들의 축구팀입니다!' },
            { name: '주말 농구 클럽', desc: '매주 토요일 농구를 즐기는 모임입니다.' },
            { name: '런닝 메이트들', desc: '함께 뛰어요! 건강한 러닝 크루입니다.' }
        ];
        
        for (const team of teams) {
            try {
                // 새 사용자 생성해서 팀장으로 만들기
                const timestamp = Date.now();
                const captain = {
                    name: `팀장_${team.name}`,
                    email: `captain_${timestamp}_${Math.random().toString().slice(2, 8)}@thematch.test`,
                    password: 'TeamCaptain123!'
                };
                
                // 회원가입
                console.log(`📝 팀장 회원가입: ${captain.email}`);
                await this.page!.goto(`${BASE_URL}/signup`);
                await this.page!.waitForLoadState('networkidle');
                
                await this.page!.fill('input#name', captain.name);
                await this.page!.fill('input#email', captain.email);  
                await this.page!.fill('input#password', captain.password);
                await this.page!.fill('input#confirmPassword', captain.password);
                
                await this.page!.click('button[type="submit"]:has-text("회원가입")');
                await this.page!.waitForTimeout(5000);
                
                // 팀 생성
                console.log(`👥 팀 생성: ${team.name}`);
                await this.page!.goto(`${BASE_URL}/teams/create`);
                await this.page!.waitForLoadState('networkidle');
                
                await this.page!.fill('input#name', team.name);
                await this.page!.fill('textarea#description', team.desc);
                
                await this.page!.click('button[type="submit"]:has-text("팀 만들기")');
                await this.page!.waitForTimeout(3000);
                
                const success = this.page!.url().includes('/teams/') && !this.page!.url().includes('/create');
                console.log(`${success ? '✅' : '❌'} 팀 생성: ${team.name}`);
                
                // 잠시 대기
                await this.page!.waitForTimeout(2000);
                
            } catch (error) {
                console.error(`❌ 팀 생성 실패 (${team.name}):`, error);
            }
        }
    }
    
    private async createAdditionalUsers(): Promise<void> {
        console.log('👤 추가 사용자 생성 중...');
        
        const users = [
            { name: '김선수', role: '선수' },
            { name: '이매니저', role: '매니저' },  
            { name: '박관중', role: '팬' },
            { name: '최코치', role: '코치' }
        ];
        
        for (const user of users) {
            try {
                const timestamp = Date.now();
                const userData = {
                    name: user.name,
                    email: `${user.name.toLowerCase()}_${timestamp}_${Math.random().toString().slice(2, 6)}@thematch.test`,
                    password: 'Player123!'
                };
                
                console.log(`📝 추가 사용자 회원가입: ${userData.email}`);
                
                await this.page!.goto(`${BASE_URL}/signup`);
                await this.page!.waitForLoadState('networkidle');
                await this.page!.waitForTimeout(2000);
                
                await this.page!.fill('input#name', userData.name);
                await this.page!.fill('input#email', userData.email);
                await this.page!.fill('input#password', userData.password);
                await this.page!.fill('input#confirmPassword', userData.password);
                
                await this.page!.click('button[type="submit"]:has-text("회원가입")');
                await this.page!.waitForTimeout(5000);
                
                const success = this.page!.url().includes('/dashboard');
                console.log(`${success ? '✅' : '❌'} 사용자 생성: ${userData.name}`);
                
                // 대기 시간
                await this.page!.waitForTimeout(3000);
                
            } catch (error) {
                console.error(`❌ 사용자 생성 실패 (${user.name}):`, error);
            }
        }
    }
}

async function runSimpleDataGenerator() {
    const generator = new SimpleDataGenerator();
    await generator.generateTestData();
}

if (require.main === module) {
    runSimpleDataGenerator().catch(console.error);
}

export { SimpleDataGenerator };