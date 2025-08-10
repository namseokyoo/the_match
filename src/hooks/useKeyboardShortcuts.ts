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

// Shortcut display component
import React, { useState } from 'react';
import { Command } from 'lucide-react';

export const ShortcutHelp: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useKeyboardShortcuts([
        {
            ...appShortcuts.help,
            handler: () => setIsOpen(!isOpen),
        },
    ]);

    if (!isOpen) return null;

    const allShortcuts = [
        { title: '일반', shortcuts: commonShortcuts },
        { title: '앱', shortcuts: appShortcuts },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">키보드 단축키</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <span className="text-sm">ESC</span>
                    </button>
                </div>

                {allShortcuts.map(group => (
                    <div key={group.title} className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3">
                            {group.title}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(group.shortcuts).map(([key, shortcut]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                                >
                                    <span className="text-sm text-gray-700">
                                        {shortcut.description}
                                    </span>
                                    <kbd className="flex items-center space-x-1">
                                        {shortcut.ctrl && (
                                            <>
                                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                    Ctrl
                                                </span>
                                                <span className="text-xs">+</span>
                                            </>
                                        )}
                                        {shortcut.alt && (
                                            <>
                                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                    Alt
                                                </span>
                                                <span className="text-xs">+</span>
                                            </>
                                        )}
                                        {shortcut.shift && (
                                            <>
                                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                    Shift
                                                </span>
                                                <span className="text-xs">+</span>
                                            </>
                                        )}
                                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                            {shortcut.key}
                                        </span>
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default useKeyboardShortcuts;