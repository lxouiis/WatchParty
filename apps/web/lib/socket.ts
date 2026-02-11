import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";
const URL = `${SERVER_URL}/party`;

export const socket: Socket = io(URL, {
    autoConnect: false,
});
