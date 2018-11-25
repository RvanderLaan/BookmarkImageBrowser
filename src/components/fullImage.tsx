import React, {useEffect, useRef, useState} from 'react';
//@ts-ignore
import CircularProgressbar from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import {IImageData} from "../imageUtils";

interface IDimensions {
  width: number,
  height: number,
}

interface IFullImageProps {
  imageData : IImageData;
  hideFullImage: () => any,
}

function getFitDimensions(natDim : IDimensions) : IDimensions {
  let width = natDim.width,
      height = natDim.height;

  if (width > window.innerWidth) {
    width = window.innerWidth;
    height = natDim.height * window.innerWidth / natDim.width;
  }
  if (height > window.innerHeight) {
    height = window.innerHeight;
    width = natDim.width * window.innerHeight / natDim.height;
  }
  return { width, height };
}

function checkIfZoomable(dim : IDimensions) {
  return dim.width > window.innerWidth || dim.height > window.innerHeight
}

const FullImage = ({ imageData, hideFullImage } : IFullImageProps) => {
  const imageEl = useRef<HTMLImageElement>(null);

  // Image props
  const naturalDimensions = imageEl.current ? {
      width: imageEl.current.naturalWidth,
      height: imageEl.current.naturalHeight,
    } : { width: 0, height: 0 };

  const isZoomable = imageEl.current && checkIfZoomable(naturalDimensions);
  const viewDimensions = isZoomable ? getFitDimensions(naturalDimensions) : naturalDimensions;

  // State
  const [isLoaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(undefined as string | undefined);
  const [isZooming, setZooming] = useState(false);
  const [transform, setTransform] = useState('');
  const [, forceUpdate] = useState(-1);

  // Event handlers
  const zoomToCursor = (e : React.MouseEvent) => {
    const clientWidth = document.body.clientWidth, // without scrollbar
          clientHeight = window.innerHeight;       // absolute window height
    const { width: natWidth, height: natHeight } = naturalDimensions;

    const zoomOffsetWidth =  (natWidth - clientWidth) / natWidth * 100;
    const zoomOffsetHeight = (natHeight - clientHeight) / natHeight * 100;

    let width = -50, height = -50;
    if (natWidth > clientWidth) {   width  -= (e.clientX / clientWidth  - 0.5) * zoomOffsetWidth; }
    if (natHeight > clientHeight) { height -= (e.clientY / clientHeight - 0.5) * zoomOffsetHeight; }

    setTransform('translate(' + width + '%, ' + height + '%)');
  };
  const toggleZooming = (e : React.MouseEvent) => {
    e.stopPropagation();
    setZooming(!isZooming);
    if (!isZooming) {
      zoomToCursor(e);
    }
  };
  const hideOnEscape = (e : any) => e.keyCode === 27 && hideFullImage();

  // Load image in background
  useEffect(() => {
    setError(undefined);
    setLoaded(false);
    setProgress(0);

    // Load full image
    const xhr = new XMLHttpRequest();
    xhr.open('GET', imageData.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function() {
      setProgress(0);
      setError('Could not load image');
    };
    xhr.onprogress = function(e) {
      setProgress(e.lengthComputable ? (e.loaded / e.total) * 100 : 0);
    };
    xhr.onloadend = function(e) {
      setProgress(100);
      setLoaded(true);
    };
    xhr.send();
  }, [imageData]); // Only update when imageData changes

  useEffect(() => {
    document.addEventListener('keydown', hideOnEscape);
    return function cleanup() {
      document.removeEventListener('keydown', hideOnEscape)
    }
  });

  // Get image url that is loaded
  let imageUrl = imageData.url;
  if (imageData.previewUrl && !isLoaded) {
    imageUrl = imageData.previewUrl;
  }
  return (
    <div id="imageOverlay" onClick={hideFullImage}>
      <img
        ref={imageEl}
        id="fullImage"
        className={isZoomable ? `${isZooming ? 'zoomOut' : 'zoomIn'}` : ''}
        src={imageUrl}
        width={isZooming ? naturalDimensions.width : viewDimensions.width}
        height={isZooming ? naturalDimensions.height : viewDimensions.height}
        onClick={toggleZooming}
        onMouseMove={isZooming ? zoomToCursor : undefined}
        style={{ transform: isZooming ? transform : '' }}
        onLoad={() => imageUrl === imageData.url
          // Force update to process new properties from changed ref
          && forceUpdate(Math.random())}
      />
      { !isLoaded && (
        <div className="progressWrapper">
          <CircularProgressbar
            percentage={progress}
          />
        </div>
      )}
    </div>
  )
};

export default FullImage;
