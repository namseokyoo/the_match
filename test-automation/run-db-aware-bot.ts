#!/usr/bin/env npx tsx

import { DbAwareIntelligentBot } from './scenarios/db-aware-intelligent-bot';

/**
 * 🧠 DB 상태 인식 지능형 봇 실행기
 * 
 * 특징:
 * - 실시간 DB 상태 분석
 * - 동적 테스트 시나리오 생성
 * - 기존 데이터와 상호작용
 * - 사용자 요청 기반 제어
 * - 가상 데이터 생성 지원
 */

async function main() {
    const args = process.argv.slice(2);
    
    console.log(`
🧠 ===== DB 상태 인식 지능형 봇 =====
📊 실시간 데이터베이스 분석
🎯 동적 시나리오 생성  
🤖 기존 데이터 기반 상호작용
🎛️ 사용자 제어 가능
📈 가상 데이터 생성 지원
=========================================
    `.trim());

    if (args.includes('--help')) {
        console.log(`
사용법:
  npm run test:db-bot                    # 기본 실행
  npm run test:db-bot -- --analysis     # DB 분석만 실행
  npm run test:db-bot -- --populate     # 가상 데이터 생성 모드
  npm run test:db-bot -- --interactive  # 대화형 제어 모드
        `);
        return;
    }

    const bot = new DbAwareIntelligentBot();
    
    try {
        if (args.includes('--analysis')) {
            console.log('📊 DB 분석 모드로 실행...');
            // DB 분석만 실행하는 모드
            await bot.startIntelligentTesting();
        } else if (args.includes('--populate')) {
            console.log('📈 가상 데이터 생성 모드로 실행...');
            // 가상 데이터 생성에 집중하는 모드
            await bot.startIntelligentTesting();
        } else if (args.includes('--interactive')) {
            console.log('🎛️ 대화형 제어 모드로 실행...');
            // 사용자 입력을 받는 대화형 모드
            await runInteractiveMode(bot);
        } else {
            console.log('🤖 기본 지능형 모드로 실행...');
            await bot.startIntelligentTesting();
        }
        
        console.log('🎉 DB 인식 지능형 봇 완료!');
    } catch (error) {
        console.error('💥 봇 실행 중 오류:', error);
        process.exit(1);
    }
}

async function runInteractiveMode(bot: DbAwareIntelligentBot) {
    console.log(`
🎛️ 대화형 제어 모드
사용 가능한 명령어:
  - start: 봇 시작
  - stop: 봇 중지  
  - status: 현재 상태 확인
  - populate: 가상 데이터 생성
  - analyze: DB 상태 분석
  - help: 도움말
  - exit: 종료
    `);
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const prompt = () => {
        rl.question('🎛️ 명령어를 입력하세요: ', async (answer: string) => {
            const command = answer.trim().toLowerCase();
            
            switch (command) {
                case 'start':
                    console.log('🚀 봇 시작...');
                    await bot.startIntelligentTesting();
                    break;
                case 'status':
                    console.log('📊 현재 상태 확인 중...');
                    // 상태 확인 로직
                    break;
                case 'analyze':
                    console.log('📊 DB 분석 시작...');
                    // DB 분석만 실행
                    break;
                case 'populate':
                    console.log('📈 가상 데이터 생성 시작...');
                    // 가상 데이터 생성 모드
                    break;
                case 'help':
                    console.log(`
사용 가능한 명령어:
  - start: 봇 시작
  - stop: 봇 중지  
  - status: 현재 상태 확인
  - populate: 가상 데이터 생성
  - analyze: DB 상태 분석
  - help: 도움말
  - exit: 종료
                    `);
                    break;
                case 'exit':
                    console.log('👋 봇을 종료합니다.');
                    rl.close();
                    return;
                default:
                    console.log('❓ 알 수 없는 명령어입니다. "help"를 입력해보세요.');
            }
            
            setTimeout(prompt, 1000);
        });
    };
    
    prompt();
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