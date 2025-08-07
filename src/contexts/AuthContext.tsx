'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    isSigningOut: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    getAccessToken: () => Promise<string | null>;
    refreshSession: () => Promise<void>;
    isAuthenticated: boolean;
    hasValidConfig: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const [initialized, setInitialized] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const initializationRef = useRef(false);
    const subscriptionRef = useRef<any>(null);

    // 세션 새로고침 함수
    const refreshSession = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error) {
                setSession(session);
                setUser(session?.user ?? null);
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    }, []);

    // 프로필 생성 함수
    const createUserProfile = useCallback(async (user: User) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    user_id: user.id,
                    bio: '',
                    social_links: {},
                    preferences: {},
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('Error creating user profile:', error);
            }
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }, []);

    // 초기화 함수
    const initializeAuth = useCallback(async () => {
        // 이미 초기화 중이거나 완료되었으면 스킵
        if (initializationRef.current) {
            return;
        }
        
        initializationRef.current = true;
        setLoading(true);

        try {
            // Supabase 설정 확인
            if (!hasValidSupabaseConfig()) {
                console.warn('Invalid Supabase configuration');
                setUser(null);
                setSession(null);
                setLoading(false);
                setInitialized(true);
                return;
            }

            // 세션 가져오기 (타임아웃 설정)
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Session timeout')), 5000)
            );

            const { data: { session } } = await Promise.race([
                sessionPromise,
                timeoutPromise
            ]).catch(error => {
                console.error('Session initialization error:', error);
                return { data: { session: null } };
            }) as any;

            setSession(session);
            setUser(session?.user ?? null);

            // 프로필 확인 및 생성
            if (session?.user) {
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('user_id', session.user.id)
                    .single();
                
                if (!existingProfile) {
                    await createUserProfile(session.user);
                }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            setUser(null);
            setSession(null);
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }, [createUserProfile]);

    // 인증 상태 변경 리스너 설정
    useEffect(() => {
        // 초기화
        initializeAuth();

        // 이전 구독 정리
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        // 인증 상태 변경 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                
                // 로딩 상태 관리
                if (event === 'SIGNED_OUT') {
                    setIsSigningOut(false);
                }
                
                setSession(session);
                setUser(session?.user ?? null);
                
                // 신규 로그인 시 프로필 생성
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('user_id')
                        .eq('user_id', session.user.id)
                        .single();
                    
                    if (!existingProfile) {
                        await createUserProfile(session.user);
                    }
                }

                // 토큰 갱신 처리
                if (event === 'TOKEN_REFRESHED') {
                    console.log('Token refreshed successfully');
                }
            }
        );

        subscriptionRef.current = subscription;

        // 정리 함수
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [initializeAuth, createUserProfile]);

    // 로그인 함수
    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            return { error: error as AuthError };
        } finally {
            setLoading(false);
        }
    };

    // 회원가입 함수
    const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                },
            });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            return { error: error as AuthError };
        } finally {
            setLoading(false);
        }
    };

    // 로그아웃 함수 (개선됨)
    const signOut = async () => {
        try {
            setIsSigningOut(true);
            
            // 로컬 상태 먼저 초기화
            setUser(null);
            setSession(null);
            
            // Supabase 로그아웃
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                // 에러가 있어도 로컬 상태는 유지
                console.error('Sign out error:', error);
                // 세션 다시 확인
                await refreshSession();
                throw error;
            }

            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error: error as AuthError };
        } finally {
            setIsSigningOut(false);
        }
    };

    // Google 로그인
    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            return { error };
        } finally {
            setLoading(false);
        }
    };

    // 비밀번호 재설정
    const resetPassword = async (email: string) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            return { error };
        } finally {
            setLoading(false);
        }
    };

    // 액세스 토큰 가져오기
    const getAccessToken = async (): Promise<string | null> => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error('Error getting session for access token:', error);
                return null;
            }
            return session.access_token;
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    };

    const value = {
        user,
        session,
        loading,
        initialized,
        isSigningOut,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        getAccessToken,
        refreshSession,
        isAuthenticated: !!user,
        hasValidConfig: hasValidSupabaseConfig(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};