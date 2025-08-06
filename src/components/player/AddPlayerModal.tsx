'use client';

import React, { useState } from 'react';
import { Player } from '@/types';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface AddPlayerModalProps {
    teamId: string;
    isOpen: boolean;
    onClose: () => void;
    onPlayerAdded: (player: Player) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
    teamId,
    isOpen,
    onClose,
    onPlayerAdded,
}) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        position: '',
        jersey_number: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('선수 이름은 필수입니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const playerData = {
                name: formData.name.trim(),
                email: formData.email.trim() || null,
                team_id: teamId,
                position: formData.position.trim() || null,
                jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data, error: insertError } = await supabase
                .from('players')
                .insert([playerData])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            // 성공 시 부모 컴포넌트에 알림
            onPlayerAdded(data as Player);
            
            // 폼 초기화
            setFormData({
                name: '',
                email: '',
                position: '',
                jersey_number: '',
            });
            
            // 모달 닫기
            onClose();
            
            alert('선수가 성공적으로 추가되었습니다.');
        } catch (err) {
            console.error('선수 추가 오류:', err);
            setError(err instanceof Error ? err.message : '선수 추가에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">선수 추가</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            이름 *
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                            placeholder="홍길동"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                        </label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                            placeholder="player@example.com"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            이메일을 입력하면 선수에게 초대 메일이 발송됩니다 (추후 기능)
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                포지션
                            </label>
                            <Input
                                type="text"
                                value={formData.position}
                                onChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                                placeholder="FW, MF, DF, GK 등"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                등번호
                            </label>
                            <Input
                                type="number"
                                value={formData.jersey_number}
                                onChange={(value) => setFormData(prev => ({ ...prev, jersey_number: value }))}
                                placeholder="10"
                                min="1"
                                max="99"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !formData.name.trim()}
                        >
                            {loading ? '추가 중...' : '추가'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPlayerModal;