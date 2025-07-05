// Base types
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

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

// Tournament types
export enum TournamentType {
    SINGLE_ELIMINATION = 'single_elimination',
    DOUBLE_ELIMINATION = 'double_elimination',
    ROUND_ROBIN = 'round_robin',
    SWISS = 'swiss',
    LEAGUE = 'league',
}

export enum TournamentStatus {
    DRAFT = 'draft',
    REGISTRATION = 'registration',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export interface Tournament {
    id: string;
    title: string;
    description?: string;
    type: TournamentType;
    status: TournamentStatus;
    creator_id: string;
    max_participants?: number;
    registration_deadline?: string;
    start_date?: string;
    end_date?: string;
    rules?: Record<string, any>;
    settings?: Record<string, any>;
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
    tournament_id?: string;
    created_at: string;
    updated_at: string;
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

// Match types
export enum MatchStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    POSTPONED = 'postponed',
}

export interface Match {
    id: string;
    tournament_id: string;
    round?: number;
    match_number?: number;
    team1_id?: string;
    team2_id?: string;
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
    status: MatchStatus;
    venue?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface MatchResult {
    id: string;
    match_id: string;
    winner_id?: string;
    team1_score?: number;
    team2_score?: number;
    details?: Record<string, any>;
    verified: boolean;
    created_at: string;
    updated_at: string;
}

// Media types
export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document',
}

export interface Media {
    id: string;
    user_id: string;
    tournament_id?: string;
    team_id?: string;
    match_id?: string;
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
    tournament_id: string;
    round: number;
    position: number;
    team1_id?: string;
    team2_id?: string;
    winner_id?: string;
    match_id?: string;
    parent_match_id?: string;
    created_at: string;
    updated_at: string;
}

// User roles
export enum UserRole {
    ADMIN = 'admin',
    ORGANIZER = 'organizer',
    PARTICIPANT = 'participant',
}

export interface UserTournament {
    id: string;
    user_id: string;
    tournament_id: string;
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
export interface CreateTournamentForm {
    title: string;
    description?: string;
    type: TournamentType;
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

// Component props types
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
}

export interface InputProps extends BaseComponentProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    required?: boolean;
    onChange?: (value: string) => void;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 