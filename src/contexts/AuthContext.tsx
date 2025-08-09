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

// 세션 저장/로드 헬퍼 함수
const SESSION_KEY = 'the_match_session';

const saveSessionToStorage = (session: Session | null) => {
    if (session) {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                user: session.user,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
};

const loadSessionFromStorage = (): Session | null => {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;
        
        const data = JSON.parse(stored);
        // 24시간 이상 지난 캐시는 무시
        if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            expires_in: 0,
            token_type: 'bearer',
            user: data.user
        };
    } catch (e) {
        console.error('Failed to load session:', e);
        return null;
    }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const initializationRef = useRef(false);
    const authSubscriptionRef = useRef<any>(null);

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

    // 세션 새로고침 함수
    const refreshSession = useCallback(async () => {
        try {
            const { data: { session: newSession }, error } = await supabase.auth.getSession();
            
            if (!error && newSession) {
                setSession(newSession);
                setUser(newSession.user);
                saveSessionToStorage(newSession);
                return;
            }
            
            // 세션이 없거나 에러가 있으면 리프레시 토큰으로 시도
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && refreshedSession) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                saveSessionToStorage(refreshedSession);
            } else {
                // 리프레시도 실패하면 로그아웃 상태로
                setSession(null);
                setUser(null);
                saveSessionToStorage(null);
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            setSession(null);
            setUser(null);
            saveSessionToStorage(null);
        }
    }, []);

    // 초기화 함수
    const initializeAuth = useCallback(async () => {
        // 이미 초기화 중이거나 완료되었으면 스킵
        if (initializationRef.current) {
            return;
        }
        
        initializationRef.current = true;

        try {
            // Supabase 설정 확인
            if (!hasValidSupabaseConfig()) {
                console.warn('Invalid Supabase configuration');
                setUser(null);
                setSession(null);
                setInitialized(true);
                setLoading(false);
                return;
            }

            // 1. 먼저 로컬 스토리지에서 캐시된 세션 로드 (빠른 UI 표시)
            const cachedSession = loadSessionFromStorage();
            if (cachedSession?.user) {
                setUser(cachedSession.user);
                setSession(cachedSession);
                // 로딩을 false로 설정하여 UI를 즉시 표시
                setLoading(false);
                setInitialized(true);
            }

            // 2. 백그라운드에서 실제 세션 확인 및 갱신
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();
            
            if (currentSession) {
                setSession(currentSession);
                setUser(currentSession.user);
                saveSessionToStorage(currentSession);
                
                // 프로필 확인 (백그라운드)
                supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('user_id', currentSession.user.id)
                    .single()
                    .then(({ data: existingProfile }) => {
                        if (!existingProfile) {
                            createUserProfile(currentSession.user);
                        }
                    });
            } else if (!cachedSession) {
                // 캐시도 없고 현재 세션도 없는 경우
                setUser(null);
                setSession(null);
            }
            
            // 캐시된 세션이 없었던 경우에만 로딩 상태 업데이트
            if (!cachedSession) {
                setInitialized(true);
                setLoading(false);
            }

        } catch (error) {
            console.error('Auth initialization error:', error);
            setUser(null);
            setSession(null);
            saveSessionToStorage(null);
            setInitialized(true);
            setLoading(false);
        }
    }, [createUserProfile]);

    // 인증 상태 변경 리스너 설정
    useEffect(() => {
        // 초기화
        initializeAuth();

        // 이전 구독 정리
        if (authSubscriptionRef.current) {
            authSubscriptionRef.current.unsubscribe();
        }

        // 인증 상태 변경 구독
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                
                // 세션 저장
                saveSessionToStorage(session);
                
                if (event === 'SIGNED_OUT') {
                    setIsSigningOut(false);
                    setSession(null);
                    setUser(null);
                    saveSessionToStorage(null);
                } else if (session) {
                    setSession(session);
                    setUser(session.user);
                    
                    // 신규 로그인 시 프로필 생성
                    if (event === 'SIGNED_IN') {
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('user_id')
                            .eq('user_id', session.user.id)
                            .single();
                        
                        if (!existingProfile) {
                            await createUserProfile(session.user);
                        }
                    }
                }
                
                // 토큰 갱신 시
                if (event === 'TOKEN_REFRESHED') {
                    console.log('Token refreshed successfully');
                    saveSessionToStorage(session);
                }
            }
        );

        authSubscriptionRef.current = subscription;

        // 페이지 포커스 시 세션 확인
        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                refreshSession();
            }
        };
        
        document.addEventListener('visibilitychange', handleFocus);

        // 정리 함수
        return () => {
            document.removeEventListener('visibilitychange', handleFocus);
            if (authSubscriptionRef.current) {
                authSubscriptionRef.current.unsubscribe();
            }
        };
    }, []); // 의존성 배열을 비워서 한 번만 실행

    // 로그인 함수
    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!error && data.session) {
                saveSessionToStorage(data.session);
            }
            
            return { error };
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
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                },
            });

            if (!error && data.session) {
                saveSessionToStorage(data.session);
            }
            
            return { error };
        } catch (error) {
            console.error('Sign up error:', error);
            return { error: error as AuthError };
        } finally {
            setLoading(false);
        }
    };

    // 로그아웃 함수
    const signOut = async () => {
        try {
            setIsSigningOut(true);
            
            // 로컬 상태 먼저 초기화
            setUser(null);
            setSession(null);
            saveSessionToStorage(null);
            
            // Supabase 로그아웃
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Sign out error:', error);
                // 에러가 있어도 로컬 상태는 유지
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
            // 현재 세션이 있으면 바로 반환
            if (session?.access_token) {
                return session.access_token;
            }
            
            // 세션 새로고침 후 토큰 반환
            const { data: { session: newSession }, error } = await supabase.auth.getSession();
            if (!error && newSession) {
                return newSession.access_token;
            }
            
            return null;
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