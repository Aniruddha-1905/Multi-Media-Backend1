import React, { useState } from "react";
import "./Comment.css";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { editcomment, deletecomment, likeComment, dislikeComment } from "../../action/comment";
import { translateText } from "../../utils/translate"; // Import translation function
import { FaThumbsUp, FaThumbsDown, FaEdit, FaTrash, FaLanguage } from 'react-icons/fa';

const Displaycommment = ({ cid, commentbody, userid, commenton, usercommented, userlocation, likes, dislikes }) => {
    const [edit, setedit] = useState(false); // Toggle edit mode
    const [cmtnody, setcommentbdy] = useState(""); // Edited comment body
    const [translatedComment, setTranslatedComment] = useState(""); // Translated text
    const [selectedLanguage, setSelectedLanguage] = useState("hi"); // Default language selection
    const [likeCount, setLikeCount] = useState(likes || 0);
    const [dislikeCount, setDislikeCount] = useState(dislikes || 0);
    const dispatch = useDispatch();
    const currentuser = useSelector((state) => state.currentuserreducer);

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
        setLikeCount(prevCount => prevCount + 1);
    };

    // Handle dislike action
    const handleDislike = () => {
        dispatch(dislikeComment(cid));
        setDislikeCount(prevCount => prevCount + 1);
    };

    return (
        <div className="comment-item">
            {edit ? (
                <>
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
                </>
            ) : (
                <p className="comment_body">{translatedComment || commentbody}</p>
            )}

            <p className="usercommented">
                - {usercommented} <span className="location-info">from {userlocation || 'Unknown Location'}</span> <span className="comment-time">{moment(commenton).format('MMM D, YYYY [at] h:mm A')}</span>
            </p>

            <div className="comment-actions">
                <div className="reaction-buttons">
                    <button className="like-btn" onClick={handleLike}>
                        <FaThumbsUp /> <span className="count">{likeCount}</span>
                    </button>
                    <button className="dislike-btn" onClick={handleDislike}>
                        <FaThumbsDown /> <span className="count">{dislikeCount}</span>
                    </button>
                </div>

                <div className="language-tools">
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
                    <button className="translate-btn" onClick={handleTranslate}>
                        <FaLanguage /> Translate
                    </button>
                </div>

                {currentuser?.result?._id === userid && (
                    <div className="owner-actions">
                        <button className="edit-btn" onClick={() => setedit(true)}>
                            <FaEdit /> Edit
                        </button>
                        <button className="delete-btn" onClick={() => dispatch(deletecomment(cid))}>
                            <FaTrash /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Displaycommment;
