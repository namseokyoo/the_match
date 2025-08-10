import { supabase } from './supabase';

/**
 * 테스트용 회원가입 - 이메일 확인 없이 바로 활성화
 * 주의: 프로덕션에서는 사용하지 마세요!
 */
export async function testSignUp(
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
                // 이메일 확인 스킵을 위한 설정
                // Supabase 대시보드에서 "Enable email confirmations"를 비활성화해야 함
                emailRedirectTo: undefined, // 이메일 확인 링크 비활성화
            },
        });

        if (error) {
            console.error('Test SignUp error:', error);
            return { data: null, error };
        }

        // 프로필 생성
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
            }
        }

        return { data, error: null };
    } catch (error) {
        console.error('Test signup error:', error);
        return {
            data: null,
            error: {
                message: 'Test signup failed',
                status: 500,
            }
        };
    }
}

/**
 * 테스트용 대량 회원가입
 */
export async function bulkTestSignUp(users: Array<{
    email: string;
    password: string;
    name: string;
}>) {
    const results = [];
    
    for (const user of users) {
        console.log(`Creating test user: ${user.email}`);
        const result = await testSignUp(user.email, user.password, {
            full_name: user.name,
        });
        
        results.push({
            email: user.email,
            success: !result.error,
            error: result.error?.message,
        });
        
        // Rate limiting 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}