'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, Loader2, Image, X, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TaskAIAssistantProps {
    taskTitle: string;
    taskDescription?: string | null;
    taskId?: number;
    onDiscard?: () => void;
    onClearChatReady?: (clearFn: () => Promise<void>) => void;
}

interface MediaFile {
    type: 'image' | 'video';
    url: string;
    filename: string;
    mime_type?: string;
}

interface ChatMessage {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    media_files?: MediaFile[] | null;
    created_at: string;
}

export default function TaskAIAssistant({ taskTitle, taskDescription, taskId, onClearChatReady }: TaskAIAssistantProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialPlanLoading, setInitialPlanLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<MediaFile[]>([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load chat history on mount
    useEffect(() => {
        if (!taskId) return;

        const loadChatHistory = async () => {
            try {
                const res = await fetch(`/api/ai/chat?taskId=${taskId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                    
                    // If no messages, generate initial plan
                    if (data.messages.length === 0) {
                        generateInitialPlan();
                    }
                }
            } catch (err) {
                console.error('Error loading chat history:', err);
            }
        };

        loadChatHistory();
    }, [taskId]);

    const generateInitialPlan = useCallback(async () => {
        if (!taskId) return;

        setInitialPlanLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    message: `Genera un plan de acción para esta tarea: ${taskTitle}${taskDescription ? `\n\nDescripción: ${taskDescription}` : ''}`,
                    isInitialPlan: true,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al generar plan');
            }

            const data = await res.json();
            
            // Reload chat history to get the new messages
            const historyRes = await fetch(`/api/ai/chat?taskId=${taskId}`);
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setMessages(historyData.messages || []);
            }
        } catch (err: any) {
            console.error('Error generating initial plan:', err);
            setError(err.message || 'Error al generar el plan inicial');
        } finally {
            setInitialPlanLoading(false);
        }
    }, [taskId, taskTitle, taskDescription]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingFile(true);
        setError(null);

        try {
            const file = files[0];
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/ai/chat/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al subir archivo');
            }

            const data = await res.json();
            setAttachedFiles(prev => [...prev, {
                type: data.file_type,
                url: data.filepath,
                filename: data.filename,
                mime_type: data.mime_type,
            }]);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            console.error('Error uploading file:', err);
            setError(err.message || 'Error al subir el archivo');
        } finally {
            setUploadingFile(false);
        }
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearChat = useCallback(async () => {
        if (!taskId) return;
        
        // Only show confirm when user explicitly clicks the button
        // This should NEVER be called automatically - only on user click
        const userConfirmed = confirm('¿Estás seguro de que deseas limpiar el historial del chat? Esta acción no se puede deshacer.');
        if (!userConfirmed) {
            return;
        }

        try {
            const res = await fetch(`/api/ai/chat?taskId=${taskId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMessages([]);
                setError(null);
                // Optionally regenerate initial plan
                if (taskTitle) {
                    generateInitialPlan();
                }
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al limpiar el chat');
            }
        } catch (err: any) {
            console.error('Error clearing chat:', err);
            setError(err.message || 'Error al limpiar el chat');
        }
    }, [taskId, taskTitle, generateInitialPlan]); // Memoize to prevent recreation

    // Expose clear chat function to parent (only when taskId changes)
    // Use a ref to track the last taskId to avoid re-exposing unnecessarily
    const lastTaskIdRef = useRef<number | undefined>(undefined);
    useEffect(() => {
        // Only expose if taskId changed and we have the callback
        if (onClearChatReady && taskId && taskId !== lastTaskIdRef.current) {
            onClearChatReady(handleClearChat);
            lastTaskIdRef.current = taskId;
        }
        // Reset when taskId is cleared
        if (!taskId) {
            lastTaskIdRef.current = undefined;
        }
    }, [taskId, handleClearChat, onClearChatReady]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputMessage.trim() && attachedFiles.length === 0) || !taskId || loading) return;

        const userMessage = inputMessage.trim() || (attachedFiles.length > 0 ? 'Ver archivo adjunto' : '');
        const filesToSend = [...attachedFiles];
        setInputMessage('');
        setAttachedFiles([]);
        setLoading(true);
        setError(null);

        // Optimistically add user message
        const tempUserMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            media_files: filesToSend.length > 0 ? filesToSend : null,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            // If there are files, use FormData, otherwise use JSON
            let res: Response;
            
            if (filesToSend.length > 0) {
                const formData = new FormData();
                formData.append('taskId', taskId.toString());
                formData.append('message', userMessage);
                formData.append('isInitialPlan', 'false');
                
                // Add files to FormData - files are already on server, just send paths
                for (const file of filesToSend) {
                    // Fetch the file from server and add it
                    const fileRes = await fetch(file.url);
                    const blob = await fileRes.blob();
                    formData.append('files', blob, file.filename);
                }

                res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    body: formData,
                });
            } else {
                res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId,
                        message: userMessage,
                        isInitialPlan: false,
                    }),
                });
            }

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al enviar mensaje');
            }

            const data = await res.json();
            
            // Reload chat history to get the complete conversation
            const historyRes = await fetch(`/api/ai/chat?taskId=${taskId}`);
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                const loadedMessages = (historyData.messages || []).map((msg: any) => ({
                    ...msg,
                    media_files: msg.media_files 
                        ? (typeof msg.media_files === 'string' ? JSON.parse(msg.media_files) : msg.media_files)
                        : null,
                }));
                setMessages(loadedMessages);
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            setError(err.message || 'Error al enviar el mensaje');
            // Remove the optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'transparent',
            overflow: 'hidden',
        }}>
            {/* Error */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    margin: 'var(--spacing-md)',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                }}>
                    {error}
                </div>
            )}

            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                }}
            >
                {initialPlanLoading && messages.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        color: 'var(--text-secondary)',
                    }}>
                        <Loader2 size={32} className="spin" style={{ marginBottom: 'var(--spacing-md)' }} />
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                            Generando plan de acción...
                        </p>
                    </div>
                )}

                {messages.map((message) => {
                    const mediaFiles = message.media_files 
                        ? (typeof message.media_files === 'string' ? JSON.parse(message.media_files) : message.media_files)
                        : null;
                    
                    return (
                        <div
                            key={message.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                                gap: '4px',
                            }}
                        >
                            <div style={{
                                maxWidth: '80%',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                background: message.role === 'user' 
                                    ? 'var(--accent-primary)' 
                                    : 'var(--bg-tertiary)',
                                color: message.role === 'user' 
                                    ? 'white' 
                                    : 'var(--text-primary)',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--spacing-sm)',
                            }}>
                                {/* Media files */}
                                {mediaFiles && mediaFiles.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--spacing-xs)',
                                        marginBottom: message.content ? 'var(--spacing-xs)' : 0,
                                    }}>
                                        {mediaFiles.map((file: MediaFile, idx: number) => (
                                            <div key={idx} style={{
                                                borderRadius: 'var(--radius-sm)',
                                                overflow: 'hidden',
                                                maxWidth: '100%',
                                            }}>
                                                {file.type === 'image' ? (
                                                    <img 
                                                        src={file.url} 
                                                        alt={file.filename}
                                                        style={{
                                                            maxWidth: '300px',
                                                            maxHeight: '300px',
                                                            objectFit: 'contain',
                                                            borderRadius: 'var(--radius-sm)',
                                                        }}
                                                    />
                                                ) : (
                                                    <video 
                                                        src={file.url}
                                                        controls
                                                        style={{
                                                            maxWidth: '300px',
                                                            maxHeight: '300px',
                                                            borderRadius: 'var(--radius-sm)',
                                                        }}
                                                    >
                                                        Tu navegador no soporta videos.
                                                    </video>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Text content */}
                                {message.content && (
                                    <div style={{
                                        lineHeight: '1.6',
                                    }}>
                                        {message.role === 'assistant' ? (
                                            <ReactMarkdown
                                                components={{
                                                    // Estilos para elementos de markdown
                                                    p: ({ children }) => (
                                                        <p style={{ margin: '0 0 0.75rem 0', lineHeight: '1.6' }}>
                                                            {children}
                                                        </p>
                                                    ),
                                                    strong: ({ children }) => (
                                                        <strong style={{ fontWeight: 600, color: 'inherit' }}>
                                                            {children}
                                                        </strong>
                                                    ),
                                                    em: ({ children }) => (
                                                        <em style={{ fontStyle: 'italic', color: 'inherit' }}>
                                                            {children}
                                                        </em>
                                                    ),
                                                    code: ({ children, className }) => {
                                                        const isInline = !className;
                                                        return isInline ? (
                                                            <code style={{
                                                                background: 'rgba(0, 0, 0, 0.1)',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.9em',
                                                                fontFamily: 'monospace',
                                                            }}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code style={{
                                                                display: 'block',
                                                                background: 'rgba(0, 0, 0, 0.1)',
                                                                padding: '12px',
                                                                borderRadius: '6px',
                                                                fontSize: '0.85em',
                                                                fontFamily: 'monospace',
                                                                overflow: 'auto',
                                                                margin: '0.5rem 0',
                                                            }}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                    ul: ({ children }) => (
                                                        <ul style={{
                                                            margin: '0.5rem 0',
                                                            paddingLeft: '1.5rem',
                                                            listStyleType: 'disc',
                                                        }}>
                                                            {children}
                                                        </ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol style={{
                                                            margin: '0.5rem 0',
                                                            paddingLeft: '1.5rem',
                                                            listStyleType: 'decimal',
                                                        }}>
                                                            {children}
                                                        </ol>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li style={{ margin: '0.25rem 0' }}>
                                                            {children}
                                                        </li>
                                                    ),
                                                    h1: ({ children }) => (
                                                        <h1 style={{
                                                            fontSize: '1.5rem',
                                                            fontWeight: 600,
                                                            margin: '1rem 0 0.5rem 0',
                                                        }}>
                                                            {children}
                                                        </h1>
                                                    ),
                                                    h2: ({ children }) => (
                                                        <h2 style={{
                                                            fontSize: '1.25rem',
                                                            fontWeight: 600,
                                                            margin: '0.75rem 0 0.5rem 0',
                                                        }}>
                                                            {children}
                                                        </h2>
                                                    ),
                                                    h3: ({ children }) => (
                                                        <h3 style={{
                                                            fontSize: '1.1rem',
                                                            fontWeight: 600,
                                                            margin: '0.5rem 0 0.25rem 0',
                                                        }}>
                                                            {children}
                                                        </h3>
                                                    ),
                                                    blockquote: ({ children }) => (
                                                        <blockquote style={{
                                                            borderLeft: '3px solid var(--accent-primary)',
                                                            paddingLeft: '1rem',
                                                            margin: '0.5rem 0',
                                                            fontStyle: 'italic',
                                                            opacity: 0.9,
                                                        }}>
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                    a: ({ children, href }) => (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                color: 'var(--accent-primary)',
                                                                textDecoration: 'underline',
                                                            }}
                                                        >
                                                            {children}
                                                        </a>
                                                    ),
                                                    hr: () => (
                                                        <hr style={{
                                                            border: 'none',
                                                            borderTop: '1px solid var(--border-color)',
                                                            margin: '1rem 0',
                                                        }} />
                                                    ),
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                {message.content}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                padding: '0 var(--spacing-xs)',
                            }}>
                                {new Date(message.created_at).toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    );
                })}

                {loading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--spacing-sm)',
                    }}>
                        <div style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                        }}>
                            <Loader2 size={16} className="spin" />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Pensando...
                            </span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
                <div style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-xs)',
                }}>
                    {attachedFiles.map((file, idx) => (
                        <div key={idx} style={{
                            position: 'relative',
                            display: 'inline-block',
                        }}>
                            {file.type === 'image' ? (
                                <img 
                                    src={file.url} 
                                    alt={file.filename}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)',
                                    }}
                                />
                            ) : (
                                <video 
                                    src={file.url}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)',
                                    }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => removeAttachedFile(idx)}
                                style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <form
                onSubmit={sendMessage}
                style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={uploadingFile || loading || initialPlanLoading || !taskId}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || loading || initialPlanLoading || !taskId}
                    style={{
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: uploadingFile || loading || initialPlanLoading || !taskId
                            ? 'not-allowed'
                            : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: uploadingFile || loading || initialPlanLoading || !taskId ? 0.6 : 1,
                        transition: 'all 0.2s',
                    }}
                    title="Subir imagen o video"
                >
                    {uploadingFile ? (
                        <Loader2 size={18} className="spin" />
                    ) : (
                        <Image size={18} />
                    )}
                </button>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={loading || initialPlanLoading || !taskId}
                    style={{
                        flex: 1,
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || initialPlanLoading || (!inputMessage.trim() && attachedFiles.length === 0) || !taskId}
                    style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: loading || initialPlanLoading || (!inputMessage.trim() && attachedFiles.length === 0) || !taskId
                            ? 'var(--bg-hover)'
                            : 'var(--accent-primary)',
                        color: 'white',
                        cursor: loading || initialPlanLoading || (!inputMessage.trim() && attachedFiles.length === 0) || !taskId
                            ? 'not-allowed'
                            : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading || initialPlanLoading || (!inputMessage.trim() && attachedFiles.length === 0) || !taskId ? 0.6 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {loading ? (
                        <Loader2 size={18} className="spin" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </form>
        </div>
    );
}
