import { Suspense } from 'react';
import MatchesClient from './MatchesClient';

export default function MatchesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        }>
            <MatchesClient />
        </Suspense>
    );
}