import { RoomState } from "@netmirror/shared";

interface ServerRoomState extends RoomState {
    // Add server-only fields if needed
}

export class RoomStore {
    private rooms = new Map<string, ServerRoomState>();

    createRoom(roomId: string, hostId: string): ServerRoomState {
        const room: ServerRoomState = {
            roomId,
            hostId,
            members: [],
            playing: false,
            approxPositionSeconds: 0,
            updatedAt: Date.now(),
            seq: 0,
        };
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): ServerRoomState | undefined {
        return this.rooms.get(roomId);
    }

    addMember(roomId: string, userId: string, displayName: string): ServerRoomState | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        if (!room.members.find((m) => m.id === userId)) {
            room.members.push({
                id: userId,
                displayName,
                isHost: userId === room.hostId
            });
        }
        return room;
    }

    removeMember(roomId: string, userId: string): ServerRoomState | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        room.members = room.members.filter((m) => m.id !== userId);
        // If host leaves, assign new host if members exist
        if (room.hostId === userId) {
            if (room.members.length > 0) {
                this.updateHost(roomId, room.members[0].id);
            } else {
                this.rooms.delete(roomId);
                return undefined;
            }
        }
        return room;
    }

    updateHost(roomId: string, newHostId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.hostId = newHostId;
        room.members = room.members.map(m => ({
            ...m,
            isHost: m.id === newHostId
        }));
    }

    updateState(roomId: string, partial: Partial<ServerRoomState>): ServerRoomState | undefined {
        const room = this.rooms.get(roomId);
        if (!room) return undefined;

        // wrapper to handle host updates if partial contains hostId
        if (partial.hostId && partial.hostId !== room.hostId) {
            this.updateHost(roomId, partial.hostId);
            delete partial.hostId; // handled
        }

        Object.assign(room, partial);
        room.updatedAt = Date.now();
        room.seq++;
        return room;
    }
}

export const roomStore = new RoomStore();
