'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import PostCard from '@/components/community/PostCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { MessageSquare, Users, PlusCircle } from 'lucide-react';
import type { Board, Post } from '@/types/community';

function CommunityContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    const [boards, setBoards] = useState<Board[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBoard, setSelectedBoard] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 게시판 목록 조회
    useEffect(() => {
        fetchBoards();
    }, []);

    // 게시글 목록 조회
    useEffect(() => {
        const boardSlug = searchParams.get('board') || '';
        const page = searchParams.get('page') || '1';
        
        setCurrentPage(parseInt(page));
        setSelectedBoard(boardSlug);
        fetchPosts(boardSlug, parseInt(page));
    }, [searchParams]);

    const fetchBoards = async () => {
        try {
            const response = await fetch('/api/boards');
            const data = await response.json();
            
            if (response.ok) {
                setBoards(data.boards || []);
            }
        } catch (error) {
            console.error('Error fetching boards:', error);
        }
    };

    const fetchPosts = async (boardSlug: string, page: number) => {
        setLoading(true);
        try {
            let url = `/api/posts?page=${page}&limit=20`;
            
            if (boardSlug) {
                const board = boards.find(b => b.slug === boardSlug);
                if (board) {
                    url += `&board_id=${board.id}`;
                }
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                setPosts(data.posts || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBoardChange = (boardSlug: string) => {
        if (boardSlug === selectedBoard) {
            router.push('/community');
        } else {
            router.push(`/community?board=${boardSlug}`);
        }
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams();
        if (selectedBoard) params.set('board', selectedBoard);
        params.set('page', page.toString());
        router.push(`/community?${params.toString()}`);
    };

    const getBoardIcon = (icon: string) => {
        switch (icon) {
            case 'Users':
                return <Users className="w-4 h-4" />;
            case 'MessageCircle':
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">커뮤니티</h1>
                    {user && (
                        <Link href="/community/write">
                            <Button variant="primary" size="md">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                글쓰기
                            </Button>
                        </Link>
                    )}
                </div>

                {/* 게시판 카테고리 탭 */}
                <div className="bg-white border border-gray-200 rounded-lg mb-6">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => handleBoardChange('')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                selectedBoard === ''
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            전체
                        </button>
                        {boards.map((board) => (
                            <button
                                key={board.id}
                                onClick={() => handleBoardChange(board.slug)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    selectedBoard === board.slug
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-gray-600 border-transparent hover:text-gray-900'
                                }`}
                            >
                                {getBoardIcon(board.icon || '')}
                                {board.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 게시글 목록 */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">아직 작성된 게시글이 없습니다.</p>
                        {user && (
                            <Link href="/community/write">
                                <Button variant="primary" size="md">
                                    첫 게시글 작성하기
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            이전
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 2 && page <= currentPage + 2)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                                            page === currentPage
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 3 ||
                                page === currentPage + 3
                            ) {
                                return <span key={page} className="px-2">...</span>;
                            }
                            return null;
                        })}
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CommunityPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <LoadingSpinner />
            </div>
        }>
            <CommunityContent />
        </Suspense>
    );
}