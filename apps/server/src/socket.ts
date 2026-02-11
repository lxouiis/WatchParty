import { Server, Socket } from "socket.io";
import {
    Events,
    RoomCreateSchema,
    RoomJoinSchema,
    ChatSendSchema,
    ActionPlaySchema,
    ActionPauseSchema,
    ActionSeekSchema,
    TransferHostSchema,
    BrowserInputSchema,
    BrowserNavigateSchema,
} from "@netmirror/shared";
import { roomStore } from "./roomStore";
import { canPerformAction, canSendChat } from "./rateLimit";
import { v4 as uuidv4 } from "uuid";
import { browserManager } from "./browserManager";

export function setupSocket(io: Server) {
    const party = io.of("/party");

    // Initialize browser (singleton for MVP)
    console.log("Starting Browser Manager...");
    browserManager.init().then(async () => {
        console.log("Browser Manager initialized. Starting screencast...");

        // Start high-performance CDP screencast
        let frameCount = 0;
        await browserManager.startScreencast((buffer) => {
            if (++frameCount % 100 === 0) console.log(`Broadcasting frame ${frameCount}, size: ${buffer.byteLength}`);
            // Use volatile emit for video frames to drop them if network is congested
            party.volatile.emit(Events.Server.BROWSER_SCREENSHOT, buffer);
        });
    });

    // Removed old polling loop
    // setInterval(...)

    party.on("connection", (socket: Socket) => {
        // Basic auth/identify could go here (using handshake query)
        let currentUserId = (socket.handshake.query.userId as string) || uuidv4();
        let currentRoomId: string | null = null;

        //console.log(`User connected: ${currentUserId}`);

        socket.on(Events.Client.ROOM_CREATE, (payload: any) => {
            const parsed = RoomCreateSchema.safeParse(payload);
            if (!parsed.success) return;

            const roomId = uuidv4().slice(0, 8); // simplified ID
            const room = roomStore.createRoom(roomId, currentUserId);
            roomStore.addMember(roomId, currentUserId, parsed.data.displayName);
            currentRoomId = roomId;

            socket.join(roomId);
            socket.emit(Events.Server.ROOM_CREATED, { roomId, inviteUrl: `/room/${roomId}` });
            socket.emit(Events.Server.ROOM_STATE, room);
        });

        socket.on(Events.Client.ROOM_JOIN, (payload: any) => {
            const parsed = RoomJoinSchema.safeParse(payload);
            if (!parsed.success) return;

            const { roomId, displayName } = parsed.data;
            const room = roomStore.addMember(roomId, currentUserId, displayName);

            if (!room) {
                socket.emit(Events.Server.ERROR, { code: "ROOM_NOT_FOUND", message: "Room does not exist" });
                return;
            }

            currentRoomId = roomId;
            socket.join(roomId);

            // Send current state to joiner
            socket.emit(Events.Server.ROOM_STATE, room);
            // Notify others
            socket.to(roomId).emit(Events.Server.ROOM_STATE, room);
        });

        socket.on(Events.Client.CHAT_SEND, (payload: any) => {
            if (!canSendChat(currentUserId)) return;

            const parsed = ChatSendSchema.safeParse(payload);
            if (!parsed.success) return;

            const { roomId, message } = parsed.data;
            const room = roomStore.getRoom(roomId);

            // Verify user is in room
            if (!room || !room.members.find(m => m.id === currentUserId)) return;

            // Find display name
            const member = room.members.find(m => m.id === currentUserId);
            const displayName = member ? member.displayName : "Unknown";

            party.to(roomId).emit(Events.Server.CHAT_MESSAGE, {
                roomId,
                userId: currentUserId,
                displayName,
                message,
                ts: Date.now(),
            });
        });

        // Helper for broadcasting actions
        const broadcastAction = (roomId: string, type: "PLAY" | "PAUSE" | "SEEK", deltaSeconds?: number) => {
            const room = roomStore.getRoom(roomId);
            if (!room) return;

            party.to(roomId).emit(Events.Server.ACTION_BROADCAST, {
                roomId,
                type,
                deltaSeconds,
                updatedAt: room.updatedAt,
                seq: room.seq,
                actorId: currentUserId
            });
            party.to(roomId).emit(Events.Server.ROOM_STATE, room);
        };

        socket.on(Events.Client.ACTION_PLAY, (payload: any) => {
            if (!canPerformAction(currentUserId)) return;
            const parsed = ActionPlaySchema.safeParse(payload);
            if (!parsed.success) return;

            const { roomId } = parsed.data;
            roomStore.updateState(roomId, { playing: true });
            broadcastAction(roomId, "PLAY");
        });

        socket.on(Events.Client.ACTION_PAUSE, (payload: any) => {
            if (!canPerformAction(currentUserId)) return;
            const parsed = ActionPauseSchema.safeParse(payload);
            if (!parsed.success) return;

            const { roomId } = parsed.data;
            roomStore.updateState(roomId, { playing: false });
            broadcastAction(roomId, "PAUSE");
        });

        socket.on(Events.Client.ACTION_SEEK, (payload: any) => {
            if (!canPerformAction(currentUserId)) return;
            const parsed = ActionSeekSchema.safeParse(payload);
            if (!parsed.success) return;

            const { roomId, deltaSeconds } = parsed.data;
            const room = roomStore.getRoom(roomId);
            if (!room) return;

            // Apply seek to approx position
            const newPos = Math.max(0, room.approxPositionSeconds + deltaSeconds);
            roomStore.updateState(roomId, { approxPositionSeconds: newPos });
            broadcastAction(roomId, "SEEK", deltaSeconds);
        });

        socket.on(Events.Client.TRANSFER_HOST, (payload: any) => {
            const parsed = TransferHostSchema.safeParse(payload);
            if (!parsed.success) return;

            const { roomId, newHostUserId } = parsed.data;
            const room = roomStore.getRoom(roomId);

            if (!room || room.hostId !== currentUserId) return; // Only host can transfer

            roomStore.updateState(roomId, { hostId: newHostUserId });
            party.to(roomId).emit(Events.Server.HOST_CHANGED, { roomId, hostId: newHostUserId });
            party.to(roomId).emit(Events.Server.ROOM_STATE, room);
        });

        socket.on(Events.Client.VIDEO_CHANGE, (payload: any) => {
            const room = roomStore.getRoom(payload.roomId);
            if (!room || room.hostId !== currentUserId) return;

            roomStore.updateState(payload.roomId, { currentVideoUrl: payload.url, playing: false });
            party.to(payload.roomId).emit(Events.Server.ROOM_STATE, room);
        });

        // Browser Events
        socket.on(Events.Client.BROWSER_INPUT, async (payload: any) => {
            // Rate limit?
            const parsed = BrowserInputSchema.safeParse(payload);
            if (!parsed.success) return;
            await browserManager.handleInput(parsed.data.type, parsed.data);

            if (parsed.data.type === 'mousemove') {
                socket.to(parsed.data.roomId).volatile.emit(Events.Server.BROWSER_MOUSE_MOVE, {
                    x: parsed.data.x,
                    y: parsed.data.y,
                    userId: currentUserId
                });
            }
        });

        socket.on(Events.Client.BROWSER_NAVIGATE, async (payload: any) => {
            const parsed = BrowserNavigateSchema.safeParse(payload);
            if (!parsed.success) return;
            await browserManager.navigate(parsed.data.url);
        });

        socket.on("disconnect", () => {
            if (currentRoomId) {
                const room = roomStore.removeMember(currentRoomId, currentUserId);
                if (room) {
                    party.to(currentRoomId).emit(Events.Server.ROOM_STATE, room);
                }
            }
        });

    });
}
