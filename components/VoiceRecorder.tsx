'use client';

import { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    onCancel: () => void;
}

export default function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecording();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            flex: 1,
        }}>
            <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-urgent)',
                animation: 'pulse 1.5s infinite',
            }} />

            <span style={{
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                flex: 1,
            }}>
                {formatDuration(duration)}
            </span>

            <button
                onClick={() => {
                    if (mediaRecorderRef.current) {
                        // Cancel recording logic
                        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                        onCancel();
                    }
                }}
                className="btn"
                style={{
                    color: 'var(--text-secondary)',
                    padding: 'var(--spacing-xs)',
                }}
            >
                ❌
            </button>

            <button
                onClick={stopRecording}
                className="btn"
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                ✓
            </button>

            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
