/**
 * 입력 필드 검증 유틸리티
 */

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
}

export interface ValidationRules {
    [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
        return { isValid: false, message: '이메일을 입력해주세요.' };
    }
    
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'example@email.com 형식으로 입력해주세요.' };
    }
    
    return { isValid: true };
}

/**
 * 비밀번호 강도 검증
 */
export function validatePassword(password: string): { 
    isValid: boolean; 
    strength: 'weak' | 'medium' | 'strong';
    message?: string;
    suggestions: string[];
} {
    const suggestions: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    
    if (!password) {
        return {
            isValid: false,
            strength: 'weak',
            message: '비밀번호를 입력해주세요.',
            suggestions: []
        };
    }
    
    if (password.length < 8) {
        suggestions.push('최소 8자 이상 입력해주세요');
    }
    
    if (!/[A-Z]/.test(password)) {
        suggestions.push('대문자를 포함해주세요');
    }
    
    if (!/[a-z]/.test(password)) {
        suggestions.push('소문자를 포함해주세요');
    }
    
    if (!/\d/.test(password)) {
        suggestions.push('숫자를 포함해주세요');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        suggestions.push('특수문자를 포함해주세요');
    }
    
    // 강도 계산
    const criteriaCount = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ].filter(Boolean).length;
    
    if (criteriaCount >= 5) {
        strength = 'strong';
    } else if (criteriaCount >= 3) {
        strength = 'medium';
    }
    
    return {
        isValid: password.length >= 8,
        strength,
        message: suggestions.length > 0 ? suggestions[0] : undefined,
        suggestions
    };
}

/**
 * 전화번호 검증
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; message?: string } {
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    const cleanPhone = phone.replace(/-/g, '');
    
    if (!phone) {
        return { isValid: false, message: '전화번호를 입력해주세요.' };
    }
    
    if (!phoneRegex.test(phone)) {
        return { isValid: false, message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)' };
    }
    
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return { isValid: false, message: '전화번호는 10-11자리여야 합니다.' };
    }
    
    return { isValid: true };
}

/**
 * URL 검증
 */
export function validateUrl(url: string): { isValid: boolean; message?: string } {
    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return { isValid: false, message: '올바른 URL 형식이 아닙니다. (예: https://example.com)' };
    }
}

/**
 * 날짜 검증
 */
export function validateDate(date: string, options?: {
    minDate?: Date;
    maxDate?: Date;
    allowPast?: boolean;
    allowFuture?: boolean;
}): { isValid: boolean; message?: string } {
    if (!date) {
        return { isValid: false, message: '날짜를 선택해주세요.' };
    }
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return { isValid: false, message: '올바른 날짜 형식이 아닙니다.' };
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (options?.allowPast === false && dateObj < now) {
        return { isValid: false, message: '과거 날짜는 선택할 수 없습니다.' };
    }
    
    if (options?.allowFuture === false && dateObj > now) {
        return { isValid: false, message: '미래 날짜는 선택할 수 없습니다.' };
    }
    
    if (options?.minDate && dateObj < options.minDate) {
        return { isValid: false, message: `${options.minDate.toLocaleDateString()} 이후 날짜를 선택해주세요.` };
    }
    
    if (options?.maxDate && dateObj > options.maxDate) {
        return { isValid: false, message: `${options.maxDate.toLocaleDateString()} 이전 날짜를 선택해주세요.` };
    }
    
    return { isValid: true };
}

/**
 * 숫자 범위 검증
 */
export function validateNumberRange(value: number, min?: number, max?: number): { 
    isValid: boolean; 
    message?: string 
} {
    if (min !== undefined && value < min) {
        return { isValid: false, message: `최소값은 ${min}입니다.` };
    }
    
    if (max !== undefined && value > max) {
        return { isValid: false, message: `최대값은 ${max}입니다.` };
    }
    
    return { isValid: true };
}

/**
 * 텍스트 길이 검증
 */
export function validateTextLength(text: string, minLength?: number, maxLength?: number): { 
    isValid: boolean; 
    message?: string 
} {
    const length = text.trim().length;
    
    if (minLength !== undefined && length < minLength) {
        return { isValid: false, message: `최소 ${minLength}자 이상 입력해주세요.` };
    }
    
    if (maxLength !== undefined && length > maxLength) {
        return { isValid: false, message: `최대 ${maxLength}자까지 입력 가능합니다.` };
    }
    
    return { isValid: true };
}

/**
 * 폼 전체 검증
 */
export function validateForm(data: Record<string, any>, rules: ValidationRules): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];
        const ruleArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];
        
        for (const rule of ruleArray) {
            if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
                errors.push({
                    field,
                    message: rule.message || `${field}은(는) 필수 입력 항목입니다.`
                });
                break;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors.push({
                    field,
                    message: rule.message || `최소 ${rule.minLength}자 이상 입력해주세요.`
                });
                break;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors.push({
                    field,
                    message: rule.message || `최대 ${rule.maxLength}자까지 입력 가능합니다.`
                });
                break;
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors.push({
                    field,
                    message: rule.message || `올바른 형식이 아닙니다.`
                });
                break;
            }
            
            if (value && rule.custom && !rule.custom(value)) {
                errors.push({
                    field,
                    message: rule.message || `유효하지 않은 값입니다.`
                });
                break;
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * SQL Injection 방지를 위한 특수문자 이스케이프
 */
export function escapeSql(text: string): string {
    return text.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
        switch (char) {
            case "\0": return "\\0";
            case "\x08": return "\\b";
            case "\x09": return "\\t";
            case "\x1a": return "\\z";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char;
            default:
                return char;
        }
    });
}