'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Eye, Heart, MessageCircle, User } from 'lucide-react';
import type { Post } from '@/types/community';

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const getUserName = () => {
        if (post.user?.full_name) {
            return post.user.full_name;
        }
        return post.user?.email?.split('@')[0] || '익명';
    };

    const formatDate = (date: string) => {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: ko
        });
    };

    return (
        <Link href={`/community/posts/${post.id}`}>
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        {post.is_pinned && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded mb-2">
                                공지
                            </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                            {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {post.content}
                        </p>
                        
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {post.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {getUserName()}
                                </span>
                                <span>{formatDate(post.created_at)}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {post.view_count}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    {post.comments_count || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Heart className={`w-3 h-3 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                    {post.likes_count || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PostCard;