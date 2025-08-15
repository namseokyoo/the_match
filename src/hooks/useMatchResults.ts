import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface MatchResult {
    game_id: string;
    round: number;
    match_index: number;
    team1_id: string;
    team2_id: string;
    team1_score: number;
    team2_score: number;
    winner_id: string | null;
    status: string;
    completed_at: string;
}

interface UseMatchResultsReturn {
    results: MatchResult[];
    loading: boolean;
    error: string | null;
    submitResult: (_matchId: string, _result: Partial<MatchResult>) => Promise<void>;
    deleteResult: (_matchId: string, _gameId: string) => Promise<void>;
    refreshResults: (_matchId: string) => Promise<void>;
}

export function useMatchResults(matchId?: string): UseMatchResultsReturn {
    const [results, setResults] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // 경기 결과 조회
    const fetchResults = useCallback(async (id: string) => {
        if (!id) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/matches/${id}/results`);
            
            if (!response.ok) {
                throw new Error('경기 결과를 불러오는데 실패했습니다.');
            }
            
            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 경기 결과 제출
    const submitResult = useCallback(async (matchId: string, result: Partial<MatchResult>) => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/matches/${matchId}/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(result),
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '결과 저장에 실패했습니다.');
            }
            
            // 결과 새로고침
            await fetchResults(matchId);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, fetchResults]);

    // 경기 결과 삭제
    const deleteResult = useCallback(async (matchId: string, gameId: string) => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/matches/${matchId}/results?game_id=${gameId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '결과 삭제에 실패했습니다.');
            }
            
            // 결과 새로고침
            await fetchResults(matchId);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, fetchResults]);

    // 결과 새로고침
    const refreshResults = useCallback(async (id: string) => {
        await fetchResults(id);
    }, [fetchResults]);

    // 초기 로드 및 matchId 변경 시 재로드
    useEffect(() => {
        if (matchId) {
            fetchResults(matchId);
        }
    }, [matchId, fetchResults]);

    return {
        results,
        loading,
        error,
        submitResult,
        deleteResult,
        refreshResults,
    };
}