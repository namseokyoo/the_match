/* eslint-disable no-unused-vars */
// Base types
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Export bracket types
export { 
    type BracketMatch, 
    type BracketRound, 
    type TournamentBracket, 
    type BracketSeed 
} from './bracket';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    user_id: string;
    bio?: string;
    social_links?: Record<string, string>;
    preferences?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Match types (기존 Tournament에서 변경)
// eslint-disable-next-line no-unused-vars
export enum MatchType {
    SINGLE_ELIMINATION = 'single_elimination',
    DOUBLE_ELIMINATION = 'double_elimination',
    ROUND_ROBIN = 'round_robin',
    SWISS = 'swiss',
    LEAGUE = 'league',
}

// eslint-disable-next-line no-unused-vars
export enum MatchStatus {
    DRAFT = 'draft',
    REGISTRATION = 'registration',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface Match {
    id: string;
    title: string;
    description?: string;
    type: MatchType | string;
    status: MatchStatus | string;
    creator_id: string;
    max_participants?: number;
    registration_deadline?: string;
    start_date?: string;
    end_date?: string;
    rules?: Record<string, any>;
    settings?: Record<string, any>;
    venue?: string;
    venue_address?: string;
    venue_lat?: number;
    venue_lng?: number;
    venue_phone?: string;
    venue_hours?: string;
    venue_info?: string;
    created_at: string;
    updated_at: string;
}

// Team types
export interface Team {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
    captain_id?: string;
    match_id?: string; // tournament_id에서 match_id로 변경
    created_at: string;
    updated_at: string;
}

export interface CreateTeamForm {
    name: string;
    description?: string;
    logo_url?: string;
}

export interface Player {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    team_id?: string;
    position?: string;
    jersey_number?: number;
    stats?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Game types (기존 Match에서 변경) - TODO: 추후 게임 기능 구현 시 사용
// eslint-disable-next-line no-unused-vars
export enum GameStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    POSTPONED = 'postponed',
}

export interface GameResult {
    id: string;
    match_id: string; // tournament_id에서 match_id로 변경
    round?: number;
    game_number?: number; // match_number에서 game_number로 변경
    team1_id?: string;
    team2_id?: string;
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
    status: GameStatus;
    venue?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface GameDetail {
    id: string;
    game_id: string; // match_id에서 game_id로 변경
    winner_id?: string;
    team1_score?: number;
    team2_score?: number;
    details?: Record<string, any>;
    verified: boolean;
    created_at: string;
    updated_at: string;
}

// Media types - TODO: 추후 미디어 업로드 기능 구현 시 사용
// eslint-disable-next-line no-unused-vars
export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document',
}

export interface Media {
    id: string;
    user_id: string;
    match_id?: string; // tournament_id에서 match_id로 변경
    team_id?: string;
    game_id?: string; // match_id에서 game_id로 변경
    type: MediaType;
    url: string;
    thumbnail_url?: string;
    caption?: string;
    file_size?: number;
    mime_type?: string;
    created_at: string;
    updated_at: string;
}

// Bracket types
export interface BracketNode {
    id: string;
    match_id: string; // tournament_id에서 match_id로 변경
    round: number;
    position: number;
    team1_id?: string;
    team2_id?: string;
    winner_id?: string;
    game_id?: string; // match_id에서 game_id로 변경
    parent_game_id?: string; // parent_match_id에서 parent_game_id로 변경
    created_at: string;
    updated_at: string;
}

// Statistics types
export interface MatchStats {
    id: string;
    match_id: string;
    total_games: number;
    completed_games: number;
    total_teams: number;
    active_teams: number;
    total_players: number;
    created_at: string;
    updated_at: string;
}

export interface TeamStats {
    id: string;
    team_id: string;
    match_id?: string;
    games_played: number;
    wins: number;
    losses: number;
    draws: number;
    points_for: number;
    points_against: number;
    win_rate: number;
    created_at: string;
    updated_at: string;
}

export interface PlayerStats {
    id: string;
    player_id: string;
    match_id?: string;
    games_played: number;
    points: number;
    assists: number;
    rebounds?: number;
    steals?: number;
    blocks?: number;
    fouls?: number;
    created_at: string;
    updated_at: string;
}

// User roles - TODO: 추후 권한 관리 시스템 구현 시 사용
// eslint-disable-next-line no-unused-vars
export enum UserRole {
    ADMIN = 'admin',
    ORGANIZER = 'organizer',
    PARTICIPANT = 'participant',
}

export interface UserMatch {
    id: string;
    user_id: string;
    match_id: string; // tournament_id에서 match_id로 변경
    role: UserRole;
    team_id?: string;
    joined_at: string;
}

// API response types
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    success: boolean;
}

