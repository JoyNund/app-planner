interface EfficiencyBarProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

export default function EfficiencyBar({ score, size = 'md' }: EfficiencyBarProps) {
    const height = size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px';

    // Color based on score
    let color = 'var(--status-urgent)'; // Red (< 50)
    if (score >= 80) color = 'var(--status-completed)'; // Green
    else if (score >= 50) color = 'var(--status-in-progress)'; // Blue/Yellowish

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: size === 'sm' ? '0.7rem' : '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Eficacia</span>
                <span style={{ fontWeight: 600, color }}>{score}%</span>
            </div>
            <div style={{
                width: '100%',
                height,
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${score}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease-in-out'
                }} />
            </div>
        </div>
    );
}
