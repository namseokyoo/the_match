'use client';

import { Trophy, Users, Calendar, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingTour } from '@/components/onboarding';

export default function Home() {
    const router = useRouter();
    const { user } = useAuth();

    // 경기 생성 페이지로 이동
    const handleCreateMatch = () => {
        if (!user) {
            router.push('/login');
        } else {
            router.push('/matches/create');
        }
    };

    // 경기 목록 페이지로 이동
    const handleViewMatches = () => {
        router.push('/matches');
    };

    // 시작하기 버튼 (회원가입 또는 경기 페이지로)
    const handleGetStarted = () => {
        if (!user) {
            router.push('/signup');
        } else {
            router.push('/matches');
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Onboarding Tour for new users */}
            <OnboardingTour autoStart={!!user} />
            
            {/* Hero Section */}
            <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-match-blue to-match-purple px-4 py-12">
                <div className="text-center text-white">
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                        <Trophy className="h-12 w-12" />
                    </div>
                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
                        The Match
                    </h1>
                    <p className="mb-8 text-xl text-white/90 md:text-2xl">
                        경기 관리의 새로운 기준
                    </p>
                    <p className="mb-8 max-w-2xl text-lg text-white/80 md:text-xl">
                        다양한 스포츠 경기의 대진표를 쉽게 생성하고, 팀을 관리하며,
                        경기 결과를 추적하는 모바일 최적화 플랫폼
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <button
                            onClick={handleCreateMatch}
                            className="touch-target rounded-lg bg-white px-8 py-3 font-semibold text-match-blue transition-all hover:bg-white/90 hover:shadow-lg"
                        >
                            경기 생성하기
                        </button>
                        <button
                            onClick={handleViewMatches}
                            className="touch-target rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-all hover:bg-white hover:text-match-blue"
                        >
                            경기 보기
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-16 px-4">
                <div className="mx-auto max-w-6xl">
                    <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
                        주요 기능
                    </h2>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-match-blue/10">
                                <Trophy className="h-8 w-8 text-match-blue" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">경기 생성</h3>
                            <p className="text-gray-600">
                                다양한 형식의 경기를 쉽게 생성하고 관리하세요
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-match-green/10">
                                <Users className="h-8 w-8 text-match-green" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">팀 관리</h3>
                            <p className="text-gray-600">
                                팀과 선수 정보를 체계적으로 관리하고 추적하세요
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-match-orange/10">
                                <Calendar className="h-8 w-8 text-match-orange" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">경기 일정</h3>
                            <p className="text-gray-600">
                                경기 일정을 관리하고 실시간으로 업데이트하세요
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-match-purple/10">
                                <BarChart3 className="h-8 w-8 text-match-purple" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">통계 분석</h3>
                            <p className="text-gray-600">
                                상세한 통계와 분석으로 성과를 추적하세요
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gray-50 py-16 px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900">
                        지금 시작하세요
                    </h2>
                    <p className="mb-8 text-xl text-gray-600">
                        무료로 The Match를 체험해보고 경기 관리의 새로운 경험을 만나보세요
                    </p>
                    <button
                        onClick={handleGetStarted}
                        className="touch-target rounded-lg bg-match-blue px-8 py-3 font-semibold text-white transition-all hover:bg-match-blue/90 hover:shadow-lg"
                    >
                        {user ? '경기 보기' : '무료로 시작하기'}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-8 px-4 text-white">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-6 w-6" />
                            <span className="text-xl font-bold">The Match</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            © 2024 The Match. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
} 