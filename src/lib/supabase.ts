import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    global: {
        headers: {
            'X-Client-Info': 'the-match-web',
        },
    },
});

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