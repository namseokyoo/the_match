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
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-purple-50/30">
            <div className="mx-auto max-w-7xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                💬 커뮤니티
                            </h2>
                            <p className="text-sm text-gray-500">다른 플레이어들과 소통해보세요</p>
                        </div>
                        {/* 탭 버튼 */}
                        <div className="flex bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-1.5 shadow-sm ml-4">
                            <button
                                onClick={() => setActiveTab('latest')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    activeTab === 'latest'
                                        ? 'bg-white text-purple-700 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                최신글
                            </button>
                            <button
                                onClick={() => setActiveTab('popular')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    activeTab === 'popular'
                                        ? 'bg-white text-purple-700 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                인기글
                            </button>
                        </div>
                    </div>
                    <Link 
                        href="/community" 
                        className="group flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                    >
                        모두 보기 
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                    <div className="space-y-4">
                        {displayPosts.map((post) => (
                            <Link key={post.id} href={`/community/posts/${post.id}`}>
                                <div className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="flex items-center gap-1.5 text-gray-500">
                                                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                                                    <span className="font-medium">{post.view_count || 0}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 text-gray-500">
                                                    <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="font-medium">댓글</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 text-gray-500">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-medium">
                                                        {formatDistanceToNow(new Date(post.created_at), { 
                                                            addSuffix: true, 
                                                            locale: ko 
                                                        })}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        {activeTab === 'popular' && (
                                            <div className="ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-full">
                                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                                <span className="text-xs font-bold text-orange-600">인기</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl">
                        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            {activeTab === 'latest' ? '아직 게시글이 없습니다' : '인기 게시글이 없습니다'}
                        </h3>
                        <p className="text-gray-600 mb-6">커뮤니티의 첫 글을 작성해보세요!</p>
                        <Link 
                            href="/community/posts/create" 
                            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
                        >
                            첫 글 작성하기
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}