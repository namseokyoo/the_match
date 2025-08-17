'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger' | 'warning' | 'info';
    icon?: React.ReactNode;
    loading?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = '확인',
    message,
    confirmText = '확인',
    cancelText = '취소',
    variant = 'default',
    icon,
    loading = false,
    closeOnOverlayClick = true,
    closeOnEscape = true
}) => {
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, loading, closeOnEscape]);

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: icon || <AlertTriangle className="w-6 h-6 text-red-600" />,
                    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
                    iconContainer: 'bg-red-100'
                };
            case 'warning':
                return {
                    icon: icon || <AlertTriangle className="w-6 h-6 text-yellow-600" />,
                    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    iconContainer: 'bg-yellow-100'
                };
            case 'info':
                return {
                    icon: icon || <Info className="w-6 h-6 text-blue-600" />,
                    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
                    iconContainer: 'bg-blue-100'
                };
            default:
                return {
                    icon: icon || <HelpCircle className="w-6 h-6 text-gray-600" />,
                    confirmButton: 'bg-gray-900 hover:bg-gray-800 text-white',
                    iconContainer: 'bg-gray-100'
                };
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnOverlayClick && !loading) {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!loading) {
            onConfirm();
        }
    };

    const styles = getVariantStyles();

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center px-4',
                'transition-all duration-300',
                isVisible ? 'opacity-100' : 'opacity-0'
            )}
            onClick={handleOverlayClick}
        >
            {/* 오버레이 */}
            <div 
                className={cn(
                    'absolute inset-0 bg-black transition-opacity duration-300',
                    isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
                )}
            />

            {/* 모달 콘텐츠 */}
            <div
                className={cn(
                    'relative bg-white rounded-lg shadow-xl max-w-md w-full',
                    'transform transition-all duration-300',
                    isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    {/* 아이콘과 제목 */}
                    <div className="flex items-start">
                        <div className={cn(
                            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                            styles.iconContainer
                        )}>
                            {styles.icon}
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="mt-6 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg',
                                'border border-gray-300 bg-white text-gray-700',
                                'hover:bg-gray-50 transition-colors',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg',
                                'transition-colors',
                                styles.confirmButton,
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'min-w-[80px]'
                            )}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg 
                                        className="animate-spin h-4 w-4" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24"
                                    >
                                        <circle 
                                            className="opacity-25" 
                                            cx="12" 
                                            cy="12" 
                                            r="10" 
                                            stroke="currentColor" 
                                            strokeWidth="4"
                                        />
                                        <path 
                                            className="opacity-75" 
                                            fill="currentColor" 
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                </span>
                            ) : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

// 뒤로가기 전용 확인 모달
export const BackConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    hasUnsavedChanges?: boolean;
}> = ({ isOpen, onClose, onConfirm, hasUnsavedChanges = true }) => {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={hasUnsavedChanges ? "저장하지 않은 변경사항이 있습니다" : "페이지를 나가시겠습니까?"}
            message={
                hasUnsavedChanges 
                    ? "변경사항을 저장하지 않고 나가면 모든 변경사항이 사라집니다. 정말 나가시겠습니까?"
                    : "현재 페이지를 나가시겠습니까?"
            }
            confirmText="나가기"
            cancelText="머무르기"
            variant="warning"
        />
    );
};

// 삭제 확인 모달
export const DeleteConfirmModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
    loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, itemName = "이 항목", loading }) => {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="삭제 확인"
            message={`${itemName}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            confirmText="삭제"
            cancelText="취소"
            variant="danger"
            loading={loading}
        />
    );
};

export default ConfirmModal;