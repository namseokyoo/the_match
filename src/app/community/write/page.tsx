'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';
import type { Board } from '@/types/community';
import toast from 'react-hot-toast';

export default function WritePostPage() {
    const router = useRouter();
    const { user } = useAuth();
    
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        board_id: '',
        title: '',
        content: '',
        tags: ''
    });

    useEffect(() => {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            router.push('/login?redirect=/community/write');
            return;
        }
        
        fetchBoards();
    }, [user, router]);

    const fetchBoards = async () => {
        try {
            const response = await fetch('/api/boards');
            const data = await response.json();
            
            if (response.ok) {
                setBoards(data.boards || []);
                if (data.boards && data.boards.length > 0) {
                    setFormData(prev => ({ ...prev, board_id: data.boards[0].id }));
                }
            }
        } catch (error) {
            console.error('Error fetching boards:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.board_id || !formData.title || !formData.content) {
            toast.error('필수 항목을 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            // Supabase 세션 가져오기
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                toast.error('로그인이 필요합니다.');
                router.push('/login?redirect=/community/write');
                return;
            }

            const tags = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    board_id: formData.board_id,
                    title: formData.title,
                    content: formData.content,
                    tags
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('게시글이 작성되었습니다.');
                router.push(`/community/posts/${data.post.id}`);
            } else {
                toast.error(data.error || '게시글 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error('게시글 작성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">게시글 작성</h1>
                </div>

                {/* 작성 폼 */}
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="space-y-6">
                        {/* 게시판 선택 */}
                        <div>
                            <label htmlFor="board_id" className="block text-sm font-medium text-gray-700 mb-2">
                                게시판 <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="board_id"
                                name="board_id"
                                value={formData.board_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {boards.map((board) => (
                                    <option key={board.id} value={board.id}>
                                        {board.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 제목 */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="제목을 입력하세요"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* 내용 */}
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                                내용 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="내용을 입력하세요"
                                rows={10}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* 태그 */}
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                                태그 (선택사항)
                            </label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 축구, 팀원모집, 서울)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-3 mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            disabled={loading}
                        >
                            {loading ? '작성 중...' : '작성하기'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}