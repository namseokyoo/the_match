'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
    ArrowLeft, 
    Heart, 
    MessageCircle, 
    Eye, 
    User,
    Edit,
    Trash2,
    Send
} from 'lucide-react';
import type { Post, Comment } from '@/types/community';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, session, loading: authLoading } = useAuth();
    const postId = params.id as string;
    
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchPost = useCallback(async () => {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            const data = await response.json();
            
            if (response.ok) {
                setPost(data.post);
            } else {
                toast.error('게시글을 불러올 수 없습니다.');
                router.push('/community');
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            toast.error('게시글을 불러오는 중 오류가 발생했습니다.');
        }
    }, [postId, router]);

    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            const data = await response.json();
            
            if (response.ok) {
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [postId]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchPost(), fetchComments()]);
            setLoading(false);
        };
        
        loadData();
    }, [fetchPost, fetchComments]);

    const handleLike = async () => {
        console.log('handleLike called, user:', user, 'session:', session, 'authLoading:', authLoading);
        
        // 인증 정보가 아직 로딩 중이면 기다림
        if (authLoading) {
            console.log('Auth is still loading...');
            return;
        }
        
        if (!user || !session) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            };
            
            const response = await fetch(`/api/posts/${postId}/likes`, {
                method: 'POST',
                headers,
                credentials: 'include', // 쿠키를 포함하도록 설정
            });

            const data = await response.json();

            if (response.ok) {
                setPost(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        is_liked: data.liked,
                        likes_count: (prev.likes_count || 0) + (data.liked ? 1 : -1)
                    };
                });
            } else {
                console.error('Like error:', data);
                if (data.error) {
                    toast.error(data.error);
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('좋아요 처리 중 오류가 발생했습니다.');
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user || !session) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        if (!commentContent.trim()) {
            toast.error('댓글 내용을 입력해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            };
            
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers,
                credentials: 'include', // 쿠키를 포함하도록 설정
                body: JSON.stringify({
                    content: commentContent,
                    parent_id: replyTo
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setCommentContent('');
                setReplyTo(null);
                await fetchComments();
                toast.success('댓글이 작성되었습니다.');
            } else {
                console.error('Comment error:', data);
                toast.error(data.error || '댓글 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            toast.error('댓글 작성 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers,
                credentials: 'include',
            });

            if (response.ok) {
                toast.success('게시글이 삭제되었습니다.');
                router.push('/community');
            } else {
                const data = await response.json();
                toast.error(data.error || '게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('게시글 삭제 중 오류가 발생했습니다.');
        }
    };

    const getUserName = (userData: any) => {
        if (userData?.full_name) {
            return userData.full_name;
        }
        return userData?.email?.split('@')[0] || '익명';
    };

    const formatDate = (date: string) => {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: ko
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (!post) {
        return null;
    }

    const isAuthor = user?.id === post.user_id;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.push('/community')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        목록으로
                    </button>
                    
                    {isAuthor && (
                        <div className="flex gap-2">
                            <Link href={`/community/posts/${postId}/edit`}>
                                <Button variant="outline" size="sm">
                                    <Edit className="w-4 h-4 mr-1" />
                                    수정
                                </Button>
                            </Link>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                삭제
                            </Button>
                        </div>
                    )}
                </div>

                {/* 게시글 내용 */}
                <article className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    {/* 게시판 카테고리 */}
                    {post.board && (
                        <Link 
                            href={`/community?board=${post.board.slug}`}
                            className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded mb-4 hover:bg-blue-200 transition-colors"
                        >
                            {post.board.name}
                        </Link>
                    )}

                    {/* 제목 */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {post.title}
                    </h1>

                    {/* 작성자 정보 */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {getUserName(post.user)}
                            </span>
                            <span>{formatDate(post.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {post.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {comments.length}
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                {post.likes_count || 0}
                            </span>
                        </div>
                    </div>

                    {/* 내용 */}
                    <div className="prose max-w-none mb-6">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 좋아요 버튼 */}
                    <div className="flex justify-center pt-4 border-t border-gray-200">
                        <button
                            onClick={handleLike}
                            disabled={authLoading}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                                authLoading
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    : post.is_liked
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{authLoading ? '로딩 중...' : `좋아요 ${post.likes_count || 0}`}</span>
                        </button>
                    </div>
                </article>

                {/* 댓글 섹션 */}
                <section className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        댓글 {comments.length}
                    </h2>

                    {/* 댓글 작성 폼 */}
                    {user ? (
                        <form onSubmit={handleCommentSubmit} className="mb-6">
                            {replyTo && (
                                <div className="mb-2 text-sm text-blue-600">
                                    답글 작성 중... 
                                    <button
                                        type="button"
                                        onClick={() => setReplyTo(null)}
                                        className="ml-2 text-gray-500 hover:text-gray-700"
                                    >
                                        취소
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder="댓글을 입력하세요..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={3}
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={submitting || !commentContent.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                            <Link href="/login">
                                <Button variant="primary" size="sm">
                                    로그인
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* 댓글 목록 */}
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">
                                                {getUserName(comment.user)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mb-2">{comment.content}</p>
                                        {user && (
                                            <button
                                                onClick={() => setReplyTo(comment.id)}
                                                className="text-sm text-gray-500 hover:text-gray-700"
                                            >
                                                답글
                                            </button>
                                        )}
                                        
                                        {/* 대댓글 */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="mt-3 ml-8 space-y-3">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.id} className="flex items-start gap-3">
                                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <User className="w-3 h-3 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-gray-900 text-sm">
                                                                    {getUserName(reply.user)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDate(reply.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700 text-sm">{reply.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {comments.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}