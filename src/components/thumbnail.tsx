import React, { useState, useEffect, useCallback } from 'react';
import {fetchAnyImage, IImageData, isGifImage, getFirstGifFrame} from "../imageUtils";

import placeholder from '../images/placeholder.png';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface IThumbnailProps {
  bookmark : BookmarkTreeNode;
  showFullImage: (imageData : IImageData) => any,
  size: ThumbnailSize,
  convertToLink: () => any,
  animated?: boolean;
}

export enum ThumbnailSize {
  SMALL = 'Small',
  LARGE = 'Large',
}

const Thumbnail = ({ bookmark, showFullImage, size, convertToLink, animated = true } : IThumbnailProps) => {

  const [isHovering, setHovering] = useState(false);
  const [imageData, setImageData] = useState<IImageData | null>(null);
  const [error, setError] = useState(null as string | null);

  const [gifFrame, setGifFrame] = useState('');

  useEffect(() => {
    fetchAnyImage(bookmark)
      .then((imageData) => {
        setImageData(imageData);
      })
      .catch((err) => {
        convertToLink();
        console.warn('Could not load image, converting to link', bookmark.url, err);
      })
  }, []); // Pass in empty array to only fetch on mount

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (!gifFrame && isGifImage(img.src)) {
      // Can't modify the original image - won't play nicely
      const img2 = new Image();
      img2.src = img.src;
      img2.crossOrigin = 'Anonymous';
      img2.onload = () => setGifFrame(getFirstGifFrame(img2));
    }
  }, [gifFrame]);
  
  const thumbnailUrl = (!animated && gifFrame && !isHovering) ? gifFrame : imageData?.previewUrl || imageData?.url;
  return (
    <div
      className={`thumbnail thumbnail${size}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* All done */}
      {
        imageData != null && !error && (
          <img
            src={thumbnailUrl}
            title={`${imageData.title}${bookmark.dateAdded && `\nBookmarked: ${new Date(bookmark.dateAdded).toLocaleString()}`}`}
            alt={imageData.title}
            onClick={() => showFullImage(imageData)}
            onLoad={handleLoad}
            onError={() => { setError('Could not load image'); setImageData(null); }}
            // crossOrigin="anonymous"
          />
        )
      }

      {/* Still loading or error */}
      {
        imageData === null && (
          <img
            src={placeholder}
            title={`${bookmark.title}${error ? ` - Error: ${error}` : ''}`}
            alt={`Placeholder for ${bookmark.title}`}
            width={200}
            className={error ? 'error' : ''}
          />
        )
      }

      {/* Overlay */}
      <div className="overlayText" style={{ display: isHovering ? 'block' : 'none' }}>
        <a href={bookmark.url}>
          { imageData && !error && imageData.title }
          { !imageData && !error && `Loading ${bookmark.title}...` }
          { error && `${bookmark.title} - ${error.toString()}` }
        </a>
      </div>
    </div>
  )
};

export default Thumbnail;
