'use client';

import { useState, useEffect } from 'react';

interface Sticker {
    id: number;
    filename: string;
    filepath: string;
}

interface StickerPack {
    id: number;
    name: string;
    stickers: Sticker[];
}

interface StickerPickerProps {
    onSelect: (stickerId: string, filepath: string) => void;
    onClose: () => void;
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
    const [packs, setPacks] = useState<StickerPack[]>([]);
    const [activePackId, setActivePackId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStickers = async () => {
            try {
                const res = await fetch('/api/stickers');
                if (res.ok) {
                    const data = await res.json();
                    setPacks(data.packs);
                    if (data.packs.length > 0) {
                        setActivePackId(data.packs[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching stickers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStickers();
    }, []);

    const activePack = packs.find(p => p.id === activePackId);

    return (
        <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            width: '320px',
            height: '300px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            marginBottom: 'var(--spacing-sm)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: 'var(--spacing-sm)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)',
            }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Stickers</span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        lineHeight: 1,
                    }}
                >
                    ×
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    Cargando...
                </div>
            ) : packs.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    No hay stickers disponibles
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Stickers Grid */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 'var(--spacing-md)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--spacing-sm)',
                        alignContent: 'start',
                    }}>
                        {activePack?.stickers.map(sticker => (
                            <button
                                key={sticker.id}
                                onClick={() => onSelect(sticker.id.toString(), sticker.filepath)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 'var(--spacing-xs)',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'background 0.2s',
                                }}
                                className="hover:bg-white/5"
                            >
                                <img
                                    src={sticker.filepath}
                                    alt="sticker"
                                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Pack Tabs */}
                    <div style={{
                        display: 'flex',
                        overflowX: 'auto',
                        borderTop: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: 'var(--spacing-xs)',
                        gap: 'var(--spacing-xs)',
                    }}>
                        {packs.map(pack => (
                            <button
                                key={pack.id}
                                onClick={() => setActivePackId(pack.id)}
                                style={{
                                    background: activePackId === pack.id ? 'var(--bg-secondary)' : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    color: activePackId === pack.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {pack.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
