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
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
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
    // 보안 헤더 및 PWA 설정
    async headers() {
        const ContentSecurityPolicy = `
            default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline' *.supabase.co *.supabase.com https://cdn.jsdelivr.net;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com data:;
            img-src 'self' *.supabase.co *.supabase.com picsum.photos data: blob: https:;
            media-src 'self' *.supabase.co *.supabase.com;
            connect-src 'self' *.supabase.co *.supabase.com wss://*.supabase.co wss://*.supabase.com https://api.github.com;
            frame-src 'self' *.supabase.co *.supabase.com;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests;
        `.replace(/\s{2,}/g, ' ').trim();

        const securityHeaders = [
            {
                key: 'X-DNS-Prefetch-Control',
                value: 'on'
            },
            {
                key: 'X-XSS-Protection',
                value: '1; mode=block'
            },
            {
                key: 'X-Frame-Options',
                value: 'SAMEORIGIN'
            },
            {
                key: 'X-Content-Type-Options',
                value: 'nosniff'
            },
            {
                key: 'Referrer-Policy',
                value: 'strict-origin-when-cross-origin'
            },
            {
                key: 'Content-Security-Policy',
                value: ContentSecurityPolicy
            },
            {
                key: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
            },
            {
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload'
            }
        ];

        return [
            {
                // 모든 페이지에 보안 헤더 적용
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                // Service Worker를 위한 헤더
                source: '/sw.js',
                headers: [
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                ],
            },
            {
                // 정적 자산에 대한 캐싱 헤더
                source: '/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig 