"use client";
import { useEffect, useRef, useState } from 'react';
import { Events } from '@netmirror/shared';
import { socket } from '@/lib/socket';
import { MousePointer2 } from 'lucide-react';

interface RemoteBrowserProps {
    roomId: string;
}

interface CursorPos {
    x: number;
    y: number;
    userId: string;
    ts: number;
}

export function RemoteBrowser({ roomId }: RemoteBrowserProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cursors, setCursors] = useState<{ [userId: string]: CursorPos }>({});
    const [browserDim, setBrowserDim] = useState({ w: 1280, h: 720 });

    useEffect(() => {
        const onScreenshot = (buffer: ArrayBuffer) => {
            // console.log('Received screenshot', buffer.byteLength);
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Update browser dimensions state if changed
                        if (img.width !== browserDim.w || img.height !== browserDim.h) {
                            setBrowserDim({ w: img.width, h: img.height });
                        }

                        if (canvas.width !== img.width) canvas.width = img.width;
                        if (canvas.height !== img.height) canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                    }
                    URL.revokeObjectURL(url);
                }
            };
            img.src = url;
        };

        const onCursor = (data: { x: number, y: number, userId: string }) => {
            setCursors(prev => {
                const newCursors = { ...prev };
                newCursors[data.userId] = { ...data, ts: Date.now() };
                return newCursors;
            });
        };

        socket.on(Events.Server.BROWSER_SCREENSHOT, onScreenshot);
        socket.on(Events.Server.BROWSER_MOUSE_MOVE, onCursor);
        return () => {
            socket.off(Events.Server.BROWSER_SCREENSHOT, onScreenshot);
            socket.off(Events.Server.BROWSER_MOUSE_MOVE, onCursor);
        };
    }, [browserDim]);

    // Cleanup old cursors? optional.

    const sendInput = (type: string, data: any) => {
        socket.emit(Events.Client.BROWSER_INPUT, {
            roomId,
            type,
            ...data
        });
    };

    const handleMouse = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (e.type === 'mousemove') {
            sendInput(e.type, { x, y: y });
        } else {
            sendInput(e.type, { x, y });
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        sendInput('scroll', { deltaY: e.deltaY });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        sendInput('keydown', { key: e.key });
    };
    const handleKeyUp = (e: React.KeyboardEvent) => {
        sendInput('keyup', { key: e.key });
    };

    return (
        <div className="flex flex-col gap-2 w-full h-full">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl group">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain cursor-crosshair pointer-events-auto outline-none"
                    tabIndex={0}
                    onMouseMove={handleMouse}
                    onMouseDown={handleMouse}
                    onMouseUp={handleMouse}
                    onClick={handleMouse}
                    onWheel={handleWheel}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    // Prevent context menu
                    onContextMenu={(e) => e.preventDefault()}
                />

                {/* Render Cursors */}
                {Object.values(cursors).map(cursor => (
                    <div
                        key={cursor.userId}
                        className="absolute pointer-events-none transition-all duration-75 ease-linear text-red-500"
                        style={{
                            left: `${(cursor.x / browserDim.w) * 100}%`,
                            top: `${(cursor.y / browserDim.h) * 100}%`,
                            // Center the tip of the cursor
                            transform: 'translate(-2px, -2px)'
                        }}
                    >
                        <MousePointer2 size={16} fill="currentColor" />
                        <span className="text-[10px] bg-red-500 text-white rounded px-1 absolute left-4 top-0 whitespace-nowrap opacity-50">
                            User
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input className="bg-white/10 p-2 rounded text-white flex-1 focus:outline-none focus:ring-2 ring-blue-500 transition" placeholder="Type URL and press Enter..." onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        // Add protocol if missing
                        let url = target.value;
                        if (!url.startsWith('http')) url = 'https://' + url;

                        socket.emit(Events.Client.BROWSER_NAVIGATE, { roomId, url });
                        target.value = '';
                    }
                }} />
            </div>
        </div>
    );
}
