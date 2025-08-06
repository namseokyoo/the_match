// 전역 인증 상태 관리
// React 컴포넌트 외부에서 관리하여 페이지 전환 시에도 유지

let globalAuthInitialized = false;
let globalAuthLoading = true;

export const getAuthState = () => ({
    initialized: globalAuthInitialized,
    loading: globalAuthLoading,
});

export const setAuthInitialized = (value: boolean) => {
    globalAuthInitialized = value;
    if (value) {
        globalAuthLoading = false;
    }
};

export const setAuthLoading = (value: boolean) => {
    globalAuthLoading = value;
};

// 초기 로드 확인
export const isInitialLoad = () => {
    return !globalAuthInitialized;
};