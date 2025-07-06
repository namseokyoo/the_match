import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 개발 환경에서 환경 변수가 없을 때 기본값 사용
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NzI1NzM4MywiZXhwIjoxOTYyODMzMzgzfQ.placeholder';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 생성하여 다음 변수를 설정하세요:');
    console.warn('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    console.warn('현재는 기본값으로 실행됩니다 (실제 기능은 작동하지 않음)');
}

export const supabase = createClient<Database>(
    supabaseUrl || defaultUrl,
    supabaseAnonKey || defaultKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

// 환경 변수 존재 여부 확인 함수
export const hasValidSupabaseConfig = () => {
    return !!(supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== defaultUrl &&
        supabaseAnonKey !== defaultKey);
};

// Auth helper functions
export const signUp = async (email: string, password: string) => {
    if (!hasValidSupabaseConfig()) {
        throw new Error('Supabase가 설정되지 않았습니다. 환경 변수를 확인하세요.');
    }
    return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
    if (!hasValidSupabaseConfig()) {
        throw new Error('Supabase가 설정되지 않았습니다. 환경 변수를 확인하세요.');
    }
    return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
    if (!hasValidSupabaseConfig()) {
        throw new Error('Supabase가 설정되지 않았습니다. 환경 변수를 확인하세요.');
    }
    return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
    if (!hasValidSupabaseConfig()) {
        return { data: { user: null }, error: null };
    }
    return supabase.auth.getUser();
};

// Helper functions for common database operations
export const db = {
    // Tournament operations
    tournaments: {
        async getAll() {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async getById(id: string) {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },

        async create(tournament: any) {
            const { data, error } = await supabase
                .from('tournaments')
                .insert([tournament])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('tournaments')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async delete(id: string) {
            const { error } = await supabase
                .from('tournaments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
    },

    // Team operations
    teams: {
        async getByTournament(tournamentId: string) {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async create(team: any) {
            const { data, error } = await supabase
                .from('teams')
                .insert([team])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('teams')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async delete(id: string) {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
    },

    // Player operations
    players: {
        async getByTeam(teamId: string) {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async create(player: any) {
            const { data, error } = await supabase
                .from('players')
                .insert([player])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('players')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async delete(id: string) {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
    },

    // Match operations
    matches: {
        async getByTournament(tournamentId: string) {
            const { data, error } = await supabase
                .from('matches')
                .select(`
          *,
          team1:teams!matches_team1_id_fkey(*),
          team2:teams!matches_team2_id_fkey(*),
          result:match_results(*)
        `)
                .eq('tournament_id', tournamentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async create(match: any) {
            const { data, error } = await supabase
                .from('matches')
                .insert([match])
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('matches')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
    },

    // Storage operations
    storage: {
        async uploadFile(bucket: string, path: string, file: File) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;
            return data;
        },

        async getPublicUrl(bucket: string, path: string) {
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);

            return data.publicUrl;
        },

        async deleteFile(bucket: string, path: string) {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) throw error;
        },
    },
}; 