'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import ShareableResultCard from './ShareableResultCard';
import ShareModal from './ShareModal';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import { Match, Team } from '@/types';

interface ShareButtonProps {
  match: Match;
  winner?: Team;
  runnerUp?: Team;
  scores?: { [teamId: string]: number };
  mvp?: {
    name: string;
    team: string;
    stats?: string;
  };
  topScorer?: {
    name: string;
    team: string;
    goals: number;
  };
  className?: string;
}

export default function ShareButton({
  match,
  winner,
  runnerUp,
  scores,
  mvp,
  topScorer,
  className = ''
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 이미지 생성
  const generateImage = async () => {
    if (!cardRef.current) return null;

    try {
      setIsGenerating(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imageData = canvas.toDataURL('image/png');
      setGeneratedImage(imageData);
      return imageData;
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      showToast('이미지 생성에 실패했습니다', 'error');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Web Share API를 사용한 공유
  const handleNativeShare = async () => {
    if (!navigator.share) {
      setIsModalOpen(true);
      return;
    }

    try {
      const imageUrl = await generateImage();
      if (!imageUrl) return;

      // DataURL을 Blob으로 변환
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'match-result.png', { type: 'image/png' });

      await navigator.share({
        title: `${match.title} 결과`,
        text: winner ? `🏆 우승: ${winner.name}` : '경기 결과를 확인하세요!',
        files: [file],
        url: window.location.href
      });

      showToast('공유되었습니다!', 'success');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('공유 실패:', error);
        setIsModalOpen(true);
      }
    }
  };

  // 이미지 다운로드
  const handleDownload = async () => {
    const imageUrl = generatedImage || await generateImage();
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `${match.title}-result.png`;
    link.href = imageUrl;
    link.click();

    showToast('이미지가 다운로드되었습니다', 'success');
  };

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('링크가 복사되었습니다', 'success');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('링크 복사 실패:', error);
      showToast('링크 복사에 실패했습니다', 'error');
    }
  };

  const result = {
    match,
    winner,
    runnerUp,
    scores,
    mvp,
    topScorer
  };

  return (
    <>
      {/* 공유 버튼 */}
      <button
        onClick={handleNativeShare}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
        disabled={isGenerating}
      >
        <Share2 className="w-4 h-4" />
        <span>{isGenerating ? '생성 중...' : '결과 공유'}</span>
      </button>

      {/* 추가 공유 옵션 버튼들 */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          disabled={isGenerating}
        >
          <Download className="w-3 h-3" />
          <span>다운로드</span>
        </button>
        
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-600" />
              <span className="text-green-600">복사됨!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>링크 복사</span>
            </>
          )}
        </button>
      </div>

      {/* 숨겨진 캔버스용 카드 */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <ShareableResultCard ref={cardRef} result={result} />
      </div>

      {/* 공유 모달 */}
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={result}
        generatedImage={generatedImage}
        onGenerateImage={generateImage}
      />
    </>
  );
}