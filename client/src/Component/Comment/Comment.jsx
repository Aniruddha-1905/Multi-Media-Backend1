import React, { useState, useEffect } from 'react'
import "./Comment.css"
import Displaycommment from './Displaycommment'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { postcomment } from '../../action/comment'
import axios from 'axios'
const Comment = ({ videoid }) => {
    const dispatch = useDispatch()
    const [commenttext, setcommentext] = useState("")
    const [userLocation, setUserLocation] = useState(null)
    const [locationLoading, setLocationLoading] = useState(false)
    const currentuser = useSelector(state => state.currentuserreducer);
    const commentlist = useSelector(state => state.commentreducer)

    // No fallback method - we'll only use OpenStreetMap/Nominatim

    // Get user location when component mounts
    useEffect(() => {
        setLocationLoading(true);

        if (navigator.geolocation) {
            // Try to get precise location from browser
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    // Use OpenStreetMap/Nominatim to get location details
                    fetchLocationDetails(latitude, longitude);
                },
                error => {
                    console.error("Browser geolocation error:", error);
                    setLocationLoading(false);
                    setUserLocation("Unknown");
                },
                { timeout: 10000, enableHighAccuracy: false } // Lower timeout and precision for better success rate
            );
        } else {
            // Browser doesn't support geolocation
            console.log("Browser doesn't support geolocation");
            setLocationLoading(false);
            setUserLocation("Unknown");
        }
    }, []);

    // Function to fetch location details using OpenStreetMap/Nominatim (free, no API key required)
    const fetchLocationDetails = async (latitude, longitude) => {
        try {
            // Add a small delay to respect Nominatim's usage policy (max 1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Call Nominatim API with proper headers
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'VideoStreamingApp/1.0', // Required by Nominatim's usage policy
                        'Accept-Language': 'en' // Request English results
                    }
                }
            );

            if (response.data && response.data.address) {
                const address = response.data.address;

                // Extract city, state, and country from address
                const city = address.city || address.town || address.village || address.hamlet || "";
                const state = address.state || address.county || "";
                const country = address.country || "";

                // Format location as "city, state, country"
                const locationParts = [city, state, country].filter(Boolean);
                const formattedLocation = locationParts.length > 0 ? locationParts.join(", ") : "Unknown";
                setUserLocation(formattedLocation);
                console.log("User location:", formattedLocation);
            } else {
                console.log("No address data in Nominatim response");
                setUserLocation("Unknown");
            }
        } catch (error) {
            console.error("Error fetching location details:", error);
            setUserLocation("Unknown");
        } finally {
            setLocationLoading(false);
        }
    };
    // const commentlist=[{
    //     _id:1,
    //     commentbody:"hello",
    //     usercommented:"Abc"
    // },
    // {
    //     _id:2,
    //     commentbody:"hello2",
    //     usercommented:"Abc2"
    // }];
    const handleonsubmit = (e) => {
        e.preventDefault();
        if (currentuser) {
            if (!commenttext) {
                alert("please type your comment!!")
            }
            else {
                dispatch(postcomment({
                    videoid: videoid,
                    userid: currentuser?.result._id,
                    commentbody: commenttext,
                    usercommented: currentuser.result.name,
                    userlocation: userLocation || "Unknown"
                }))
                setcommentext("")
            }
        } else {
            alert("Please login to comment")
        }
    }


    return (
        <>
            <form className='comments_sub_form_comments' onSubmit={handleonsubmit}>
                <input type="text" onChange={(e) => setcommentext(e.target.value)} placeholder='add comment...' value={commenttext} className='comment_ibox' />
                <input type="submit" value={locationLoading ? "Locating..." : "add"} className='comment_add_btn_comments' disabled={locationLoading} />
            </form>
            {locationLoading && <div className="location-loading">Getting your location...</div>}
            <div className="display_comment_container">
                {commentlist?.data.filter((q) => videoid === q?.videoid)
                    .reverse()
                    .map((m) => {
                        return (
                            <Displaycommment
                                key={m._id}
                                cid={m._id}
                                userid={m.userid}
                                commentbody={m.commentbody}
                                commenton={m.commentedon}
                                usercommented={m.usercommented}
                                userlocation={m.userlocation}
                                likes={m.likes}
                                dislikes={m.dislikes}
                            />
                        )
                    })}
            </div>
        </>
    )
}

export default Comment