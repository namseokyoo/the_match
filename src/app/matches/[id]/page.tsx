import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Match } from '@/types';
import MatchDetailClient from './MatchDetailClient';

interface MatchDetailPageProps {
    params: { id: string };
}

// 서버 컴포넌트에서 직접 Supabase 사용
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getMatch(id: string): Promise<Match | null> {
    try {
        // ID 유효성 검사
        if (!id || typeof id !== 'string' || id.trim() === '') {
            console.error('Invalid match ID provided:', id);
            return null;
        }

        // 직접 Supabase에서 데이터 조회
        const { data: match, error } = await supabaseAdmin
            .from('matches')
            .select('*')
            .eq('id', id.trim())
            .single();

        if (error) {
            console.error('경기 조회 오류:', error);
            // PGRST116은 데이터가 없는 경우 (404)
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        // 필수 필드 검증
        if (!match || !match.id || !match.title || !match.creator_id) {
            console.error('Invalid match data received:', match);
            return null;
        }

        return match as Match;
    } catch (error) {
        console.error('서버에서 경기 조회 오류:', error);
        return null;
    }
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
    // params 유효성 검사
    if (!params?.id) {
        notFound();
    }

    const match = await getMatch(params.id);

    if (!match) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 브레드크럼 - 깔끔한 디자인 */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2">
                        <li className="inline-flex items-center">
                            <a href="/matches" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors">
                                경기 목록
                            </a>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-900" title={match.title || '제목 없음'}>
                                    {match.title && match.title.length > 30 ? `${match.title.substring(0, 30)}...` : (match.title || '제목 없음')}
                                </span>
                            </div>
                        </li>
                    </ol>
                </nav>

                {/* 클라이언트 컴포넌트에 데이터 전달 */}
                <MatchDetailClient match={match} />
            </div>
        </div>
    );
}