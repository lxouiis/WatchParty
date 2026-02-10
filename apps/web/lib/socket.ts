import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000/party";

export const socket: Socket = io(URL, {
    autoConnect: false,
});
