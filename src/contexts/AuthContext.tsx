'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    getAccessToken: () => Promise<string | null>;
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

    useEffect(() => {
        // Supabase 설정이 유효하지 않으면 즉시 초기화 완료
        if (!hasValidSupabaseConfig()) {
            setLoading(false);
            setInitialized(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('auth_initialized', 'true');
            }
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
                    setInitialized(true);
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('auth_initialized', 'true');
                    }
                }
            } catch (error) {
                console.error('Error getting session:', error);
                if (isMounted) {
                    setUser(null);
                    setSession(null);
                    setLoading(false);
                    setInitialized(true);
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('auth_initialized', 'true');
                    }
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

    const value = {
        user,
        session,
        loading: loading && !initialized,  // 초기화되지 않았을 때만 loading true
        initialized,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
        getAccessToken,
        isAuthenticated: !!user,
        hasValidConfig: hasValidSupabaseConfig(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};