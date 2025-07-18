import React from 'react';
import { redirect } from 'next/navigation';
import { Match } from '@/types';
import MatchDetailClient from './MatchDetailClient';

interface MatchDetailPageProps {
    params: { id: string };
}

async function getMatch(id: string): Promise<Match | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/matches/${id}`, {
            next: { revalidate: 60 }, // 캐시 1분
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('서버에서 경기 조회 오류:', error);
        return null;
    }
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
    const match = await getMatch(params.id);

    if (!match) {
        redirect('/matches');
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 브레드크럼 */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                        <a href="/matches" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-match-blue">
                            경기
                        </a>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2" title={match.title}>
                                {match.title.length > 30 ? `${match.title.substring(0, 30)}...` : match.title}
                            </span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* 클라이언트 컴포넌트에 데이터 전달 */}
            <MatchDetailClient match={match} />
        </div>
    );
}