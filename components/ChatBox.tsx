'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import UserAvatar from './UserAvatar';
import TaskMentionInput from './TaskMentionInput';
import VoiceRecorder from './VoiceRecorder';
import { formatTime } from '@/lib/utils';
import { renderTaskMentions, extractTaskIds } from '@/lib/taskMentions';
import { linkifyText } from '@/lib/linkify';
import { Image as ImageIcon, Mic, Send } from 'lucide-react';
import { useNotifications } from './useNotifications';

interface ChatMessage {
    id: number;
    message: string;
    created_at: string;
    user: {
        id: number;
        username: string;
        full_name: string;
        avatar_color: string;
    } | null;
    referenced_tasks?: string[]; // Array of task_ids
    message_type?: 'text' | 'image' | 'voice';
    file_path?: string;
}

interface Task {
    id: number;
    task_id: string | null;
    title: string;
    status: string;
}

import { Trash2 } from 'lucide-react';

interface ChatBoxProps {
    currentUserId: number;
    currentUserRole?: string;
}

const ChatMessageItem = memo(({ msg, isCurrentUser, taskMap }: { msg: ChatMessage, isCurrentUser: boolean, taskMap: Map<string, Task & { task_id: string }> }) => {
    return (
        <div
            style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                width: 'fit-content',
            }}
        >
            {!isCurrentUser && msg.user && (
                <UserAvatar name={msg.user.full_name} color={msg.user.avatar_color} size="sm" />
            )}
            <div
                style={{
                    background: isCurrentUser 
                        ? 'var(--accent-primary)' 
                        : 'var(--glass-bg-medium)',
                    backdropFilter: isCurrentUser ? 'none' : 'blur(var(--blur-amount))',
                    WebkitBackdropFilter: isCurrentUser ? 'none' : 'blur(var(--blur-amount))',
                    border: isCurrentUser ? 'none' : '1px solid var(--glass-border)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    borderBottomRightRadius: isCurrentUser ? '4px' : 'var(--radius-md)',
                    borderBottomLeftRadius: isCurrentUser ? 'var(--radius-md)' : '4px',
                }}
            >
                {!isCurrentUser && (
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            marginBottom: 'var(--spacing-xs)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {msg.user?.full_name}
                    </div>
                )}
                <div style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-primary)', maxWidth: '100%', overflow: 'hidden' }}>
                    {msg.message_type === 'image' && msg.file_path ? (
                        <div style={{ maxWidth: '250px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <img
                                src={msg.file_path}
                                alt="shared image"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                        </div>
                    ) : msg.message_type === 'voice' && msg.file_path ? (
                        <div style={{ minWidth: '180px', maxWidth: '100%' }}>
                            <audio controls style={{ width: '100%', maxWidth: '250px', height: '32px' }}>
                                <source src={msg.file_path} type="audio/webm" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ) : (
                        <p style={{ margin: 0 }}>
                            {renderTaskMentions(msg.message || '', taskMap).map((segment, i) => {
                                if (segment.type === 'mention' && segment.taskDbId) {
                                    return (
                                        <Link
                                            key={i}
                                            href={`/tasks/${segment.taskDbId}`}
                                            style={{
                                                color: isCurrentUser ? 'white' : 'var(--accent-primary)',
                                                fontWeight: 600,
                                                textDecoration: 'underline',
                                                textDecorationStyle: 'dotted',
                                                backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(6, 182, 212, 0.15)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = isCurrentUser ? 'rgba(255,255,255,0.3)' : 'rgba(6, 182, 212, 0.25)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = isCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(6, 182, 212, 0.15)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {segment.content}
                                        </Link>
                                    );
                                }
                                // Apply linkify to text segments to make URLs clickable
                                return (
                                    <span key={i}>
                                        {linkifyText(segment.content, {
                                            color: isCurrentUser ? 'rgba(255,255,255,0.9)' : 'var(--accent-primary)',
                                            hoverColor: isCurrentUser ? 'white' : 'var(--accent-secondary)',
                                        })}
                                    </span>
                                );
                            })}
                        </p>
                    )}
                </div>
                <div
                    style={{
                        fontSize: '0.7rem',
                        marginTop: 'var(--spacing-xs)',
                        color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    }}
                >
                    {formatTime(msg.created_at)}
                </div>
            </div>
            {isCurrentUser && msg.user && (
                <UserAvatar name={msg.user.full_name} color={msg.user.avatar_color} size="sm" />
            )}
        </div>
    );
});

export default function ChatBox({ currentUserId, currentUserRole }: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previousMessagesRef = useRef<ChatMessage[]>([]);
    const shouldScrollRef = useRef(true);
    const isInitialLoadRef = useRef(true);
    const { showNotification } = useNotifications();

    // Check if user is near the bottom of the chat
    const isNearBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return true;
        const threshold = 100; // pixels from bottom
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    };

    const handleClearChat = async () => {
        if (!confirm('¿Estás seguro de que deseas borrar TODO el historial del chat? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch('/api/chat/clear', {
                method: 'DELETE',
            });

            if (res.ok) {
                setMessages([]);
            } else {
                alert('Error al limpiar el chat');
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
            alert('Error de conexión');
        }
    };

    // Map of task_id -> Task for rendering
    const taskMap = useMemo(() => {
        const map = new Map<string, Task & { task_id: string }>();
        tasks.forEach(t => {
            if (t.task_id) map.set(t.task_id, t as Task & { task_id: string });
        });
        return map;
    }, [tasks]);

    const fetchMessages = async () => {
        try {
            // Check scroll position before fetching
            const wasNearBottom = isNearBottom();
            
            const res = await fetch('/api/chat');
            const data = await res.json();
            const newMessages = data.messages;
            
            // Check for new messages (not sent by current user)
            if (previousMessagesRef.current.length > 0) {
                const previousIds = new Set(previousMessagesRef.current.map(m => m.id));
                const newMessagesToNotify = newMessages.filter(
                    (msg: ChatMessage) => 
                        !previousIds.has(msg.id) && 
                        msg.user?.id !== currentUserId
                );
                
                if (newMessagesToNotify.length > 0) {
                    const latestMessage = newMessagesToNotify[newMessagesToNotify.length - 1];
                    const senderName = latestMessage.user?.full_name || 'Alguien';
                    const messagePreview = latestMessage.message 
                        ? (latestMessage.message.length > 50 
                            ? latestMessage.message.substring(0, 50) + '...' 
                            : latestMessage.message)
                        : latestMessage.message_type === 'image' 
                            ? '📷 Imagen compartida'
                            : latestMessage.message_type === 'voice'
                                ? '🎤 Nota de voz'
                                : 'Nuevo mensaje';
                    
                    showNotification({
                        title: `💬 Nuevo mensaje de ${senderName}`,
                        body: messagePreview,
                        tag: 'chat-message',
                    });
                }
                
                // Only auto-scroll if user was near bottom or sent a message
                shouldScrollRef.current = wasNearBottom;
            } else {
                // Initial load - always scroll to bottom
                shouldScrollRef.current = true;
            }
            
            previousMessagesRef.current = newMessages;
            setMessages(newMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds

        // Fetch tasks for mentions
        const fetchTasks = async () => {
            try {
                const res = await fetch('/api/tasks');
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data.tasks);
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };
        fetchTasks();

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Only auto-scroll if appropriate
        if (shouldScrollRef.current || isInitialLoadRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoadRef.current ? 'auto' : 'smooth' });
            isInitialLoadRef.current = false;
        }
    }, [messages]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSending(true);
        try {
            // 1. Upload file
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/chat/files', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            const uploadData = await uploadRes.json();

            // 2. Send message with file path
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: null,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    file_path: uploadData.filepath
                }),
            });

            if (res.ok) {
                fetchMessages();
                // Clear file input
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                const errorData = await res.json();
                console.error('Error creating message:', errorData);
                alert('Error al enviar la imagen. Por favor intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error sending file:', error);
            alert('Error al enviar la imagen. Verifica tu conexión.');
        } finally {
            setSending(false);
        }
    };

    const handleVoiceRecording = async (blob: Blob) => {
        setIsRecording(false);
        setSending(true);
        try {
            // 1. Upload audio file
            const formData = new FormData();
            formData.append('file', blob, 'voice-note.webm');

            const uploadRes = await fetch('/api/chat/files', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            const uploadData = await uploadRes.json();

            // 2. Send message with audio path
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: null,
                    type: 'voice',
                    file_path: uploadData.filepath
                }),
            });

            if (res.ok) {
                fetchMessages();
            } else {
                const errorData = await res.json();
                console.error('Error creating voice message:', errorData);
                alert('Error al enviar la nota de voz. Por favor intenta de nuevo.');
            }
        } catch (error) {
            console.error('Error sending voice note:', error);
            alert('Error al enviar la nota de voz. Verifica tu conexión.');
        } finally {
            setSending(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const referencedTasks = extractTaskIds(newMessage);

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage,
                    type: 'text',
                    referenced_tasks: referencedTasks
                }),
            });

            if (res.ok) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'var(--glass-bg-medium)',
                backdropFilter: 'blur(var(--blur-amount))',
                WebkitBackdropFilter: 'blur(var(--blur-amount))',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {currentUserRole === 'admin' && (
                <button
                    onClick={handleClearChat}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 10,
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--status-urgent)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                    }}
                    title="Limpiar chat"
                >
                    <Trash2 size={14} color="var(--text-secondary)" /> Limpiar
                </button>
            )}
            {/* Messages */}
            <div
                ref={messagesContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                }}
            >
                {messages.map((msg) => (
                    <ChatMessageItem
                        key={msg.id}
                        msg={msg}
                        isCurrentUser={msg.user?.id === currentUserId}
                        taskMap={taskMap}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
                style={{
                    padding: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    alignItems: 'flex-end',
                    position: 'relative',
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn"
                    style={{
                        padding: 'var(--spacing-sm)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontSize: '1.2rem',
                        height: '42px',
                        width: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Adjuntar imagen"
                >
                    <ImageIcon size={20} strokeWidth={2} />
                </button>

                {isRecording ? (
                    <VoiceRecorder
                        onRecordingComplete={handleVoiceRecording}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => setIsRecording(true)}
                            className="btn"
                            style={{
                                padding: 'var(--spacing-sm)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '1.2rem',
                                height: '42px',
                                width: '42px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title="Nota de voz"
                        >
                            <Mic size={20} strokeWidth={2} />
                        </button>
                        <TaskMentionInput
                            value={newMessage}
                            onChange={setNewMessage}
                            onSubmit={handleSendMessage}
                            tasks={tasks}
                            disabled={sending}
                        />
                        <button
                            onClick={handleSendMessage}
                            className="btn btn-primary"
                            disabled={sending || !newMessage.trim()}
                            style={{ height: '42px' }}
                        >
                            {sending ? '...' : <Send size={18} strokeWidth={2} />}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
