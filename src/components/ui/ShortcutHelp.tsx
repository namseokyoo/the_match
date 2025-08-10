'use client';

import React, { useState } from 'react';
import { useKeyboardShortcuts, commonShortcuts, appShortcuts } from '@/hooks/useKeyboardShortcuts';

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
                            {Object.entries(group.shortcuts).map(([key, shortcut]: [string, any]) => (
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

export default ShortcutHelp;