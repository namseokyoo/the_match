'use client';

import { useEffect, useCallback, useRef } from 'react';

interface Shortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    handler: (e: KeyboardEvent) => void;
    description?: string;
    preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
    scope?: 'global' | 'local';
}

export function useKeyboardShortcuts(
    shortcuts: Shortcut[],
    options: UseKeyboardShortcutsOptions = {}
) {
    const { enabled = true, scope = 'global' } = options;
    const elementRef = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Check if user is typing in an input field
        const target = e.target as HTMLElement;
        const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName) || 
                        target.contentEditable === 'true';

        shortcuts.forEach(shortcut => {
            // Skip if user is typing (unless explicitly allowed)
            if (isTyping && !shortcut.meta && !shortcut.ctrl) return;

            const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                              e.code.toLowerCase() === shortcut.key.toLowerCase();
            
            const ctrlMatches = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
            const altMatches = shortcut.alt ? e.altKey : !e.altKey;
            const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey;
            const metaMatches = shortcut.meta ? e.metaKey : !e.metaKey;

            if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
                if (shortcut.preventDefault !== false) {
                    e.preventDefault();
                }
                shortcut.handler(e);
            }
        });
    }, [shortcuts, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const element = scope === 'local' && elementRef.current 
            ? elementRef.current 
            : window;

        element.addEventListener('keydown', handleKeyDown as any);

        return () => {
            element.removeEventListener('keydown', handleKeyDown as any);
        };
    }, [handleKeyDown, enabled, scope]);

    return elementRef;
}

// Common shortcuts
export const commonShortcuts = {
    search: { key: '/', description: '검색' },
    escape: { key: 'Escape', description: '닫기/취소' },
    save: { key: 's', ctrl: true, description: '저장' },
    new: { key: 'n', ctrl: true, description: '새로 만들기' },
    delete: { key: 'Delete', description: '삭제' },
    selectAll: { key: 'a', ctrl: true, description: '모두 선택' },
    undo: { key: 'z', ctrl: true, description: '실행 취소' },
    redo: { key: 'z', ctrl: true, shift: true, description: '다시 실행' },
    copy: { key: 'c', ctrl: true, description: '복사' },
    paste: { key: 'v', ctrl: true, description: '붙여넣기' },
    cut: { key: 'x', ctrl: true, description: '잘라내기' },
};

// App-specific shortcuts
export const appShortcuts = {
    createMatch: { key: 'n', ctrl: true, alt: true, description: '새 경기 만들기' },
    createTeam: { key: 't', ctrl: true, alt: true, description: '새 팀 만들기' },
    viewMatches: { key: '1', alt: true, description: '경기 목록 보기' },
    viewTeams: { key: '2', alt: true, description: '팀 목록 보기' },
    viewProfile: { key: '3', alt: true, description: '프로필 보기' },
    toggleSidebar: { key: 'b', ctrl: true, description: '사이드바 토글' },
    quickSearch: { key: 'k', ctrl: true, description: '빠른 검색' },
    help: { key: '?', shift: true, description: '도움말' },
};

export default useKeyboardShortcuts;