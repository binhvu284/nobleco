import React from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function SectionHeader({ title, description, action }: SectionHeaderProps) {
    return (
        <div className="section-header">
            <div className="section-header-content">
                <h2 className="section-title">{title}</h2>
                {description && <p className="section-description">{description}</p>}
            </div>
            {action && <div className="section-action">{action}</div>}
        </div>
    );
}

