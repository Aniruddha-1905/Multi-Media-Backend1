import React, { useState, useEffect } from "react";
import "./Comment.css";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { editcomment, deletecomment, likeComment, dislikeComment } from "../../action/comment";
import { translateText } from "../../utils/translate"; // Import translation function
import { FaThumbsUp, FaThumbsDown, FaEdit, FaTrash, FaLanguage } from "react-icons/fa"; // Import icons

// Helper function to get relative time from various timestamp formats
const getRelativeTime = (comment) => {
  if (!comment) return 'recently';

  // For comments, check both commenton and commentedon fields
  const timestamp = comment.commentedon || comment.commenton;

  if (!timestamp) {
    return 'recently';
  }

  return moment(timestamp).fromNow();
};

const Displaycommment = ({ cid, commentbody, userid, commenton, usercommented, userlocation, likes = 0, dislikes = 0 }) => {
    const [edit, setedit] = useState(false); // Toggle edit mode
    const [cmtnody, setcommentbdy] = useState(""); // Edited comment body
    const [translatedComment, setTranslatedComment] = useState(""); // Translated text
    const [selectedLanguage, setSelectedLanguage] = useState("hi"); // Default language selection
    const [likeCount, setLikeCount] = useState(likes);
    const [dislikeCount, setDislikeCount] = useState(dislikes);
    const dispatch = useDispatch();
    const currentuser = useSelector((state) => state.currentuserreducer);
    const commentlist = useSelector(state => state.commentreducer);

    // Update like/dislike counts when the comment list changes
    useEffect(() => {
        if (commentlist?.data) {
            const currentComment = commentlist.data.find(comment => comment._id === cid);
            if (currentComment) {
                setLikeCount(currentComment.likes || 0);
                setDislikeCount(currentComment.dislikes || 0);
            }
        }
    }, [commentlist, cid]);

    // List of Indian languages supported for translation
    const languages = [
        { code: "hi", name: "Hindi" },
        { code: "ta", name: "Tamil" },
        { code: "te", name: "Telugu" },
        { code: "kn", name: "Kannada" },
        { code: "ml", name: "Malayalam" },
        { code: "mr", name: "Marathi" },
        { code: "bn", name: "Bengali" },
        { code: "gu", name: "Gujarati" },
        { code: "pa", name: "Punjabi" },
    ];

    // Handle translating the comment
    const handleTranslate = async () => {
        const translatedText = await translateText(commentbody, selectedLanguage);
        setTranslatedComment(translatedText);
    };

    // Handle like action
    const handleLike = () => {
        dispatch(likeComment(cid));
        // Optimistic UI update
        setLikeCount(prev => prev + 1);
    };

    // Handle dislike action
    const handleDislike = () => {
        dispatch(dislikeComment(cid));
        // Optimistic UI update
        setDislikeCount(prev => prev + 1);
    };

    return (
        <div className="comment-container">
            {edit ? (
                <div className="edit-comment-form">
                    <form className="comments_sub_form_comments" onSubmit={(e) => {
                        e.preventDefault();
                        if (cmtnody) {
                            dispatch(editcomment({ id: cid, commentbody: cmtnody }));
                            setcommentbdy("");
                            setedit(false);
                        } else {
                            alert("Please type your comment!");
                        }
                    }}>
                        <input
                            type="text"
                            onChange={(e) => setcommentbdy(e.target.value)}
                            placeholder="Edit comment..."
                            value={cmtnody}
                            className="comment_ibox"
                        />
                        <input type="submit" value="Save" className="comment_add_btn_comments" />
                    </form>
                </div>
            ) : (
                <p className="comment_body">{translatedComment || commentbody}</p>
            )}

            <p className="usercommented">
                - {usercommented}
                <span className="comment-time">
                    commented {getRelativeTime({commenton})}
                </span>
                {userlocation && userlocation !== "Unknown" && (
                    <span className="user-location">
                        <br/>📍 {userlocation}
                    </span>
                )}
            </p>

            <div className="comment-actions">
                <div className="comment-reactions">
                    <button className="reaction-btn like-btn" onClick={handleLike}>
                        <FaThumbsUp /> <span className="reaction-count">{likeCount}</span>
                    </button>
                    <button className="reaction-btn dislike-btn" onClick={handleDislike}>
                        <FaThumbsDown /> <span className="reaction-count">{dislikeCount}</span>
                    </button>
                </div>

                {currentuser?.result?._id === userid && (
                    <div className="user-actions">
                        <div className="translation-controls">
                            <select
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                value={selectedLanguage}
                                className="language-dropdown"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <button className="action-btn translate-btn" onClick={handleTranslate}>
                                <FaLanguage /> Translate
                            </button>
                        </div>
                        <button className="action-btn edit-btn" onClick={() => setedit(true)}>
                            <FaEdit /> Edit
                        </button>
                        <button className="action-btn delete-btn" onClick={() => dispatch(deletecomment(cid))}>
                            <FaTrash /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Displaycommment;
