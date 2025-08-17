import React from 'react';
import Link from 'next/link';

export default function MatchNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto text-center">
                <div className="mb-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        경기를 찾을 수 없습니다
                    </h1>
                    <p className="text-gray-600">
                        요청하신 경기가 존재하지 않거나 삭제되었을 수 있습니다.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        href="/matches"
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        경기 목록으로 돌아가기
                    </Link>
                    
                    <Link
                        href="/"
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        홈으로 가기
                    </Link>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                    <p>문제가 지속되면 관리자에게 문의해주세요.</p>
                </div>
            </div>
        </div>
    );
}