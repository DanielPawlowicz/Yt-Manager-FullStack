import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Service from '../service/Service';

const PlayVideo = ({ video }) => {
    const [bookmarking, setBookmarking] = useState(false);
    const playerRef = useRef(null);

    useEffect(() => {
        // Dynamically load the YouTube iframe API script
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);

        // Callback function to initialize the player when the script is loaded
        window.onYouTubeIframeAPIReady = initializePlayer;

        // Clean up function to remove the script and the callback
        return () => {
            document.body.removeChild(script);
            delete window.onYouTubeIframeAPIReady;
        };
    }, []);

    // Function to initialize the YouTube player
    const initializePlayer = () => {
        // Ensure the YouTube iframe API is available
        if (window.YT && window.YT.Player) {
            // Initialize the player
            playerRef.current = new window.YT.Player('youtube-player', {
                events: {
                    onReady: onPlayerReady
                }
            });
        } else {
            console.error('YouTube iframe API not available.');
        }
    };

    // Function to handle the onReady event of the player
    const onPlayerReady = (event) => {
        // Now the player is ready to receive API calls
        console.log('Player ready');
    };

    const handleBookmarkClick = async () => {
        try {
            // Ensure the player reference exists
            if (playerRef.current) {
                // Get the current time of the video
                const currentTime = playerRef.current.getCurrentTime();

                // Create a bookmark object with video details and current time
                const videoBookmark = { ...video, bookmark: currentTime };
                console.log(videoBookmark);

                // Make a PUT request to save the bookmark
                const response = await Service.editByYtId(video.ytId, videoBookmark);

                // Handle success
                console.log('Bookmark saved:', response.data);

                // Set bookmarking state to false
                setBookmarking(false);
            } else {
                console.error('Player reference not found.');
            }
        } catch (error) {
            // Handle error
            console.error('Error bookmarking video:', error);
        }
    };

    // Function to handle clicking on the bookmark paragraph
    const handleBookmarkParagraphClick = () => {
        // Seek the video to the bookmarked time
        if (playerRef.current && video.bookmark !== null) {
            playerRef.current.seekTo(video.bookmark);
        }
    };

    return (
        <div className="play-video">
            <iframe
                id="youtube-player"
                width="840"
                height="472"
                src={`https://www.youtube.com/embed/${video.ytId}?enablejsapi=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
            <p onClick={handleBookmarkParagraphClick}>Bookmark: <a href="#">{video.bookmark}</a></p>
            <button onClick={handleBookmarkClick} disabled={bookmarking}>
                {bookmarking ? 'Bookmarking...' : 'Add Bookmark'}
            </button>
        </div>
    );
};

export default PlayVideo;
