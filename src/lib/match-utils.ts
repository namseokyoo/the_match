import { MatchStatus } from '@/types';

/**
 * 경기 날짜를 기반으로 상태를 자동으로 계산합니다.
 * @param registrationStartDate - 등록 시작일
 * @param registrationDeadline - 등록 마감일
 * @param startDate - 경기 시작일
 * @param endDate - 경기 종료일
 * @param currentStatus - 현재 상태 (취소된 경우 유지)
 * @returns 계산된 경기 상태
 */
export function calculateMatchStatus(
    registrationStartDate?: string | null,
    registrationDeadline?: string | null,
    startDate?: string | null,
    endDate?: string | null,
    currentStatus?: string | null
): MatchStatus {
    // 취소된 경기는 상태 유지
    if (currentStatus === MatchStatus.CANCELLED) {
        return MatchStatus.CANCELLED;
    }

    const now = new Date();
    const regStartDate = registrationStartDate ? new Date(registrationStartDate) : null;
    const regDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    const matchStartDate = startDate ? new Date(startDate) : null;
    const matchEndDate = endDate ? new Date(endDate) : null;

    // 경기 종료일이 지났으면 완료
    if (matchEndDate && now > matchEndDate) {
        return MatchStatus.COMPLETED;
    }

    // 경기 시작일이 지났으면 진행중
    if (matchStartDate && now >= matchStartDate) {
        return MatchStatus.IN_PROGRESS;
    }

    // 등록 시작일이 지났고 등록 마감일 전이면 등록중
    if (regStartDate && now >= regStartDate) {
        if (regDeadline && now <= regDeadline) {
            return MatchStatus.REGISTRATION;
        }
        // 등록 마감일이 지났지만 경기 시작 전이면 준비중
        if (regDeadline && now > regDeadline) {
            return MatchStatus.DRAFT;
        }
    }

    // 등록 시작일 전이거나 날짜가 설정되지 않은 경우 준비중
    return MatchStatus.DRAFT;
}

/**
 * 경기 상태에 대한 한글 라벨을 반환합니다.
 */
export function getMatchStatusLabel(status: MatchStatus | string): string {
    switch (status) {
        case MatchStatus.DRAFT:
            return '준비중';
        case MatchStatus.REGISTRATION:
            return '등록중';
        case MatchStatus.IN_PROGRESS:
            return '진행중';
        case MatchStatus.COMPLETED:
            return '완료';
        case MatchStatus.CANCELLED:
            return '취소됨';
        default:
            return '알 수 없음';
    }
}

/**
 * 경기 상태에 대한 색상 클래스를 반환합니다.
 */
export function getMatchStatusColor(status: MatchStatus | string): string {
    switch (status) {
        case MatchStatus.DRAFT:
            return 'bg-gray-100 text-gray-700';
        case MatchStatus.REGISTRATION:
            return 'bg-green-100 text-green-700';
        case MatchStatus.IN_PROGRESS:
            return 'bg-blue-100 text-blue-700';
        case MatchStatus.COMPLETED:
            return 'bg-gray-100 text-gray-700';
        case MatchStatus.CANCELLED:
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}