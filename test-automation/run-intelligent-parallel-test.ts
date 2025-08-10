#!/usr/bin/env npx tsx

import { IntelligentParallelBot } from './scenarios/intelligent-parallel-bot';

/**
 * 🤖 지능형 병렬 테스트 실행기
 * 
 * 특징:
 * - 5개 브라우저 동시 실행
 * - 실시간 모니터링 및 에러 감지
 * - 30% 에러율 초과시 자동 중단/수정/재시작
 * - 스마트 셀렉터 시스템
 * - 다중 사용자 시나리오 시뮬레이션
 */

async function main() {
    console.log(`
🚀 ===== 지능형 병렬 테스트 봇 =====
🔥 실시간 모니터링 활성화
⚡ 5개 브라우저 병렬 처리
🧠 자동 에러 감지 및 복구
🎯 다중 사용자 시나리오
=======================================
    `.trim());

    const bot = new IntelligentParallelBot();
    
    try {
        await bot.startParallelTesting();
        console.log('🎉 테스트 완료!');
    } catch (error) {
        console.error('💥 테스트 실행 중 오류:', error);
        process.exit(1);
    }
}

// 시그널 핸들링
process.on('SIGINT', () => {
    console.log('\n🛑 사용자에 의해 중단됨');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 프로세스 종료됨');
    process.exit(0);
});

main().catch(error => {
    console.error('💥 실행 중 치명적 오류:', error);
    process.exit(1);
});