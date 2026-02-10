---
id: "netmirror-party-modern-watch"
name: "Netmirror Party (DRM-safe) – Modern Watch2Gether-style App"
version: "1.0.0"
description: >
  Build a modern, sleek, mobile-first watch-party web app for DRM-protected sites.
  App syncs PLAY/PAUSE/SEEK intents and a shared "approx timeline" (host-authoritative),
  plus realtime chat. No direct DRM player control; use guided sync UX.

goals:
  - Create/join rooms via link or code
  - Host is source of truth (Option 2): anyone can pause/play; last action wins; host can transfer host
  - Realtime chat with sleek transparent bottom overlay that adapts to portrait/landscape
  - DRM-safe: do NOT attempt to read/control protected player state; provide guided sync + countdown
  - Production-like structure: clean UI, types, validation, rate limiting basics

non_goals:
  - No remote browser streaming / screen rebroadcast
  - No DRM bypass, no player automation for protected streams
  - No payments, no complex auth in MVP (optional later)

stack:
  frontend:
    framework: "Next.js 14+ (App Router)"
    language: "TypeScript"
    styling: "TailwindCSS"
    ui: "shadcn/ui"
    icons: "lucide-react"
    animations: "framer-motion"
  backend:
    runtime: "Node.js 20+"
    framework: "Express"
    realtime: "Socket.IO"
  optional_scale:
    redis: "socket.io-redis adapter"
  deployment:
    frontend: "Vercel"
    backend: "Render/Fly/Railway (WebSocket-friendly)"
    dev_tunnel:
      recommended: ["Cloudflare Tunnel", "ngrok"]

project_structure:
  root:
    - apps:
        - web: "Next.js frontend"
        - server: "Express + Socket.IO"
    - packages:
        - shared: "shared types + event schemas (zod)"
    - docs: "architecture + event protocol"
  apps/web:
    - app:
        - page.tsx: "Landing"
        - room/[roomId]/page.tsx: "Room UI"
    - components:
        - ChatOverlay.tsx
        - VideoSyncControls.tsx
        - RoomHeader.tsx
        - UserList.tsx
    - lib:
        - socket.ts: "socket client"
        - ui.ts: "utility"
  apps/server:
    - src:
        - index.ts: "server bootstrap"
        - socket.ts: "socket handlers"
        - roomStore.ts: "in-memory store (replaceable)"
        - rateLimit.ts: "basic per-socket event throttling"
  packages/shared:
    - events.ts: "event names + payload types"
    - schemas.ts: "zod validation schemas"

ux_design:
  theme:
    style: "sleek, dark, glassmorphism"
    background: "deep dark gradient"
    cards: "soft shadows, 2xl rounding"
    typography: "clear hierarchy, compact"
  responsive_rules:
    portrait:
      chat: "bottom floating overlay (glass), 35-45% height max, collapsible"
      controls: "center card, large buttons"
    landscape:
      chat: "bottom overlay smaller OR right-side drawer (toggle), avoid covering controls"
      controls: "left/center, keep primary buttons reachable"
  chat_overlay:
    requirements:
      - "Fixed to bottom with safe-area support (iOS)"
      - "Transparent blur background"
      - "Input always visible; messages scroll"
      - "Collapse/expand button"
    css_guidelines:
      - "position: fixed"
      - "bottom: env(safe-area-inset-bottom)"
      - "background: rgba(0,0,0,0.35)"
      - "backdrop-filter: blur(10px)"
      - "max-height varies by orientation"
  guided_sync_ui:
    concept: >
      Since DRM player can’t be controlled, provide a shared approximate timeline + countdown actions.
      When host presses play/pause/seek, clients show an overlay: “Do this now” with 3..2..1 countdown.
    components:
      - "Big action banner (PLAY/PAUSE/SEEK + seconds)"
      - "Countdown animation"
      - "Optional 'I’m synced' confirmation button"

room_logic:
  identifiers:
    roomId: "short code (6-8 chars) + full UUID in URL"
    invite_link: "/room/{roomId}"
  roles:
    host:
      can:
        - "transfer host"
        - "set session title/notes (e.g., movie name)"
        - "trigger sync actions"
    participant:
      can:
        - "chat"
        - "trigger play/pause (allowed in Option 2)"
        - "request seek (optional: only host applies seek)"
  rules_option2_play_pause:
    arbitration: "last-write-wins"
    authority: "server assigns monotonic sequence number per room"
    behavior:
      - "any PLAY/PAUSE broadcasts to all"
      - "host may transfer host at any time"
      - "server stores latest state: playing + approxPosition + updatedAt + seq"
  seek_policy:
    default: "host-only seek (recommended)"
    fallback: "allow anyone seek; still last-write-wins"
  late_join_sync:
    server_sends_on_join:
      - "room state snapshot (playing, approxPositionSeconds, updatedAt, hostId, seq)"
    client_estimation:
      - "estimatedPosition = approxPosition + (now - updatedAt if playing)"
      - "show as 'approx' with disclaimers"

