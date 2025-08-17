// API 클라이언트 유틸리티
// 재시도 로직, 타임아웃, 캐싱, 성능 최적화 등을 처리

interface FetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    cacheStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxAge?: number;
    requireAuth?: boolean;
    accessToken?: string | null;
}

interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
    etag?: string;
}

interface APIResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
    success?: boolean;
}

const DEFAULT_TIMEOUT = 8000; // 8초로 단축
const DEFAULT_RETRIES = 2; // 재시도 횟수 감소
const DEFAULT_RETRY_DELAY = 500; // 500ms로 단축
const DEFAULT_CACHE_TIMEOUT = 60000; // 60초로 연장

// 성능 메트릭 추적
interface PerformanceMetrics {
    requestCount: number;
    cacheHits: number;
    totalTime: number;
    errorCount: number;
}

class APIClient {
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTimeout = DEFAULT_CACHE_TIMEOUT;
    private metrics: PerformanceMetrics = {
        requestCount: 0,
        cacheHits: 0,
        totalTime: 0,
        errorCount: 0
    };
    
    // 동일한 요청 중복 방지를 위한 프로미스 캐시
    private inflightRequests: Map<string, Promise<unknown>> = new Map();

    async fetchWithRetry(
        url: string,
        options: FetchOptions = {}
    ): Promise<Response> {
        const {
            timeout = DEFAULT_TIMEOUT,
            retries = DEFAULT_RETRIES,
            retryDelay = DEFAULT_RETRY_DELAY,
            requireAuth = false,
            accessToken = null,
            ...fetchOptions
        } = options;
        
        // 인증이 필요한 경우 Authorization 헤더 추가
        if (requireAuth && accessToken) {
            fetchOptions.headers = {
                ...fetchOptions.headers,
                'Authorization': `Bearer ${accessToken}`,
            };
        }

        const startTime = performance.now();
        this.metrics.requestCount++;
        
        let lastError: Error | null = null;

        for (let i = 0; i <= retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                // 캐시된 ETag가 있으면 If-None-Match 헤더 추가
                const cacheKey = url + JSON.stringify(fetchOptions);
                const cached = this.cache.get(cacheKey);
                if (cached?.etag && fetchOptions.method !== 'POST') {
                    fetchOptions.headers = {
                        ...fetchOptions.headers,
                        'If-None-Match': cached.etag
                    };
                }

                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                // 304 Not Modified 처리
                if (response.status === 304 && cached) {
                    this.metrics.cacheHits++;
                    this.metrics.totalTime += performance.now() - startTime;
                    return new Response(JSON.stringify(cached.data), {
                        status: 200,
                        headers: response.headers
                    });
                }

                if (!response.ok && response.status >= 500) {
                    // 서버 에러인 경우 재시도
                    throw new Error(`Server error: ${response.status}`);
                }

                this.metrics.totalTime += performance.now() - startTime;
                return response;
            } catch (error) {
                lastError = error as Error;
                this.metrics.errorCount++;
                
                // 마지막 시도가 아니면 대기 후 재시도
                if (i < retries) {
                    console.log(`Retry ${i + 1}/${retries} for ${url}`);
                    await new Promise(resolve => 
                        setTimeout(resolve, retryDelay * Math.pow(1.5, i)) // 지수 백오프 완화
                    );
                } else {
                    console.error(`Failed after ${retries} retries:`, error);
                }
            }
        }

        throw lastError || new Error('Unknown error');
    }

    async get<T = unknown>(url: string, options?: FetchOptions): Promise<T> {
        const {
            cacheStrategy = 'stale-while-revalidate',
            maxAge = this.cacheTimeout,
            ...fetchOptions
        } = options || {};
        
        const cacheKey = url + JSON.stringify(fetchOptions);
        
        // 중복 요청 방지 - 동일한 요청이 진행 중이면 기다림
        if (this.inflightRequests.has(cacheKey)) {
            return this.inflightRequests.get(cacheKey)! as Promise<T>;
        }
        
        const cached = this.cache.get(cacheKey);
        const isStale = cached && (Date.now() - cached.timestamp > maxAge);
        
        // 캐시 전략에 따른 처리
        if (cacheStrategy === 'cache-first' && cached && !isStale) {
            this.metrics.cacheHits++;
            console.log('Cache hit for:', url);
            return cached.data as T;
        }
        
        // 네트워크 요청 프로미스 생성
        const requestPromise = this.executeNetworkRequest<T>(url, fetchOptions, cacheKey, cached as CacheEntry<T>);
        
        // 진행 중인 요청으로 등록
        this.inflightRequests.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            // 요청 완료 후 제거
            this.inflightRequests.delete(cacheKey);
        }
    }
    
    private async executeNetworkRequest<T>(
        url: string, 
        fetchOptions: RequestInit, 
        cacheKey: string, 
        cached?: CacheEntry<T>
    ): Promise<T> {
        try {
            const response = await this.fetchWithRetry(url, {
                ...fetchOptions,
                method: 'GET',
            });

            const data = await response.json();
            const etag = response.headers.get('ETag');

            // 성공 시 캐시 저장 (ETag 포함)
            if (response.ok) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    etag: etag || undefined,
                });
                
                // 캐시 크기 제한 (최대 100개)
                if (this.cache.size > 100) {
                    const oldestKey = this.cache.keys().next().value;
                    this.cache.delete(oldestKey);
                }
            }

            return data;
        } catch (error) {
            // 캐시된 데이터가 있으면 에러 시에도 반환 (stale-while-revalidate)
            if (cached) {
                console.warn('Using stale cache due to network error:', error);
                this.metrics.cacheHits++;
                return cached.data as T;
            }
            throw error;
        }
    }

    // 성능 메트릭 조회
    getMetrics(): PerformanceMetrics & { cacheHitRate: number; avgResponseTime: number } {
        const cacheHitRate = this.metrics.requestCount > 0 ? 
            (this.metrics.cacheHits / this.metrics.requestCount) * 100 : 0;
        const avgResponseTime = this.metrics.requestCount > 0 ? 
            this.metrics.totalTime / this.metrics.requestCount : 0;
            
        return {
            ...this.metrics,
            cacheHitRate,
            avgResponseTime
        };
    }

    // 선택적 캐시 무효화
    invalidateCache(pattern?: string) {
        if (!pattern) {
            this.cache.clear();
            this.inflightRequests.clear();
            return;
        }
        
        this.cache.forEach((value, key) => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        });
    }
    
    // 캐시 전체 삭제 (하위 호환성)
    clearCache() {
        this.invalidateCache();
    }
}

