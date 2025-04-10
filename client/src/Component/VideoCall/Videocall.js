import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { RiPhoneFill } from "react-icons/ri";
import { RiScreenshot2Line, RiScreenshot2Fill } from "react-icons/ri";
import { RiRecordCircleFill, RiRecordCircleLine } from "react-icons/ri";
import { RiFileCopyLine } from "react-icons/ri";
import { ToastContainer, toast } from "react-toastify";
import { useReactMediaRecorder } from "react-media-recorder";
import "react-toastify/dist/ReactToastify.css";
import "./VideoCall.css";

const VideoCall = () => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [yourID, setYourID] = useState("");
  const [friendID, setFriendID] = useState("");
  const [screenSharing, setScreenSharing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [dots, setDots] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [idCopied, setIdCopied] = useState(false);
  const [mainVideo, setMainVideo] = useState('user'); // 'user' or 'partner'

  const userVideo = useRef();
  const partnerVideo = useRef();
  const screenStream = useRef();
  const peerRef = useRef();
  const socket = useRef();
  const timerInterval = useRef(null);

  const { startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({
      screen: true,
      audio: true,
      blobPropertyBag: { type: "video/webm" },
    });

  useEffect(() => {
    socket.current = io.connect("https://multi-media-backend1.onrender.com/");
    //socket.current = io.connect("http://localhost:5000/");
    console.log("Use Effect running");

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
      });

    socket.current.on("yourID", (id) => {
      setYourID(id);
    });

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.current.on("callEnded", () => {
      endCall();
    });
  }, []);

  useEffect(() => {
    if (userVideo.current && stream) {
      userVideo.current.srcObject = stream;
    }
  }, [stream, userVideo]);

  const callPeer = (id) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: yourID,
      });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    peer.on("close", () => {
      endCall();
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      setInCall(true);
      peer.signal(signal);
    });

    peerRef.current = peer;
  };

  const acceptCall = () => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    peer.on("close", () => {
      endCall();
    });

    peer.signal(callerSignal);
    setCallAccepted(true);
    setInCall(true);
    peerRef.current = peer;
  };

  const startScreenSharing = async () => {
    try {
      screenStream.current = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setScreenSharing(true);
      setMainVideo('screen');
      replaceTrack(screenStream.current.getVideoTracks()[0]);
      if (userVideo.current) {
        userVideo.current.srcObject = screenStream.current;
      }
      toast.info("Screen sharing started");
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast.error("Failed to share screen");
    }
  };

  const stopScreenSharing = () => {
    screenStream.current.getTracks().forEach((track) => track.stop());
    setScreenSharing(false);
    setMainVideo('user');
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((newStream) => {
        setStream(newStream);
        replaceTrack(newStream.getVideoTracks()[0]);
        if (userVideo.current) {
          userVideo.current.srcObject = newStream;
        }
        toast.info("Screen sharing stopped");
      });
  };

  const replaceTrack = (newTrack) => {
    const peer = peerRef.current;
    if (peer && peer.streams && peer.streams[0] && peer.streams[0].getVideoTracks()[0]) {
      const sender = peer.streams[0].getVideoTracks()[0];
      peer.replaceTrack(sender, newTrack, peer.streams[0]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setRecording(true);
    setRecordingTime(0);
    toast.info("Recording started");
    startRecording();

    // Start timer
    timerInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setRecording(false);
    toast.info("Recording stopped");
    stopRecording();

    // Stop timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setIdCopied(true);
    toast.info("ID copied to clipboard");
    setTimeout(() => setIdCopied(false), 2000);
  };
  //this will stay here
  const checkTime = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    return currentHour >= 9 && currentHour <= 23; // 6 PM to 12 AM
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setCallAccepted(false);
    setInCall(false);
    setReceivingCall(false);
    setCaller("");
    setCallerSignal(null);
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = null;
    }
    // Emit endCall event to the other user
    socket.current.emit("endCall", { to: caller || friendID });
  };

  // Animation for trailing dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length < 3 ? prevDots + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="video-call-container">
      {checkTime() ? (
        <>
          {/* Video Grid */}
          <div className="video-grid">
            {recording && (
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                <span className="recording-time">{formatTime(recordingTime)}</span>
              </div>
            )}

            {stream && mainVideo === 'user' && (
              <video
                className="video-stream main-video"
                playsInline
                muted
                ref={userVideo}
                autoPlay
              />
            )}

            {callAccepted && mainVideo === 'partner' && (
              <video
                className="video-stream main-video"
                playsInline
                ref={partnerVideo}
                autoPlay
              />
            )}

            {stream && screenSharing && mainVideo === 'screen' && (
              <video
                className="video-stream main-video"
                playsInline
                muted
                ref={userVideo}
                autoPlay
              />
            )}

            {stream && callAccepted && mainVideo !== 'user' && (
              <video
                className="video-stream secondary-video"
                playsInline
                muted
                ref={userVideo}
                autoPlay
                onClick={() => setMainVideo('user')}
              />
            )}

            {callAccepted && mainVideo !== 'partner' && (
              <video
                className="video-stream secondary-video"
                playsInline
                ref={partnerVideo}
                autoPlay
                onClick={() => setMainVideo('partner')}
              />
            )}
          </div>

          {/* ID Display and Copy */}
          <div className="id-container">
            <span className="id-label">Your ID (share this with friends to receive calls):</span>
            <div className="id-value-container">
              <span className="id-display">{yourID}</span>
              <button
                className="copy-button"
                onClick={() => copyToClipboard(yourID)}
              >
                <RiFileCopyLine /> {idCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <span className="id-label">Enter your friend's ID to make a call:</span>
          </div>

          {/* Call Input */}
          <div className="call-input-container">
            <input
              className="call-input"
              type="text"
              placeholder="Enter friend's ID to call"
              value={friendID}
              onChange={(e) => setFriendID(e.target.value)}
            />
            <button
              className="call-button"
              onClick={() => callPeer(friendID)}
            >
              <RiPhoneFill /> Call
            </button>
          </div>

          {/* Incoming Call */}
          {receivingCall && !callAccepted && (
            <div className="incoming-call">
              <h2>{caller} is calling you{dots}</h2>
              <button className="accept-button" onClick={acceptCall}>
                <RiPhoneFill />
              </button>
            </div>
          )}

          {/* Control Buttons */}
          <div className="controls-container">
            <div className="tooltip">
              <button
                className={`control-button ${screenSharing ? 'active' : ''}`}
                onClick={screenSharing ? stopScreenSharing : startScreenSharing}
              >
                {screenSharing ? <RiScreenshot2Fill /> : <RiScreenshot2Line />}
              </button>
              <span className="tooltip-text">
                {screenSharing ? 'Stop Sharing' : 'Share Screen'}
              </span>
            </div>

            <div className="tooltip">
              <button
                className={`control-button ${recording ? 'active' : ''}`}
                onClick={recording ? handleStopRecording : handleStartRecording}
              >
                {recording ? <RiRecordCircleFill /> : <RiRecordCircleLine />}
              </button>
              <span className="tooltip-text">
                {recording ? 'Stop Recording' : 'Start Recording'}
              </span>
            </div>

            {inCall && (
              <div className="tooltip">
                <button className="control-button end-call" onClick={endCall}>
                  <RiPhoneFill />
                </button>
                <span className="tooltip-text">End Call</span>
              </div>
            )}
          </div>

          {/* Recording Preview */}
          {mediaBlobUrl && (
            <div className="preview-container">
              <h3 className="preview-title">Recording Preview</h3>
              <video
                className="preview-video"
                src={mediaBlobUrl}
                controls
              />
              <a
                className="download-link"
                href={mediaBlobUrl}
                download="recording.webm"
              >
                Download Recording
              </a>
            </div>
          )}

          <ToastContainer position="top-right" autoClose={3000} />
        </>
      ) : (
        <div className="time-restriction">
          <h1>Video calls are only allowed from 6 PM to 12 AM</h1>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
