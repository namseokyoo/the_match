import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import MobileNavbar from '@/components/ui/MobileNavbar';
import MobileNav from '@/components/layout/MobileNav';
import { ErrorBoundary } from '@/components/ui';
import { ToastContainer } from '@/components/ui/Toast';
import ClientProviders from '@/components/providers/ClientProviders';
import PWAProvider from '@/components/pwa/PWAProvider';
import GlobalLoader from '@/components/ui/GlobalLoader';
import Breadcrumb from '@/components/ui/Breadcrumb';
import './globals.css';

// ConfigStatus는 클라이언트 사이드에서만 렌더링
const ConfigStatus = dynamic(
    () => import('@/components/ui/ConfigStatus'),
    { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'The Match - Tournament Management Platform',
    description: 'Create brackets, manage teams, and organize various sports competitions with ease.',
    keywords: ['tournament', 'bracket', 'sports', 'competition', 'team management'],
    authors: [{ name: 'The Match Team' }],
    creator: 'The Match Team',
    publisher: 'The Match Team',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('http://localhost:3000'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'The Match - Tournament Management Platform',
        description: 'Create brackets, manage teams, and organize various sports competitions with ease.',
        url: 'http://localhost:3000',
        siteName: 'The Match',
        locale: 'ko_KR',
        type: 'website',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'The Match - Tournament Management Platform',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'The Match - Tournament Management Platform',
        description: 'Create brackets, manage teams, and organize various sports competitions with ease.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
    verification: {
        google: 'google-site-verification-code',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className={inter.className}>
                <ErrorBoundary>
                    <ClientProviders>
                        <PWAProvider>
                            {/* 글로벌 로더 */}
                            <GlobalLoader />
                            
                            {/* 모바일 사이즈 고정 래퍼 */}
                            <div className="mobile-wrapper">
                                <div className="mobile-container">
                                    <div className="relative flex min-h-screen flex-col">
                                        {/* 네비게이션 바 */}
                                        <MobileNavbar />
                                        
                                        {/* 브레드크럼 */}
                                        <Breadcrumb />

                                        {/* 메인 콘텐츠 */}
                                        <main className="flex-1 pb-16">
                                            <ErrorBoundary>
                                                {children}
                                            </ErrorBoundary>
                                        </main>
                                    </div>
                                </div>
                                
                                {/* 모바일 하단 네비게이션 - 컨테이너 기준으로 위치 */}
                                <MobileNav />
                            </div>

                            {/* Toast 컨테이너 */}
                            <ToastContainer />

                            {/* 개발 환경에서 설정 상태 표시 */}
                            {process.env.NODE_ENV === 'development' && (
                                <ConfigStatus />
                            )}
                        </PWAProvider>
                    </ClientProviders>
                </ErrorBoundary>
            </body>
        </html>
    );
} 