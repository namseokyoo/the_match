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
        const getSession = async () => {
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

        getSession();

        // Auth state 변화 감지
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle profile creation on sign up
            if (event === 'SIGNED_UP' && session?.user) {
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
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);
        return { error };
    };

    const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });

        setLoading(false);
        return { error };
    };

    const signOut = async () => {
        setLoading(true);

        const { error } = await supabase.auth.signOut();

        setLoading(false);
        return { error };
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

    return {
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        isAuthenticated: !!user,
        hasValidConfig: hasValidSupabaseConfig(),
    };
}; 