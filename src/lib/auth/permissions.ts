import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// 사용자 역할 정의
export enum UserRole {
    SUPER_ADMIN = 'super_admin',     // 시스템 관리자
    ADMIN = 'admin',                 // 일반 관리자
    MATCH_CREATOR = 'match_creator', // 경기 생성자
    TEAM_CAPTAIN = 'team_captain',   // 팀 주장
    TEAM_MEMBER = 'team_member',     // 팀 멤버
    USER = 'user',                   // 일반 사용자
    GUEST = 'guest'                  // 게스트
}

// 권한 정의
export enum Permission {
    // 경기 관련
    CREATE_MATCH = 'create_match',
    EDIT_MATCH = 'edit_match',
    DELETE_MATCH = 'delete_match',
    MANAGE_MATCH = 'manage_match',
    VIEW_MATCH = 'view_match',
    
    // 팀 관련
    CREATE_TEAM = 'create_team',
    EDIT_TEAM = 'edit_team',
    DELETE_TEAM = 'delete_team',
    MANAGE_TEAM = 'manage_team',
    JOIN_TEAM = 'join_team',
    LEAVE_TEAM = 'leave_team',
    VIEW_TEAM = 'view_team',
    
    // 선수 관련
    ADD_PLAYER = 'add_player',
    EDIT_PLAYER = 'edit_player',
    REMOVE_PLAYER = 'remove_player',
    VIEW_PLAYER = 'view_player',
    
    // 참가 관련
    APPLY_TO_MATCH = 'apply_to_match',
    APPROVE_PARTICIPATION = 'approve_participation',
    REJECT_PARTICIPATION = 'reject_participation',
    WITHDRAW_FROM_MATCH = 'withdraw_from_match',
    
    // 경기 진행 관련
    UPDATE_SCORE = 'update_score',
    START_MATCH = 'start_match',
    END_MATCH = 'end_match',
    CHECKIN = 'checkin',
    
    // 시스템 관련
    MANAGE_USERS = 'manage_users',
    MANAGE_SYSTEM = 'manage_system',
    VIEW_ANALYTICS = 'view_analytics',
    MODERATE_CONTENT = 'moderate_content'
}

// 역할별 권한 매핑
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: Object.values(Permission), // 모든 권한
    
    [UserRole.ADMIN]: [
        Permission.CREATE_MATCH,
        Permission.EDIT_MATCH,
        Permission.DELETE_MATCH,
        Permission.MANAGE_MATCH,
        Permission.VIEW_MATCH,
        Permission.CREATE_TEAM,
        Permission.EDIT_TEAM,
        Permission.DELETE_TEAM,
        Permission.MANAGE_TEAM,
        Permission.VIEW_TEAM,
        Permission.VIEW_PLAYER,
        Permission.APPROVE_PARTICIPATION,
        Permission.REJECT_PARTICIPATION,
        Permission.UPDATE_SCORE,
        Permission.START_MATCH,
        Permission.END_MATCH,
        Permission.VIEW_ANALYTICS,
        Permission.MODERATE_CONTENT
    ],
    
    [UserRole.MATCH_CREATOR]: [
        Permission.CREATE_MATCH,
        Permission.EDIT_MATCH,
        Permission.DELETE_MATCH,
        Permission.MANAGE_MATCH,
        Permission.VIEW_MATCH,
        Permission.APPROVE_PARTICIPATION,
        Permission.REJECT_PARTICIPATION,
        Permission.UPDATE_SCORE,
        Permission.START_MATCH,
        Permission.END_MATCH,
        Permission.VIEW_TEAM,
        Permission.VIEW_PLAYER
    ],
    
    [UserRole.TEAM_CAPTAIN]: [
        Permission.CREATE_TEAM,
        Permission.EDIT_TEAM,
        Permission.DELETE_TEAM,
        Permission.MANAGE_TEAM,
        Permission.VIEW_TEAM,
        Permission.ADD_PLAYER,
        Permission.EDIT_PLAYER,
        Permission.REMOVE_PLAYER,
        Permission.VIEW_PLAYER,
        Permission.APPLY_TO_MATCH,
        Permission.WITHDRAW_FROM_MATCH,
        Permission.CHECKIN,
        Permission.VIEW_MATCH
    ],
    
    [UserRole.TEAM_MEMBER]: [
        Permission.VIEW_TEAM,
        Permission.VIEW_PLAYER,
        Permission.LEAVE_TEAM,
        Permission.CHECKIN,
        Permission.VIEW_MATCH
    ],
    
    [UserRole.USER]: [
        Permission.CREATE_TEAM,
        Permission.JOIN_TEAM,
        Permission.VIEW_TEAM,
        Permission.VIEW_PLAYER,
        Permission.VIEW_MATCH,
        Permission.CREATE_MATCH
    ],
    
    [UserRole.GUEST]: [
        Permission.VIEW_MATCH,
        Permission.VIEW_TEAM,
        Permission.VIEW_PLAYER
    ]
};

// 사용자 컨텍스트 인터페이스
export interface UserContext {
    userId?: string;
    email?: string;
    roles: UserRole[];
    permissions: Permission[];
    teamIds?: string[];  // 소속 팀 ID들
    matchIds?: string[]; // 생성한 경기 ID들
}

