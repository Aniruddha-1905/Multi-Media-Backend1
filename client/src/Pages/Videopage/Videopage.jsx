import React, { useEffect, useRef, useState } from "react";
import "./Videopage.css";
import moment from "moment";
import Likewatchlatersavebtns from "./Likewatchlatersavebtns";
import { useParams, Link, useNavigate } from "react-router-dom";
import Comment from "../../Component/Comment/Comment";
import { viewvideo, getallvideo } from "../../action/video";
import { addtohistory } from "../../action/history";
import { useSelector, useDispatch } from "react-redux";
import { setcurrentuser } from "../../action/currentuser";
import { checkWatchTimeEligibility, updateWatchTimeStatus } from "../../action/subscriptionActions";
import { getUserDownloadedVideos } from "../../action/downloadedvideo";

// Helper function to get relative time from various timestamp formats
const getRelativeTime = (video) => {
  if (!video) return 'recently';

  // Check for different timestamp fields
  const timestamp = video.createdAt || video.createdat || video.timestamps || video.updatedAt || video.updatedat;

  if (!timestamp) {
    // If no timestamp field is found, check if there's a createdAt inside timestamps
    if (video.timestamps && video.timestamps.createdAt) {
      return moment(video.timestamps.createdAt).fromNow();
    }
    return 'recently';
  }

  return moment(timestamp).fromNow();
};

