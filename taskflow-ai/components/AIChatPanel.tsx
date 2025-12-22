
import React, { useState, useRef, useEffect } from 'react';
import { generateTasksFromAI } from '../services/geminiService';
import { ChatMessage, Task, Priority, TaskStatus } from '../types';

interface AIChatPanelProps {
  onAddTasks: (tasks: Task[]) => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ onAddTasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hi! I'm your AI task assistant. Want me to help you plan a project, break down a goal, or just organize your day? Just tell me what's on your mind!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await generateTasksFromAI(userMsg);
      
      const newModelMsg: ChatMessage = {
        role: 'model',
        content: result.text,
        suggestedTasks: result.tasks
      };
      
      setMessages(prev => [...prev, newModelMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestedTasks = (suggested: Partial<Task>[]) => {
    const newTasks: Task[] = suggested.map(t => ({
      id: Math.random().toString(36).substring(7),
      title: t.title || 'Untitled Task',
      description: t.description || '',
      priority: t.priority as Priority || Priority.MEDIUM,
      status: TaskStatus.TODO,
      createdAt: Date.now()
    }));
    onAddTasks(newTasks);
    setMessages(prev => [...prev, { role: 'model', content: `Added ${newTasks.length} tasks to your board! 🚀` }]);
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] max-w-md h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">TaskFlow AI Assistant</h3>
              <p className="text-xs text-indigo-100">Powered by Gemini 3 Pro</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                  <div className="mt-2 w-full max-w-[85%] bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suggested Breakdown:</p>
                    <ul className="space-y-1">
                      {msg.suggestedTasks.map((t, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="mt-1 block w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                          <span>{t.title}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handleAddSuggestedTasks(msg.suggestedTasks!)}
                      className="w-full mt-2 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add all to my list
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to plan something..."
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-indigo-600 text-white rounded-xl disabled:bg-slate-300 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
