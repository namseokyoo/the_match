'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // 초기화 - Supabase 세션만 확인 (캐시 없음)
    useEffect(() => {
        // Supabase 설정 확인
        if (!hasValidSupabaseConfig()) {
            console.warn('Invalid Supabase configuration');
            setLoading(false);
            return;
        }

        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Supabase에서 현재 세션 가져오기 (캐시 없이)
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                
                if (mounted) {
                    if (!error && currentSession) {
                        setSession(currentSession);
                        setUser(currentSession.user);
                    } else {
                        // 세션이 없거나 에러가 있으면 로그아웃 상태
                        setSession(null);
                        setUser(null);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    setLoading(false);
                }
            }
        };

        // 인증 상태 변경 리스너
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('Auth state changed:', event);
                
                if (mounted) {
                    if (event === 'SIGNED_OUT') {
                        // 로그아웃 이벤트
                        setSession(null);
                        setUser(null);
                        // localStorage 완전 정리
                        try {
                            localStorage.clear();
                            sessionStorage.clear();
                        } catch (e) {
                            console.error('Failed to clear storage:', e);
                        }
                    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        // 로그인 또는 토큰 갱신
                        if (newSession) {
                            setSession(newSession);
                            setUser(newSession.user);
                        }
                    } else if (event === 'PASSWORD_RECOVERY') {
                        // 비밀번호 복구 중
                        console.log('Password recovery in progress');
                    }
                }
            }
        );

        // 초기 인증 상태 확인
        initializeAuth();

        // Cleanup
        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // 빈 의존성 배열 - 한 번만 실행

    // 로그인
    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Sign in error:', error);
                return { error };
            }

            // onAuthStateChange가 상태를 업데이트함
            return { error: null };
        } catch (error) {
            console.error('Sign in exception:', error);
            return { error: error as AuthError };
        }
    };

    // 회원가입
    const signUp = async (userEmail: string, userPassword: string, userMetadata?: Record<string, any>) => {
        try {
            const { error } = await supabase.auth.signUp({
                email: userEmail,
                password: userPassword,
                options: {
                    data: userMetadata,
                },
            });

            if (error) {
                console.error('Sign up error:', error);
                return { error };
            }

            // onAuthStateChange가 상태를 업데이트함
            return { error: null };
        } catch (error) {
            console.error('Sign up exception:', error);
            return { error: error as AuthError };
        }
    };

    // 로그아웃 - 간단하고 확실하게
    const signOut = async () => {
        try {
            // 1. 로컬 상태 즉시 초기화
            setUser(null);
            setSession(null);
            
            // 2. 모든 스토리지 정리
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {
                console.error('Failed to clear storage:', e);
            }

            // 3. Supabase 로그아웃 (실패해도 로컬은 이미 정리됨)
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Supabase sign out error:', error);
                // 에러가 있어도 로컬 상태는 이미 초기화됨
                // refreshSession 호출하지 않음!
            }
        } catch (error) {
            console.error('Sign out exception:', error);
            // 예외가 발생해도 로컬 상태는 초기화 상태 유지
        }
    };

    // Google 로그인
    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                console.error('Google sign in error:', error);
                return { error };
            }

            return { error: null };
        } catch (error) {
            console.error('Google sign in exception:', error);
            return { error: error as AuthError };
        }
    };

    // 비밀번호 재설정
    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) {
                console.error('Reset password error:', error);
                return { error };
            }

            return { error: null };
        } catch (error) {
            console.error('Reset password exception:', error);
            return { error: error as AuthError };
        }
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        isAuthenticated: !!user && !!session,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};