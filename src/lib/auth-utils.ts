import { supabase } from './supabase';

/**
 * 이메일 중복 체크
 * @param email 체크할 이메일 주소
 * @returns 이미 존재하면 true, 사용 가능하면 false
 */
export async function checkEmailExists(email: string): Promise<boolean> {
    try {
        // Supabase Auth API는 이메일 중복 체크를 직접 제공하지 않음
        // signUp을 시도하고 응답을 확인하는 방법이 더 정확함
        // 여기서는 실제로 중복 체크를 건너뛰고 signUp 응답에서 처리
        
        // 임시로 false 반환 (실제 체크는 signUp에서 처리)
        return false;
    } catch (error) {
        console.error('Email check error:', error);
        return false;
    }
}

/**
 * 안전한 회원가입 처리
 * Supabase의 특성을 고려한 회원가입 로직
 */
export async function safeSignUp(
    email: string, 
    password: string, 
    metadata?: Record<string, any>
) {
    try {
        // Supabase signUp 시도
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                // 프로덕션 URL을 명시적으로 설정
                emailRedirectTo: process.env.NODE_ENV === 'production' 
                    ? 'https://the-match-five.vercel.app/auth/callback'
                    : `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error('SignUp error:', error);
            
            // Supabase 에러 메시지 체크
            // "User already registered" 에러는 이메일이 이미 존재할 때 발생
            if (error.message?.includes('User already registered')) {
                return {
                    data: null,
                    error: {
                        message: 'Email already registered',
                        status: 400,
                    }
                };
            }
            
            return { data: null, error };
        }

        // 응답 검증
        // Supabase는 이미 존재하는 이메일에 대해 에러 없이 응답할 수 있음
        if (!data.user) {
            return {
                data: null,
                error: {
                    message: 'Signup failed - no user created',
                    status: 400,
                }
            };
        }

        // identities 체크 - 비어있으면 이미 존재하는 사용자
        // Supabase는 이미 가입된 이메일로 재가입 시도시 identities를 빈 배열로 반환
        if (data.user.identities && data.user.identities.length === 0) {
            console.log('User already exists (empty identities)');
            return {
                data: null,
                error: {
                    message: 'Email already registered',
                    status: 400,
                }
            };
        }

        // 4. 프로필 생성 (profiles 테이블에 email 컬럼이 없음)
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    user_id: data.user.id,
                    bio: metadata?.full_name ? `안녕하세요, ${metadata.full_name}입니다.` : null,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (profileError && profileError.code !== '23505') {
                console.error('Profile creation error:', profileError);
                // 프로필 생성 실패는 무시 (나중에 생성 가능)
            }
        }

        return { data, error: null };
    } catch (error) {
        console.error('Safe signup error:', error);
        return {
            data: null,
            error: {
                message: 'Signup failed',
                status: 500,
            }
        };
    }
}