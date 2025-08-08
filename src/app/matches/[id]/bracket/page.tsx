'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TournamentBracket } from '@/components/match/TournamentBracket';
import { Button } from '@/components/ui';
import ShareButton from '@/components/share/ShareButton';
import { generateBracket, updateMatch } from '@/utils/bracketGenerator';
import { TournamentBracket as BracketType, BracketMatch, BracketSeed } from '@/types/bracket';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/Toast';

export default function MatchBracketPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;
    const { user } = useAuth();
    
    const [bracket, setBracket] = useState<BracketType | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        fetchBracketData();
    }, [matchId]);

    const fetchBracketData = async () => {
        try {
            setLoading(true);

            // 경기 정보 조회
            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (matchError) {
                console.error('Match fetch error:', matchError);
                showToast('경기 정보를 불러올 수 없습니다', 'error');
                setLoading(false);
                return;
            }

            // 참가 팀 목록 조회
            const { data: participants, error: participantsError } = await supabase
                .from('match_participants')
                .select('*, team:teams(*)')
                .eq('match_id', matchId)
                .eq('status', 'approved');

            if (participantsError) {
                console.error('Participants fetch error:', participantsError);
                showToast('참가 팀 정보를 불러올 수 없습니다', 'error');
                setLoading(false);
                return;
            }

            // 소유자 확인
            if (user && matchData.creator_id === user.id) {
                setIsOwner(true);
            }

            // 팀 목록을 시드로 변환
            const teams = participants?.map(p => p.team).filter(Boolean) || [];
            const seeds: BracketSeed[] = teams.map((team: any, index: number) => ({
                teamId: team.id,
                teamName: team.name,
                seed: index + 1, // 임시로 순서대로 시드 배정
            }));

            // 브라켓 생성
            if (seeds.length >= 2) {
                const generatedBracket = generateBracket(matchId, seeds, 'single_elimination');
                
                // 더미 점수 데이터 추가 (실제로는 DB에서 가져와야 함)
                if (seeds.length >= 4) {
                    // 8강 경기 결과 설정
                    if (generatedBracket.rounds[0]) {
                        generatedBracket.rounds[0].matches[0].team1Score = 3;
                        generatedBracket.rounds[0].matches[0].team2Score = 1;
                        generatedBracket.rounds[0].matches[0].status = 'completed';
                        generatedBracket.rounds[0].matches[0].winner = generatedBracket.rounds[0].matches[0].team1?.id;
                        
                        if (generatedBracket.rounds[0].matches[1]) {
                            generatedBracket.rounds[0].matches[1].team1Score = 2;
                            generatedBracket.rounds[0].matches[1].team2Score = 2;
                            generatedBracket.rounds[0].matches[1].status = 'in_progress';
                        }
                    }
                    
                    // 준결승 설정
                    if (seeds.length >= 8 && generatedBracket.rounds[1]) {
                        // 첫 번째 준결승 - 진행 완료
                        if (generatedBracket.rounds[1].matches[0]) {
                            generatedBracket.rounds[1].matches[0].team1 = {
                                id: seeds[0].teamId,
                                name: seeds[0].teamName,
                                seed: seeds[0].seed
                            };
                            generatedBracket.rounds[1].matches[0].team1Score = 2;
                            generatedBracket.rounds[1].matches[0].team2Score = 0;
                            generatedBracket.rounds[1].matches[0].status = 'completed';
                            generatedBracket.rounds[1].matches[0].winner = seeds[0].teamId;
                        }
                    }
                }
                
                setBracket(generatedBracket);
                setLoading(false);
            } else {
                showToast('참가 팀이 2팀 이상이어야 브라켓을 생성할 수 있습니다', 'warning');
                setLoading(false);
            }

        } catch (error) {
            console.error('Bracket fetch error:', error);
            showToast('브라켓 정보를 불러오는데 실패했습니다', 'error');
            setLoading(false);
        }
    };

    const handleMatchClick = (match: BracketMatch) => {
        if (!isOwner) {
            showToast('경기 주최자만 결과를 입력할 수 있습니다', 'warning');
            return;
        }
        
        if (!match.team1 || !match.team2) {
            showToast('아직 대진이 확정되지 않았습니다', 'info');
            return;
        }

        setSelectedMatch(match);
        setShowUpdateModal(true);
    };

    const handleUpdateMatch = (team1Score: number, team2Score: number) => {
        if (!selectedMatch || !bracket) return;

        let winner: string | undefined;
        if (team1Score > team2Score) {
            winner = selectedMatch.team1?.id;
        } else if (team2Score > team1Score) {
            winner = selectedMatch.team2?.id;
        }

        const updatedBracket = updateMatch(bracket, selectedMatch.id, {
            team1Score,
            team2Score,
            winner,
            status: 'completed',
        });

        setBracket(updatedBracket);
        setShowUpdateModal(false);
        setSelectedMatch(null);
        showToast('경기 결과가 업데이트되었습니다', 'success');

        // TODO: 실제 데이터베이스에 저장
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/matches/${matchId}`)}
                        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        경기 상세로 돌아가기
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">토너먼트 브라켓</h1>
                    <p className="mt-2 text-gray-600">
                        경기 대진표와 결과를 확인할 수 있습니다.
                    </p>
                </div>

                {/* 브라켓 */}
                {bracket ? (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <TournamentBracket
                            bracket={bracket}
                            onMatchClick={handleMatchClick}
                            isEditable={isOwner}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                        <p className="text-gray-500">참가 팀이 부족하여 브라켓을 생성할 수 없습니다.</p>
                    </div>
                )}

                {/* 경기 결과 입력 모달 */}
                {showUpdateModal && selectedMatch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">경기 결과 입력</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {selectedMatch.team1?.name}
                                    </label>
                                    <input
                                        type="number"
                                        id="team1Score"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="점수 입력"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {selectedMatch.team2?.name}
                                    </label>
                                    <input
                                        type="number"
                                        id="team2Score"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="점수 입력"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowUpdateModal(false);
                                        setSelectedMatch(null);
                                    }}
                                >
                                    취소
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        const team1Score = parseInt((document.getElementById('team1Score') as HTMLInputElement).value) || 0;
                                        const team2Score = parseInt((document.getElementById('team2Score') as HTMLInputElement).value) || 0;
                                        handleUpdateMatch(team1Score, team2Score);
                                    }}
                                >
                                    저장
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}