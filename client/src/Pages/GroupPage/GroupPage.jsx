import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage } from '../../action/messageActions';
import { leaveGroup } from '../../action/groupActions';
import * as api from '../../Api';
import io from 'socket.io-client';
import './GroupPage.css';

const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copyNotification, setCopyNotification] = useState(false);
    const [copiedLinkType, setCopiedLinkType] = useState(''); // 'local', 'deployed', or empty
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef(null);

    // Get messages from Redux store
    const messages = useSelector(state => state.messages[groupId] || []);

    // Get current user from Redux store
    const currentuser = useSelector(state => state.currentuserreducer);

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

    // Initialize socket connection
    useEffect(() => {
        // Connect to socket server
        socketRef.current = io('http://localhost:5000/', {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            transports: ['websocket', 'polling']
        });

        // Set up socket connection listeners
        socketRef.current.on('connect', () => {
            console.log(`Socket connected with ID: ${socketRef.current.id}`);
            setSocketConnected(true);

            // Join the group room if we have user and group info
            if (currentuser?.result?._id && group?._id) {
                socketRef.current.emit('joinGroup', {
                    groupId: group._id,
                    userId: currentuser.result._id,
                    userName: currentuser.result.name || 'Anonymous'
                });
            }
        });

        // Handle socket disconnection
        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
            setSocketConnected(false);
        });

        // Handle socket connection errors
        socketRef.current.on('connect_error', (error) => {
            console.log(`Socket connection error: ${error.message}`);
            setSocketConnected(false);
        });

        // Clean up socket connection on component unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [currentuser, group]);

    // Set up group-specific socket event handlers
    useEffect(() => {
        if (!socketRef.current || !socketConnected || !group?._id) return;

        // Clear any existing listeners to prevent duplicates
        socketRef.current.off('userJoinedGroup');
        socketRef.current.off('userLeftGroup');
        socketRef.current.off('userOfflineGroup');
        socketRef.current.off('newGroupMessage');
        socketRef.current.off('groupParticipants');
        socketRef.current.off('newGroupInvite');

        // Handle new users joining the group
        socketRef.current.on('userJoinedGroup', ({ userId, userName, timestamp }) => {
            console.log(`User ${userName} (${userId}) joined the group`);
            setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
        });

        // Handle users leaving the group
        socketRef.current.on('userLeftGroup', ({ userId, timestamp }) => {
            console.log(`User ${userId} left the group`);
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        // Handle users going offline
        socketRef.current.on('userOfflineGroup', ({ userId, timestamp }) => {
            console.log(`User ${userId} went offline`);
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        });

        // Handle receiving current group participants
        socketRef.current.on('groupParticipants', ({ participants }) => {
            console.log(`Received ${participants.length} group participants`);
            const onlineUserIds = participants
                .filter(p => p.online !== false)
                .map(p => p.userId);
            setOnlineUsers(onlineUserIds);
        });

        // Handle new messages
        socketRef.current.on('newGroupMessage', (messageData) => {
            console.log(`New message received from ${messageData.userName}`);
            // We'll let Redux handle message updates through the regular API
            dispatch(fetchMessages(group._id));
        });

        // Handle new group invites
        socketRef.current.on('newGroupInvite', ({ inviteLink, inviterId, inviterName }) => {
            console.log(`New invite created by ${inviterName} (${inviterId}): ${inviteLink}`);
        });

        // Join the group room if we have user info
        if (currentuser?.result?._id) {
            socketRef.current.emit('joinGroup', {
                groupId: group._id,
                userId: currentuser.result._id,
                userName: currentuser.result.name || 'Anonymous'
            });
        }
    }, [socketConnected, group, currentuser, dispatch]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        try {
            // Send message through API for persistence
            const result = await dispatch(sendMessage(groupId, message));

            if (result?.error) {
                setError(result.error);
            } else {
                // If API call was successful, also emit through socket for real-time updates
                if (socketRef.current && socketConnected && currentuser?.result?._id) {
                    socketRef.current.emit('groupMessage', {
                        groupId,
                        message: message.trim(),
                        userId: currentuser.result._id,
                        userName: currentuser.result.name || 'Anonymous'
                    });
                }

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
                // Notify other users via socket that we're leaving
                if (socketRef.current && socketConnected && currentuser?.result?._id) {
                    socketRef.current.emit('leaveGroup', {
                        groupId: group._id,
                        userId: currentuser.result._id
                    });
                }

                // Call the API to actually leave the group
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

    // Function to copy the local invite link
    const copyLocalInviteLink = () => {
        // Create local invite URL
        const localInviteUrl = `http://localhost:3000/join/${group.inviteLink}`;

        // Copy to clipboard
        navigator.clipboard.writeText(localInviteUrl)
            .then(() => {
                // Show notification
                setCopyNotification(true);
                setCopiedLinkType('local');

                // Hide notification after 3 seconds
                setTimeout(() => {
                    setCopyNotification(false);
                    setCopiedLinkType('');
                }, 3000);

                // Emit socket event to notify other group members
                if (socketRef.current && socketConnected && currentuser?.result?._id) {
                    socketRef.current.emit('groupInvite', {
                        groupId: group._id,
                        inviteLink: group.inviteLink,
                        inviterId: currentuser.result._id,
                        inviterName: currentuser.result.name || 'Anonymous'
                    });
                }

                console.log(`Copied local invite link to clipboard: ${localInviteUrl}`);
            })
            .catch(err => {
                console.error('Failed to copy local invite link:', err);
                alert('Failed to copy local invite link. Please try again.');
            });
    };

    // Function to format message timestamp to show date and time
    const formatMessageTime = (timestamp) => {
        const messageDate = new Date(timestamp);
        const now = new Date();

        // Check if the message is from today
        const isToday = messageDate.toDateString() === now.toDateString();

        // Check if the message is from yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = messageDate.toDateString() === yesterday.toDateString();

        // Check if the message is from this year
        const isThisYear = messageDate.getFullYear() === now.getFullYear();

        // Format the time (hours and minutes)
        const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            // If message is from today, just show the time
            return `Today at ${timeString}`;
        } else if (isYesterday) {
            // If message is from yesterday, show "Yesterday" and the time
            return `Yesterday at ${timeString}`;
        } else if (isThisYear) {
            // If message is from this year, show month and day with time
            const dateString = messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return `${dateString} at ${timeString}`;
        } else {
            // For older messages, show full date with time
            const dateString = messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
            return `${dateString} at ${timeString}`;
        }
    };

    // Function to copy the deployed invite link
    const copyDeployedInviteLink = () => {
        // Create deployed invite URL
        const deployedInviteUrl = `https://peppy-belekoy-71b433.netlify.app/join-deployed/${group.inviteLink}`;

        // Copy to clipboard
        navigator.clipboard.writeText(deployedInviteUrl)
            .then(() => {
                // Show notification
                setCopyNotification(true);
                setCopiedLinkType('deployed');

                // Hide notification after 3 seconds
                setTimeout(() => {
                    setCopyNotification(false);
                    setCopiedLinkType('');
                }, 3000);

                // Emit socket event to notify other group members
                if (socketRef.current && socketConnected && currentuser?.result?._id) {
                    socketRef.current.emit('groupInvite', {
                        groupId: group._id,
                        inviteLink: group.inviteLink,
                        inviterId: currentuser.result._id,
                        inviterName: currentuser.result.name || 'Anonymous'
                    });
                }

                console.log(`Copied deployed invite link to clipboard: ${deployedInviteUrl}`);
            })
            .catch(err => {
                console.error('Failed to copy deployed invite link:', err);
                alert('Failed to copy deployed invite link. Please try again.');
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
                    <div className="invite-link-container">
                        <div className="invite-buttons">
                            <button onClick={copyLocalInviteLink} className="copy-link-btn local-link-btn">
                                {copyNotification && copiedLinkType === 'local' ? 'Copied!' : 'Copy Local Link'}
                            </button>
                            <button onClick={copyDeployedInviteLink} className="copy-link-btn deployed-link-btn">
                                {copyNotification && copiedLinkType === 'deployed' ? 'Copied!' : 'Copy Deployed Link'}
                            </button>
                        </div>
                        {copyNotification && (
                            <div className="copy-notification">
                                {copiedLinkType === 'local' ? 'Local invite link copied to clipboard!' :
                                 copiedLinkType === 'deployed' ? 'Deployed invite link copied to clipboard!' :
                                 'Invite link copied to clipboard!'}
                            </div>
                        )}
                    </div>
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
                                        <div className="sender-info">
                                            <span className="message-sender">{msg.sender?.name || 'Unknown User'}</span>
                                            {onlineUsers.includes(msg.sender?._id) && (
                                                <span className="online-indicator" title="Online"></span>
                                            )}
                                        </div>
                                        <span className="message-time" title={new Date(msg.timestamp).toLocaleString()}>
                                            {formatMessageTime(msg.timestamp)}
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
