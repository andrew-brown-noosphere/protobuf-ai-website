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

## Environment Variables

Copy `.env.example` to `.env` (or add the same keys in the Vercel dashboard) and populate:

- `RESEND_API_KEY` – Resend secret required for both the waitlist notification email and inbound forwarding.
- `WAITLIST_FORWARD_TO` – Inbox that receives new `/api/waitlist` submissions (defaults to `andrew@protobuf.ai`).
- `OPENAI_API_KEY` – Optional; enables the AI-generated confirmation message on the landing page.
- `RESEND_INBOUND_FORWARD_TO` – Optional comma-separated list of real inboxes that should receive forwarded inbound mail processed by `/api/resend-inbound`.

## Resend Inbound Email Setup

1. In Resend, enable **Inbound Email** for `protobuf.ai`, update the MX records, and wait for verification.
2. Configure a webhook destination in Resend that points to `https://<your-deployment>/api/resend-inbound` (or `http://localhost:3000/api/resend-inbound` when testing with `vercel dev`).
3. Set `RESEND_API_KEY` and `RESEND_INBOUND_FORWARD_TO` in `.env`/Vercel so the function can forward real messages to your inbox.
4. Deploy to Vercel. Every `email.received` payload is logged and (if configured) re-sent via Resend’s send API; other event types immediately return `{ "ignored": true }`.
5. Tail the function logs (`vercel logs api/resend-inbound`) while sending a test message to confirm the payload and forwarded copy look correct.

## Analytics

- LeadFeeder tracking: For general visitor intelligence
- VoiceForge tracking: For GitHub attribution and target graph integration

## Content Updates

- Blog posts are in `/blog/`
- Main landing page is `index.html`
- Tracking script is `voiceforge-tracking.js`

## Security Note

This is a private repository. Do not expose tracking endpoints or attribution logic publicly.
