'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error handling auth callback:', error);
                    router.push('/login?error=callback_error');
                    return;
                }

                if (data.session) {
                    // Auth successful, redirect to dashboard
                    router.push('/dashboard');
                } else {
                    // No session, redirect to login
                    router.push('/login');
                }
            } catch (error) {
                console.error('Error in auth callback:', error);
                router.push('/login?error=callback_error');
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-match-blue border-t-transparent"></div>
                <h2 className="text-lg font-semibold text-gray-900">인증 처리 중...</h2>
                <p className="mt-2 text-sm text-gray-600">
                    잠시만 기다려주세요. 로그인을 완료하고 있습니다.
                </p>
            </div>
        </div>
    );
} 