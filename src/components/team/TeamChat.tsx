'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Send, Bell, BellOff, MoreVertical, Trash2, Pin, Users } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import type { Database } from '@/types/supabase';

interface TeamMessage {
  id: string;
  team_id: string;
  user_id: string;
  message: string;
  is_announcement: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    profile?: {
      username?: string;
      avatar_url?: string;
    };
  };
}

interface TeamChatProps {
  teamId: string;
  isTeamCaptain?: boolean;
  currentUserId?: string;
}

export default function TeamChat({ teamId, isTeamCaptain = false, currentUserId }: TeamChatProps) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient<Database>();

  // 메시지 목록 불러오기
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      // Since we don't have user details, we'll use user_id as a simple identifier
      const transformedMessages = data?.map(msg => ({
        ...msg,
        user: {
          id: msg.user_id,
          email: `user_${msg.user_id.substring(0, 8)}@team.com`, // Placeholder email
          profile: {
            username: `User ${msg.user_id.substring(0, 8)}`, // Use first 8 chars of UUID
            avatar_url: undefined
          }
        }
      })) || [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showToast('메시지를 불러오는데 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, teamId]);

  // 실시간 구독 설정
  useEffect(() => {
    fetchMessages();

    // 실시간 메시지 구독
    const channel = supabase
      .channel(`team-messages:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        async (payload) => {
          // Transform new message to match our interface
          const newMsg = {
            ...payload.new,
            user: {
              id: payload.new.user_id,
              email: `user_${payload.new.user_id.substring(0, 8)}@team.com`,
              profile: {
                username: `User ${payload.new.user_id.substring(0, 8)}`,
                avatar_url: undefined
              }
            }
          } as TeamMessage;

          setMessages(prev => [...prev, newMsg]);
          
          // 새 메시지 알림
          if (payload.new.user_id !== currentUserId) {
            if (payload.new.is_announcement) {
              showToast('📢 새로운 공지사항이 있습니다', 'info');
            }
            
            // 브라우저 알림 (권한이 있을 경우)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('The Match - 새 메시지', {
                body: payload.new.is_announcement ? '📢 새로운 공지사항' : '새로운 메시지가 도착했습니다',
                icon: '/icon-192x192.png'
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new } as TeamMessage
                : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, teamId, currentUserId, fetchMessages]);

  // 메시지 전송
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          user_id: currentUserId,
          message: newMessage.trim(),
          is_announcement: isAnnouncement,
          is_pinned: false
        });

      if (error) throw error;

      setNewMessage('');
      setIsAnnouncement(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('메시지 전송에 실패했습니다', 'error');
    } finally {
      setSending(false);
    }
  };

  // 메시지 삭제
  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      showToast('메시지가 삭제되었습니다', 'success');
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('메시지 삭제에 실패했습니다', 'error');
    }
  };

  // 메시지 고정/해제
  const togglePin = async (messageId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('team_messages')
        .update({ is_pinned: !currentPinned })
        .eq('id', messageId);

      if (error) throw error;
      showToast(currentPinned ? '고정이 해제되었습니다' : '메시지가 고정되었습니다', 'success');
    } catch (error) {
      console.error('Error toggling pin:', error);
      showToast('작업에 실패했습니다', 'error');
    }
  };

  // 스크롤 최하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 고정된 메시지와 일반 메시지 분리
  const pinnedMessages = messages.filter(msg => msg.is_pinned);
  const regularMessages = messages.filter(msg => !msg.is_pinned);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">팀 채팅</h3>
          </div>
          <span className="text-sm text-gray-500">
            {messages.length}개의 메시지
          </span>
        </div>
      </div>

      {/* 고정된 메시지 */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <div className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
            <Pin className="w-3 h-3" />
            고정된 메시지
          </div>
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="py-1 text-sm text-blue-900">
              {msg.is_announcement && <span className="font-medium">[공지] </span>}
              {msg.message}
            </div>
          ))}
        </div>
      )}

      {/* 메시지 목록 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ maxHeight: '500px' }}
      >
        {regularMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 메시지가 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          regularMessages.map((msg) => {
            const isOwn = msg.user_id === currentUserId;
            const canModerate = isOwn || isTeamCaptain;

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                  {/* 사용자 정보 */}
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {msg.user.profile?.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {msg.user.profile?.username || msg.user.email?.split('@')[0]}
                      </span>
                    </div>
                  )}

                  {/* 메시지 내용 */}
                  <div className="relative group">
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        msg.is_announcement
                          ? 'bg-yellow-100 border border-yellow-300'
                          : isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.is_announcement && (
                        <div className={`flex items-center gap-1 mb-1 ${
                          isOwn ? 'text-yellow-900' : 'text-yellow-700'
                        }`}>
                          <Bell className="w-3 h-3" />
                          <span className="text-xs font-medium">공지</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>

                    {/* 옵션 메뉴 */}
                    {canModerate && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowOptions(showOptions === msg.id ? null : msg.id)}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {showOptions === msg.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            {isTeamCaptain && (
                              <button
                                onClick={() => {
                                  togglePin(msg.id, msg.is_pinned);
                                  setShowOptions(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pin className="w-4 h-4" />
                                {msg.is_pinned ? '고정 해제' : '메시지 고정'}
                              </button>
                            )}
                            {isOwn && (
                              <button
                                onClick={() => {
                                  deleteMessage(msg.id);
                                  setShowOptions(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                삭제
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 시간 표시 */}
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : ''}`}>
                    {format(new Date(msg.created_at), 'HH:mm', { locale: ko })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          {isTeamCaptain && (
            <button
              type="button"
              onClick={() => setIsAnnouncement(!isAnnouncement)}
              className={`p-2 rounded-lg transition-colors ${
                isAnnouncement 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={isAnnouncement ? '공지 모드 켜짐' : '공지로 전송'}
            >
              {isAnnouncement ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
          )}
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAnnouncement ? "공지사항을 입력하세요..." : "메시지를 입력하세요..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={sending || !currentUserId}
          />
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !currentUserId}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {isAnnouncement && (
          <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 px-3 py-1 rounded">
            📢 공지사항으로 전송됩니다. 모든 팀원에게 알림이 갑니다.
          </div>
        )}
      </form>
    </div>
  );
}