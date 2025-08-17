'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Eye, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
        <section className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="mx-auto max-w-7xl">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            커뮤니티
                        </h2>
                        {/* 탭 버튼 */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('latest')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'latest'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                최신글
                            </button>
                            <button
                                onClick={() => setActiveTab('popular')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'popular'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                인기글
                            </button>
                        </div>
                    </div>
                    <Link 
                        href="/community" 
                        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm"
                    >
                        모두 보기 <ArrowRight className="w-4 h-4" />
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
                                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
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
                                            <div className="ml-4 flex items-center gap-1 text-orange-500">
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
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                            {activeTab === 'latest' ? '아직 게시글이 없습니다' : '인기 게시글이 없습니다'}
                        </p>
                        <Link 
                            href="/community/posts/create" 
                            className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
                        >
                            첫 글 작성하기
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}