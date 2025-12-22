import { getPriorityLabel } from '@/lib/utils';

interface PriorityBadgeProps {
    priority: 'urgent' | 'high' | 'medium' | 'low';
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
    return (
        <span className={`badge badge-${priority}`}>
            {getPriorityLabel(priority)}
        </span>
    );
}