export const apiClient = new APIClient();

// 인증이 필요한 API 호출을 위한 헬퍼 함수
export async function fetchWithAuth(
    url: string,
    accessToken: string | null,
    options: Omit<FetchOptions, 'accessToken' | 'requireAuth'> = {}
): Promise<Response> {
    return apiClient.fetchWithRetry(url, {
        ...options,
        requireAuth: true,
        accessToken,
    });
}

// POST 요청을 위한 간단한 헬퍼
export async function postWithAuth<T = unknown>(
    url: string,
    accessToken: string | null,
    body: Record<string, unknown> | string,
    options: Omit<FetchOptions, 'accessToken' | 'requireAuth' | 'method' | 'body'> = {}
): Promise<T> {
    const response = await fetchWithAuth(url, accessToken, {
        ...options,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status} 오류가 발생했습니다.`);
    }
    
    return response.json();
}

// 특화된 API 함수들
export const matchAPI = {
    async getAll(options: { 
        status?: string;
        type?: string; 
        limit?: number;
        cacheStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate' 
    } = {}) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams();
        
        if (options.status) params.append('status', options.status);
        if (options.type) params.append('type', options.type);
        if (options.limit) params.append('limit', options.limit.toString());
        
        const url = `${baseUrl}/api/matches${params.toString() ? `?${params.toString()}` : ''}`;
        
        return apiClient.get<APIResponse>(url, {
            cacheStrategy: options.cacheStrategy || 'stale-while-revalidate',
            maxAge: 45000, // 45초 캐시
        });
    },

    async getById(id: string, options: { includeGames?: boolean } = {}) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams();
        
        if (options.includeGames) params.append('include', 'games');
        
        const url = `${baseUrl}/api/matches/${id}${params.toString() ? `?${params.toString()}` : ''}`;
        
        return apiClient.get<APIResponse>(url, {
            cacheStrategy: 'cache-first',
            maxAge: 30000, // 30초 캐시
        });
    },

    async getActive() {
        return this.getAll({ 
            status: 'in_progress,registration', 
            limit: 6,
            cacheStrategy: 'stale-while-revalidate' 
        });
    },

    async getUpcoming() {
        return this.getAll({ 
            status: 'registration,draft', 
            limit: 4,
            cacheStrategy: 'stale-while-revalidate' 
        });
    },
};

export const teamAPI = {
    async getAll(options: { 
        matchId?: string;
        recruiting?: boolean;
        limit?: number;
        cacheStrategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate' 
    } = {}) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams();
        
        if (options.matchId) params.append('match_id', options.matchId);
        if (options.recruiting) params.append('recruiting', 'true');
        if (options.limit) params.append('limit', options.limit.toString());
        
        const url = `${baseUrl}/api/teams${params.toString() ? `?${params.toString()}` : ''}`;
        
        return apiClient.get<APIResponse>(url, {
            cacheStrategy: options.cacheStrategy || 'stale-while-revalidate',
            maxAge: 60000, // 60초 캐시 (팀 데이터는 상대적으로 안정적)
        });
    },

    async getById(id: string, options: { includeMembers?: boolean } = {}) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams();
        
        if (options.includeMembers) params.append('include', 'members');
        
        const url = `${baseUrl}/api/teams/${id}${params.toString() ? `?${params.toString()}` : ''}`;
        
        return apiClient.get<APIResponse>(url, {
            cacheStrategy: 'cache-first',
            maxAge: 30000,
        });
    },

    async getRecruiting() {
        return this.getAll({ 
            recruiting: true, 
            limit: 4,
            cacheStrategy: 'stale-while-revalidate' 
        });
    },
};

// 대시보드용 배치 API - 한 번의 호출로 모든 데이터 가져오기
export const dashboardAPI = {
    async getHomeData() {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        
        return apiClient.get<APIResponse>(`${baseUrl}/api/dashboard`, {
            cacheStrategy: 'stale-while-revalidate',
            maxAge: 30000, // 30초 캐시
        });
    }
};

// 성능 모니터링 유틸리티
export const performanceUtils = {
    getMetrics() {
        return apiClient.getMetrics();
    },

    logPerformance() {
        const metrics = apiClient.getMetrics();
        console.group('API Performance Metrics');
        console.log(`Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
        console.log(`Average Response Time: ${metrics.avgResponseTime.toFixed(1)}ms`);
        console.log(`Total Requests: ${metrics.requestCount}`);
        console.log(`Cache Hits: ${metrics.cacheHits}`);
        console.log(`Errors: ${metrics.errorCount}`);
        console.groupEnd();
    },

    clearCache(pattern?: string) {
        apiClient.invalidateCache(pattern);
    }
};