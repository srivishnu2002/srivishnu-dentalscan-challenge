"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function MessagingSidebar({ patientId = "guest-patient" }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/messaging?patientId=${patientId}`)
        .then(res => res.json())
        .then(data => setMessages(data.messages || []));
    }
  }, [isOpen, patientId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { id: Date.now().toString(), content: input, sender: "patient", createdAt: new Date().toISOString() };
    
    // Optimistic UI Update: Instantly show message
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    try {
      const res = await fetch("/api/messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, content: newMsg.content, sender: "patient" }),
      });
      if (!res.ok) throw new Error("Failed to send");
    } catch (err) {
      console.error(err);
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== newMsg.id));
      alert("Failed to send message. Please try again.");
    }
  };

  return (
    <>
      {/* Floating Action Button - Hides completely when sidebar is open */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 p-4 rounded-full shadow-xl hover:bg-blue-500 transition-colors z-50 flex items-center gap-2"
        >
          <MessageSquare size={24} className="text-white" />
          <span className="text-white font-semibold pr-2">Message Clinic</span>
        </button>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
          <h2 className="text-white font-semibold">Clinic Chat</h2>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-zinc-500 text-sm text-center mt-10">No messages yet. Ask the clinic a question!</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'patient' ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-zinc-800 text-zinc-200 self-start rounded-tl-none'}`}>
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors">
            <Send size={20} />
          </button>
        </form>
      </div>
    </>
  );
}