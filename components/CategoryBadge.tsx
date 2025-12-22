import { getCategoryLabel } from '@/lib/utils';

interface CategoryBadgeProps {
    category: 'design' | 'content' | 'video' | 'campaign' | 'social' | 'other';
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
    const colorMap = {
        design: '#ec4899',
        content: '#8b5cf6',
        video: '#f59e0b',
        campaign: '#3b82f6',
        social: '#10b981',
        other: '#6b7280',
    };

    return (
        <span
            className="badge"
            style={{
                backgroundColor: `${colorMap[category]}20`,
                color: colorMap[category],
                border: `1px solid ${colorMap[category]}`,
            }}
        >
            {getCategoryLabel(category)}
        </span>
    );
}
