import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUsers() {
    // 기존 사용자 조회
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('사용자 조회 실패:', error);
        return;
    }
    
    console.log('기존 사용자 수:', users?.users?.length || 0);
    
    if (users?.users && users.users.length > 0) {
        console.log('\n사용 가능한 사용자 ID:');
        users.users.slice(0, 3).forEach((user, i) => {
            console.log(`${i + 1}. ${user.id} (${user.email})`);
        });
        
        // 첫 번째 사용자 ID를 파일에 저장
        const userId = users.users[0].id;
        console.log(`\n테스트에 사용할 사용자 ID: ${userId}`);
        
        return userId;
    } else {
        console.log('사용자가 없습니다. 테스트 사용자를 생성해야 합니다.');
    }
}

checkUsers();