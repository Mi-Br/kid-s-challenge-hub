# 🚀 Challenge Hub - Local Deployment Guide

## System Requirements
- Node.js 16+ (LTS recommended)
- 2GB RAM minimum
- 1GB disk space

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Production
```bash
npm run build
```
This creates an optimized production build in the `dist/` directory.

### 3. Run Locally

**Option A: Development Server**
```bash
npm run dev
```
Access at: `http://localhost:5173`

**Option B: Production Build**
```bash
npm run build
npm run preview
```
Access at: `http://localhost:4173`

## What's Included

### 📚 Content
- **478 Dutch reading challenges** across 3 groep levels (4-5, 5-6, 7-8)
- **3 difficulty levels** per groep (low, medium, high)
- **816 custom illustrations** (2 per challenge, ~1.3GB total)

### ✨ Features
- Full reading comprehension exercises
- Auto-fix validation system (keywords + literal answers)
- Image support for all challenges
- Responsive design for tablets/laptops

### 📂 Project Structure
```
src/
├── components/          # React components
├── pages/              # Page components (LearnDutch.tsx)
├── content/
│   └── challenges/
│       └── dutch-reading/  # 478 challenge JSON files
├── lib/                # Utilities & helpers
├── types/              # TypeScript definitions
└── data/              # Challenge data

public/
└── images/
    └── challenges/
        └── dutch-reading/  # 816 PNG images (organized by challenge ID)
```

## Environment Setup

No API keys needed! All content is pre-generated.

Create `.env.local` (optional):
```
VITE_API_URL=http://localhost:5173
```

## Performance Notes

- First load: ~2-3 seconds (images cached after)
- Challenge images: ~1.5-2MB each
- Total app size: ~50MB (prod build)

## Troubleshooting

### Images Not Loading
- Check: `public/images/challenges/dutch-reading/{challenge-id}/`
- Verify images exist as `image-1.png` and `image-2.png`
- Clear browser cache (Ctrl+Shift+Del)

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Port Already in Use
```bash
# Use different port
PORT=3000 npm run dev
```

## Network Access

For local network access (same WiFi):
```bash
# Find your machine IP
ipconfig getifaddr en0  # macOS
ip addr               # Linux

# Access from other devices
http://<YOUR_IP>:5173
```

## Git Status
- ✅ All 478 challenges committed
- ✅ All 816 images present
- ✅ Production-ready build

## Next Steps

1. **Install**: `npm install`
2. **Build**: `npm run build`
3. **Run**: `npm run preview`
4. **Share**: Give kids the URL and enjoy! 🎉

---

**Total Development Time**: March 1, 2026
**Challenge Generation**: 478 challenges + 816 images
**Status**: ✅ Production Ready
