import { Suspense } from 'react';
import PlayersClient from './PlayersClient';

export default function PlayersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-match-blue"></div>
            </div>
        }>
            <PlayersClient />
        </Suspense>
    );
}