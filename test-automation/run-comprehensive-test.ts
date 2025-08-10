#!/usr/bin/env tsx

import { ComprehensiveTestBot } from './scenarios/comprehensive-match-lifecycle';
import fs from 'fs';
import path from 'path';

const RESULTS_PATH = path.join(__dirname, 'results');

async function runTest() {
    console.log('🚀 The Match 플랫폼 종합 테스트 시작...\n');
    console.log('🎯 테스트 목표: 실제 서비스 환경에서 전체 워크플로우 검증');
    console.log('📊 테스트 범위: 회원가입 → 팀생성 → 경기생성 → 참가신청 → 채팅 → 관리 → 점수입력\n');
    
    try {
        const bot = new ComprehensiveTestBot();
        const results = await bot.runComprehensiveTest();
        
        // 결과 분석
        const totalTests = results.length;
        const passedTests = results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 종합 테스트 완료!');
        console.log('='.repeat(60));
        console.log(`📊 전체 성공률: ${passedTests}/${totalTests} (${successRate}%)`);
        console.log(`✅ 성공: ${passedTests}개 시나리오`);
        console.log(`❌ 실패: ${failedTests}개 시나리오`);
        
        if (failedTests > 0) {
            console.log('\n🚨 실패한 시나리오:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`  ❌ ${r.scenario}`);
                if (r.errors.length > 0) {
                    console.log(`     └ 오류: ${r.errors[0]}`);
                }
            });
        }
        
        console.log('\n📋 상세 리포트 생성 중...');
        const report = bot.generateReport();
        const reportPath = path.join(RESULTS_PATH, `comprehensive-test-report-${Date.now()}.md`);
        fs.writeFileSync(reportPath, report);
        
        console.log(`📄 리포트 저장됨: ${reportPath}`);
        console.log(`📸 스크린샷 저장 위치: ${path.join(__dirname, 'screenshots')}`);
        
        // 성공률에 따른 권장사항
        if (successRate >= 90) {
            console.log('\n🌟 우수한 성과! 플랫폼이 안정적으로 작동합니다.');
        } else if (successRate >= 70) {
            console.log('\n👍 양호한 성과. 몇 가지 개선사항이 있습니다.');
        } else {
            console.log('\n⚠️ 주의 필요. 여러 기능에 문제가 발견되었습니다.');
        }
        
        console.log('\n🤖 봇 모드 준비 완료: 이 스크립트를 정기적으로 실행하여');
        console.log('   서비스 안정성을 모니터링하고 더미 데이터를 유지할 수 있습니다.');
        
        // 최종 결과를 JSON으로도 저장
        const summaryPath = path.join(RESULTS_PATH, `test-summary-${Date.now()}.json`);
        fs.writeFileSync(summaryPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalTests,
            passedTests,
            failedTests,
            successRate,
            details: results.map(r => ({
                scenario: r.scenario,
                success: r.success,
                duration: r.duration,
                errorCount: r.errors.length
            }))
        }, null, 2));
        
        console.log(`💾 요약 데이터: ${summaryPath}\n`);
        
        // 종료 코드 결정
        process.exit(successRate >= 70 ? 0 : 1);
        
    } catch (error) {
        console.error('❌ 테스트 실행 중 치명적 오류 발생:');
        console.error(error);
        
        // 에러 로그 저장
        const errorPath = path.join(RESULTS_PATH, `test-error-${Date.now()}.log`);
        fs.writeFileSync(errorPath, `테스트 실행 오류\n실행 시간: ${new Date().toISOString()}\n\n${error}\n\n${error instanceof Error ? error.stack : ''}`);
        
        console.log(`🚨 에러 로그 저장됨: ${errorPath}`);
        process.exit(2);
    }
}

// 스크립트 직접 실행시에만 작동
if (require.main === module) {
    runTest();
}