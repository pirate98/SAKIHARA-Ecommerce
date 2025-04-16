import React, { useState, useRef, useEffect } from 'react';
import Slider from 'react-slick';

import css from './ListingPage.module.css';
import ReactImageVideoLightbox from 'react-image-video-lightbox';

const isSafari = () => {
  return 'webkit' in document;
}

function VideosItem(props) {
  const { video } = props;
  const [isVideoPlay, setVideoPlay] = useState(false);
  const videoRef = useRef(null);
 
  useEffect(() => {
    const setPosterAttribute = () => {
      const isSafariBrowser = isSafari();
      if (isSafariBrowser) {
        const video = videoRef.current;
        video.setAttribute('poster', video.asset.url);
      }
    }
    setPosterAttribute();
  }, [])  

  return (
    <div className={css.photoSingleVideoContainer}>
      <video
        ref={videoRef}
        className={css.videoImage}
        loop
        muted
        playsInline
        width="100%"
      >
        <source src={video.asset.url} type="video/mp4" />
      </video>
      {isVideoPlay === false && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="59"
          height="60"
          viewBox="0 0 59 60"
          fill="none"
        >
          <circle cx="29.5" cy="30.1738" r="29.5" fill="#1DB1A9" />
          <path d="M38.5768 29.9471L25.8691 20.1895V39.7048L38.5768 29.9471Z" fill="white" />
        </svg>
      )}
    </div>
  );
}

const settings = {
  infinite: false,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  swipeToSlide: true,
  swipe: true,
  autoplay: true,
  autoplaySpeed: 4000,
  dots: true,
  dotsClass: 'slick-dots slick-thumb',
  nextArrow: <></>,
  prevArrow: <></>,
};

function SectionVideos(props) {
  const { rootClassName, videos = [] } = props;
  const [index, setIndex] = useState(0);
  const [isVideoGalleryOpen, setIsVideoGalleryOpen] = useState(false);

  return (
    <div className={css.mainContentWrapper}>
      <div className={rootClassName || css.photoSliderWrapper}>
        <Slider className={css.carousel} {...settings}>
          {videos.map((video, index) => (
            <div
              onClick={() => {
                setIsVideoGalleryOpen(true);
                setIndex(index);
              }}
              key={video.id}
            >
              <VideosItem key={video.id} video={video} />
            </div>
          ))}
        </Slider>
      </div>

      {isVideoGalleryOpen && (
        <div className={css.videoGallery}>
          <ReactImageVideoLightbox
            data={videos.map(video => {
              return { url: video.asset.url, type: 'video', title: '' };
            })}
            startIndex={index}
            showResourceCount={true}
            onCloseCallback={() => setIsVideoGalleryOpen(false)}
            onClose
          />
        </div>
      )}
    </div>
  );
}

export default SectionVideos;
