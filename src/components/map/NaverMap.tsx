'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { MapPin, Navigation, Phone, Clock, Info } from 'lucide-react';

interface NaverMapProps {
  address: string;
  title?: string;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  editable?: boolean;
  height?: string;
  showInfo?: boolean;
  phoneNumber?: string;
  openingHours?: string;
  additionalInfo?: string;
}

declare global {
  interface Window {
    naver: any;
  }
}

export default function NaverMap({
  address,
  title = '경기장 위치',
  onLocationSelect,
  editable = false,
  height = '400px',
  showInfo = true,
  phoneNumber,
  openingHours,
  additionalInfo
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchedAddress, setSearchedAddress] = useState(address);
  const [coordinates, setCoordinates] = useState({ lat: 37.5665, lng: 126.9780 });

  // 주소로 좌표 검색
  const searchAddressToCoordinate = (searchAddress: string) => {
    if (!window.naver) return;

    window.naver.maps.Service.geocode(
      { query: searchAddress },
      (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.ERROR) {
          console.error('주소 검색 실패');
          return;
        }

        if (response.v2.meta.totalCount === 0) {
          alert('검색 결과가 없습니다. 다른 주소를 입력해주세요.');
          return;
        }

        const item = response.v2.addresses[0];
        const newLat = parseFloat(item.y);
        const newLng = parseFloat(item.x);

        setCoordinates({ lat: newLat, lng: newLng });
        
        if (map) {
          const newCenter = new window.naver.maps.LatLng(newLat, newLng);
          map.setCenter(newCenter);
          
          if (marker) {
            marker.setPosition(newCenter);
          }
        }

        if (onLocationSelect) {
          onLocationSelect(newLat, newLng, searchAddress);
        }
      }
    );
  };

  // 지도 초기화
  const initializeMap = () => {
    if (!window.naver || !mapRef.current) return;

    const mapOptions = {
      center: new window.naver.maps.LatLng(coordinates.lat, coordinates.lng),
      zoom: 16,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT
      }
    };

    const newMap = new window.naver.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // 마커 생성
    const newMarker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(coordinates.lat, coordinates.lng),
      map: newMap,
      title: title
    });
    setMarker(newMarker);

    // 정보창 생성
    if (showInfo) {
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0; font-weight: bold;">${title}</h4>
            <p style="margin: 5px 0; color: #666; font-size: 13px;">${address}</p>
            ${phoneNumber ? `<p style="margin: 5px 0; color: #666; font-size: 13px;">📞 ${phoneNumber}</p>` : ''}
            ${openingHours ? `<p style="margin: 5px 0; color: #666; font-size: 13px;">🕐 ${openingHours}</p>` : ''}
          </div>
        `
      });

      window.naver.maps.Event.addListener(newMarker, 'click', () => {
        infoWindow.open(newMap, newMarker);
      });
    }

    // 편집 가능한 경우 클릭 이벤트 추가
    if (editable) {
      window.naver.maps.Event.addListener(newMap, 'click', (e: any) => {
        const latlng = e.coord;
        newMarker.setPosition(latlng);
        
        // 역지오코딩으로 주소 가져오기
        window.naver.maps.Service.reverseGeocode(
          {
            coords: latlng,
            orders: [
              window.naver.maps.Service.OrderType.ADDR,
              window.naver.maps.Service.OrderType.ROAD_ADDR
            ].join(',')
          },
          (status: any, response: any) => {
            if (status === window.naver.maps.Service.Status.ERROR) {
              console.error('역지오코딩 실패');
              return;
            }

            const items = response.v2.results;
            const address = items[0].region.area1.name + ' ' +
                          items[0].region.area2.name + ' ' +
                          items[0].region.area3.name + ' ' +
                          (items[0].land ? items[0].land.number1 + (items[0].land.number2 ? '-' + items[0].land.number2 : '') : '');

            setSearchedAddress(address);
            if (onLocationSelect) {
              onLocationSelect(latlng.lat(), latlng.lng(), address);
            }
          }
        );
      });
    }

    setLoading(false);
  };

  // 네이버 지도 스크립트 로드 후 초기화
  useEffect(() => {
    if (window.naver && window.naver.maps) {
      initializeMap();
    }
  }, []);

  // 주소 변경 시 재검색
  useEffect(() => {
    if (address && window.naver && window.naver.maps) {
      searchAddressToCoordinate(address);
    }
  }, [address]);

  return (
    <>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}&submodules=geocoder`}
        onLoad={initializeMap}
      />
      
      <div className="w-full">
        {/* 검색 바 (편집 가능한 경우) */}
        {editable && (
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchedAddress}
                  onChange={(e) => setSearchedAddress(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchAddressToCoordinate(searchedAddress);
                    }
                  }}
                  placeholder="주소를 입력하세요"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => searchAddressToCoordinate(searchedAddress)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              지도를 클릭하여 위치를 선택하거나 주소를 검색하세요
            </p>
          </div>
        )}

        {/* 지도 영역 */}
        <div className="relative">
          <div
            ref={mapRef}
            style={{ width: '100%', height }}
            className="rounded-lg border border-gray-200"
          />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">지도를 불러오는 중...</p>
              </div>
            </div>
          )}
        </div>

        {/* 경기장 정보 */}
        {showInfo && !editable && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              경기장 정보
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <span className="text-gray-700">{address}</span>
              </div>
              {phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${phoneNumber}`} className="text-blue-600 hover:underline">
                    {phoneNumber}
                  </a>
                </div>
              )}
              {openingHours && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{openingHours}</span>
                </div>
              )}
              {additionalInfo && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <p className="text-gray-700">{additionalInfo}</p>
                </div>
              )}
            </div>
            
            {/* 네이버 지도에서 보기 버튼 */}
            <div className="mt-4">
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                네이버 지도에서 보기
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}