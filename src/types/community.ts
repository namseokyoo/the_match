// 게시판 커뮤니티 관련 타입 정의

export interface Board {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: string;
    board_id: string;
    user_id: string;
    title: string;
    content: string;
    view_count: number;
    is_pinned: boolean;
    is_deleted: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
    
    // 조인된 데이터
    board?: Board;
    user?: {
        id: string;
        email: string;
        full_name?: string;
        avatar_url?: string;
    };
    comments_count?: number;
    likes_count?: number;
    is_liked?: boolean;
}

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    
    // 조인된 데이터
    user?: {
        id: string;
        email: string;
        full_name?: string;
        avatar_url?: string;
    };
    replies?: Comment[];
}

export interface PostLike {
    post_id: string;
    user_id: string;
    created_at: string;
}

// 게시글 작성/수정 폼
export interface PostForm {
    board_id: string;
    title: string;
    content: string;
    tags?: string[];
}

// 댓글 작성/수정 폼
export interface CommentForm {
    content: string;
    parent_id?: string;
}

// 게시글 목록 쿼리 파라미터
export interface PostListQuery {
    board_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    sort?: 'latest' | 'popular' | 'commented';
}

// 게시글 목록 응답
export interface PostListResponse {
    posts: Post[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}