// Check-in types
export interface CheckIn {
    id: string;
    match_id: string;
    team_id?: string;
    player_id?: string;
    user_id: string;
    type: 'match' | 'team' | 'player';
    status: 'checked_in' | 'checked_out' | 'absent';
    checked_in_at: string;
    checked_out_at?: string;
    qr_code_data?: any;
    created_at: string;
    updated_at: string;
    player?: Player;
    team?: Team;
    user?: {
        id: string;
        email: string;
        full_name?: string;
    };
}

export interface PaginatedResponse<T = any> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Form types
export interface CreateMatchForm {
    title: string;
    description?: string;
    type: MatchType;
    max_participants?: number;
    registration_deadline?: string;
    start_date?: string;
    end_date?: string;
    rules?: Record<string, any>;
}

export interface CreateTeamForm {
    name: string;
    description?: string;
    logo_url?: string;
}

export interface CreatePlayerForm {
    name: string;
    email?: string;
    position?: string;
    jersey_number?: number;
}

// Team Join Request types
// eslint-disable-next-line no-unused-vars
export enum JoinRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface TeamJoinRequest {
    id: string;
    team_id: string;
    user_id: string;
    player_name: string;
    player_email?: string;
    position?: string;
    jersey_number?: number;
    message?: string;
    status: JoinRequestStatus | string;
    responded_by?: string;
    responded_at?: string;
    response_message?: string;
    created_at: string;
    updated_at: string;
    
    // 조인된 데이터
    team?: Team;
    user?: User;
    responder?: User;
}

// Component prop types
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
}

export interface InputProps extends BaseComponentProps {
    id?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    // eslint-disable-next-line no-unused-vars
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    required?: boolean;
    onChange?: (value: string) => void;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    pattern?: string;
    maxLength?: number;
    minLength?: number;
    autoComplete?: string;
    autoFocus?: boolean;
    readOnly?: boolean;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Participant types (경기 참가 관련)
// eslint-disable-next-line no-unused-vars
export enum ParticipantStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface MatchParticipant {
    id: string;
    match_id: string;
    team_id: string;
    status: ParticipantStatus;
    applied_at: string;
    responded_at?: string;
    response_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;

    // 조인된 데이터
    team?: Team;
    match?: Match;
    responder?: User;
}

export interface ApplyToMatchForm {
    teamId?: string;
    notes?: string;
}

export interface ParticipantResponse {
    status: ParticipantStatus.APPROVED | ParticipantStatus.REJECTED;
    notes?: string;
}

// Match Template types
export interface MatchTemplate {
    id: string;
    name: string;
    description?: string;
    creator_id: string;
    type: MatchType;
    sport_type?: string;
    max_teams?: number;
    min_teams?: number;
    rules?: Record<string, any>;
    settings?: Record<string, any>;
    usage_count: number;
    is_public: boolean;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface CreateTemplateForm {
    name: string;
    description?: string;
    type: MatchType;
    sport_type?: string;
    max_teams?: number;
    min_teams?: number;
    rules?: Record<string, any>;
    settings?: Record<string, any>;
    is_public?: boolean;
    tags?: string[];
} 