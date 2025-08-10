/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.com',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    eslint: {
        dirs: ['src'],
    },
    typescript: {
        // Vercel 빌드 시 타입 에러를 무시하지 않고 엄격하게 체크
        ignoreBuildErrors: false,
        // 타입 체크를 빌드 전에 수행
        tsconfigPath: './tsconfig.json',
    },
    swcMinify: true,
    poweredByHeader: false,
    reactStrictMode: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    // PWA 헤더 설정
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig 