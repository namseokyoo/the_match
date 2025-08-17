'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Trophy, Eye, EyeOff } from 'lucide-react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, signInWithGoogle, user, loading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            // redirectTo 또는 returnUrl 파라미터 확인
            const redirectTo = searchParams.get('redirectTo') || searchParams.get('returnUrl');
            console.log('[Login] User logged in, redirecting to:', redirectTo || '/dashboard');
            router.push(redirectTo || '/dashboard');
        }
    }, [user, loading, router, searchParams]);

    // Check for error in URL params
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'callback_error') {
            setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }, [searchParams]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        const { error } = await signIn(email, password);

        if (error) {
            setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        } else {
            const returnUrl = searchParams.get('returnUrl');
            router.push(returnUrl || '/matches');
        }

        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');

        const { error } = await signInWithGoogle();

        if (error) {
            setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
            setIsLoading(false);
        }
        // Note: Don't set loading to false here as the redirect will happen
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 shadow-lg">
                        <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        The Match에 로그인
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        토너먼트 관리의 새로운 경험을 시작하세요
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">로그인</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    이메일
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={setEmail}
                                    disabled={isLoading}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    비밀번호
                                </label>
                                <div className="relative mt-1">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="비밀번호를 입력하세요"
                                        value={password}
                                        onChange={setPassword}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                로그인
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">또는</span>
                            </div>
                        </div>

                        {/* Google Login */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google로 로그인
                        </Button>

                        {/* Sign up link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                계정이 없으신가요?{' '}
                                <Link
                                    href="/signup"
                                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                    회원가입
                                </Link>
                            </p>
                        </div>

                        {/* Forgot password link */}
                        <div className="text-center">
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-600">로딩 중...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
} 