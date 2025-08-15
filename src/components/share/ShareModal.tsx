'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Download, Check, MessageCircle, Link } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import { Match, Team } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
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
  };
  generatedImage: string | null;
  onGenerateImage: () => Promise<string | null>;
}

export default function ShareModal({
  isOpen,
  onClose,
  result,
  generatedImage,
  onGenerateImage
}: ShareModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(generatedImage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateImage = useCallback(async () => {
    if (generatedImage) {
      setImageUrl(generatedImage);
      return;
    }

    setIsGenerating(true);
    const image = await onGenerateImage();
    setImageUrl(image);
    setIsGenerating(false);
  }, [generatedImage, onGenerateImage]);

  useEffect(() => {
    if (isOpen && !imageUrl) {
      generateImage();
    }
  }, [isOpen, imageUrl, generateImage]);

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `${result.match.title}-result.png`;
    link.href = imageUrl;
    link.click();

    showToast('이미지가 다운로드되었습니다', 'success');
  };

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

  const shareToKakao = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      const Kakao = (window as any).Kakao;
      
      if (!Kakao.isInitialized()) {
        // 카카오 API 키는 실제 키로 교체 필요
        Kakao.init('YOUR_KAKAO_API_KEY');
      }

      Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `${result.match.title} 결과`,
          description: result.winner ? `🏆 우승: ${result.winner.name}` : '경기 결과를 확인하세요!',
          imageUrl: imageUrl || 'https://the-match.vercel.app/og-image.png',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '결과 보기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else {
      showToast('카카오톡 공유 기능을 사용할 수 없습니다', 'error');
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(
      result.winner 
        ? `🏆 ${result.match.title} 우승: ${result.winner.name}` 
        : `${result.match.title} 결과`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">결과 공유하기</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 이미지 미리보기 */}
        <div className="p-4">
          {isGenerating ? (
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">이미지 생성 중...</p>
              </div>
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt="경기 결과"
              width={400}
              height={600}
              className="w-full rounded-lg shadow-md"
              unoptimized={true}
            />
          ) : (
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">이미지를 생성할 수 없습니다</p>
            </div>
          )}
        </div>

        {/* 공유 옵션 */}
        <div className="p-4 space-y-3">
          {/* SNS 공유 버튼들 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={shareToKakao}
              className="flex flex-col items-center gap-2 p-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-xs font-medium">카카오톡</span>
            </button>
            
            <button
              onClick={shareToFacebook}
              className="flex flex-col items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="font-bold text-lg">f</span>
              </div>
              <span className="text-xs font-medium">페이스북</span>
            </button>
            
            <button
              onClick={shareToTwitter}
              className="flex flex-col items-center gap-2 p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="font-bold">𝕏</span>
              </div>
              <span className="text-xs font-medium">X (트위터)</span>
            </button>
          </div>

          {/* 다운로드 & 링크 복사 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={!imageUrl}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">이미지 저장</span>
            </button>
            
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">복사됨!</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  <span className="text-sm font-medium">링크 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 공유 텍스트 */}
        <div className="p-4 border-t">
          <p className="text-sm text-gray-600">
            {result.winner 
              ? `🏆 ${result.match.title} 우승: ${result.winner.name}`
              : `${result.match.title} 결과를 공유해보세요!`}
          </p>
        </div>
      </div>
    </div>
  );
}