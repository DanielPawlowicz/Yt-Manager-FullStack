import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Service from './service/Service';
import Video from './service/Video';

const API_KEY = 'AIzaSyCCd-2OgVAdtWYRIWQ6JapPXYB1-IjSESg';

const SearchYoutube = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        const playlistDialog = document.querySelector('.playlist-dialog');
        if (playlistDialog && !playlistDialog.contains(event.target)) {
          setShowPlaylistDialog(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showPlaylistDialog]);


    const handleChange = (event) => {
      setQuery(event.target.value);
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&key=${API_KEY}`
        );
        const videoIds = response.data.items.map((item) => item.id.videoId);
        const videoDetailsResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(
            ','
          )}&key=${API_KEY}`
        );
    
        // Check if videoDetailsResponse has items
        if (!videoDetailsResponse.data.items) {
          throw new Error('No video details found');
        }
    
        const videoDetails = videoDetailsResponse.data.items;
        const resultsWithDetails = response.data.items.map((item, index) => {
          return {
            ...item,
            duration: videoDetails[index]?.contentDetails?.duration || 'N/A',
          };
        });
        setResults(resultsWithDetails);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    

    const parseDuration = (duration) => {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
      if (!match) {
        return 'N/A';
      }
    
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const seconds = match[3] ? parseInt(match[3]) : 0;
    
      let durationString = '';
      if (hours > 0) {
        durationString += `${hours}h `;
      }
      if (minutes > 0) {
        durationString += `${minutes}m `;
      }
      if (seconds > 0) {
        durationString += `${seconds}s `;
      }
    
      return durationString.trim();
    };

    const handleShowPlaylists = async (e) => {

      const rect = e.target.getBoundingClientRect();
      setDialogPosition({ x: rect.x, y: rect.y });

      try {
        const response = await Service.getPlaylists();
        setPlaylists(response.data);
        setShowPlaylistDialog(true);
        // console.log("worked");
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };
  
    return (
      <div>
        <form onSubmit={handleSubmit}>
          <input type="text" value={query} onChange={handleChange} />
          <button type="submit">Search</button>
        </form>
        <ul>
          {results.map((item) => (
            <li className="video-render" key={item.id.videoId}>
                <a href={`https://www.youtube.com/watch?v=${item.id.videoId}`} target="_blank" rel="noopener noreferrer">
                  <img src={item.snippet.thumbnails.default.url} alt={item.snippet.title} />
                </a>
                <div className="video-info">
                <a href={`https://www.youtube.com/watch?v=${item.id.videoId}`} target="_blank" rel="noopener noreferrer">
                  <p className='video-title'>{item.snippet.title}</p>
                </a>
                <p className='video-duration'>{parseDuration(item.duration)}</p>
                <button onClick={()=>Video.addToPlaylist(item, 1)}>+ To Watch</button>
                {/* <button onClick={(e)=>handleShowPlaylists(e)}>+ Playlists</button> */}
                </div>
            </li>
            
          ))}
        </ul>

        {/* {showPlaylistDialog && (
          <div className="playlist-dialog" style={{ top: dialogPosition.y, left: dialogPosition.x }}>
            <h2>Select a Playlist</h2>
            <ul>
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button onClick={() => Video.addToPlaylist(playlist.id)}>Add to {playlist.playlistName}</button>
                </li>
              ))}
            </ul>
          </div>
        )} */}
        
      </div>
    );
}

export default SearchYoutube