/**
 * Supabase 클라이언트에서 사용자 정보 가져오기
 */
export async function getUserFromSupabase(): Promise<UserContext | null> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        return {
            roles: [UserRole.GUEST],
            permissions: ROLE_PERMISSIONS[UserRole.GUEST]
        };
    }

    // 사용자 프로필과 역할 가져오기
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, user_roles(*)')
        .eq('id', user.id)
        .single();

    // 사용자가 속한 팀들 가져오기
    const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id);

    // 사용자가 생성한 경기들 가져오기
    const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .eq('created_by', user.id);

    // 역할 결정
    const roles: UserRole[] = [];
    
    // 시스템 역할
    if (profile?.user_roles?.some((r: any) => r.role === UserRole.SUPER_ADMIN)) {
        roles.push(UserRole.SUPER_ADMIN);
    } else if (profile?.user_roles?.some((r: any) => r.role === UserRole.ADMIN)) {
        roles.push(UserRole.ADMIN);
    } else {
        roles.push(UserRole.USER);
    }

    // 경기 생성자 역할
    if (matches && matches.length > 0) {
        roles.push(UserRole.MATCH_CREATOR);
    }

    // 팀 역할
    if (teamMembers) {
        const captainTeams = teamMembers.filter(tm => tm.role === 'captain');
        const memberTeams = teamMembers.filter(tm => tm.role === 'member');
        
        if (captainTeams.length > 0) {
            roles.push(UserRole.TEAM_CAPTAIN);
        }
        if (memberTeams.length > 0) {
            roles.push(UserRole.TEAM_MEMBER);
        }
    }

    // 권한 통합
    const permissions = new Set<Permission>();
    roles.forEach(role => {
        ROLE_PERMISSIONS[role].forEach(permission => {
            permissions.add(permission);
        });
    });

    return {
        userId: user.id,
        email: user.email,
        roles,
        permissions: Array.from(permissions),
        teamIds: teamMembers?.map(tm => tm.team_id) || [],
        matchIds: matches?.map(m => m.id) || []
    };
}

/**
 * 권한 확인 함수
 */
export function hasPermission(
    userContext: UserContext,
    permission: Permission
): boolean {
    return userContext.permissions.includes(permission);
}

/**
 * 역할 확인 함수
 */
export function hasRole(
    userContext: UserContext,
    role: UserRole
): boolean {
    return userContext.roles.includes(role);
}

/**
 * 리소스 소유권 확인 함수
 */
export async function checkResourceOwnership(
    userContext: UserContext,
    resourceType: 'match' | 'team' | 'player',
    resourceId: string
): Promise<boolean> {
    if (!userContext.userId) return false;

    // 관리자는 모든 리소스 접근 가능
    if (hasRole(userContext, UserRole.SUPER_ADMIN) || hasRole(userContext, UserRole.ADMIN)) {
        return true;
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    switch (resourceType) {
        case 'match':
            const { data: match } = await supabase
                .from('matches')
                .select('created_by')
                .eq('id', resourceId)
                .single();
            
            return match?.created_by === userContext.userId;

        case 'team':
            // 팀 주장인지 확인
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('role')
                .eq('team_id', resourceId)
                .eq('user_id', userContext.userId)
                .single();
            
            return teamMember?.role === 'captain';

        case 'player':
            // 선수가 속한 팀의 주장인지 확인
            const { data: player } = await supabase
                .from('players')
                .select('team_id')
                .eq('id', resourceId)
                .single();
            
            if (!player?.team_id) return false;
            
            const { data: captain } = await supabase
                .from('team_members')
                .select('role')
                .eq('team_id', player.team_id)
                .eq('user_id', userContext.userId)
                .single();
            
            return captain?.role === 'captain';

        default:
            return false;
    }
}

/**
 * API 라우트 권한 체크 미들웨어
 */
export async function withAuth(
    request: NextRequest,
    requiredPermission?: Permission,
    resourceCheck?: {
        type: 'match' | 'team' | 'player';
        idParam: string;
    }
) {
    const userContext = await getUserFromSupabase();
    
    if (!userContext) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 권한 확인
    if (requiredPermission && !hasPermission(userContext, requiredPermission)) {
        return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 리소스 소유권 확인
    if (resourceCheck) {
        const pathParts = request.nextUrl.pathname.split('/');
        const resourceIdIndex = parseInt(resourceCheck.idParam);
        const resourceId = pathParts[resourceIdIndex];
        const isOwner = await checkResourceOwnership(
            userContext,
            resourceCheck.type,
            resourceId
        );
        
        if (!isOwner) {
            return new Response(
                JSON.stringify({ error: 'Resource access denied' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    return null; // 권한 확인 성공
}

/**
 * 페이지 보호 함수 (클라이언트 컴포넌트용)
 */
export async function protectPage(
    requiredPermission?: Permission,
    redirectTo: string = '/login'
) {
    const userContext = await getUserFromSupabase();
    
    if (!userContext || userContext.roles.includes(UserRole.GUEST)) {
        return {
            redirect: {
                destination: redirectTo,
                permanent: false
            }
        };
    }

    if (requiredPermission && !hasPermission(userContext, requiredPermission)) {
        return {
            redirect: {
                destination: '/403',
                permanent: false
            }
        };
    }

    return {
        props: {
            userContext
        }
    };
}