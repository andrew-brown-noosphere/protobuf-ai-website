# protobuf.ai Website

Website for protobuf.ai - AI-powered Protocol Buffers development.

## Overview

This repository contains the marketing website and blog for protobuf.ai. It includes:

- Landing page with waitlist signup
- Blog with technical content
- VoiceForge target graph tracking integration
- Attribution tracking for GitHub → Website → Conversion funnel

## Tracking & Attribution

The site includes custom first-party tracking that integrates with VoiceForge's target graph system. This allows us to:

- Track visitors from GitHub signal discovery
- Attribute downloads and signups to specific GitHub users
- Build complete conversion funnels
- Trigger automated outreach based on behavior

### Attribution Flow

1. GitHub user stars protobuf/grpc repo (tracked by VoiceForge)
2. User visits protobuf.ai via outreach link with `?gh=username`
3. All actions are tracked and attributed to their GitHub profile
4. VoiceForge can trigger personalized follow-up campaigns

## Deployment

The website is deployed to GitHub Pages / Vercel / Netlify (configure as needed).

## Local Development

```bash
# Serve locally
python -m http.server 8000

# Or use any static server
npx serve .
```

## Analytics

- LeadFeeder tracking: For general visitor intelligence
- VoiceForge tracking: For GitHub attribution and target graph integration

## Content Updates

- Blog posts are in `/blog/`
- Main landing page is `index.html`
- Tracking script is `voiceforge-tracking.js`

## Security Note

This is a private repository. Do not expose tracking endpoints or attribution logic publicly.