/**
 * 사용자 친화적인 에러 메시지 매핑
 */

export interface AppError {
  message?: string;
  code?: string;
  status?: number;
  statusCode?: number;
  stack?: string;
}

export type ErrorInput = string | Error | AppError | unknown;

export const ERROR_MESSAGES: Record<string, string> = {
  // 인증 관련
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'User not found': '등록되지 않은 사용자입니다.',
  'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
  'Password reset required': '비밀번호 재설정이 필요합니다.',
  'Session expired': '세션이 만료되었습니다. 다시 로그인해주세요.',
  'Unauthorized': '로그인이 필요한 서비스입니다.',
  'User already registered': '이미 가입된 이메일입니다.',
  
  // 네트워크 관련
  'Network error': '네트워크 연결을 확인해주세요.',
  'Server error': '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  'Timeout': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  'Failed to fetch': '데이터를 불러올 수 없습니다. 새로고침해주세요.',
  
  // 데이터 검증
  'Invalid email': '올바른 이메일 형식이 아닙니다.',
  'Password too short': '비밀번호는 최소 8자 이상이어야 합니다.',
  'Required field': '필수 입력 항목입니다.',
  'Invalid format': '올바른 형식으로 입력해주세요.',
  'Duplicate entry': '이미 존재하는 데이터입니다.',
  
  // 권한 관련
  'Permission denied': '해당 작업을 수행할 권한이 없습니다.',
  'Access denied': '접근이 거부되었습니다.',
  'Not allowed': '허용되지 않은 작업입니다.',
  
  // 리소스 관련
  'Not found': '요청하신 페이지를 찾을 수 없습니다.',
  'Resource not found': '요청하신 데이터를 찾을 수 없습니다.',
  'Already exists': '이미 존재하는 항목입니다.',
  
  // 팀/매치 관련
  'Team full': '팀 정원이 가득 찼습니다.',
  'Match already started': '이미 시작된 경기입니다.',
  'Match ended': '종료된 경기입니다.',
  'Registration closed': '참가 신청이 마감되었습니다.',
  'Invalid team': '유효하지 않은 팀입니다.',
  
  // 파일 업로드
  'File too large': '파일 크기가 너무 큽니다. (최대 10MB)',
  'Invalid file type': '지원하지 않는 파일 형식입니다.',
  'Upload failed': '파일 업로드에 실패했습니다.',
  
  // 기본 메시지
  'Unknown error': '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

/**
 * 에러 코드를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: ErrorInput): string {
  // 에러가 문자열인 경우
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }
  
  // 에러 객체의 메시지 확인
  if (error && typeof error === 'object' && 'message' in error && error.message) {
    const messageStr = String(error.message);
    // 에러 메시지에서 매칭되는 부분 찾기
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (messageStr.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return ERROR_MESSAGES[messageStr] || messageStr;
  }
  
  // 에러 코드 확인
  if (error && typeof error === 'object' && 'code' in error && error.code) {
    return ERROR_MESSAGES[String(error.code)] || `오류 코드: ${error.code}`;
  }
  
  // HTTP 상태 코드별 메시지
  if (error && typeof error === 'object' && (('status' in error && error.status) || ('statusCode' in error && error.statusCode))) {
    const statusCode = ('status' in error && error.status) || ('statusCode' in error && error.statusCode);
    switch (statusCode) {
      case 400:
        return '잘못된 요청입니다. 입력 내용을 확인해주세요.';
      case 401:
        return '로그인이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청하신 페이지를 찾을 수 없습니다.';
      case 409:
        return '중복된 데이터가 있습니다.';
      case 422:
        return '입력 데이터를 처리할 수 없습니다.';
      case 429:
        return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 502:
      case 503:
      case 504:
        return '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
      default:
        return `오류가 발생했습니다. (코드: ${statusCode})`;
    }
  }
  
  // 기본 메시지
  return ERROR_MESSAGES['Unknown error'];
}

/**
 * 에러 액션 버튼 제공
 */
export interface ErrorAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function getErrorActions(error: ErrorInput): ErrorAction[] {
  const actions: ErrorAction[] = [];
  
  // 에러 타입에 따른 액션 제공
  if ((error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Session expired')) || 
      (error && typeof error === 'object' && 'status' in error && error.status === 401)) {
    actions.push({
      label: '다시 로그인',
      action: () => window.location.href = '/login',
      variant: 'primary'
    });
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && 
      (error.message.includes('Network') || error.message.includes('fetch'))) {
    actions.push({
      label: '새로고침',
      action: () => window.location.reload(),
      variant: 'primary'
    });
  }
  
  if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
    actions.push({
      label: '홈으로',
      action: () => window.location.href = '/',
      variant: 'primary'
    });
  }
  
  // 기본 액션
  if (actions.length === 0) {
    actions.push({
      label: '다시 시도',
      action: () => window.location.reload(),
      variant: 'outline'
    });
  }
  
  return actions;
}

/**
 * 필드별 에러 메시지
 */
export function getFieldErrorMessage(field: string, errorType: string): string {
  const fieldMessages: Record<string, Record<string, string>> = {
    email: {
      required: '이메일을 입력해주세요.',
      invalid: '올바른 이메일 형식이 아닙니다.',
      duplicate: '이미 사용 중인 이메일입니다.'
    },
    password: {
      required: '비밀번호를 입력해주세요.',
      min: '비밀번호는 최소 8자 이상이어야 합니다.',
      weak: '더 안전한 비밀번호를 사용해주세요.',
      mismatch: '비밀번호가 일치하지 않습니다.'
    },
    name: {
      required: '이름을 입력해주세요.',
      min: '이름은 최소 2자 이상이어야 합니다.',
      max: '이름은 최대 50자까지 가능합니다.'
    },
    title: {
      required: '제목을 입력해주세요.',
      min: '제목은 최소 2자 이상이어야 합니다.',
      max: '제목은 최대 100자까지 가능합니다.'
    },
    content: {
      required: '내용을 입력해주세요.',
      min: '내용은 최소 10자 이상이어야 합니다.',
      max: '내용은 최대 5000자까지 가능합니다.'
    }
  };
  
  return fieldMessages[field]?.[errorType] || '올바른 값을 입력해주세요.';
}