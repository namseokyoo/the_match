import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import TeamChat from '@/components/team/TeamChat';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import type { Database } from '@/types/supabase';

export const metadata: Metadata = {
  title: '팀 채팅 - The Match',
  description: '팀원들과 소통하고 공지사항을 공유하세요',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TeamChatPage({ params }: PageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              팀 채팅을 사용하려면 로그인이 필요합니다.
            </p>
            <Link 
              href="/login" 
              className="inline-block mt-2 text-blue-600 hover:text-blue-700 underline"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 팀 정보 가져오기
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', params.id)
    .single();

  if (teamError || !team) {
    notFound();
  }

  // 팀 멤버 확인 - 현재 사용자가 팀 주장인지 확인
  // Note: 현재는 모든 로그인 사용자가 팀 채팅에 참여 가능하도록 설정
  // TODO: 향후 팀 멤버십 시스템 구현 후 접근 제한 추가
  const isTeamCaptain = team.captain_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link 
            href={`/teams/${params.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            팀 페이지로 돌아가기
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {team.name}
                </h1>
                <p className="text-gray-600">
                  팀원들과 소통하고 중요한 공지사항을 공유하세요
                </p>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <span className="text-sm text-gray-600">팀 채팅</span>
              </div>
            </div>
            
            {isTeamCaptain && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 팀 주장 권한: 공지사항 전송 및 메시지 고정 기능을 사용할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 채팅 컴포넌트 */}
        <div className="bg-white rounded-lg shadow-sm" style={{ height: '600px' }}>
          <TeamChat 
            teamId={params.id} 
            isTeamCaptain={isTeamCaptain}
            currentUserId={user.id}
          />
        </div>

        {/* 도움말 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">채팅 기능</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 실시간 메시지 전송 및 수신</li>
              <li>• 오프라인 시에도 메시지 확인 가능</li>
              <li>• 자신의 메시지 삭제 가능</li>
              <li>• 브라우저 알림 지원</li>
            </ul>
          </div>
          
          {isTeamCaptain && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">주장 권한</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 📢 공지사항 전송 (노란색 강조)</li>
                <li>• 📌 중요 메시지 고정</li>
                <li>• 모든 메시지 관리 권한</li>
                <li>• 팀원 알림 설정 관리</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}