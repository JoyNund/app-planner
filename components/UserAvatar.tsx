import { getInitials } from '@/lib/utils';

interface UserAvatarProps {
    name: string;
    color: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function UserAvatar({ name, color, size = 'md' }: UserAvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    return (
        <div
            className="user-avatar"
            style={{
                backgroundColor: color,
                width: size === 'sm' ? '2rem' : size === 'md' ? '2.5rem' : '3rem',
                height: size === 'sm' ? '2rem' : size === 'md' ? '2.5rem' : '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontWeight: 700,
                fontSize: size === 'sm' ? '0.75rem' : size === 'md' ? '0.875rem' : '1rem',
                color: 'white',
                flexShrink: 0,
            }}
        >
            {getInitials(name)}
        </div>
    );
}
