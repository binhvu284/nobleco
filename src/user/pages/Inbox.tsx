import { useState } from 'react';
import UserLayout from '../components/UserLayout';
import { IconSearch, IconFilter, IconMail, IconCheck, IconX } from '../../admin/components/icons';

interface Message {
    id: number;
    title: string;
    content: string;
    type: 'announcement' | 'notification' | 'message';
    priority: 'high' | 'medium' | 'low';
    read: boolean;
    timestamp: string;
    sender?: string;
}

export default function Inbox() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'announcement' | 'notification' | 'message'>('all');
    const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    // Mock data - will be replaced with API calls later
    const [messages] = useState<Message[]>([
        {
            id: 1,
            title: 'New Product Launch',
            content: 'We are excited to announce the launch of our new product line. Check out the latest additions to our catalog.',
            type: 'announcement',
            priority: 'high',
            read: false,
            timestamp: '2025-01-15T10:30:00',
            sender: 'Admin'
        },
        {
            id: 2,
            title: 'Monthly Training Session',
            content: 'Join us for this month\'s training session on product knowledge and sales techniques.',
            type: 'notification',
            priority: 'medium',
            read: false,
            timestamp: '2025-01-14T14:20:00',
            sender: 'Training Team'
        },
        {
            id: 3,
            title: 'Commission Payment Processed',
            content: 'Your commission payment for last month has been processed and will be available in your wallet shortly.',
            type: 'message',
            priority: 'low',
            read: true,
            timestamp: '2025-01-13T09:15:00',
            sender: 'Finance Team'
        },
        {
            id: 4,
            title: 'Community Event This Weekend',
            content: 'Don\'t miss our community event this weekend. Great networking opportunities and exclusive deals.',
            type: 'announcement',
            priority: 'high',
            read: false,
            timestamp: '2025-01-12T16:45:00',
            sender: 'Events Team'
        }
    ]);

    const filteredMessages = messages.filter(msg => {
        const matchesSearch = searchQuery === '' || 
            msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || msg.type === filterType;
        const matchesPriority = filterPriority === 'all' || msg.priority === filterPriority;
        const matchesRead = filterRead === 'all' || 
            (filterRead === 'read' && msg.read) || 
            (filterRead === 'unread' && !msg.read);
        
        return matchesSearch && matchesType && matchesPriority && matchesRead;
    });

    const unreadCount = messages.filter(msg => !msg.read).length;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getTypeIcon = (type: string) => {
        return <IconMail />;
    };

    return (
        <UserLayout title="Inbox">
            <div className="inbox-page">
                <div className="inbox-container">
                    {/* Sidebar - Message List */}
                    <div className="inbox-sidebar">
                        <div className="inbox-header">
                            <h2>Inbox</h2>
                            {unreadCount > 0 && (
                                <span className="unread-badge">{unreadCount}</span>
                            )}
                        </div>

                        {/* Search and Filters */}
                        <div className="inbox-filters">
                            <div className="search-container">
                                <IconSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            <div className="filter-group">
                                <select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className="filter-select"
                                >
                                    <option value="all">All Types</option>
                                    <option value="announcement">Announcements</option>
                                    <option value="notification">Notifications</option>
                                    <option value="message">Messages</option>
                                </select>

                                <select 
                                    value={filterPriority} 
                                    onChange={(e) => setFilterPriority(e.target.value as any)}
                                    className="filter-select"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>

                                <select 
                                    value={filterRead} 
                                    onChange={(e) => setFilterRead(e.target.value as any)}
                                    className="filter-select"
                                >
                                    <option value="all">All</option>
                                    <option value="unread">Unread</option>
                                    <option value="read">Read</option>
                                </select>
                            </div>
                        </div>

                        {/* Message List */}
                        <div className="message-list">
                            {filteredMessages.length === 0 ? (
                                <div className="empty-state">
                                    <IconMail style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
                                    <p>No messages found</p>
                                </div>
                            ) : (
                                filteredMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message-item ${!message.read ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedMessage(message)}
                                    >
                                        <div className="message-item-header">
                                            <div className="message-icon" style={{ color: getPriorityColor(message.priority) }}>
                                                {getTypeIcon(message.type)}
                                            </div>
                                            <div className="message-info">
                                                <h3 className="message-title">{message.title}</h3>
                                                <div className="message-meta">
                                                    {message.sender && <span className="message-sender">{message.sender}</span>}
                                                    <span className="message-time">{formatDate(message.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {message.priority === 'high' && (
                                            <div className="priority-badge" style={{ backgroundColor: getPriorityColor(message.priority) }}>
                                                High Priority
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content - Message Detail */}
                    <div className="inbox-content">
                        {selectedMessage ? (
                            <div className="message-detail">
                                <div className="message-detail-header">
                                    <div>
                                        <h1>{selectedMessage.title}</h1>
                                        <div className="message-detail-meta">
                                            {selectedMessage.sender && (
                                                <span className="sender">From: {selectedMessage.sender}</span>
                                            )}
                                            <span className="timestamp">{formatDate(selectedMessage.timestamp)}</span>
                                            <span 
                                                className="priority-tag" 
                                                style={{ backgroundColor: getPriorityColor(selectedMessage.priority) + '20', color: getPriorityColor(selectedMessage.priority) }}
                                            >
                                                {selectedMessage.priority} priority
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        className="close-btn"
                                        onClick={() => setSelectedMessage(null)}
                                    >
                                        <IconX />
                                    </button>
                                </div>
                                <div className="message-detail-body">
                                    <p>{selectedMessage.content}</p>
                                </div>
                                <div className="message-detail-actions">
                                    <button className="btn-primary">
                                        <IconCheck /> Mark as Read
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-message-state">
                                <IconMail style={{ fontSize: '64px', color: '#9ca3af', marginBottom: '24px' }} />
                                <h3>Select a message to view</h3>
                                <p>Choose a message from the list to read its content</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}

