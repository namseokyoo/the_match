'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeGuideProps {
    onClose?: () => void;
    isFooterVersion?: boolean;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onClose, isFooterVersion = false }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        // 푸터 버전이 아닌 경우에만 자동 표시 로직 실행
        if (!isFooterVersion) {
            const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
            if (!hasSeenGuide) {
                setIsVisible(true);
            }
        } else {
            // 푸터에서 호출된 경우 항상 표시
            setIsVisible(true);
        }
    }, [isFooterVersion]);

    const handleClose = () => {
        setIsVisible(false);
        if (!isFooterVersion) {
            localStorage.setItem('hasSeenWelcomeGuide', 'true');
        }
        onClose?.();
    };

    const handleDontShowAgain = () => {
        localStorage.setItem('hasSeenWelcomeGuide', 'true');
        handleClose();
    };

    const steps = [
        {
            title: "The Match에 오신 것을 환영합니다!",
            icon: Trophy,
            color: "blue",
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">The Match</span>는 모든 종류의 스포츠 경기를 
                        쉽고 편리하게 관리할 수 있는 플랫폼입니다.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">이런 경기들을 관리할 수 있어요:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span>⚽ 축구 리그</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span>🏀 농구 토너먼트</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span>🎮 e스포츠 대회</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span>🏸 배드민턴 클럽전</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "시작하기 - 3단계로 끝!",
            icon: Calendar,
            color: "green",
            content: (
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                                    1
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">회원가입 또는 로그인</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    간단한 이메일 인증으로 바로 시작할 수 있어요
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">
                                    2
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">경기 또는 팀 생성</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    주최자라면 경기를, 참가자라면 팀을 만들어보세요
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold">
                                    3
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">참가자 모집 및 관리</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    자동으로 대진표가 생성되고, 결과를 기록할 수 있어요
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "주요 기능 소개",
            icon: Users,
            color: "purple",
            content: (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        <div className="border border-gray-200 rounded-lg p-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                🏆 다양한 경기 방식
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                토너먼트, 리그전, 스위스 라운드 등 다양한 방식 지원
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                📊 실시간 대진표
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                자동으로 생성되고 업데이트되는 대진표와 순위표
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                👥 팀 관리
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                팀원 모집, 참가 신청, 체크인까지 한 번에
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                📱 모바일 최적화
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                언제 어디서나 경기를 관리하고 확인하세요
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    if (!isVisible) return null;

    const currentStepData = steps[currentStep];
    const Icon = currentStepData.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in" data-testid="welcome-guide">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r from-${currentStepData.color}-500 to-${currentStepData.color}-600 p-6 text-white`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{currentStepData.title}</h2>
                                <p className="text-sm text-white text-opacity-90 mt-1">
                                    단계 {currentStep + 1} / {steps.length}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {currentStepData.content}
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 px-6 pb-3">
                    {steps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentStep 
                                    ? 'w-8 bg-blue-600' 
                                    : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div>
                            {!isFooterVersion && currentStep === 0 && (
                                <button
                                    onClick={handleDontShowAgain}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    다시 보지 않기
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    이전
                                </button>
                            )}
                            {currentStep < steps.length - 1 ? (
                                <button
                                    onClick={() => setCurrentStep(currentStep + 1)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    다음
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    {user ? (
                                        <Link
                                            href="/matches/create"
                                            onClick={handleClose}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            경기 만들기
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/signup"
                                            onClick={handleClose}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            지금 시작하기
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeGuide;