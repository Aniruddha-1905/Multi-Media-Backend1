import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage } from '../../action/messageActions';
import { leaveGroup } from '../../action/groupActions';
import * as api from '../../Api';
import './GroupPage.css';

const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);

    // Get messages from Redux store
    const messages = useSelector(state => state.messages[groupId] || []);

    // Get group from Redux store or local state
    const [group, setGroup] = useState(null);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                setLoading(true);
                setError('');

                // Get the auth token from localStorage
                const token = JSON.parse(localStorage.getItem('Profile'))?.token;
                if (!token) {
                    setError('You must be logged in to view this group');
                    setLoading(false);
                    return;
                }

                // Fetch group details
                try {
                    const { data } = await api.getGroupById(groupId);
                    setGroup(data);
                } catch (err) {
                    console.error('Error fetching group:', err);
                    setError('Failed to load group details');
                    setLoading(false);
                    return;
                }

                // Fetch messages
                try {
                    dispatch(fetchMessages(groupId));
                } catch (err) {
                    console.error('Error fetching messages:', err);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error in fetchGroupData:', error);
                setError('Failed to load group. Please try again.');
                setLoading(false);
            }
        };

        if (groupId) {
            fetchGroupData();
        }
    }, [groupId, dispatch]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        try {
            const result = await dispatch(sendMessage(groupId, message));

            if (result?.error) {
                setError(result.error);
            } else {
                setMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message. Please try again.');
        }
    };

    const handleLeaveGroup = async () => {
        if (window.confirm('Are you sure you want to leave this group?')) {
            try {
                const result = await dispatch(leaveGroup(groupId, navigate));

                if (result?.error) {
                    setError(result.error);
                }
                // Navigation will be handled by the action if successful
            } catch (error) {
                console.error('Error leaving group:', error);
                setError('Failed to leave group. Please try again.');
            }
        }
    };

    const handleCopyInviteLink = () => {
        // Use the direct join link for easier joining
        const inviteUrl = `${window.location.origin}/join-direct/${group.inviteLink}`;
        navigator.clipboard.writeText(inviteUrl)
            .then(() => {
                setLinkCopied(true);
                // Reset the copied state after 3 seconds
                setTimeout(() => setLinkCopied(false), 3000);
            })
            .catch(err => {
                console.error('Failed to copy invite link:', err);
                setError('Failed to copy invite link. Please try again.');
            });
    };

    if (loading) {
        return (
            <div className="group-page-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading group...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="group-page-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p className="error-message">{error}</p>
                    <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="group-page-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Group not found</p>
                    <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="group-page-container">
            <div className="group-header">
                <div className="group-info">
                    <h1>{group.name}</h1>
                    <p>{group.description}</p>
                </div>
                <div className="group-actions">
                    <button
                        onClick={handleCopyInviteLink}
                        className={linkCopied ? "copied-btn" : ""}
                    >
                        {linkCopied ? "Link Copied!" : "Copy Invite Link"}
                    </button>
                    <button onClick={handleLeaveGroup} className="leave-btn">Leave Group</button>
                </div>
            </div>

            <div className="messages-container">
                <div className="messages-list">
                    {messages.length > 0 ? (
                        messages.map(msg => (
                            <div key={msg._id} className="message">
                                <div className="message-avatar">
                                    {msg.sender?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="message-content">
                                    <div className="message-header">
                                        <span className="message-sender">{msg.sender?.name || 'Unknown User'}</span>
                                        <span className="message-time">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="message-body">
                                        {msg.messageBody}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-messages">
                            <p>No messages yet. Be the first to send a message!</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSendMessage} className="message-input">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows="2"
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
};

export default GroupPage;
