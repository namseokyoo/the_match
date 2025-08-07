'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';

interface TourStep {
    id: string;
    title: string;
    description: string;
    target?: string; // CSS selector for highlighting
    position?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
}

const tourSteps: TourStep[] = [
    {
        id: 'welcome',
        title: '환영합니다! 🎉',
        description: 'The Match에 오신 것을 환영합니다. 경기 및 토너먼트 관리를 위한 완벽한 플랫폼입니다.',
    },
    {
        id: 'create-match',
        title: '경기 생성하기',
        description: '먼저 새로운 경기를 만들어보세요. 싱글 엘리미네이션, 더블 엘리미네이션, 라운드 로빈 등 다양한 형식을 지원합니다.',
        target: '[data-tour="create-match"]',
        position: 'bottom',
    },
    {
        id: 'team-management',
        title: '팀 관리',
        description: '팀을 생성하고 선수를 추가하여 경기에 참가할 수 있습니다.',
        target: '[data-tour="teams"]',
        position: 'bottom',
    },
    {
        id: 'dashboard',
        title: '대시보드',
        description: '대시보드에서 진행 중인 경기, 최근 결과, 통계를 한눈에 확인할 수 있습니다.',
        target: '[data-tour="dashboard"]',
        position: 'bottom',
    },
    {
        id: 'realtime',
        title: '실시간 업데이트',
        description: '경기 상태와 결과가 실시간으로 업데이트됩니다. 참가자들과 즉시 소통할 수 있습니다.',
    },
    {
        id: 'complete',
        title: '시작할 준비가 되었습니다!',
        description: '이제 The Match의 모든 기능을 사용할 준비가 되었습니다. 첫 경기를 만들어보시겠습니까?',
    },
];

interface OnboardingTourProps {
    onComplete?: () => void;
    autoStart?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
    onComplete,
    autoStart = true,
}) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasSeenTour, setHasSeenTour] = useState(false);
    const router = useRouter();

    // 투어 완료 여부 확인
    useEffect(() => {
        const tourCompleted = localStorage.getItem('onboarding_completed');
        if (tourCompleted) {
            setHasSeenTour(true);
        } else if (autoStart) {
            setIsActive(true);
        }
    }, [autoStart]);

    // 현재 단계의 요소 하이라이트
    useEffect(() => {
        if (isActive && tourSteps[currentStep].target) {
            const target = document.querySelector(tourSteps[currentStep].target!);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.classList.add('tour-highlight');
            }

            return () => {
                if (target) {
                    target.classList.remove('tour-highlight');
                }
            };
        }
    }, [currentStep, isActive]);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem('onboarding_completed', 'true');
        setIsActive(false);
        setHasSeenTour(true);
        
        if (onComplete) {
            onComplete();
        }

        // 마지막 단계에서 경기 생성 페이지로 이동 제안
        if (currentStep === tourSteps.length - 1) {
            const goToCreate = window.confirm('첫 경기를 만들어보시겠습니까?');
            if (goToCreate) {
                router.push('/matches/create');
            }
        }
    };

    const handleRestart = () => {
        setCurrentStep(0);
        setIsActive(true);
    };

    if (!isActive) {
        if (hasSeenTour) {
            return (
                <button
                    onClick={handleRestart}
                    className="fixed bottom-4 right-4 z-40 bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-shadow"
                    title="투어 다시 보기"
                >
                    <svg className="w-6 h-6 text-match-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            );
        }
        return null;
    }

    const step = tourSteps[currentStep];
    const progress = ((currentStep + 1) / tourSteps.length) * 100;

    return (
        <>
            {/* 오버레이 */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleSkip} />
            
            {/* 투어 카드 */}
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50">
                <Card className="p-6 shadow-2xl">
                    {/* 진행 바 */}
                    <div className="mb-4">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-match-blue transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {currentStep + 1} / {tourSteps.length}
                        </p>
                    </div>

                    {/* 컨텐츠 */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {step.title}
                        </h2>
                        <p className="text-gray-600">
                            {step.description}
                        </p>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleSkip}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            건너뛰기
                        </button>
                        
                        <div className="flex space-x-2">
                            {currentStep > 0 && (
                                <Button
                                    onClick={handlePrevious}
                                    variant="secondary"
                                    size="sm"
                                >
                                    이전
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                variant="primary"
                                size="sm"
                            >
                                {currentStep === tourSteps.length - 1 ? '완료' : '다음'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 하이라이트 스타일 */}
            <style jsx global>{`
                .tour-highlight {
                    position: relative;
                    z-index: 45;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
                    border-radius: 4px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
                    }
                    100% {
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
                    }
                }
            `}</style>
        </>
    );
};