realtime_protocol:
  transport: "Socket.IO namespaces: /party"
  event_versioning: "v1"
  events:
    client_to_server:
      - ROOM_CREATE: { displayName: "string" }
      - ROOM_JOIN: { roomId: "string", displayName: "string" }
      - CHAT_SEND: { roomId: "string", message: "string" }
      - ACTION_PLAY: { roomId: "string", clientTimeMs: "number" }
      - ACTION_PAUSE: { roomId: "string", clientTimeMs: "number" }
      - ACTION_SEEK: { roomId: "string", deltaSeconds: "number", clientTimeMs: "number" }
      - TRANSFER_HOST: { roomId: "string", newHostUserId: "string" }
      - HEARTBEAT: { roomId: "string" }
    server_to_client:
      - ROOM_CREATED: { roomId: "string", inviteUrl: "string" }
      - ROOM_STATE: { roomId: "string", hostId: "string", members: "array", playing: "boolean", approxPositionSeconds: "number", updatedAt: "number", seq: "number", sessionTitle: "string?" }
      - CHAT_MESSAGE: { roomId: "string", userId: "string", displayName: "string", message: "string", ts: "number" }
      - ACTION_BROADCAST: { roomId: "string", type: "PLAY|PAUSE|SEEK", deltaSeconds: "number?", updatedAt: "number", seq: "number", actorId: "string" }
      - HOST_CHANGED: { roomId: "string", hostId: "string" }
      - ERROR: { code: "string", message: "string" }

validation_security:
  input_validation: "Use zod in shared package; reject invalid payloads"
  rate_limiting:
    chat: "max 3 msgs/sec per user"
    actions: "max 5 actions/10 sec per user; drop extras"
  room_limits:
    max_members: 12
    max_message_length: 400
  sanitization:
    - "escape/render text safely; no raw HTML"
  privacy:
    - "no storing chat history in DB for MVP"
  logging:
    - "minimal: room create/join, errors"

implementation_steps:
  - step: "Scaffold monorepo"
    details:
      - "apps/web Next.js TS + Tailwind + shadcn/ui"
      - "apps/server Express TS + Socket.IO"
      - "packages/shared types + zod schemas"
  - step: "Backend room store"
    details:
      - "in-memory Map<roomId, RoomState>"
      - "assign userId per socket"
      - "seq increments on every state update"
  - step: "Socket handlers"
    details:
      - "ROOM_CREATE creates state, sets creator as host"
      - "ROOM_JOIN adds member, emits ROOM_STATE"
      - "ACTION_* updates playing/position/updatedAt, emits ACTION_BROADCAST + ROOM_STATE"
      - "TRANSFER_HOST validates host, updates hostId, emits HOST_CHANGED + ROOM_STATE"
  - step: "Frontend UI"
    details:
      - "Landing: create room / join room"
      - "Room: header + members list + sync controls + chat overlay"
      - "Overlay action banner w/ countdown animation on ACTION_BROADCAST"
  - step: "Mobile polish"
    details:
      - "orientation-aware layout using CSS + matchMedia"
      - "safe-area padding"
      - "collapse chat button"
  - step: "Deploy"
    details:
      - "Deploy server to WebSocket-friendly host"
      - "Deploy web to Vercel"
      - "Set NEXT_PUBLIC_WS_URL"
  - step: "Dev tunnel (optional)"
    details:
      - "Use Cloudflare Tunnel/ngrok to expose server locally for testing"

acceptance_tests:
  - "User A creates room; gets invite link/code"
  - "User B joins; sees room state + chat"
  - "User A presses play; both see countdown banner"
  - "User B presses pause; both see pause banner (last-write-wins)"
  - "Host transfers host; controls reflect new host"
  - "Portrait to landscape keeps chat at bottom or collapses cleanly"

agent_instructions:
  code_quality:
    - "Use TypeScript everywhere"
    - "No any; strict types"
    - "Shared event schemas enforced server+client"
  ui_quality:
    - "Modern glassy UI, smooth transitions, avoid clutter"
    - "Large tap targets for mobile"
  do_not:
    - "Do not attempt DRM bypass or player automation"
    - "Do not implement remote streaming VM"
---

# After applying this skill:
# 1) Generate the full repo with the project_structure
# 2) Implement backend + frontend according to implementation_steps
# 3) Provide run instructions (pnpm) + env vars