const Videopage = () => {
  const { vid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const commentRef = useRef(null);
  // State for tracking taps on video - used in handleVideoClick function
  // eslint-disable-next-line no-unused-vars
  const [taps, setTaps] = useState([]);
  const timeoutRef = useRef(null);

  const vids = useSelector((state) => state.videoreducer);
  const vv = vids?.data.filter((q) => q._id === vid)[0];
  // Debug video timestamp
  if (vv) {
    console.log('Video object:', vv);
    console.log('Video timestamp fields:', {
      createdAt: vv.createdAt,
      createdat: vv.createdat,
      timestamps: vv.timestamps,
      createdAt_type: typeof vv.createdAt,
      createdat_type: typeof vv.createdat
    });
  }
  const currentuser = useSelector((state) => state.currentuserreducer);
  const [updatedPoints, setUpdatedPoints] = useState(currentuser?.result?.points || 0);
  const [watchTimeLimit, setWatchTimeLimit] = useState(300); // Default 5 minutes (300 seconds)
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [timeWarningMessage, setTimeWarningMessage] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(300);
  const [formattedTime, setFormattedTime] = useState('00:05:00'); // HH:MM:SS format
  const [isDownloadedVideo, setIsDownloadedVideo] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  // Loop functionality removed
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const downloadedVideos = useSelector(state => state.downloadedvideoreducer);
  // Subscription data is now handled through the checkWatchTimeEligibility function

  const handleViews = () => {
    dispatch(viewvideo({ id: vid }));
  };

  const handleHistory = () => {
    dispatch(
      addtohistory({
        videoid: vid,
        viewer: currentuser?.result._id,
      })
    );
  };

  const handleVideoCompletion = () => {
    // Loop functionality removed

    const pointsEarned = 5; // Points for completing the video
    const newPoints = updatedPoints + pointsEarned;

    setUpdatedPoints(newPoints);  // Update points locally

    // Dispatch an action to update the points in the current user
    dispatch(setcurrentuser({
      ...currentuser,
      result: {
        ...currentuser.result,
        points: newPoints, // Add updated points to the current user
      },
    }));
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return; // Check if video element exists

    try {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();

        // Handle the play promise to catch any errors
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing video:', error);
          });
        }
      } else {
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleSeek = (direction) => {
    if (!videoRef.current) return; // Check if video element exists

    try {
      const seekTime = 10;
      if (direction === "forward") {
        videoRef.current.currentTime += seekTime;
      } else if (direction === "backward") {
        videoRef.current.currentTime -= seekTime;
      }
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  // Loop functionality removed

  const scrollToComments = () => {
    if (commentRef.current) {
      commentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const goToRandomVideo = async () => {
    try {
      // Fetch latest videos
      dispatch(getallvideo());

      // Get all videos except current one
      const otherVideos = vids?.data.filter(video => video._id !== vid);

      if (otherVideos && otherVideos.length > 0) {
        // Select a random video from the filtered list
        const randomIndex = Math.floor(Math.random() * otherVideos.length);
        const randomVideo = otherVideos[randomIndex];

        console.log("Navigating to random video:", randomVideo._id);
        navigate(`/videopage/${randomVideo._id}`, { replace: true });
      } else {
        console.log("No other videos available");
      }
    } catch (error) {
      console.error("Error navigating to random video:", error);
    }
  };

  const handleTripleTap = (region) => {
    switch (region) {
      case "left":
        scrollToComments();
        break;
      case "middle":
        goToRandomVideo();
        break;
      case "right":
        window.location.href = '/';
        break;
      default:
        break;
    }
  };

  const handleVideoClick = (e) => {
    e.preventDefault();
    const now = Date.now();
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // Determine click region
    const region = clickX > (2 * width) / 3 ? "right" :
                  clickX < width / 3 ? "left" : "middle";

    // Add new tap with timestamp and region
    setTaps(prevTaps => {
      const newTaps = [...prevTaps, { time: now, region }];

      // Only keep taps within last 500ms
      const recentTaps = newTaps.filter(tap => now - tap.time <= 500);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to handle taps
      timeoutRef.current = setTimeout(() => {
        const tapCount = recentTaps.length;
        const lastRegion = recentTaps[recentTaps.length - 1].region;

        if (tapCount === 1) {
          handlePlayPause();
        } else if (tapCount === 2) {
          if (lastRegion === "right") {
            handleSeek("forward");
          } else if (lastRegion === "left") {
            handleSeek("backward");
          }
        } else if (tapCount === 3) {
          handleTripleTap(lastRegion);
        }

        // Clear taps after handling
        setTaps([]);
      }, 500);

      return recentTaps;
    });
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Start countdown timer
  const startCountdownTimer = () => {
    // Clear any existing interval
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }

    // Set initial formatted time
    setFormattedTime(formatTime(timeRemainingSeconds));

    // Start a new interval
    const intervalId = setInterval(() => {
      setTimeRemainingSeconds(prevTime => {
        const newTime = prevTime - 1;

        // Update formatted time
        setFormattedTime(formatTime(newTime));

        // Check if time is up
        if (newTime <= 0) {
          clearInterval(intervalId);
          handleTimeLimitReached();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    setTimerIntervalId(intervalId);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  };

  // Handle when time limit is reached
  const handleTimeLimitReached = () => {
    // Pause the video
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Update watch time limit status in the database
    dispatch(updateWatchTimeStatus(true));

    // Show time limit reached modal
    setTimeWarningMessage(`You've reached your ${watchTimeLimit/60} minute limit on your ${subscriptionPlan} plan. You can only watch downloaded videos for the next 24 hours.`);
    setShowTimeWarning(true);

    // Set local state
    setIsBlocked(true);
    setBlockTimeRemaining(24);

    // Don't automatically navigate away - let the user decide what to do
  };

  // Check if the current video is in the user's downloaded videos
  const checkIfVideoIsDownloaded = () => {
    if (!currentuser?.result?._id || !downloadedVideos?.data || !vid) {
      setIsDownloadedVideo(false);
      return;
    }

    // Check if the current video is in the user's downloaded videos
    const isDownloaded = downloadedVideos.data.some(item => item.videoid === vid && item.viewer === currentuser.result._id);
    setIsDownloadedVideo(isDownloaded);
    console.log(`Video ${vid} is ${isDownloaded ? 'in' : 'not in'} user's downloaded videos`);
  };

  // Check watch time eligibility
  const checkWatchTimeLimit = async () => {
    if (!currentuser?.result?._id) {
      // For non-logged in users, use default free plan limit (5 minutes)
      setWatchTimeLimit(300);
      setTimeRemainingSeconds(300);
      setIsUnlimited(false);
      setSubscriptionPlan('free');

      // Start the countdown timer for non-logged in users
      startCountdownTimer();
      return;
    }

    // Properly handle the Promise returned by dispatch
    dispatch(checkWatchTimeEligibility())
      .then(result => {
        if (result.error) {
          console.error('Error checking watch time eligibility:', result.error);
          return;
        }

        // Update state with subscription details
        setWatchTimeLimit(result.watchTimeLimit);
        setTimeRemainingSeconds(result.watchTimeLimit);
        setIsUnlimited(result.isUnlimited);
        setSubscriptionPlan(result.subscriptionPlan);
        setIsBlocked(result.isBlocked);
        setBlockTimeRemaining(result.blockTimeRemaining);

        // Set initial formatted time
        setFormattedTime(formatTime(result.watchTimeLimit));

        console.log(`User subscription: ${result.subscriptionPlan}, Watch time limit: ${result.watchTimeLimit} seconds`);
        console.log(`User is ${result.isBlocked ? 'blocked' : 'not blocked'} for video playback`);

        // If user is blocked and this is not a downloaded video, show block message
        // but don't automatically redirect - let the user decide what to do
        if (result.isBlocked && !isDownloadedVideo) {
          // Don't navigate away automatically - just show the block message
          return;
        }

        // Start the countdown timer if not blocked and not unlimited
        if (!result.isBlocked && !result.isUnlimited) {
          startCountdownTimer();
        }
      })
      .catch(error => {
        console.error('Error checking watch time eligibility:', error);
      });
  };

  // Handle time limit for video playback
  const handleTimeUpdate = () => {
    // We're now using the countdown timer instead of tracking video time
    // This function is kept for compatibility but doesn't enforce time limits anymore

    // Show warning when 30 seconds remaining
    if (timeRemainingSeconds <= 30 && timeRemainingSeconds > 0 && !showTimeWarning) {
      setTimeWarningMessage(`Your ${subscriptionPlan} plan allows ${watchTimeLimit/60} minutes of video. Upgrade for more time!`);
      setShowTimeWarning(true);
    }
  };

  useEffect(() => {
    if (currentuser) {
      handleHistory();

      // Fetch user's downloaded videos
      dispatch(getUserDownloadedVideos());
    }
    handleViews();

    // Check watch time eligibility
    checkWatchTimeLimit();

    // Initial fetch of videos
    dispatch(getallvideo());

    return () => {
      // Clean up timeouts and intervals
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
    };
  }, []);

  // Check if video is downloaded whenever downloadedVideos or vid changes
  useEffect(() => {
    checkIfVideoIsDownloaded();
  }, [downloadedVideos, vid]);

  // Listen for navigation changes
  useEffect(() => {
    if (vv) {
      handleViews();
      if (currentuser) {
        handleHistory();
      }
    }
  }, [vid]);

  return (
    <>
      <div className="container_videoPage">
        <div className="container2_videoPage">
          <div className="video_display_screen_videoPage">
            <div className="video_player_custom" onClick={handleVideoClick}>
              <div className="video-container">
                {vv?.filepath ? (
                  <video
                    ref={videoRef}
                    src={`${process.env.REACT_APP_API_URL || 'https://multi-media-backend1.onrender.com'}/${vv.filepath}`}
                    className="video_ShowVideo_videoPage"
                    controls

                    onEnded={handleVideoCompletion} // Handle video completion
                    onTimeUpdate={handleTimeUpdate} // Handle time limit
                  ></video>
                ) : (
                  <div className="video-loading">Loading video...</div>
                )}
                {/* Loop controls removed */}
              </div>
              {showTimeWarning && (
                <div className="time-warning-overlay">
                  <div className="time-warning-message">
                    <h3>Time Limit Warning</h3>
                    <p>{timeWarningMessage}</p>
                    <div className="time-warning-actions">
                      <button onClick={() => navigate('/subscription')} className="upgrade-btn">
                        Upgrade Now
                      </button>
                      <button onClick={() => setShowTimeWarning(false)} className="dismiss-btn">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!isUnlimited && !isDownloadedVideo && (
                <div className="time-remaining-clock">
                  Time remaining: {formattedTime}
                </div>
              )}
              {isDownloadedVideo && (
                <div className="downloaded-video-badge">
                  Downloaded Video - No Time Limit
                </div>
              )}
              {isBlocked && !isDownloadedVideo && (
                <div className="blocked-video-overlay">
                  <div className="blocked-video-message">
                    <h3>Watch Time Limit Reached</h3>
                    <p>You've reached your watch time limit for today. You can only watch downloaded videos for the next {blockTimeRemaining} hours.</p>
                    <div className="blocked-video-actions">
                      <button onClick={() => navigate('/subscription')} className="upgrade-btn">
                        Upgrade Plan
                      </button>
                      <button onClick={() => navigate('/downloads')} className="view-downloads-btn">
                        View Downloads
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="video_details_videoPage">
              <div className="video_btns_title_VideoPage_cont">
                <p className="video_title_VideoPage">{vv?.title}</p>
                <div className="views_date_btns_VideoPage">
                  <div className="views_videoPage">
                    {vv?.views} views <div className="dot"></div>{" "}
                    <span className="video-timestamp">
                      {getRelativeTime(vv)}
                    </span>
                  </div>
                  <Likewatchlatersavebtns vv={vv} vid={vid} />
                </div>
              </div>
              <Link to={"/"} className="chanel_details_videoPage">
                <b className="chanel_logo_videoPage">
                  <p>{vv?.uploader.charAt(0).toUpperCase()}</p>
                </b>
                <p className="chanel_name_videoPage">{vv.uploader}</p>
              </Link>
              <div className="comments_VideoPage" ref={commentRef}>
                <h2>
                  <u>Comments</u>
                </h2>
                <Comment videoid={vv._id} />
              </div>
            </div>
          </div>
          <div className="moreVideoBar">More videos</div>
        </div>
      </div>
    </>
  );
};

export default Videopage;