#!/bin/bash

echo "🔍 Pre-deployment check starting..."

# 1. TypeScript 타입 체크
echo "📝 Checking TypeScript types..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript type check failed!"
    exit 1
fi

# 2. ESLint 체크
echo "🔍 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint check failed!"
    exit 1
fi

# 3. 프로덕션 빌드 테스트
echo "🔨 Building for production..."
NODE_ENV=production npm run build
if [ $? -ne 0 ]; then
    echo "❌ Production build failed!"
    exit 1
fi

echo "✅ All pre-deployment checks passed!"
echo "💡 It's safe to deploy to Vercel!"