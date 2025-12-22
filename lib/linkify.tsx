import React from 'react';

// URL regex pattern - matches http, https, and www URLs
const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

interface LinkifyOptions {
    color?: string;
    hoverColor?: string;
}

/**
 * Converts URLs in text to clickable links
 * Returns an array of React elements (text spans and anchor tags)
 */
export function linkifyText(
    text: string, 
    options: LinkifyOptions = {}
): React.ReactNode[] {
    const { 
        color = 'var(--accent-primary)', 
        hoverColor = 'var(--accent-secondary)' 
    } = options;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIndex = 0;
    
    // Reset regex state
    URL_REGEX.lastIndex = 0;
    
    while ((match = URL_REGEX.exec(text)) !== null) {
        // Add text before the URL
        if (match.index > lastIndex) {
            parts.push(
                <span key={`text-${keyIndex++}`}>
                    {text.slice(lastIndex, match.index)}
                </span>
            );
        }
        
        // Get the URL and ensure it has a protocol
        let url = match[0];
        const href = url.startsWith('http') ? url : `https://${url}`;
        
        // Add the link
        parts.push(
            <a
                key={`link-${keyIndex++}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color,
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    wordBreak: 'break-all',
                    transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = hoverColor;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = color;
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {url}
            </a>
        );
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(
            <span key={`text-${keyIndex++}`}>
                {text.slice(lastIndex)}
            </span>
        );
    }
    
    return parts.length > 0 ? parts : [<span key="text-0">{text}</span>];
}

/**
 * Check if text contains any URLs
 */
export function containsUrl(text: string): boolean {
    URL_REGEX.lastIndex = 0;
    return URL_REGEX.test(text);
}
