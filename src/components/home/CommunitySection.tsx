'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Eye, TrendingUp, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { EmptyState } from '@/components/ui';

interface Post {
    id: string;
    title: string;
    content: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    view_count: number;
    profiles: {
        username: string | null;
        email: string;
    };
}

export default function CommunitySection() {
    const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);

            // 최신글 가져오기 (최근 5개)
            const { data: latest, error: latestError } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    content,
                    user_id,
                    created_at,
                    updated_at,
                    view_count
                `)
                .order('created_at', { ascending: false })
                .limit(5);
            
            // 각 포스트에 대한 프로필 정보 가져오기
            let postsWithProfiles: Post[] = [];
            if (latest && latest.length > 0) {
                const userIds = Array.from(new Set(latest.map(p => p.user_id)));
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, email')
                    .in('user_id', userIds);
                
                postsWithProfiles = latest.map(post => ({
                    ...post,
                    profiles: profiles?.find(p => p.user_id === post.user_id) || {
                        username: null,
                        email: ''
                    }
                })) as Post[];
            }

            if (latestError) {
                console.error('Error fetching latest posts:', latestError);
            } else {
                setLatestPosts(postsWithProfiles);
            }

            // 인기글 가져오기 (최근 7일간 조회수 순)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: popular, error: popularError } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    content,
                    user_id,
                    created_at,
                    updated_at,
                    view_count
                `)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('view_count', { ascending: false })
                .limit(5);
            
            // 각 포스트에 대한 프로필 정보 가져오기
            let popularWithProfiles: Post[] = [];
            if (popular && popular.length > 0) {
                const userIds = Array.from(new Set(popular.map(p => p.user_id)));
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, email')
                    .in('user_id', userIds);
                
                popularWithProfiles = popular.map(post => ({
                    ...post,
                    profiles: profiles?.find(p => p.user_id === post.user_id) || {
                        username: null,
                        email: ''
                    }
                })) as Post[];
            }

            if (popularError) {
                console.error('Error fetching popular posts:', popularError);
            } else {
                setPopularPosts(popularWithProfiles);
            }
        } catch (error) {
            console.error('Error fetching community posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayPosts = activeTab === 'latest' ? latestPosts : popularPosts;

    return (
        <section className="py-6 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="mx-auto max-w-7xl">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                                커뮤니티
                            </h2>
                            <p className="text-sm text-gray-500">다른 플레이어들과 소통해보세요</p>
                        </div>
                        {/* 탭 버튼 */}
                        <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('latest')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    activeTab === 'latest'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                최신글
                            </button>
                            <button
                                onClick={() => setActiveTab('popular')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    activeTab === 'popular'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                인기글
                            </button>
                        </div>
                    </div>
                    <Link 
                        href="/community" 
                        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        모두 보기 
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : displayPosts.length > 0 ? (
                    <div className="space-y-3">
                        {displayPosts.map((post) => (
                            <Link key={post.id} href={`/community/posts/${post.id}`}>
                                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-150 cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {post.view_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3" />
                                                    댓글
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(post.created_at), { 
                                                        addSuffix: true, 
                                                        locale: ko 
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        {activeTab === 'popular' && (
                                            <div className="ml-4 flex items-center gap-1 text-amber-500">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-xs font-medium">인기</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-100 rounded-lg">
                        <EmptyState
                            icon={MessageSquare}
                            title={activeTab === 'latest' ? '게시글이 없습니다' : '인기 게시글이 없습니다'}
                            description="첫 번째 게시글을 작성해보세요"
                            action={{ label: "글 작성하기", href: "/community/posts/create" }}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}