'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, RefreshCw, Check } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

interface QRCodeGeneratorProps {
  matchId: string;
  teamId?: string;
  playerId?: string;
  type: 'match' | 'team' | 'player';
  title: string;
  subtitle?: string;
}

export default function QRCodeGenerator({
  matchId,
  teamId,
  playerId,
  type,
  title,
  subtitle
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [matchId, teamId, playerId, type]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      // QR 코드에 포함될 데이터
      const qrData = {
        type,
        matchId,
        teamId,
        playerId,
        timestamp: Date.now(),
        checkInUrl: `${window.location.origin}/checkin`,
      };

      // QR 코드 생성
      const url = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });

      setQrCodeUrl(url);
    } catch (error) {
      console.error('QR 코드 생성 실패:', error);
      showToast('QR 코드 생성에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `checkin-qr-${type}-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();

    showToast('QR 코드가 다운로드되었습니다', 'success');
  };

  const handleRefresh = () => {
    generateQRCode();
    showToast('QR 코드가 새로 생성되었습니다', 'success');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : qrCodeUrl ? (
        <>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <img
                src={qrCodeUrl}
                alt="체크인 QR 코드"
                className="w-64 h-64"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Check className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">체크인 방법</p>
                  <ol className="mt-2 space-y-1 text-blue-800">
                    <li>1. 참가자가 The Match 앱을 엽니다</li>
                    <li>2. 체크인 메뉴에서 QR 스캔을 선택합니다</li>
                    <li>3. 이 QR 코드를 스캔합니다</li>
                    <li>4. 자동으로 체크인이 완료됩니다</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>QR 코드 다운로드</span>
              </button>
              
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">QR 코드를 생성할 수 없습니다</p>
        </div>
      )}
    </div>
  );
}