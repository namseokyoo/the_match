import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetDatabase() {
    console.log('🔄 Starting database reset...\n');

    try {
        // 1. Delete all match participants
        console.log('📋 Deleting match participants...');
        const { error: participantsError, count: participantsCount } = await supabase
            .from('match_participants')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)
        
        if (participantsError) throw participantsError;
        console.log(`✅ Deleted ${participantsCount || 0} match participants\n`);

        // 2. Delete all matches
        console.log('🏆 Deleting all matches...');
        const { error: matchesError, count: matchesCount } = await supabase
            .from('matches')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (matchesError) throw matchesError;
        console.log(`✅ Deleted ${matchesCount || 0} matches\n`);

        // 3. Delete all team messages (instead of team_members)
        console.log('💬 Deleting team messages...');
        const { error: messagesError, count: messagesCount } = await supabase
            .from('team_messages')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (messagesError) throw messagesError;
        console.log(`✅ Deleted ${messagesCount || 0} team messages\n`);

        // 4. Delete all teams
        console.log('⚽ Deleting all teams...');
        const { error: teamsError, count: teamsCount } = await supabase
            .from('teams')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (teamsError) throw teamsError;
        console.log(`✅ Deleted ${teamsCount || 0} teams\n`);

        // 5. Delete all profiles
        console.log('👤 Deleting user profiles...');
        const { error: profilesError, count: profilesCount } = await supabase
            .from('profiles')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (profilesError) throw profilesError;
        console.log(`✅ Deleted ${profilesCount || 0} profiles\n`);

        // 6. Delete all auth users (except service account)
        console.log('🔐 Deleting auth users...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) throw listError;
        
        let deletedUsers = 0;
        for (const user of users || []) {
            if (user.email !== 'service@thematch.com') {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.warn(`⚠️  Failed to delete user ${user.email}: ${deleteError.message}`);
                } else {
                    deletedUsers++;
                }
            }
        }
        console.log(`✅ Deleted ${deletedUsers} auth users\n`);

        console.log('✨ Database reset complete!');
        console.log('📊 Summary:');
        console.log(`   - Match Participants: ${participantsCount || 0} deleted`);
        console.log(`   - Matches: ${matchesCount || 0} deleted`);
        console.log(`   - Team Messages: ${messagesCount || 0} deleted`);
        console.log(`   - Teams: ${teamsCount || 0} deleted`);
        console.log(`   - Profiles: ${profilesCount || 0} deleted`);
        console.log(`   - Auth Users: ${deletedUsers} deleted`);

    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

// Run the reset
resetDatabase().then(() => {
    console.log('\n✅ Database is now clean and ready for testing!');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Failed to reset database:', error);
    process.exit(1);
});