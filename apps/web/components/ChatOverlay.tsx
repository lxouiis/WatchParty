"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { socket } from "@/lib/socket";
import { Events, ChatMessage } from "@netmirror/shared";

export function ChatOverlay({ roomId, userId }: { roomId: string, userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onMessage = (msg: ChatMessage) => {
            setMessages(p => [...p, msg]);
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        };
        socket.on(Events.Server.CHAT_MESSAGE, onMessage);
        return () => { socket.off(Events.Server.CHAT_MESSAGE, onMessage); };
    }, []);

    const send = () => {
        if (!input.trim()) return;
        socket.emit(Events.Client.CHAT_SEND, { message: input });
        setInput("");
    };

    return (
        <>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600/90 text-white rounded-full shadow-lg backdrop-blur-md border border-white/10 md:hidden">
                    <MessageCircle size={24} />
                </button>
            )}

            <motion.div
                initial={{ y: "92%" }}
                animate={{ y: isOpen ? 0 : "92%" }}
                className={`fixed bottom-0 left-0 right-0 md:w-96 md:left-auto md:right-8 md:bottom-8 md:rounded-2xl flex flex-col glass z-40 transition-all duration-300 ${isOpen ? 'h-[60vh] md:h-[600px] md:!transform-none' : 'h-16 md:h-[600px] md:!transform-none'}`}
            >
                <div className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer bg-white/5 hover:bg-white/10 transition-colors rounded-t-2xl" onClick={() => setIsOpen(!isOpen)}>
                    <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-blue-400" />
                        <span className="font-semibold text-sm">Chat ({messages.length})</span>
                    </div>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 && <div className="text-center text-gray-500 text-xs mt-10">No messages yet. Say hi!</div>}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.userId === userId ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-gray-400 mb-1 ml-1">{m.displayName}</span>
                            <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words shadow-sm ${m.userId === userId ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                {m.message}
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                <div className="p-3 border-t border-white/10 flex gap-2 bg-black/20 md:rounded-b-2xl">
                    <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-gray-500"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                    />
                    <button onClick={send} disabled={!input.trim()} className="p-2 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors">
                        <Send size={18} />
                    </button>
                </div>
            </motion.div>
        </>
    );
}
