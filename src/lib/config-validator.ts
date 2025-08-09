import { createClient } from '@supabase/supabase-js';

/**
 * 환경 설정 검증 모듈
 * 
 * 애플리케이션 실행에 필요한 모든 환경 변수와 설정을 검증합니다.
 * Supabase 연결 상태를 확인하고, 문제 발생 시 명확한 안내를 제공합니다.
 */

// 환경 변수 타입 정의
interface EnvironmentVariables {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
}

// 검증 결과 타입
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    environment: 'development' | 'production' | 'test';
    supabaseStatus: SupabaseConnectionStatus;
}

export interface ValidationError {
    field: string;
    message: string;
    hint?: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
    hint?: string;
}

export interface SupabaseConnectionStatus {
    isConnected: boolean;
    latency?: number;
    error?: string;
    projectUrl?: string;
    isHealthy: boolean;
}

// 환경 변수 검증 클래스
export class ConfigValidator {
    private errors: ValidationError[] = [];
    private warnings: ValidationWarning[] = [];
    
    /**
     * 모든 환경 설정을 검증합니다.
     */
    public async validateAll(): Promise<ValidationResult> {
        this.errors = [];
        this.warnings = [];

        // 1. 환경 변수 검증
        this.validateEnvironmentVariables();
        
        // 2. Supabase 연결 테스트
        const supabaseStatus = await this.testSupabaseConnection();
        
        // 3. 환경 감지
        const environment = this.detectEnvironment();
        
        // 4. 추가 검증 (프로덕션 환경)
        if (environment === 'production') {
            this.validateProductionSettings();
        }

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            environment,
            supabaseStatus,
        };
    }

    /**
     * 필수 환경 변수들을 검증합니다.
     */
    private validateEnvironmentVariables(): Partial<EnvironmentVariables> {
        const vars: Partial<EnvironmentVariables> = {};

        // NEXT_PUBLIC_SUPABASE_URL 검증
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
            this.errors.push({
                field: 'NEXT_PUBLIC_SUPABASE_URL',
                message: 'Supabase URL이 설정되지 않았습니다.',
                hint: '.env.local 파일에 NEXT_PUBLIC_SUPABASE_URL을 추가하세요.',
            });
        } else if (!this.isValidSupabaseUrl(supabaseUrl)) {
            this.errors.push({
                field: 'NEXT_PUBLIC_SUPABASE_URL',
                message: 'Supabase URL 형식이 올바르지 않습니다.',
                hint: 'URL이 https://[PROJECT_ID].supabase.co 형식인지 확인하세요.',
            });
        } else {
            vars.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
        }

        // NEXT_PUBLIC_SUPABASE_ANON_KEY 검증
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!anonKey) {
            this.errors.push({
                field: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                message: 'Supabase Anon Key가 설정되지 않았습니다.',
                hint: '.env.local 파일에 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요.',
            });
        } else if (!this.isValidJWT(anonKey)) {
            this.errors.push({
                field: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                message: 'Supabase Anon Key 형식이 올바르지 않습니다.',
                hint: 'Supabase 대시보드에서 올바른 Anon Key를 복사했는지 확인하세요.',
            });
        } else {
            vars.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
        }

        // SUPABASE_SERVICE_ROLE_KEY 검증 (서버 사이드에서만)
        if (typeof window === 'undefined') {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (!serviceKey) {
                this.warnings.push({
                    field: 'SUPABASE_SERVICE_ROLE_KEY',
                    message: 'Service Role Key가 설정되지 않았습니다.',
                    hint: 'API 라우트에서 관리자 권한이 필요한 작업이 제한될 수 있습니다.',
                });
            } else if (!this.isValidJWT(serviceKey)) {
                this.errors.push({
                    field: 'SUPABASE_SERVICE_ROLE_KEY',
                    message: 'Service Role Key 형식이 올바르지 않습니다.',
                    hint: 'Supabase 대시보드에서 올바른 Service Role Key를 복사했는지 확인하세요.',
                });
            } else {
                vars.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
            }

            // Service Role Key가 Anon Key와 같은지 확인
            if (serviceKey && anonKey && serviceKey === anonKey) {
                this.errors.push({
                    field: 'SUPABASE_SERVICE_ROLE_KEY',
                    message: 'Service Role Key와 Anon Key가 동일합니다.',
                    hint: 'Service Role Key는 관리자 권한을 가진 별도의 키여야 합니다.',
                });
            }
        }

        return vars;
    }

    /**
     * Supabase 연결을 테스트합니다.
     */
    private async testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            return {
                isConnected: false,
                error: '환경 변수가 설정되지 않았습니다.',
                isHealthy: false,
            };
        }

        try {
            const startTime = Date.now();
            const client = createClient(url, key);
            
            // 간단한 연결 테스트 - auth.getSession()을 사용
            const { error } = await client.auth.getSession();
            const latency = Date.now() - startTime;

            if (error && !error.message.includes('session')) {
                return {
                    isConnected: false,
                    error: `Supabase 연결 실패: ${error.message}`,
                    latency,
                    projectUrl: url,
                    isHealthy: false,
                };
            }

            // 연결 성공
            const status: SupabaseConnectionStatus = {
                isConnected: true,
                latency,
                projectUrl: url,
                isHealthy: latency < 1000, // 1초 이내면 건강한 상태
            };

            // 지연 시간 경고
            if (latency > 1000) {
                this.warnings.push({
                    field: 'Supabase Connection',
                    message: `Supabase 응답 시간이 느립니다 (${latency}ms).`,
                    hint: '네트워크 상태를 확인하거나 더 가까운 리전을 선택하세요.',
                });
            }

            return status;
        } catch (error) {
            return {
                isConnected: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류',
                projectUrl: url,
                isHealthy: false,
            };
        }
    }

    /**
     * 현재 환경을 감지합니다.
     */
    private detectEnvironment(): 'development' | 'production' | 'test' {
        if (process.env.NODE_ENV === 'test') return 'test';
        if (process.env.NODE_ENV === 'production') return 'production';
        return 'development';
    }

    /**
     * 프로덕션 환경 설정을 추가로 검증합니다.
     */
    private validateProductionSettings(): void {
        // NEXTAUTH_SECRET 검증 (사용하는 경우)
        if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_SECRET) {
            this.errors.push({
                field: 'NEXTAUTH_SECRET',
                message: '프로덕션 환경에서 NEXTAUTH_SECRET이 필요합니다.',
                hint: 'openssl rand -base64 32 명령으로 시크릿을 생성하세요.',
            });
        }

        // HTTPS 확인
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (url && !url.startsWith('https://')) {
            this.errors.push({
                field: 'NEXT_PUBLIC_SUPABASE_URL',
                message: '프로덕션 환경에서는 HTTPS를 사용해야 합니다.',
                hint: 'Supabase URL이 https://로 시작하는지 확인하세요.',
            });
        }

        // Service Role Key 노출 확인
        if (typeof window !== 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.errors.push({
                field: 'SUPABASE_SERVICE_ROLE_KEY',
                message: '클라이언트 사이드에서 Service Role Key가 노출되었습니다!',
                hint: 'Service Role Key는 서버 사이드에서만 사용해야 합니다.',
            });
        }
    }

    /**
     * Supabase URL 형식을 검증합니다.
     */
    private isValidSupabaseUrl(url: string): boolean {
        const pattern = /^https:\/\/[a-z0-9]+\.supabase\.(co|com)$/;
        return pattern.test(url);
    }

    /**
     * JWT 토큰 형식을 검증합니다.
     */
    private isValidJWT(token: string): boolean {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        try {
            // 각 파트가 Base64 디코딩 가능한지 확인
            parts.forEach(part => {
                atob(part.replace(/-/g, '+').replace(/_/g, '/'));
            });
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * 싱글톤 인스턴스
 */
export const configValidator = new ConfigValidator();

/**
 * 환경 설정 검증 결과를 포맷팅합니다.
 */
export function formatValidationResult(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== 환경 설정 검증 결과 ===');
    lines.push(`환경: ${result.environment}`);
    lines.push(`상태: ${result.isValid ? '✅ 정상' : '❌ 오류'}`);
    lines.push('');

    if (result.supabaseStatus.isConnected) {
        lines.push('📡 Supabase 연결 상태:');
        lines.push(`  ✅ 연결됨 (${result.supabaseStatus.latency}ms)`);
        lines.push(`  URL: ${result.supabaseStatus.projectUrl}`);
        lines.push(`  상태: ${result.supabaseStatus.isHealthy ? '정상' : '느림'}`);
    } else {
        lines.push('📡 Supabase 연결 상태:');
        lines.push(`  ❌ 연결 실패`);
        lines.push(`  오류: ${result.supabaseStatus.error}`);
    }
    lines.push('');

    if (result.errors.length > 0) {
        lines.push('❌ 오류:');
        result.errors.forEach(error => {
            lines.push(`  • ${error.field}: ${error.message}`);
            if (error.hint) {
                lines.push(`    💡 ${error.hint}`);
            }
        });
        lines.push('');
    }

    if (result.warnings.length > 0) {
        lines.push('⚠️ 경고:');
        result.warnings.forEach(warning => {
            lines.push(`  • ${warning.field}: ${warning.message}`);
            if (warning.hint) {
                lines.push(`    💡 ${warning.hint}`);
            }
        });
    }

    return lines.join('\n');
}