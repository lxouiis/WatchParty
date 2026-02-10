import { z } from "zod";
import { CreateRoomSchema, JoinRoomSchema, ChatMessageSchema, RoomStateSchema, ActionBroadcastSchema } from "./schemas";

export const Events = {
    Client: {
        ROOM_CREATE: "ROOM_CREATE",
        ROOM_JOIN: "ROOM_JOIN",
        CHAT_SEND: "CHAT_SEND",
        ACTION_PLAY: "ACTION_PLAY",
        ACTION_PAUSE: "ACTION_PAUSE",
        ACTION_SEEK: "ACTION_SEEK",
        TRANSFER_HOST: "TRANSFER_HOST",
        HEARTBEAT: "HEARTBEAT",
        BROWSER_INPUT: "BROWSER_INPUT",
        BROWSER_NAVIGATE: "BROWSER_NAVIGATE",
        VIDEO_CHANGE: "VIDEO_CHANGE",
    },
    Server: {
        ROOM_CREATED: "ROOM_CREATED",
        ROOM_STATE: "ROOM_STATE",
        CHAT_MESSAGE: "CHAT_MESSAGE",
        ACTION_BROADCAST: "ACTION_BROADCAST",
        HOST_CHANGED: "HOST_CHANGED",
        ERROR: "ERROR",
        BROWSER_SCREENSHOT: "BROWSER_SCREENSHOT",
        BROWSER_MOUSE_MOVE: "BROWSER_MOUSE_MOVE",
    },
} as const;

export type RoomState = z.infer<typeof RoomStateSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ActionBroadcast = z.infer<typeof ActionBroadcastSchema>;
