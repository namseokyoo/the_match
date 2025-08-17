'use client';

import React, { useState, useRef, DragEvent, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableItem {
    id: string;
    [key: string]: unknown;
}

interface DragAndDropProps<T extends DraggableItem> {
    items: T[];
    onReorder: (items: T[]) => void;
    renderItem: (_item: T, _index: number, _isDragging: boolean) => ReactNode;
    className?: string;
    direction?: 'vertical' | 'horizontal';
    handle?: boolean;
}

export function DragAndDrop<T extends DraggableItem>({
    items,
    onReorder,
    renderItem,
    className = '',
    direction = 'vertical',
    handle = true,
}: DragAndDropProps<T>) {
    const [draggedItem, setDraggedItem] = useState<T | null>(null);
    const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
    const dragNodeRef = useRef<HTMLDivElement | null>(null);
    const dragOverNodeRef = useRef<HTMLDivElement | null>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, item: T, _index: number) => {
        setDraggedItem(item);
        dragNodeRef.current = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        
        // Add dragging class after a short delay to avoid visual glitch
        setTimeout(() => {
            if (dragNodeRef.current) {
                dragNodeRef.current.classList.add('opacity-50');
            }
        }, 0);
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>, _index: number) => {
        e.preventDefault();
        if (draggedItem && items[_index].id !== draggedItem.id) {
            setDraggedOverIndex(_index);
            dragOverNodeRef.current = e.currentTarget;
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnd = () => {
        if (dragNodeRef.current) {
            dragNodeRef.current.classList.remove('opacity-50');
        }
        
        if (draggedItem && draggedOverIndex !== null) {
            const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
            
            if (draggedIndex !== draggedOverIndex) {
                const newItems = [...items];
                const draggedContent = newItems[draggedIndex];
                
                // Remove dragged item
                newItems.splice(draggedIndex, 1);
                
                // Insert at new position
                newItems.splice(draggedOverIndex, 0, draggedContent);
                
                onReorder(newItems);
            }
        }
        
        // Reset state
        setDraggedItem(null);
        setDraggedOverIndex(null);
        dragNodeRef.current = null;
        dragOverNodeRef.current = null;
    };

    const containerClass = direction === 'horizontal' 
        ? 'flex flex-row space-x-4' 
        : 'flex flex-col space-y-2';

    return (
        <div className={`${containerClass} ${className}`}>
            {items.map((item, index) => (
                <div
                    key={item.id}
                    draggable={!handle}
                    onDragStart={(e) => !handle && handleDragStart(e, item, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    className={`
                        relative transition-all duration-200
                        ${draggedOverIndex === index ? 'scale-105' : ''}
                        ${draggedItem?.id === item.id ? 'cursor-grabbing' : handle ? '' : 'cursor-grab'}
                    `}
                >
                    {handle && (
                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, item, index)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                        >
                            <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div className={handle ? 'pl-8' : ''}>
                        {renderItem(item, index, draggedItem?.id === item.id)}
                    </div>
                    {draggedOverIndex === index && (
                        <div 
                            className={`
                                absolute bg-blue-500 opacity-50
                                ${direction === 'horizontal' 
                                    ? 'w-1 h-full -left-2 top-0' 
                                    : 'h-1 w-full left-0 -top-2'}
                            `}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// Sortable List Component
interface SortableListProps<T extends DraggableItem> {
    items: T[];
    onReorder: (items: T[]) => void;
    renderItem: (_item: T) => ReactNode;
    className?: string;
}

export function SortableList<T extends DraggableItem>({
    items,
    onReorder,
    renderItem,
    className = '',
}: SortableListProps<T>) {
    return (
        <DragAndDrop
            items={items}
            onReorder={onReorder}
            renderItem={(item) => (
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {renderItem(item)}
                </div>
            )}
            className={className}
            handle={true}
        />
    );
}

// Kanban Board Component
interface KanbanColumn<T extends DraggableItem> {
    id: string;
    title: string;
    items: T[];
}

interface KanbanBoardProps<T extends DraggableItem> {
    columns: KanbanColumn<T>[];
    onItemMove: (_itemId: string, _fromColumn: string, _toColumn: string, _newIndex: number) => void;
    renderItem: (_item: T) => ReactNode;
    className?: string;
}

export function KanbanBoard<T extends DraggableItem>({
    columns,
    onItemMove,
    renderItem,
    className = '',
}: KanbanBoardProps<T>) {
    const [draggedItem, setDraggedItem] = useState<{ item: T; columnId: string } | null>(null);

    const handleDragStart = (item: T, columnId: string) => {
        setDraggedItem({ item, columnId });
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetColumnId: string, targetIndex: number) => {
        e.preventDefault();
        if (draggedItem) {
            onItemMove(
                draggedItem.item.id,
                draggedItem.columnId,
                targetColumnId,
                targetIndex
            );
            setDraggedItem(null);
        }
    };

    return (
        <div className={`flex space-x-4 ${className}`}>
            {columns.map(column => (
                <div
                    key={column.id}
                    className="flex-1 bg-gray-50 rounded-lg p-4"
                >
                    <h3 className="font-semibold text-gray-900 mb-4">{column.title}</h3>
                    <div
                        className="space-y-2 min-h-[200px]"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, column.id, column.items.length)}
                    >
                        {column.items.map((item, index) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item, column.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.stopPropagation();
                                    handleDrop(e, column.id, index);
                                }}
                                className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                            >
                                {renderItem(item)}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default DragAndDrop;