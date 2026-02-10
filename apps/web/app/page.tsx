"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { Events } from "@netmirror/shared";
import { Radio, ArrowRight, Users } from "lucide-react";

export default function Home() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onCreated = (data: { roomId: string }) => {
      console.log("[Client] Room created:", data);
      router.push(`/room/${data.roomId}?name=${encodeURIComponent(name)}`);
    };

    socket.on("connect", () => {
      console.log("[Client] Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Client] Socket connection error:", err);
    });

    socket.on(Events.Server.ROOM_CREATED, onCreated);

    return () => {
      socket.off(Events.Server.ROOM_CREATED, onCreated);
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [name, router]);

  const create = () => {
    if (!name) {
      alert("Please enter your name");
      return;
    }
    socket.connect();
    socket.emit(Events.Client.ROOM_CREATE, { displayName: name });
  };

  const join = () => {
    if (!name || !roomId) {
      alert("Please enter name and room code");
      return;
    }
    socket.connect();
    router.push(`/room/${roomId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass p-8 md:p-12 rounded-3xl w-full max-w-lg relative z-10 border border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <Radio size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Netmirror Party</h1>
          <p className="text-gray-400">Sync movies & shows with friends.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter your name..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={create}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-px focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-950 px-8 py-3 dark:bg-gray-950 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-gray-900">
                Create Room
                <ArrowRight size={16} className="ml-2" />
              </span>
            </button>

            <div className="relative">
              <input
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
                placeholder="Code"
              />
              <button
                onClick={join}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Join"
              >
                <Users size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="fixed bottom-6 text-xs text-gray-600">v1.0.0 • DRM-Safe Watch Party</p>
    </main>
  );
}
