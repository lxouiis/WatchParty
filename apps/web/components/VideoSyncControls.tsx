"use client";
import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { Events, ActionBroadcast, RoomState } from "@netmirror/shared";
import { Play, Pause, FastForward, Rewind, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export function VideoSyncControls({ roomId, isHost }: { roomId: string, isHost: boolean }) {
    const [countdown, setCountdown] = useState<number | null>(null);
    const [action, setAction] = useState<ActionBroadcast | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);
    const playerRef = useRef<any>(null); // Use any to bypass type issues with dynamic import

    // Ignore internal events when we are applying a network event
    const remoteUpdate = useRef(false);

    useEffect(() => {
        const onAction = (evt: ActionBroadcast) => {
            handleRemoteAction(evt);
        };
        const onState = (room: RoomState) => {
            if (room.currentVideoUrl && room.currentVideoUrl !== videoUrl) {
                setVideoUrl(room.currentVideoUrl);
            }
        };

        socket.on(Events.Server.ACTION_BROADCAST, onAction);
        socket.on(Events.Server.ROOM_STATE, onState);
        return () => {
            socket.off(Events.Server.ACTION_BROADCAST, onAction);
            socket.off(Events.Server.ROOM_STATE, onState);
        };
    }, [videoUrl]);

    const handleRemoteAction = (evt: ActionBroadcast) => {
        startCountdown(evt);
        remoteUpdate.current = true;

        if (evt.type === 'PLAY') {
            setIsPlaying(true);
        } else if (evt.type === 'PAUSE') {
            setIsPlaying(false);
        } else if (evt.type === 'SEEK') {
            if (playerRef.current && evt.deltaSeconds) {
                const current = playerRef.current.getCurrentTime();
                playerRef.current.seekTo(current + evt.deltaSeconds);
            }
        }

        // Reset flag after a tick
        setTimeout(() => { remoteUpdate.current = false; }, 500);
    };

    const startCountdown = (evt: ActionBroadcast) => {
        setAction(evt);
        setCountdown(3);
        const int = setInterval(() => {
            setCountdown(prev => {
                if (prev === 1) {
                    clearInterval(int);
                    setTimeout(() => {
                        setCountdown(null);
                        setAction(null);
                    }, 1500);
                    return 0;
                }
                return (prev || 0) - 1;
            });
        }, 1000);
    };

    const emit = (type: "PLAY" | "PAUSE" | "SEEK", delta?: number) => {
        if (remoteUpdate.current) return;
        socket.emit(`ACTION_${type}`, { roomId, deltaSeconds: delta, clientTimeMs: Date.now() });
    };

    const changeUrl = (url: string) => {
        setVideoUrl(url);
        if (isHost) {
            socket.emit(Events.Client.VIDEO_CHANGE, { roomId, url });
        }
    };

    // Player callbacks
    const handlePlay = () => {
        if (!remoteUpdate.current && !isPlaying) {
            emit('PLAY');
            setIsPlaying(true);
        }
    };

    const handlePause = () => {
        if (!remoteUpdate.current && isPlaying) {
            emit('PAUSE');
            setIsPlaying(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="aspect-video bg-black/50 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                {videoUrl ? (
                    // @ts-ignore
                    <ReactPlayer
                        ref={playerRef}
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        playing={isPlaying}
                        controls={true} // Allow local seeking for now, or hide controls to force sync
                        onPlay={handlePlay}
                        onPause={handlePause}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <p>No video selected. Host, paste a URL below.</p>
                    </div>
                )}
            </div>

            <div className="w-full max-w-md mx-auto space-y-4">
                {isHost && (
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                placeholder="Paste video URL (YouTube, MP4, Netmirror direct link)..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') changeUrl((e.target as HTMLInputElement).value);
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="glass rounded-2xl p-6 flex items-center justify-between gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors -z-10" />

                    <button onClick={() => emit("SEEK", -10)} className="p-4 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white">
                        <Rewind size={24} />
                    </button>

                    <button onClick={() => isPlaying ? emit("PAUSE") : emit("PLAY")} className="p-6 rounded-full bg-white/5 hover:bg-white/15 border border-white/5 transition active:scale-95">
                        {isPlaying ? <Pause size={32} fill="currentColor" className="text-gray-200" /> : <Play size={32} fill="currentColor" className="text-gray-200" />}
                    </button>

                    <button onClick={() => emit("SEEK", 10)} className="p-4 rounded-full hover:bg-white/10 transition text-gray-300 hover:text-white">
                        <FastForward size={24} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {countdown !== null && action && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl border border-blue-500/30 backdrop-blur-2xl z-50 pointer-events-none"
                    >
                        <h3 className="text-2xl font-bold uppercase tracking-widest text-blue-300 mb-4">
                            {action.type}
                        </h3>
                        <div className="text-9xl font-black tabular-nums bg-gradient-to-b from-white to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                            {countdown === 0 ? "GO!" : countdown}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
