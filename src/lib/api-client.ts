// API 클라이언트 유틸리티
// 재시도 로직, 타임아웃, 캐싱 등을 처리

interface FetchOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

const DEFAULT_TIMEOUT = 10000; // 10초
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1초

class APIClient {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheTimeout = 30000; // 30초 캐시

    async fetchWithRetry(
        url: string,
        options: FetchOptions = {}
    ): Promise<Response> {
        const {
            timeout = DEFAULT_TIMEOUT,
            retries = DEFAULT_RETRIES,
            retryDelay = DEFAULT_RETRY_DELAY,
            ...fetchOptions
        } = options;

        let lastError: Error | null = null;

        for (let i = 0; i <= retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok && response.status >= 500) {
                    // 서버 에러인 경우 재시도
                    throw new Error(`Server error: ${response.status}`);
                }

                return response;
            } catch (error) {
                lastError = error as Error;
                
                // 마지막 시도가 아니면 대기 후 재시도
                if (i < retries) {
                    console.log(`Retry ${i + 1}/${retries} for ${url}`);
                    await new Promise(resolve => 
                        setTimeout(resolve, retryDelay * Math.pow(2, i)) // 지수 백오프
                    );
                } else {
                    console.error(`Failed after ${retries} retries:`, error);
                }
            }
        }

        throw lastError || new Error('Unknown error');
    }

    async get<T>(url: string, options?: FetchOptions): Promise<T> {
        // 캐시 확인
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('Using cached data for:', url);
            return cached.data;
        }

        try {
            const response = await this.fetchWithRetry(url, {
                ...options,
                method: 'GET',
            });

            const data = await response.json();

            // 성공 시 캐시 저장
            if (response.ok) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                });
            }

            return data;
        } catch (error) {
            // 캐시된 데이터가 있으면 에러 시에도 반환 (stale-while-revalidate)
            if (cached) {
                console.warn('Using stale cache due to error:', error);
                return cached.data;
            }
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

export const apiClient = new APIClient();

// 특화된 API 함수들
export const matchAPI = {
    async getAll() {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return apiClient.get<any>(`${baseUrl}/api/matches`);
    },

    async getById(id: string) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return apiClient.get<any>(`${baseUrl}/api/matches/${id}`);
    },
};

export const teamAPI = {
    async getAll() {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return apiClient.get<any>(`${baseUrl}/api/teams`);
    },

    async getById(id: string) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return apiClient.get<any>(`${baseUrl}/api/teams/${id}`);
    },
};