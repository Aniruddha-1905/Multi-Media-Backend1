import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import './VOIP.css';

// Process polyfill is now imported globally from polyfills.js

const VOIP = () => {
  const { roomId } = useParams();
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isScreenShareFullscreen, setIsScreenShareFullscreen] = useState(false);
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [participantNames, setParticipantNames] = useState({});
  const [participantVideos, setParticipantVideos] = useState({});
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [debugInfo, setDebugInfo] = useState([]);

  // Function to add debug messages
  const addDebugMessage = (message) => {
    console.log(message);
    setDebugInfo(prev => [message, ...prev].slice(0, 10)); // Keep last 10 messages
  };
  const [userId] = useState(Math.random().toString(36).substr(2, 9)); // Generate a random user ID
  const [userName] = useState(`User-${Math.random().toString(36).substr(2, 4)}`); // Generate a random user name

  const audioRef = useRef();
  const videoRef = useRef();
  const screenShareRef = useRef();
  const navigate = useNavigate();

  // Initialize socket connection
  useEffect(() => {
    addDebugMessage('Initializing socket connection');
    // Connect to the socket server
    socketRef.current = io('http://localhost:5000/', {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      forceNew: true
    });

    // Set up socket connection listeners
    socketRef.current.on('connect', () => {
      addDebugMessage(`Socket connected with ID: ${socketRef.current.id}`);
      setSocketConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      addDebugMessage('Socket disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      addDebugMessage(`Socket connection error: ${error.message}`);
      setSocketConnected(false);
    });

    return () => {
      addDebugMessage('Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Main VOIP effect
  useEffect(() => {
    if (!socketRef.current || !socketConnected) {
      addDebugMessage('Waiting for socket connection...');
      return;
    }

    // Clear any existing listeners to prevent duplicates
    socketRef.current.off('existingParticipants');
    socketRef.current.off('userJoinedVoip');
    socketRef.current.off('voipSignal');
    socketRef.current.off('userLeftVoip');
    socketRef.current.off('roomUpdate');

    addDebugMessage(`VOIP component mounted, roomId: ${roomId}`);

    // Get audio stream initially (video will be added on demand)
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((mediaStream) => {
        addDebugMessage('Got audio stream');
        setStream(mediaStream);
        if (audioRef.current) {
          audioRef.current.srcObject = mediaStream;
        }
        addDebugMessage('Audio stream set to ref');

        // Join the room
        addDebugMessage(`Joining VOIP room with ID: ${roomId} as user: ${userId} (${userName})`);
        socketRef.current.emit('joinVoipRoom', { roomId, userId, userName });
        setCallStatus('Connected');
        setIsConnected(true);

        // Listen for room updates (new event)
        socketRef.current.on('roomUpdate', ({ participants }) => {
          if (!participants) return;

          addDebugMessage(`Room update received with ${participants.length} participants`);

          // Filter out our own user ID
          const otherParticipants = participants.filter(p => p.userId !== userId);

          // Update participants list
          const participantIds = otherParticipants.map(p => p.userId);
          setParticipants(participantIds);

          // Update participant names
          const names = {};
          otherParticipants.forEach(p => {
            names[p.userId] = p.userName || `User-${p.userId.substring(0, 4)}`;
          });
          setParticipantNames(names);

          addDebugMessage(`Updated participants list: ${participantIds.join(', ') || 'none'}`);
        });

        // Listen for existing participants in the room
        socketRef.current.on('existingParticipants', ({ participants }) => {
          addDebugMessage(`Received ${participants.length} existing participants: ${JSON.stringify(participants)}`);

          // Add all existing participants
          const newParticipants = participants.map(p => p.userId);
          setParticipants(prev => [...prev, ...newParticipants]);

          // Store all participant names
          const newNames = {};
          participants.forEach(p => {
            newNames[p.userId] = p.userName || `User-${p.userId.substring(0, 4)}`;
            addDebugMessage(`Added participant: ${p.userId} (${p.userName || 'Unknown'})`);
          });
          setParticipantNames(prev => ({ ...prev, ...newNames }));

          // Create peer connections for each existing participant
          participants.forEach(participant => {
            const peer = new SimplePeer({
              initiator: true,
              trickle: false,
              stream: mediaStream,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:global.stun.twilio.com:3478' }
                ]
              }
            });

            peer.on('signal', (signalData) => {
              socketRef.current.emit('voipSignal', { to: participant.userId, from: userId, signalData });
            });

            peer.on('error', (err) => {
              addDebugMessage(`Peer connection error with ${participant.userId}: ${err.message}`);
              console.error('Peer connection error:', err);
            });

            peer.on('stream', (remoteStream) => {
              addDebugMessage(`Received stream from ${participant.userId}`);

              // Check if there's a video track
              const hasVideo = remoteStream.getVideoTracks().length > 0;

              // Create an audio element for the remote stream
              const audio = document.createElement('audio');
              audio.id = `audio-${participant.userId}`;
              audio.srcObject = remoteStream;
              audio.autoplay = true;
              document.body.appendChild(audio);

              // If there's video, create a video element
              if (hasVideo) {
                const videoContainer = document.getElementById(`video-container-${participant.userId}`);
                if (videoContainer) {
                  // Clear the placeholder
                  videoContainer.innerHTML = '';

                  // Create video element
                  const video = document.createElement('video');
                  video.id = `video-${participant.userId}`;
                  video.srcObject = remoteStream;
                  video.autoplay = true;
                  video.playsInline = true;
                  video.style.width = '100%';
                  video.style.height = '100%';
                  video.style.objectFit = 'cover';

                  videoContainer.appendChild(video);
                  addDebugMessage(`Added video for ${participant.userId}`);
                }
              }
            });

            // Handle data channel messages
            peer.on('data', (data) => {
              try {
                const message = JSON.parse(data.toString());
                addDebugMessage(`Received message from ${participant.userId}: ${message.type}`);

                // Handle video state changes
                if (message.type === 'videoState') {
                  const videoContainer = document.getElementById(`video-container-${participant.userId}`);
                  if (videoContainer) {
                    if (!message.enabled) {
                      // Video turned off, show placeholder
                      videoContainer.innerHTML = `
                        <div class="participant-avatar">
                          ${(participantNames[participant.userId] || `User-${participant.userId.substring(0, 4)}`).substring(0, 2).toUpperCase()}
                        </div>
                      `;
                    }
                    // If enabled, the video will be added when the stream is received
                  }
                }
              } catch (error) {
                console.error('Error parsing data message:', error);
              }
            });

            setPeers(prevPeers => [...prevPeers, { peer, userId: participant.userId }]);
          });
        });

        // Listen for new users joining the room
        socketRef.current.on('userJoinedVoip', (data) => {
          addDebugMessage(`New user joined: ${data.userId} (${data.userName || 'Unknown'})`);

          // Check if this user is already in our participants list
          if (!participants.includes(data.userId)) {
            setParticipants(prev => [...prev, data.userId]);

            // Store the user's name
            setParticipantNames(prev => ({
              ...prev,
              [data.userId]: data.userName || `User-${data.userId.substring(0, 4)}`
            }));
          } else {
            addDebugMessage(`User ${data.userId} is already in participants list`);
          }

          // Create a new peer connection
          const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: mediaStream,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
              ]
            }
          });

          // When we have a signal to send
          peer.on('signal', (signalData) => {
            socketRef.current.emit('voipSignal', { to: data.userId, from: userId, signalData });
          });

          peer.on('error', (err) => {
            addDebugMessage(`Peer connection error with ${data.userId}: ${err.message}`);
            console.error('Peer connection error:', err);
          });

          // When we receive a stream from the peer
          peer.on('stream', (remoteStream) => {
            addDebugMessage(`Received stream from new user ${data.userId}`);

            // Check if there's a video track
            const hasVideo = remoteStream.getVideoTracks().length > 0;

            // Create an audio element for the remote stream
            const audio = document.createElement('audio');
            audio.id = `audio-${data.userId}`;
            audio.srcObject = remoteStream;
            audio.autoplay = true;
            document.body.appendChild(audio);

            // If there's video, create a video element
            if (hasVideo) {
              const videoContainer = document.getElementById(`video-container-${data.userId}`);
              if (videoContainer) {
                // Clear the placeholder
                videoContainer.innerHTML = '';

                // Create video element
                const video = document.createElement('video');
                video.id = `video-${data.userId}`;
                video.srcObject = remoteStream;
                video.autoplay = true;
                video.playsInline = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';

                videoContainer.appendChild(video);
                addDebugMessage(`Added video for new user ${data.userId}`);
              }
            }
          });

          // Handle data channel messages
          peer.on('data', (data) => {
            try {
              const message = JSON.parse(data.toString());
              addDebugMessage(`Received message from new user: ${message.type}`);

              // Handle different message types here
            } catch (error) {
              console.error('Error parsing data message:', error);
            }
          });

          // Add the peer to our list
          setPeers((prevPeers) => [...prevPeers, { peer, userId: data.userId }]);
        });

        // Listen for signals from other peers
        socketRef.current.on('voipSignal', (data) => {
          // If this is a new peer, create a new connection
          const existingPeer = peers.find(p => p.userId === data.from);

          if (!existingPeer) {
            const peer = new SimplePeer({
              initiator: false,
              trickle: false,
              stream: mediaStream,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:global.stun.twilio.com:3478' }
                ]
              }
            });

            peer.on('signal', (signalData) => {
              socketRef.current.emit('voipSignal', { to: data.from, from: userId, signalData });
            });

            peer.on('error', (err) => {
              addDebugMessage(`Peer connection error with ${data.from}: ${err.message}`);
              console.error('Peer connection error:', err);
            });

            peer.on('stream', (remoteStream) => {
              addDebugMessage(`Received stream from user ${data.from} (answering)`);

              // Check if there's a video track
              const hasVideo = remoteStream.getVideoTracks().length > 0;

              // Create an audio element for the remote stream
              const audio = document.createElement('audio');
              audio.id = `audio-${data.from}`;
              audio.srcObject = remoteStream;
              audio.autoplay = true;
              document.body.appendChild(audio);

              // If there's video, create a video element
              if (hasVideo) {
                const videoContainer = document.getElementById(`video-container-${data.from}`);
                if (videoContainer) {
                  // Clear the placeholder
                  videoContainer.innerHTML = '';

                  // Create video element
                  const video = document.createElement('video');
                  video.id = `video-${data.from}`;
                  video.srcObject = remoteStream;
                  video.autoplay = true;
                  video.playsInline = true;
                  video.style.width = '100%';
                  video.style.height = '100%';
                  video.style.objectFit = 'cover';

                  videoContainer.appendChild(video);
                  addDebugMessage(`Added video for user ${data.from} (answering)`);
                }
              }
            });

            // Handle data channel messages
            peer.on('data', (data) => {
              try {
                const message = JSON.parse(data.toString());
                addDebugMessage(`Received message from ${data.from}: ${message.type}`);

                // Handle video state changes
                if (message.type === 'videoState') {
                  const videoContainer = document.getElementById(`video-container-${data.from}`);
                  if (videoContainer) {
                    if (!message.enabled) {
                      // Video turned off, show placeholder
                      videoContainer.innerHTML = `
                        <div class="participant-avatar">
                          ${(participantNames[data.from] || `User-${data.from.substring(0, 4)}`).substring(0, 2).toUpperCase()}
                        </div>
                      `;
                    }
                    // If enabled, the video will be added when the stream is received
                  }
                }
              } catch (error) {
                console.error('Error parsing data message:', error);
              }
            });

            // Process the received signal
            peer.signal(data.signalData);

            // Add the peer to our list
            setPeers((prevPeers) => [...prevPeers, { peer, userId: data.from }]);
            setParticipants(prev => [...prev, data.from]);
          } else {
            // If we already have this peer, just process the signal
            existingPeer.peer.signal(data.signalData);
          }
        });

        // Listen for users leaving
        socketRef.current.on('userLeftVoip', (data) => {
          addDebugMessage(`User left: ${data.userId}`);
          setParticipants(prev => prev.filter(id => id !== data.userId));
          setPeers(prevPeers => prevPeers.filter(peer => {
            if (peer.userId === data.userId) {
              peer.peer.destroy();
              return false;
            }
            return true;
          }));

          // Remove the audio element
          const audioElement = document.getElementById(`audio-${data.userId}`);
          if (audioElement) {
            audioElement.remove();
          }

          // Remove from participant names
          setParticipantNames(prev => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
        });
      })
      .catch((error) => {
        console.error('Error accessing audio devices:', error);
        setCallStatus('Failed to access microphone');
      });

    // Cleanup function
    return () => {
      addDebugMessage('VOIP component unmounting, cleaning up');

      // Stop all tracks in the stream
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          addDebugMessage(`Stopped track: ${track.kind}`);
        });
      }

      // Destroy all peer connections
      peers.forEach(peer => {
        if (peer.peer) {
          try {
            peer.peer.destroy();
            addDebugMessage(`Destroyed peer connection to ${peer.userId}`);
          } catch (err) {
            addDebugMessage(`Error destroying peer: ${err.message}`);
          }
        }
      });

      // Remove all audio elements
      participants.forEach(id => {
        const audioElement = document.getElementById(`audio-${id}`);
        if (audioElement) {
          audioElement.remove();
          addDebugMessage(`Removed audio element for ${id}`);
        }
      });

      // Leave the room
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('leaveVoipRoom', { roomId, userId });
        addDebugMessage(`Sent leaveVoipRoom event for room ${roomId}`);

        // Remove socket listeners
        socketRef.current.off('userJoinedVoip');
        socketRef.current.off('voipSignal');
        socketRef.current.off('userLeftVoip');
        socketRef.current.off('existingParticipants');
        socketRef.current.off('roomUpdate');
        addDebugMessage('Removed all socket listeners');
      }
    };
  }, [roomId, userId, socketConnected]);

  // Toggle mute
  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      addDebugMessage(`Microphone ${isMuted ? 'unmuted' : 'muted'}`);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        // Turn off video
        if (stream) {
          // Only stop and remove camera tracks, not screen sharing tracks
          const cameraVideoTracks = stream.getVideoTracks().filter(track =>
            !track.label.includes('screen') && !track.label.includes('display')
          );

          cameraVideoTracks.forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });

          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }

          setIsVideoEnabled(false);
          addDebugMessage('Video turned off');

          // Notify peers about video state change
          peers.forEach(peer => {
            if (peer.peer && peer.peer.connected) {
              peer.peer.send(JSON.stringify({ type: 'videoState', enabled: false }));
            }
          });
        }
      } else {
        // Turn on video
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];

        if (stream) {
          stream.addTrack(videoTrack);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.style.display = 'block';
          }

          setIsVideoEnabled(true);
          addDebugMessage('Video turned on');

          // Notify peers about video state change and renegotiate connections
          peers.forEach(peer => {
            if (peer.peer && peer.peer.connected) {
              // Send message about video state
              peer.peer.send(JSON.stringify({ type: 'videoState', enabled: true }));

              // Add the video track to the peer connection
              peer.peer.addTrack(videoTrack, stream);
            }
          });
        }
      }
    } catch (error) {
      addDebugMessage(`Error toggling video: ${error.message}`);
      console.error('Error toggling video:', error);
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (stream) {
          // Find and remove only screen sharing tracks
          const screenTracks = stream.getVideoTracks().filter(track =>
            track.label.includes('screen') || track.label.includes('display')
          );

          screenTracks.forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });

          if (screenShareRef.current) {
            screenShareRef.current.srcObject = null;
            screenShareRef.current.style.display = 'none';
          }

          setIsScreenSharing(false);
          addDebugMessage('Screen sharing stopped');

          // If video is enabled, make sure it's still visible
          // The video tracks should still be in the stream since we didn't remove them
          if (isVideoEnabled && videoRef.current) {
            // Make sure the video element is displaying the stream
            if (!videoRef.current.srcObject) {
              videoRef.current.srcObject = stream;
            }
            videoRef.current.style.display = 'block';
          }

          // Notify peers about screen sharing state
          peers.forEach(peer => {
            if (peer.peer && peer.peer.connected) {
              peer.peer.send(JSON.stringify({ type: 'screenShare', enabled: false }));
            }
          });
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Handle the user canceling the screen share dialog
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        if (stream) {
          // Keep video tracks active if video is enabled
          // We'll just add the screen track without removing video tracks

          // Add screen track to stream
          stream.addTrack(screenTrack);

          // Create a separate stream for screen sharing display
          const screenOnlyStream = new MediaStream([screenTrack]);

          if (screenShareRef.current) {
            screenShareRef.current.srcObject = screenOnlyStream;
            screenShareRef.current.style.display = 'block';
          }

          // Make sure video remains visible if it was enabled
          if (isVideoEnabled && videoRef.current) {
            // Ensure video element is visible
            videoRef.current.style.display = 'block';
          }

          setIsScreenSharing(true);
          addDebugMessage('Screen sharing started');

          // Notify peers about screen sharing state and renegotiate connections
          peers.forEach(peer => {
            if (peer.peer && peer.peer.connected) {
              // Send message about screen sharing state
              peer.peer.send(JSON.stringify({ type: 'screenShare', enabled: true }));

              // Add the screen track to the peer connection
              peer.peer.addTrack(screenTrack, stream);
            }
          });
        }
      }
    } catch (error) {
      // User probably canceled the screen sharing dialog
      addDebugMessage(`Screen sharing error or canceled: ${error.message}`);
      console.error('Screen sharing error:', error);
    }
  };

  // Refresh connection
  const refreshConnection = () => {
    addDebugMessage('Manually refreshing connection');

    // Re-emit join room event
    if (socketRef.current && socketConnected) {
      // First, clear existing participants to avoid duplicates
      setParticipants([]);
      setParticipantNames({});

      // Re-join the room
      socketRef.current.emit('joinVoipRoom', { roomId, userId, userName });
      addDebugMessage(`Re-sent joinVoipRoom event for room ${roomId}`);

      // Update UI
      setCallStatus('Reconnecting...');
      setTimeout(() => setCallStatus('Connected'), 1000);
    } else {
      addDebugMessage('Cannot refresh: socket not connected');
      setCallStatus('Connection lost');
    }
  };

  // Start recording the call
  const startRecording = async () => {
    try {
      // If already recording, stop it first
      if (isRecording) {
        addDebugMessage('Already recording, stopping current recording first');
        stopRecording();
        // Wait a bit for the previous recording to be properly stopped
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Reset any previous recording state
      setRecordedChunks([]);
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping a non-active recorder
        }
        mediaRecorderRef.current = null;
      }

      addDebugMessage('Starting screen capture for recording...');

      // Show a user-friendly message
      alert('Please select the browser tab or entire screen you want to record. For best results, select the browser tab showing the video call.');

      // Use display media to capture the entire screen
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: true
      });

      addDebugMessage('Screen capture successful, setting up recorder');

      // Create a new stream that includes screen capture and audio
      const recordingStream = new MediaStream();

      // Add all tracks from the display stream (screen + system audio)
      displayStream.getTracks().forEach(track => {
        recordingStream.addTrack(track);

        // When the user stops sharing, stop recording
        track.addEventListener('ended', () => {
          addDebugMessage('Screen sharing ended, stopping recording');
          if (isRecording) {
            stopRecording();
          }
        });
      });

      // Try to add microphone audio if available
      if (stream) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            recordingStream.addTrack(audioTracks[0].clone());
          } catch (e) {
            console.log('Could not add microphone track:', e);
          }
        }
      }

      // Create media recorder with codec fallbacks
      let options = {};

      // Try different codecs in order of preference
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        options = { mimeType: 'video/webm;codecs=vp9,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }

      addDebugMessage(`Using recording format: ${options.mimeType || 'browser default'}`);

      // Create and store the media recorder
      const mediaRecorder = new MediaRecorder(recordingStream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Store the chunks directly in an array variable for reliability
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
          // Also update state for UI purposes
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        addDebugMessage(`Recording stopped with ${chunks.length} chunks`);
        console.log('Recorded chunks:', chunks);

        if (chunks.length > 0) {
          // Create a blob from the recorded chunks
          const mimeType = mediaRecorder.mimeType || 'video/webm';
          const blob = new Blob(chunks, { type: mimeType });
          console.log('Blob created, size:', blob.size, 'bytes');

          // Determine file extension based on mime type
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'mp4';

          const filename = `video-call-${roomId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${extension}`;

          // Simple, direct download approach
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);

            // Click the link to trigger download
            a.click();

            // Remove the link after a delay
            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
              addDebugMessage('Download link cleaned up');
            }, 1000);

            addDebugMessage('Download triggered successfully');
          } catch (error) {
            console.error('Error downloading recording:', error);
            addDebugMessage(`Download error: ${error.message}`);
          }
        } else {
          addDebugMessage('No recorded data available to save');
        }

        // Stop all tracks in the recording stream
        if (recordingStream) {
          recordingStream.getTracks().forEach(track => track.stop());
        }
      };

      // Start recording with a 1-second timeslice for frequent ondataavailable events
      mediaRecorder.start(1000);
      setIsRecording(true);
      addDebugMessage('Recording started');

    } catch (error) {
      console.error('Error in recording process:', error);
      addDebugMessage(`Recording error: ${error.message}`);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        addDebugMessage('Stopping recording...');

        // Request any pending data before stopping
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          // Some browsers might not support requestData
          console.log('RequestData not supported:', e);
        }

        // Stop the recorder immediately
        mediaRecorderRef.current.stop(); // This will trigger the onstop event handler
        addDebugMessage('MediaRecorder stopped');

        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        addDebugMessage(`Error stopping recording: ${error.message}`);
        setIsRecording(false);
      }
    } else {
      addDebugMessage('No active recording to stop');
    }
  };

  // Helper function to manually force a download
  const forceDownload = (chunks) => {
    if (!chunks || chunks.length === 0) {
      addDebugMessage('No chunks available for forced download');
      return;
    }

    try {
      addDebugMessage(`Forcing manual download with ${chunks.length} chunks`);

      // Create a blob from the recorded chunks
      const mimeType = 'video/webm';
      const blob = new Blob(chunks, { type: mimeType });

      if (blob.size <= 0) {
        addDebugMessage('Error: Created blob is empty');
        return;
      }

      const filename = `video-call-${roomId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;

      // Create a hidden download link
      const a = document.createElement('a');
      a.download = filename;
      a.href = URL.createObjectURL(blob);
      a.style.display = 'none';
      document.body.appendChild(a);

      // Click the link to trigger download
      a.click();

      // Remove the link after a delay
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(a.href);
      }, 1000);

      addDebugMessage('Manual download triggered');
    } catch (error) {
      console.error('Error in manual download:', error);
      addDebugMessage(`Manual download error: ${error.message}`);
    }
  };

  // Toggle fullscreen for camera video
  const toggleVideoFullscreen = () => {
    if (!videoRef.current) return;

    if (!isVideoFullscreen) {
      // Enter fullscreen - use CSS-based fullscreen for better mobile compatibility
      videoRef.current.classList.add('fullscreen-video');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when in fullscreen

      // Also try native fullscreen API as a fallback
      try {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) { /* Safari */
          videoRef.current.webkitRequestFullscreen();
        } else if (videoRef.current.msRequestFullscreen) { /* IE11 */
          videoRef.current.msRequestFullscreen();
        }
      } catch (err) {
        console.log('Native fullscreen failed, using CSS fullscreen');
      }

      setIsVideoFullscreen(true);
    } else {
      // Exit fullscreen
      videoRef.current.classList.remove('fullscreen-video');
      document.body.style.overflow = ''; // Restore scrolling

      // Also try to exit native fullscreen
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      } catch (err) {
        console.log('Native fullscreen exit failed');
      }

      setIsVideoFullscreen(false);
    }
  };

  // Toggle fullscreen for screen share
  const toggleScreenShareFullscreen = () => {
    if (!screenShareRef.current) return;

    if (!isScreenShareFullscreen) {
      // Enter fullscreen - use CSS-based fullscreen for better mobile compatibility
      screenShareRef.current.classList.add('fullscreen-video');
      document.body.style.overflow = 'hidden'; // Prevent scrolling when in fullscreen

      // Also try native fullscreen API as a fallback
      try {
        if (screenShareRef.current.requestFullscreen) {
          screenShareRef.current.requestFullscreen();
        } else if (screenShareRef.current.webkitRequestFullscreen) { /* Safari */
          screenShareRef.current.webkitRequestFullscreen();
        } else if (screenShareRef.current.msRequestFullscreen) { /* IE11 */
          screenShareRef.current.msRequestFullscreen();
        }
      } catch (err) {
        console.log('Native fullscreen failed, using CSS fullscreen');
      }

      setIsScreenShareFullscreen(true);
    } else {
      // Exit fullscreen
      screenShareRef.current.classList.remove('fullscreen-video');
      document.body.style.overflow = ''; // Restore scrolling

      // Also try to exit native fullscreen
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      } catch (err) {
        console.log('Native fullscreen exit failed');
      }

      setIsScreenShareFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement ||
                          !!document.webkitFullscreenElement ||
                          !!document.msFullscreenElement;

      if (!isFullscreen) {
        setIsVideoFullscreen(false);
        setIsScreenShareFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // End call and navigate back
  const endCall = () => {
    addDebugMessage('Ending call');

    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      // Just stop the recording - the onstop handler will handle the download
      stopRecording();
      addDebugMessage('Stopped active recording');
    }

    // Stop all tracks in the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      addDebugMessage('Stopped audio tracks');
    }

    // Destroy all peer connections
    peers.forEach(peer => {
      if (peer.peer) {
        peer.peer.destroy();
        addDebugMessage(`Destroyed peer connection to ${peer.userId}`);
      }
    });

    // Leave the room
    if (socketRef.current && socketConnected) {
      socketRef.current.emit('leaveVoipRoom', { roomId, userId });
      addDebugMessage(`Sent leaveVoipRoom event for room ${roomId}`);
    }

    // Navigate back
    navigate('/');
  };

  return (
    <div className="voip-container">
      <div className="voip-header">
        <h2>Video Call</h2>
        <div className="call-status">
          {callStatus}
          <span className={`connection-indicator ${socketConnected ? 'connected' : 'disconnected'}`}>
            {socketConnected ? 'Socket Connected' : 'Socket Disconnected'}
          </span>
          {isRecording && (
            <span className="recording-indicator">
              <span className="recording-dot"></span> Recording
            </span>
          )}
        </div>
      </div>

      <div className="participants-container">
        <h3>Participants ({participants.length + 1})</h3>
        <div className="participants-list">
          <div className="participant">
            <div className="participant-avatar">{userName.substring(0, 2).toUpperCase()}</div>
            <div className="participant-name">{userName} (You)</div>
          </div>
          {participants.map(id => (
            <div key={id} className="participant">
              <div className="participant-avatar">{(participantNames[id] || `User-${id.substring(0, 4)}`).substring(0, 2).toUpperCase()}</div>
              <div className="participant-name">{participantNames[id] || `User-${id.substring(0, 4)}`}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="video-container">
        {/* Local video */}
        <div
          className="video-wrapper local-video-wrapper"
          onDoubleClick={toggleVideoFullscreen}
          title="Double-click to toggle fullscreen"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
            style={{ display: isVideoEnabled ? 'block' : 'none' }}
          />
          <div className="video-label">You ({userName}){isVideoFullscreen ? ' (Fullscreen)' : ''}</div>
        </div>

        {/* Screen share */}
        <div
          className="video-wrapper screen-share-wrapper"
          onDoubleClick={toggleScreenShareFullscreen}
          title="Double-click to toggle fullscreen"
        >
          <video
            ref={screenShareRef}
            autoPlay
            muted
            playsInline
            className="screen-share"
            style={{ display: isScreenSharing ? 'block' : 'none' }}
          />
          {isScreenSharing && (
            <div className="video-label">
              Your Screen{isScreenShareFullscreen ? ' (Fullscreen)' : ''}
            </div>
          )}
        </div>

        {/* Remote videos will be added dynamically */}
        <div id="remote-videos" className="remote-videos-container">
          {participants.map(id => (
            <div key={id} className="video-wrapper remote-video-wrapper">
              <div id={`video-container-${id}`} className="remote-video-placeholder">
                <div className="participant-avatar">
                  {(participantNames[id] || `User-${id.substring(0, 4)}`).substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="video-label">{participantNames[id] || `User-${id.substring(0, 4)}`}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="voip-controls">
        <button
          className={`control-button ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button
          className={`control-button ${isVideoEnabled ? 'video-on' : 'video-off'}`}
          onClick={toggleVideo}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? 'Video Off' : 'Video On'}
        </button>
        <button
          className={`control-button ${isScreenSharing ? 'screen-on' : 'screen-off'}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
        >
          {isScreenSharing ? 'Stop Share' : 'Share Screen'}
        </button>
        <button
          className="control-button refresh"
          onClick={refreshConnection}
          title="Refresh connection if users can't see each other"
        >
          Refresh
        </button>
        <button
          className={`control-button ${isRecording ? 'recording' : 'record'}`}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? 'Stop Recording' : 'Record'}
        </button>
        <button
          className="control-button end-call"
          onClick={endCall}
          title="End call and return to home"
        >
          End Call
        </button>
      </div>

      {/* Debug information */}
      <div className="debug-info">
        <h4>Debug Info (Room ID: {roomId})</h4>
        <div className="debug-messages">
          {debugInfo.map((msg, index) => (
            <div key={index} className="debug-message">{msg}</div>
          ))}
        </div>
      </div>

      {/* Hidden audio element for local stream */}
      <audio ref={audioRef} muted />
    </div>
  );
};

export default VOIP;
