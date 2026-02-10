"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { Events, RoomState } from "@netmirror/shared";
import { ChatOverlay } from "@/components/ChatOverlay";
import { VideoSyncControls } from "@/components/VideoSyncControls";
import { UserList } from "@/components/UserList";
import { Share2, Play, Tv } from "lucide-react";

import { RemoteBrowser } from "@/components/RemoteBrowser";

export default function RoomPage() {
    const { roomId } = useParams();
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const [room, setRoom] = useState<RoomState | null>(null);
    const [mode, setMode] = useState<"sync" | "browser">("browser");

    useEffect(() => {
        if (!name || !roomId) return;

        if (!socket.connected) socket.connect();

        socket.emit(Events.Client.ROOM_JOIN, { roomId, displayName: name });

        const onState = (state: RoomState) => {
            setRoom(state);
        };
        socket.on(Events.Server.ROOM_STATE, onState);

        return () => {
            socket.off(Events.Server.ROOM_STATE, onState);
        };
    }, [roomId, name]);

    const copyInvite = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Invite link copied!");
    };

    if (!room) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Joining party...</p>
            </div>
        </div>
    );

    const isHost = room.hostId === socket.id;

    return (
        <div className="min-h-dvh flex flex-col md:flex-row gap-6 max-w-7xl mx-auto p-4 md:p-8 relative">
            <div className="flex-1 flex flex-col justify-center space-y-8 pb-24 md:pb-0">
                <div className="text-center space-y-4">
                    <div className="flex justify-center gap-4 mb-4">
                        <button
                            onClick={() => setMode("sync")}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === "sync" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
                        >
                            <Play size={16} className="inline mr-2" /> Sync Mode
                        </button>
                        <button
                            onClick={() => setMode("browser")}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${mode === "browser" ? "bg-purple-600 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
                        >
                            <Tv size={16} className="inline mr-2" /> Cloud Browser
                        </button>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass cursor-pointer hover:bg-white/10 transition" onClick={copyInvite}>
                        <span className="text-xs font-mono text-blue-300">Room: {roomId}</span>
                        <Share2 size={12} className="text-gray-400" />
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg">
                        {room.sessionTitle || "Sync Session"}
                    </h1>
                </div>

                {mode === "browser" ? (
                    <RemoteBrowser roomId={room.roomId} />
                ) : (
                    <VideoSyncControls roomId={room.roomId} isHost={isHost} />
                )}

                <div className="text-center text-sm text-gray-500">
                    Host: <span className="text-white">{room.members.find(m => m.id === room.hostId)?.displayName}</span>
                </div>
            </div>

            <div className="hidden md:block w-72 shrink-0">
                <UserList room={room} />
            </div>

            <ChatOverlay roomId={room.roomId} userId={socket.id || ""} />
        </div>
    );
}
