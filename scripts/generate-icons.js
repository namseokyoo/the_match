// PWA 아이콘 생성 스크립트
// 단색 아이콘을 생성합니다 (실제 프로젝트에서는 로고 이미지를 사용해야 합니다)

const fs = require('fs');
const path = require('path');

// 간단한 SVG 아이콘 생성
const createSVG = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#3B82F6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">TM</text>
</svg>`;
};

// PNG 생성을 위한 Canvas 설정 (Node.js에서는 sharp나 canvas 패키지가 필요하지만, 여기서는 SVG로 대체)
const createPlaceholderIcon = (filename, size) => {
  const svg = createSVG(size);
  const svgPath = path.join(__dirname, '..', 'public', filename.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svg);
  console.log(`Created ${filename} as SVG placeholder`);
};

// 아이콘 생성
const icons = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

// public 디렉토리 확인
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 각 아이콘 생성
icons.forEach(icon => {
  createPlaceholderIcon(icon.name, icon.size);
});

// 실제 PNG를 생성하기 위한 HTML (브라우저에서 실행)
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
</head>
<body>
  <h1>PWA Icon Generator</h1>
  <p>아래 캔버스를 우클릭하여 이미지로 저장하세요:</p>
  ${icons.map(icon => `
    <div style="margin: 20px;">
      <h3>${icon.name} (${icon.size}x${icon.size})</h3>
      <canvas id="canvas-${icon.size}" width="${icon.size}" height="${icon.size}" style="border: 1px solid #ccc;"></canvas>
      <br>
      <a id="download-${icon.size}" download="${icon.name}" href="">다운로드</a>
    </div>
  `).join('')}
  
  <script>
    ${icons.map(icon => `
      (function() {
        const canvas = document.getElementById('canvas-${icon.size}');
        const ctx = canvas.getContext('2d');
        
        // 배경
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(0, 0, ${icon.size}, ${icon.size});
        
        // 텍스트
        ctx.fillStyle = 'white';
        ctx.font = 'bold ${icon.size * 0.4}px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TM', ${icon.size / 2}, ${icon.size / 2});
        
        // 다운로드 링크 설정
        const link = document.getElementById('download-${icon.size}');
        link.href = canvas.toDataURL('image/png');
      })();
    `).join('\n')}
  </script>
</body>
</html>`;

// HTML 파일 생성
fs.writeFileSync(path.join(publicDir, 'generate-icons.html'), htmlContent);
console.log('\n✅ SVG 아이콘이 생성되었습니다.');
console.log('📌 PNG 아이콘을 생성하려면 public/generate-icons.html을 브라우저에서 열어주세요.');