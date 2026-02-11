import { io, Socket } from "socket.io-client";

const SERVER_URL = "https://netmirrorserver-production.up.railway.app";
// const SERVER_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";
const finalUrl = SERVER_URL.startsWith('http') ? SERVER_URL : `https://${SERVER_URL}`;
const URL = `${finalUrl}/party`;

console.log('[Socket] Connecting to (Hardcoded):', URL);

export const socket: Socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
});
