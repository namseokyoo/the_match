-- 게시판 커뮤니티 기능을 위한 테이블 생성

-- 게시판 카테고리 테이블
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'MessageSquare',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_posts_board_id (board_id),
    INDEX idx_posts_user_id (user_id),
    INDEX idx_posts_created_at (created_at DESC)
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_comments_post_id (post_id),
    INDEX idx_comments_user_id (user_id),
    INDEX idx_comments_parent_id (parent_id)
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (post_id, user_id),
    INDEX idx_post_likes_post_id (post_id),
    INDEX idx_post_likes_user_id (user_id)
);

-- 초기 게시판 카테고리 삽입
INSERT INTO boards (name, slug, description, icon, order_index) VALUES
    ('팀원 모집', 'recruitment', '팀원을 모집하는 게시판입니다', 'Users', 1),
    ('자유 게시판', 'free', '자유롭게 소통하는 공간입니다', 'MessageCircle', 2)
ON CONFLICT (slug) DO NOTHING;

-- RLS (Row Level Security) 정책 설정

-- boards 테이블 정책
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_select_policy" ON boards
    FOR SELECT USING (is_active = true);

-- posts 테이블 정책
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게시글 조회 가능
CREATE POLICY "posts_select_policy" ON posts
    FOR SELECT USING (is_deleted = false);

-- 로그인한 사용자만 게시글 작성 가능
CREATE POLICY "posts_insert_policy" ON posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 본인 게시글만 수정 가능
CREATE POLICY "posts_update_policy" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

-- 본인 게시글만 삭제 가능 (soft delete)
CREATE POLICY "posts_delete_policy" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- comments 테이블 정책
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 댓글 조회 가능
CREATE POLICY "comments_select_policy" ON comments
    FOR SELECT USING (is_deleted = false);

-- 로그인한 사용자만 댓글 작성 가능
CREATE POLICY "comments_insert_policy" ON comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 본인 댓글만 수정 가능
CREATE POLICY "comments_update_policy" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

-- 본인 댓글만 삭제 가능 (soft delete)
CREATE POLICY "comments_delete_policy" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- post_likes 테이블 정책
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 좋아요 조회 가능
CREATE POLICY "post_likes_select_policy" ON post_likes
    FOR SELECT USING (true);

-- 로그인한 사용자만 좋아요 가능
CREATE POLICY "post_likes_insert_policy" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 좋아요만 취소 가능
CREATE POLICY "post_likes_delete_policy" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE posts 
    SET view_count = view_count + 1
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;