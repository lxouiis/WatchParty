"use client";
import { User } from "lucide-react";
import { RoomState } from "@netmirror/shared";

export function UserList({ room }: { room: RoomState }) {
    return (
        <div className="glass p-4 rounded-2xl h-fit">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-4 font-semibold">In Party ({room.members.length})</h3>
            <div className="space-y-3">
                {room.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10">
                            <User size={14} className="text-gray-300" />
                        </div>
                        <div>
                            <div className="text-sm font-medium flex items-center gap-2">
                                {m.displayName}
                                {m.isHost && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30">HOST</span>}
                                {m.id === room.hostId && !m.isHost && <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">H?</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
