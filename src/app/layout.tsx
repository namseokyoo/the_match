import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/ui/Navbar';
import { ErrorBoundary } from '@/components/ui';
import { NotificationProvider } from '@/contexts/NotificationContext';
import './globals.css';

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
                    <NotificationProvider>
                        <div className="min-h-screen bg-background font-sans antialiased">
                            <div className="relative flex min-h-screen flex-col">
                                {/* 네비게이션 바 */}
                                <Navbar />

                                {/* 메인 콘텐츠 */}
                                <main className="flex-1">
                                    <ErrorBoundary>
                                        {children}
                                    </ErrorBoundary>
                                </main>
                            </div>
                        </div>
                    </NotificationProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
} 