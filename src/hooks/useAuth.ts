'use client';

import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

interface UseAuthReturn {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
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

        // 현재 세션 확인
        const getCurrentSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error getting session:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getCurrentSession();

        // 인증 상태 변화 감지
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle profile creation on sign up
            if (event === 'SIGNED_IN' && session?.user && !user) {
                await createUserProfile(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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
            const { data, error } = await supabase.auth.signInWithPassword({
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
            const { data, error } = await supabase.auth.signUp({
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
        setLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        setLoading(false);
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