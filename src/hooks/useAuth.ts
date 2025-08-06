'use client';

/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

interface UseAuthReturn {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (userEmail: string, userPassword: string) => Promise<{ error: AuthError | null }>;
    signUp: (userEmail: string, userPassword: string, userMetadata?: Record<string, any>) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    resetPassword: (userEmail: string) => Promise<{ error: AuthError | null }>;
    getAccessToken: () => Promise<string | null>;
    isAuthenticated: boolean;
    hasValidConfig: boolean;
}

export const useAuth = (): UseAuthReturn => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Supabase 설정이 유효하지 않으면 로딩만 false로 설정
        if (!hasValidSupabaseConfig()) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        // 현재 세션 확인
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error getting session:', error);
                if (isMounted) {
                    setUser(null);
                    setSession(null);
                    setLoading(false);
                }
            }
        };

        // 초기 세션 로드
        initializeAuth();

        // 인증 상태 변화 감지
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            if (isMounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Handle profile creation on sign up
                if (event === 'SIGNED_IN' && session?.user) {
                    // 새로운 사용자인지 확인 (프로필이 없는 경우)
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
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []); // 빈 dependency 배열 - 컴포넌트 마운트 시 한 번만 실행

    const createUserProfile = async (user: User) => {
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
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            return { error: error as AuthError };
        }
    };

    const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
        try {
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
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error: error as AuthError };
        }
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        return { error };
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        return { error };
    };

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

    return {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        getAccessToken,
        isAuthenticated: !!user,
        hasValidConfig: hasValidSupabaseConfig(),
    };
}; 