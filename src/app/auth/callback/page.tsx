'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState('인증 처리 중...');
    const [subMessage, setSubMessage] = useState('잠시만 기다려주세요. 로그인을 완료하고 있습니다.');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // URL에서 토큰 파라미터 확인
                const token_hash = searchParams.get('token_hash');
                const type = searchParams.get('type');
                const next = searchParams.get('next') || '/dashboard';

                console.log('Auth callback params:', { token_hash, type, next });

                // 이메일 확인 처리
                if (type === 'email' && token_hash) {
                    setMessage('이메일 확인 중...');
                    setSubMessage('이메일 주소를 확인하고 있습니다.');
                    
                    // verifyOtp를 사용하여 이메일 확인
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash,
                        type: 'email',
                    });

                    if (verifyError) {
                        console.error('Email verification error:', verifyError);
                        setMessage('이메일 확인 실패');
                        setSubMessage('이메일 확인에 실패했습니다. 다시 시도해주세요.');
                        setTimeout(() => {
                            router.push('/login?error=email_verification_failed');
                        }, 3000);
                        return;
                    }

                    setMessage('이메일 확인 완료!');
                    setSubMessage('이제 로그인할 수 있습니다.');
                    setTimeout(() => {
                        router.push('/login?message=email_confirmed');
                    }, 2000);
                    return;
                }

                // 일반 세션 확인
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error handling auth callback:', error);
                    router.push('/login?error=callback_error');
                    return;
                }

                if (data.session) {
                    // Auth successful, redirect to dashboard
                    setMessage('로그인 성공!');
                    setSubMessage('대시보드로 이동합니다.');
                    setTimeout(() => {
                        router.push(next);
                    }, 1000);
                } else {
                    // No session, redirect to login
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error in auth callback:', error);
                setMessage('오류 발생');
                setSubMessage('인증 처리 중 오류가 발생했습니다.');
                setTimeout(() => {
                    router.push('/login?error=callback_error');
                }, 3000);
            }
        };

        handleAuthCallback();
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-match-blue border-t-transparent"></div>
                <h2 className="text-lg font-semibold text-gray-900">{message}</h2>
                <p className="mt-2 text-sm text-gray-600">
                    {subMessage}
                </p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-match-blue border-t-transparent"></div>
                    <h2 className="text-lg font-semibold text-gray-900">인증 처리 중...</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        잠시만 기다려주세요. 로그인을 완료하고 있습니다.
                    </p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
} 