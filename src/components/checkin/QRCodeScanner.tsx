'use client';

import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';

interface QRCodeScannerProps {
  onScan: (data: any) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export default function QRCodeScanner({ onScan, onClose, isOpen }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      initializeScanner();
    }

    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      // 카메라 권한 확인
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);

      if (!hasCamera) {
        showToast('카메라를 사용할 수 없습니다', 'error');
        return;
      }

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => handleScanSuccess(result),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      setScanner(qrScanner);
      await qrScanner.start();
      setScanning(true);
    } catch (error) {
      console.error('스캐너 초기화 실패:', error);
      showToast('카메라 접근 권한이 필요합니다', 'error');
      setHasCamera(false);
    }
  };

  const handleScanSuccess = (result: QrScanner.ScanResult) => {
    try {
      // QR 코드 데이터 파싱
      const data = JSON.parse(result.data);
      
      // 유효성 검증
      if (!data.type || !data.matchId) {
        throw new Error('유효하지 않은 QR 코드입니다');
      }

      // 타임스탬프 확인 (24시간 이내)
      const maxAge = 24 * 60 * 60 * 1000; // 24시간
      if (Date.now() - data.timestamp > maxAge) {
        throw new Error('만료된 QR 코드입니다');
      }

      setScanResult(data);
      onScan(data);
      
      // 스캔 성공 후 잠시 대기
      if (scanner) {
        scanner.pause();
      }

      showToast('체크인 성공!', 'success');

      // 2초 후 자동으로 닫기
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('QR 코드 처리 실패:', error);
      showToast(error instanceof Error ? error.message : 'QR 코드 인식에 실패했습니다', 'error');
      
      // 실패 시 다시 스캔 시작
      setTimeout(() => {
        if (scanner) {
          scanner.start();
        }
      }, 2000);
    }
  };

  const handleClose = () => {
    if (scanner) {
      scanner.destroy();
      setScanner(null);
    }
    setScanning(false);
    setScanResult(null);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="bg-white rounded-t-2xl p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">QR 코드 스캔</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스캐너 영역 */}
        <div className="bg-black relative aspect-square">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
              />
              
              {/* 스캔 가이드 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>

              {/* 스캔 결과 오버레이 */}
              {scanResult && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-6 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-semibold">체크인 완료!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {scanResult.type === 'match' && '경기 체크인이 완료되었습니다'}
                      {scanResult.type === 'team' && '팀 체크인이 완료되었습니다'}
                      {scanResult.type === 'player' && '선수 체크인이 완료되었습니다'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-3 text-yellow-400" />
                <p className="text-lg font-medium">카메라를 사용할 수 없습니다</p>
                <p className="text-sm mt-2 text-gray-300">
                  카메라 권한을 확인해주세요
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="bg-white rounded-b-2xl p-4">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Camera className="w-4 h-4 mr-2" />
            <span>
              {scanning ? 'QR 코드를 스캔 영역에 맞춰주세요' : '카메라를 준비 중입니다...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}