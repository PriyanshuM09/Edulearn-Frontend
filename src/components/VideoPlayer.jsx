import { useEffect, useRef, useState } from 'react';
import { getYouTubeID, isYouTubeURL } from '../utils/videoUtils';
import { Loader2, AlertCircle } from 'lucide-react';

const VideoPlayer = ({ url, onEnded, onProgress, lessonId }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isApiReady, setIsApiReady] = useState(!!(window.YT && window.YT.Player));
  const progressIntervalRef = useRef(null);
  const lastPercentRef = useRef(0);
  
  // Use refs for props to avoid stale closures in setInterval
  const onProgressRef = useRef(onProgress);
  const lessonIdRef = useRef(lessonId);
  const onEndedRef = useRef(onEnded);

   useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
   useEffect(() => { 
     if (lessonId !== lessonIdRef.current) {
       console.log(`[VideoPlayer] Switching track to Lesson: ${lessonId}`);
       lastPercentRef.current = 0; 
       lessonIdRef.current = lessonId;
       clearProgressInterval();
     }
   }, [lessonId]);
   useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);


  // 1. Handle API Loading
  useEffect(() => {
    if (isApiReady) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkReady);
          setIsApiReady(true);
        }
      }, 100);
      return () => clearInterval(checkReady);
    }
  }, [isApiReady]);

  // Helper to clear interval
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Start polling progress
  const startProgressInterval = () => {
    clearProgressInterval();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          const percent = Math.floor((currentTime / duration) * 100);
          // Only trigger if percent changed to avoid spamming
          if (percent !== lastPercentRef.current) {
            lastPercentRef.current = percent;
            if (onProgressRef.current) onProgressRef.current(percent, lessonIdRef.current);
          }
        }
      }
    }, 2000); // Check every 2 seconds
  };


  // 2. Handle Player Initialization & Updates
  useEffect(() => {
    if (!url || !isYouTubeURL(url) || !isApiReady) return;

    const videoId = getYouTubeID(url);
    if (!videoId) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    lastPercentRef.current = 0; // Reset tracking for new URL
    clearProgressInterval();

    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      // Reuse existing player
      try {
        playerRef.current.loadVideoById(videoId);
        setLoading(false);
      } catch (e) {
        console.error("Failed to load video by ID, recreating player", e);
        createPlayer(videoId);
      }
    } else {
      // Create new player
      createPlayer(videoId);
    }

    function createPlayer(vId) {
      // Create a fresh div inside the container to be replaced by YouTube
      // This prevents React from losing track of the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div id="yt-player-element"></div>';
        
        playerRef.current = new window.YT.Player('yt-player-element', {
          height: '100%',
          width: '100%',
          videoId: vId,
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: () => setLoading(false),
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                startProgressInterval();
              } else if (event.data === window.YT.PlayerState.PAUSED || 
                         event.data === window.YT.PlayerState.ENDED) {
                clearProgressInterval();
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                if (onEndedRef.current) onEndedRef.current(lessonIdRef.current);
              }
            },
            onError: () => {
              clearProgressInterval();
              setError(true);
              setLoading(false);
            }
          },
        });
      }
    }

    // cleanup is handled by innerHTML clearing on next run or unmount
  }, [url, isApiReady, lessonId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgressInterval();
      if (playerRef.current && playerRef.current.destroy) {
        try {
           playerRef.current.destroy();
        } catch (e) {
           // Ignore destroy errors
        }
      }
    };
  }, []);

  if (!url) return null;

  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold">Video Unplayable</h3>
          <p className="text-sm text-gray-400 mt-2">The video URL provided might be invalid or restricted.</p>
          <a href={url} target="_blank" rel="noreferrer" className="mt-4 text-blue-400 hover:underline text-sm">
            Try watching on external site
          </a>
        </div>
      )}

      {isYouTubeURL(url) ? (
        <div key="yt-container" ref={containerRef} className="w-full h-full" />
      ) : (
        <div key="fallback-container" className="w-full h-full">
           <iframe
            src={url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
