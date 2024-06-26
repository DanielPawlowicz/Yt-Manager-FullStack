import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Service from '../service/Service';
import Video from '../service/Video';

const API_KEY = 'AIzaSyCCd-2OgVAdtWYRIWQ6JapPXYB1-IjSESg';

const SearchYoutube = ({ onPlaylistCreated }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
    const [selectedVideo, setSelectedVideo] = useState({});
    const [playlistName, setPlaylistName] = useState('');
  
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
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=200&q=${query}&key=${API_KEY}`
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

    const handleShowPlaylists = async (e, item) => {

      const rect = e.target.getBoundingClientRect();
      setDialogPosition({ x: rect.x, y: rect.y });

      try {
        const response = await Service.getPlaylists();
        setPlaylists(response.data);
        setSelectedVideo(item);
        setShowPlaylistDialog(true);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    const handlePlaylistNameChange = (event) => {
      setPlaylistName(event.target.value);
    };

    const handleCreatePlaylist = async (video, playlistName) => {
      try {
        let playlistResponse = await Service.createNewPlaylist(playlistName);
        const playlistId = playlistResponse.data;
        console.log(playlistId);
        setShowPlaylistDialog(false);
        setPlaylistName('');
        await Video.addToPlaylist(video, 1);
        await Video.addToPlaylist(video, playlistId);

        // Invoke the callback function after playlist creation
        if (onPlaylistCreated) {
          onPlaylistCreated();
        }
      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    };
  
    return (
      <div>
        <div className='search-container'>
          <form onSubmit={handleSubmit}>
            <input className="search-input" type="text" value={query} onChange={handleChange} />
            <button className='search-btn' type="submit">Search</button>
          </form>
        </div>
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
                <p className='video-duration'>{Video.parseDuration(item.duration)}</p>
                <button onClick={()=>Video.addToPlaylist(item, 1)}>+ To Watch</button>
                <button onMouseOver={(e)=>handleShowPlaylists(e, item)}>+ Playlists</button>
                </div>
            </li>
            
          ))}
        </ul>

        {showPlaylistDialog && (
          <div className="playlist-dialog" style={{ top: dialogPosition.y, left: dialogPosition.x }}>
            <h3>Select the Playlist</h3>
            <ul>
              <li className='new-playlist'>
                <label>New Playlist: <input type="text" className='playlistName' name='playlistName'  value={playlistName} onChange={handlePlaylistNameChange}/></label>
                <button onClick={() => handleCreatePlaylist(selectedVideo, playlistName)}>Add</button>
              </li>
              {playlists.map((playlist) => (
                <li key={playlist.id} className='playlists-list'>
                  <p onClick={() => Video.addToPlaylist(selectedVideo, playlist.id)}>{playlist.playlistName}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        
      </div>
    );
}

export default SearchYoutube