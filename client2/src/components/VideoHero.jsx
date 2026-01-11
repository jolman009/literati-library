import React, { useState, useEffect, useRef } from 'react';
import './VideoHero.css';

const VideoHero = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef(null);

  // Video data - each video has a corresponding thumbnail
  const videos = [
    {
      id: 'gamify',
      videoSrc: '/videos/Gamify_Your_Reading_Life_version_1.mp4',
      posterSrc: '/videos/Gamify_Your_Reading_Life_version_1 (1).png',
      title: 'Gamify Your Reading Life',
      description: 'Turn every page into progress'
    },
    {
      id: 'mastery',
      videoSrc: '/videos/Achieve_Reading_Mastery__version_1.mp4',
      posterSrc: '/videos/Achieve_Reading_Mastery__version_1.png',
      title: 'Achieve Reading Mastery',
      description: 'Build lasting reading habits'
    },
    {
      id: 'smarter',
      videoSrc: '/videos/Read_Smarter,_Not_Harder__version_1.mp4',
      posterSrc: '/videos/Read_Smarter,_Not_Harder__version_1.png',
      title: 'Read Smarter, Not Harder',
      description: 'Track your progress effortlessly'
    },
    {
      id: 'knowledge',
      videoSrc: '/videos/Finish_the_book,_keep_the_knowledge__version_1.mp4',
      posterSrc: '/videos/Finish_the_book,_keep_the_knowledge__version_1.png',
      title: 'Finish the book, keep the knowledge',
      description: 'Never forget what you read'
    }
  ];

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentVideoIndex((prevIndex) =>
          (prevIndex + 1) % videos.length
        );
        setIsTransitioning(false);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, [videos.length]);

  // Reset and play video when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      // Auto-play with error handling
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(_error => {
          // Auto-play was prevented - the poster will be shown
        });
      }
    }
  }, [currentVideoIndex]);

  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="video-hero-container">
      <div className={`video-hero-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
        <video
          ref={videoRef}
          className="video-hero"
          poster={currentVideo.posterSrc}
          muted
          playsInline
          loop
          preload="auto"
        >
          <source src={currentVideo.videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Gradient overlay for better text visibility */}
        <div className="video-hero-overlay"></div>
      </div>

      {/* Video navigation dots */}
      <div className="video-hero-nav">
        {videos.map((video, index) => (
          <button
            key={video.id}
            className={`video-nav-dot ${index === currentVideoIndex ? 'active' : ''}`}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentVideoIndex(index);
                setIsTransitioning(false);
              }, 300);
            }}
            aria-label={`Show ${video.title}`}
          >
            <span className="video-nav-tooltip">{video.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoHero;
