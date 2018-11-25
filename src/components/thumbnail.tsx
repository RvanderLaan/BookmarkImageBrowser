import React, { useState, useEffect } from 'react';
import {fetchAnyImage, IImageData} from "../imageUtils";

import placeholder from '../images/placeholder.png';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface IThumbnailProps {
  bookmark : BookmarkTreeNode;
  showFullImage: (imageData : IImageData) => any,
  size: ThumbnailSize,
}

export enum ThumbnailSize {
  SMALL = 'Small',
  LARGE = 'Large',
}

const Thumbnail = ({ bookmark, showFullImage, size } : IThumbnailProps) => {

  const [isHovering, setHovering] = useState(false);
  const [imageData, setImageData] = useState(null as IImageData | null);
  const [error, setError] = useState(null as string | null);
  if (error) console.log(imageData);

  useEffect(() => {
    fetchAnyImage(bookmark)
      .then((imageData) => setImageData(imageData))
      .catch((err) => { setError(err.toString()); console.error(err) })
  }, []); // Pass in empty array to only fetch on mount

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
            src={imageData.previewUrl || imageData.url}
            title={`${imageData.title}${bookmark.dateAdded && `\nBookmarked: ${new Date(bookmark.dateAdded).toLocaleString()}`}`}
            alt={imageData.title}
            onClick={() => showFullImage(imageData)}
            onError={() => setError('Could not load image')}
          />
        )
      }

      {/* Still loading or error */}
      {
        imageData === null && (
          <img
            src={placeholder}
            title={`Placeholder for ${bookmark.title}`}
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
