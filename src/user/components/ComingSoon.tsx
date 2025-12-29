import { useState, useEffect } from 'react';
import { IconMail, IconLibrary, IconBook } from '../../admin/components/icons';

interface ComingSoonProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    stats?: Array<{
        label: string;
        value: number;
        suffix?: string;
    }>;
}

export default function ComingSoon({ title, description, icon, stats = [] }: ComingSoonProps) {
    const [animatedStats, setAnimatedStats] = useState<number[]>(stats.map(() => 0));

    useEffect(() => {
        // Animate stats counting up
        if (stats.length > 0) {
            setAnimatedStats(stats.map(() => 0)); // Reset to 0
            
            const timers = stats.map((stat, index) => {
                const duration = 2000; // 2 seconds
                const steps = 60;
                const increment = stat.value / steps;
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= stat.value) {
                        current = stat.value;
                        clearInterval(timer);
                    }
                    setAnimatedStats(prev => {
                        const newStats = [...prev];
                        newStats[index] = Math.floor(current);
                        return newStats;
                    });
                }, duration / steps);

                return timer;
            });

            return () => {
                timers.forEach(timer => clearInterval(timer));
            };
        }
    }, [stats]);

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-content">
                {/* Animated Icon */}
                <div className="coming-soon-icon-wrapper">
                    <div className="icon-pulse">
                        {icon}
                    </div>
                    <div className="icon-ring ring-1"></div>
                    <div className="icon-ring ring-2"></div>
                    <div className="icon-ring ring-3"></div>
                </div>

                {/* Title and Description */}
                <h1 className="coming-soon-title">{title}</h1>
                <p className="coming-soon-description">{description}</p>

                {/* Animated Progress Bar */}
                <div className="progress-container">
                    <div className="progress-bar">
                        <div className="progress-fill"></div>
                    </div>
                    <span className="progress-text">Under Development</span>
                </div>

                {/* Statistics */}
                {stats.length > 0 && (
                    <div className="coming-soon-stats">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-value">
                                    {animatedStats[index] !== undefined ? animatedStats[index].toLocaleString() : '0'}
                                    {stat.suffix && <span className="stat-suffix">{stat.suffix}</span>}
                                </div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Floating Particles Animation */}
                <div className="particles">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="particle" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 2}s`
                        }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

