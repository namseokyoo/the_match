// 간단한 PNG 아이콘 생성 스크립트
const fs = require('fs');
const path = require('path');

// 1x1 투명 PNG (placeholder)
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// 간단한 파란색 사각형 PNG 생성 (16x16)
const blue16x16 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABkSURBVDiNY2AYBaNgFAyEgP///88kxhxGRkZGYgz4//8/AzF6cRrAwMDAgNcARkZGRmINwGkAKS6A0f///z+DXQ8jIyMjsQYwEGsAAwMDw////xmIcQUjIyMjsQaMglEwbAQAAKNnC9FH4B0eAAAAAElFTkSuQmCC', 'base64');

// 간단한 파란색 사각형 PNG 생성 (32x32)
const blue32x32 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABySURBVFiF7dYxCsAgEETRp7kgXiDe/x7pBQKCFhZiYSNYWKQIBP5jNzDFwsCbZnZmZmb/RSKRAABQSqkAAKSUXETkzjmXnHMuIrIBYFtrLRhj3ERk11qriMgmhLCFELbee997773WWkspZcYYN8YYNxE5L/0CEYN0sa4UAAAAAElFTkSuQmCC', 'base64');

// 더 큰 아이콘들은 32x32를 복사
const icons = [
  { name: 'favicon-16x16.png', data: blue16x16 },
  { name: 'favicon-32x32.png', data: blue32x32 },
  { name: 'android-chrome-192x192.png', data: blue32x32 }, // 임시로 같은 이미지 사용
  { name: 'android-chrome-512x512.png', data: blue32x32 }, // 임시로 같은 이미지 사용
  { name: 'apple-touch-icon.png', data: blue32x32 } // 임시로 같은 이미지 사용
];

const publicDir = path.join(__dirname, '..', 'public');

// 기존 SVG 파일 삭제
const svgFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.svg'));
svgFiles.forEach(file => {
  if (file !== 'vercel.svg') { // vercel.svg는 유지
    fs.unlinkSync(path.join(publicDir, file));
    console.log(`Deleted ${file}`);
  }
});

// PNG 파일 생성
icons.forEach(icon => {
  const filePath = path.join(publicDir, icon.name);
  fs.writeFileSync(filePath, icon.data);
  console.log(`Created ${icon.name}`);
});

// favicon.ico 생성 (32x32 PNG를 복사)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), blue32x32);
console.log('Created favicon.ico');

console.log('\n✅ PNG 아이콘이 생성되었습니다.');
console.log('⚠️  이것은 임시 아이콘입니다. 실제 로고 이미지로 교체해주세요.');