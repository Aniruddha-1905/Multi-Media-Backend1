import React, { useEffect, useState } from 'react'
import Leftsidebar from '../../Component/Leftsidebar/Leftsidebar'
import { MdFileDownload } from "react-icons/md"
import { RiVipCrownLine, RiCloseLine } from "react-icons/ri"
import WHLvideolist from '../../Component/WHL/WHLvideolist'
import { useSelector, useDispatch } from 'react-redux'
import { getUserDownloadedVideos, upgradeToPremium, cancelPremium, checkDownloadEligibility } from '../../action/downloadedvideo'
import './Downloads.css'

const Downloads = () => {
    const dispatch = useDispatch();
    const currentuser = useSelector(state => state.currentuserreducer);
    const downloadedVideos = useSelector(state => state.downloadedvideoreducer);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Track premium status
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        if (currentuser?.result?._id) {
            dispatch(getUserDownloadedVideos());

            // Debug log for premium status from currentuser
            console.log('Current user premium status:', currentuser?.result?.isPremium);

            // Check premium status from server
            const checkPremiumStatus = async () => {
                try {
                    const eligibility = await dispatch(checkDownloadEligibility());
                    console.log('Premium status check from server:', eligibility);
                    setIsPremium(eligibility.isPremium === true);
                } catch (error) {
                    console.error('Error checking premium status:', error);
                }
            };

            checkPremiumStatus();
        }
    }, [currentuser, dispatch]);

    // Handle premium upgrade
    const handleUpgradeToPremium = async () => {
        if (!currentuser?.result?._id) {
            alert("Please login to upgrade to premium");
            return;
        }

        try {
            const result = await dispatch(upgradeToPremium());

            if (result.success) {
                alert("Successfully upgraded to premium! You can now download unlimited videos.");
                setShowPremiumModal(false);
                setIsPremium(true);
            } else {
                alert(result.message || "Error upgrading to premium");
            }
        } catch (error) {
            console.error('Error upgrading to premium:', error);
            alert("Error upgrading to premium");
        }
    };

    // Handle cancel premium
    const handleCancelPremium = async () => {
        if (!currentuser?.result?._id) {
            alert("Please login to cancel premium membership");
            return;
        }

        try {
            const result = await dispatch(cancelPremium());

            if (result.success) {
                alert("Successfully cancelled premium membership. Your premium benefits will end immediately.");
                setShowCancelModal(false);
                setIsPremium(false);
            } else {
                alert(result.message || "Error cancelling premium membership");
            }
        } catch (error) {
            console.error('Error cancelling premium membership:', error);
            alert("Error cancelling premium membership");
        }
    };

    return (
        <div className="container_Pages_App">
            {showPremiumModal && (
                <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Upgrade to Premium</h2>
                        <p>Upgrade to premium to download unlimited videos!</p>
                        <div className="premium-features">
                            <div className="premium-feature">
                                <RiVipCrownLine size={24} />
                                <span>Unlimited video downloads</span>
                            </div>
                            <div className="premium-feature">
                                <MdFileDownload size={24} />
                                <span>Download in high quality</span>
                            </div>
                        </div>
                        <div className="premium-buttons">
                            <button className="premium-upgrade-btn" onClick={handleUpgradeToPremium}>
                                Upgrade Now
                            </button>
                            <button className="premium-cancel-btn" onClick={() => setShowPremiumModal(false)}>
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="premium-modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Cancel Premium Membership</h2>
                        <p>Are you sure you want to cancel your premium membership?</p>
                        <div className="cancel-premium-info">
                            <p>If you cancel:</p>
                            <ul>
                                <li>Your premium benefits will end immediately</li>
                                <li>You'll be limited to downloading 1 video per day</li>
                                <li>You can upgrade again at any time</li>
                            </ul>
                        </div>
                        <div className="premium-buttons">
                            <button className="premium-cancel-confirm-btn" onClick={handleCancelPremium}>
                                Yes, Cancel Premium
                            </button>
                            <button className="premium-keep-btn" onClick={() => setShowCancelModal(false)}>
                                Keep Premium
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Leftsidebar />
            <div className='container2_Pages_App'>
                <div className="container_downloadsPage">
                    <div className="downloads-header">
                        <h1 className="title_container_DownloadsPage">
                            <MdFileDownload className="downloads-icon" />
                            <span>Downloaded Videos</span>
                        </h1>

                        {!isPremium && (
                            <button
                                className="upgrade-premium-btn"
                                onClick={() => setShowPremiumModal(true)}
                            >
                                <RiVipCrownLine />
                                <span>Upgrade to Premium</span>
                            </button>
                        )}
                    </div>

                    {isPremium ? (
                        <div className="premium-badge">
                            <div className="premium-badge-content">
                                <RiVipCrownLine />
                                <span>Premium Member</span>
                            </div>
                            <button
                                className="cancel-premium-btn"
                                onClick={() => setShowCancelModal(true)}
                                title="Cancel Premium Membership"
                            >
                                <RiCloseLine />
                                <span>Cancel</span>
                            </button>
                        </div>
                    ) : (
                        <div className="download-limit-info">
                            <p>Free users can download 1 video per day.</p>
                            <p>Upgrade to premium for unlimited downloads!</p>
                        </div>
                    )}

                    <div className="container_videoList_DownloadsPage">
                        {downloadedVideos?.data?.length > 0 ? (
                            <WHLvideolist
                                page={"Downloads"}
                                currentuser={currentuser?.result?._id}
                                videolist={downloadedVideos}
                            />
                        ) : (
                            <div className="no-downloads">
                                <MdFileDownload size={50} />
                                <p>No downloaded videos yet</p>
                                <p>Start downloading videos to see them here!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Downloads
