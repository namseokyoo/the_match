'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { signIn } from '@/lib/supabase';
import { safeSignUp } from '@/lib/auth-utils';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Trophy, Eye, EyeOff, Check } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { signUp, signInWithGoogle, user, loading } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Password validation
    const isPasswordValid = password.length >= 8;
    const isPasswordMatch = password === confirmPassword && confirmPassword !== '';

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (!isPasswordValid) {
            setError('비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }

        if (!isPasswordMatch) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        setError('');

        // safeSignUp 함수를 사용하여 안전한 회원가입 처리
        const { data, error: signUpError } = await safeSignUp(email, password, {
            full_name: name,
        });

        if (signUpError) {
            // 에러 메시지 처리
            console.error('Signup error:', signUpError);
            
            // 이메일 중복 체크
            if (signUpError.message === 'Email already registered') {
                setError('이미 등록된 이메일 주소입니다. 다른 이메일을 사용하거나 로그인해주세요.');
            } else if (signUpError.message.includes('Invalid email') || 
                       signUpError.message.includes('valid email')) {
                setError('올바른 이메일 주소를 입력해주세요.');
            } else if (signUpError.message.includes('Password') || 
                       signUpError.message.includes('password')) {
                setError('비밀번호는 최소 6자 이상이어야 합니다.');
            } else if (signUpError.message.includes('rate limit')) {
                setError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
            } else if (signUpError.message === 'Signup failed - no user created') {
                setError('회원가입에 실패했습니다. 이미 가입된 이메일일 수 있습니다.');
            } else {
                setError('회원가입에 실패했습니다. 다시 시도해주세요.');
            }
            setIsLoading(false);
            return; // 에러 발생 시 여기서 종료
        }

        // 회원가입이 성공한 경우에만 자동 로그인 시도
        console.log('회원가입 성공, 자동 로그인 시도...');
        
        // 잠시 대기 후 로그인 (Supabase가 사용자를 생성하는 시간 필요)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: signInError } = await signIn(email, password);
        
        if (signInError) {
            console.error('자동 로그인 실패:', signInError);
            // 로그인 실패시 성공 메시지 표시하고 로그인 페이지로 안내
            setSuccess(true);
        } else {
            console.log('자동 로그인 성공');
            // 로그인 성공시 바로 대시보드로 이동
            router.push('/dashboard');
        }
        setIsLoading(false);
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        setError('');

        const { error } = await signInWithGoogle();

        if (error) {
            setError('Google 회원가입에 실패했습니다. 다시 시도해주세요.');
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-match-blue border-t-transparent"></div>
                    <p className="text-sm text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <Card>
                        <CardContent className="text-center p-8">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">회원가입 완료!</h2>
                            <p className="text-gray-600 mb-6">
                                회원가입이 완료되었습니다.<br />
                                이제 로그인하여 서비스를 이용하실 수 있습니다.
                            </p>
                            <Button
                                onClick={() => router.push('/login')}
                                className="w-full"
                            >
                                로그인 페이지로 이동
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-match-blue">
                        <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        The Match 회원가입
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        지금 가입하고 토너먼트 관리를 시작하세요
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">계정 만들기</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Signup Form */}
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    이름
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="홍길동"
                                    value={name}
                                    onChange={setName}
                                    disabled={isLoading}
                                    required
                                    className="mt-1"
                                />
                            </div>

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
                                        placeholder="최소 8자 이상"
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
                                {password && (
                                    <p className={`mt-1 text-xs ${isPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPasswordValid ? '✓ 비밀번호가 유효합니다' : '✗ 최소 8자 이상 입력해주세요'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    비밀번호 확인
                                </label>
                                <div className="relative mt-1">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="비밀번호를 다시 입력하세요"
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && (
                                    <p className={`mt-1 text-xs ${isPasswordMatch ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPasswordMatch ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                loading={isLoading}
                                disabled={isLoading || !isPasswordValid || !isPasswordMatch}
                            >
                                회원가입
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

                        {/* Google Signup */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleSignup}
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
                            Google로 회원가입
                        </Button>

                        {/* Login link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                이미 계정이 있으신가요?{' '}
                                <Link
                                    href="/login"
                                    className="font-medium text-match-blue hover:text-blue-600"
                                >
                                    로그인
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 