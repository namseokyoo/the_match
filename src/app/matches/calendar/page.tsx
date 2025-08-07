'use client';

import React from 'react';
import { MatchCalendar } from '@/components/calendar/MatchCalendar';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function MatchCalendarPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 브레드크럼 */}
                <nav className="flex mb-8" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <Link
                                href="/matches"
                                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                경기 목록
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">캘린더</span>
                            </div>
                        </li>
                    </ol>
                </nav>

                {/* 페이지 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">경기 일정 캘린더</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                월별, 주별로 경기 일정을 한눈에 확인하세요.
                            </p>
                        </div>
                        {user && (
                            <Link
                                href="/matches/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                새 경기 만들기
                            </Link>
                        )}
                    </div>
                </div>

                {/* 캘린더 컴포넌트 */}
                <MatchCalendar />

                {/* 안내 정보 */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                캘린더 사용 팁
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>경기를 클릭하면 상세 정보를 확인할 수 있습니다.</li>
                                    <li>상단 필터를 사용하여 경기 상태나 유형별로 필터링할 수 있습니다.</li>
                                    <li>월/주/목록 뷰를 선택하여 원하는 방식으로 일정을 확인하세요.</li>
                                    <li>파란색 배경의 날짜는 오늘을 나타냅니다.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}