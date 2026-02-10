import { z } from "zod";

export const UserSchema = z.object({
    id: z.string(),
    displayName: z.string().min(1).max(20),
    isHost: z.boolean(),
});

export const RoomStateSchema = z.object({
    roomId: z.string(),
    hostId: z.string(),
    members: z.array(UserSchema),
    playing: z.boolean(),
    approxPositionSeconds: z.number(),
    updatedAt: z.number(),
    seq: z.number(),
    sessionTitle: z.string().optional(),
    currentVideoUrl: z.string().optional(),
});


export const CreateRoomSchema = z.object({
    displayName: z.string().min(1),
});
export const RoomCreateSchema = CreateRoomSchema;

export const JoinRoomSchema = z.object({
    roomId: z.string(),
    displayName: z.string().min(1),
});
export const RoomJoinSchema = JoinRoomSchema;

export const ChatMessageSchema = z.object({
    roomId: z.string(),
    userId: z.string(),
    displayName: z.string(),
    message: z.string().max(400),
    ts: z.number(),
    id: z.string().optional(),
});

export const ChatSendSchema = z.object({
    roomId: z.string(),
    message: z.string().max(400),
});

export const ActionBroadcastSchema = z.object({
    roomId: z.string(),
    type: z.enum(["PLAY", "PAUSE", "SEEK"]),
    deltaSeconds: z.number().optional(),
    updatedAt: z.number(),
    seq: z.number(),
    actorId: z.string(),
});

export const ActionPlaySchema = z.object({
    roomId: z.string(),
});

export const ActionPauseSchema = z.object({
    roomId: z.string(),
});

export const ActionSeekSchema = z.object({
    roomId: z.string(),
    deltaSeconds: z.number(),
});

export const TransferHostSchema = z.object({
    roomId: z.string(),
    newHostUserId: z.string(),
});

export const BrowserInputSchema = z.object({
    roomId: z.string(),
    type: z.enum(['mousemove', 'mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'keypress', 'scroll']),
    x: z.number().optional(),
    y: z.number().optional(),
    key: z.string().optional(),
    text: z.string().optional(),
    deltaY: z.number().optional(),
});

export const BrowserNavigateSchema = z.object({
    roomId: z.string(),
    url: z.string().url(),
});
