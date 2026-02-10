# Project Implementation Plan: Netmirror Watch Party "Cloud Browser"

## Overview
You want to watch "netmirror" (or any site) together with a friend, perfectly synced, by running the browser in a VM and streaming it to both of you. This eliminates "lag" and "buffering" differences because you both view the same high-bandwidth stream.

## Phase 1: Core Room Management (Completed)
We have fixed the existing `apps/server` and `apps/web` code to ensure Rooms can be created and joined correctly.
- **Fixed**: `RoomStore` type mismatches (User ID vs Object).
- **Fixed**: `Socket.io` event naming inconsistencies.

## Phase 2: Cloud Browser Backend
To run a browser on the server and control it:
1.  **Tech Stack**: We will use **Puppeteer** (a Node.js library to control Chrome).
2.  **Streaming**: We will use **MJPEG** (Motion JPEG) for a simple initial stream, or **WebRTC** for low-latency video (more complex).
    *   *Recommendation*: Start with MJPEG (sending screenshots rapidly) to prove the concept. It's easier to implement in your existing Node server.
3.  **Input Sync**: We will listen for `MOUSE_MOVE`, `CLICK`, and `KEY_PRESS` events from the frontend and inject them into Puppeteer.

## Phase 3: Frontend Video Player
1.  Update the Room UI to show a "Remote Browser" view instead of just a list of users.
2.  Add an `<img>` tag (for MJPEG) or `<canvas>` to display the remote browser.
3.  Add event listeners to capture your mouse and keyboard and send them to the server.

## Phase 4: Deployment (The VM Part)
Since Vercel cannot host a persistent VM/Browser:
1.  **Docker**: We will create a `Dockerfile` that packages Node.js + Chrome.
2.  **Hosting**: You can deploy this Docker image to **Railway**, **Render**, **Fly.io**, or a robust VPS like **DigitalOcean** ($5/mo).
3.  **Automation**: You mentioned Ansible. We can write an Ansible playbook to provision a VPS and deploy the Docker container seamlessly.

## Next Steps
I will now:
1.  Install `puppeteer` in the server.
2.  Create a `BrowserSession` class to manage the Chrome instance.
3.  Add the streaming endpoint.
