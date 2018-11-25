import React, {ChangeEvent} from 'react';
import {ThumbnailSize} from "./thumbnail";

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface INavbarProps {
  path : BookmarkTreeNode[],
  chooseDirectory: (id : string) => any,
  toggleOptions: () => any,
  setThumnailSize: (size : ThumbnailSize) => any,
  thumbnailSize: ThumbnailSize,
  onDirUp : () => any,
  onDirLeft : () => any,
  onDirRight : () => any,
}

const Navbar = ({
  path, chooseDirectory, toggleOptions, setThumnailSize, thumbnailSize, onDirUp, onDirLeft, onDirRight
} : INavbarProps) => {
  const handleThumbChange = (e : any) => setThumnailSize(e.target.value);
  return (
    <div id="navbar">
      <div id="buttons">
        <div onClick={onDirUp} className="button" id="up" title="Directory up"/>
        <div onClick={onDirLeft} className="button" id="left" title="Directory left"/>
        <div onClick={onDirRight} className="button" id="right" title="Directory right"/>
      </div>

      <div className="navGroup">
        <div className="dir" onClick={() => chooseDirectory('0')}>All</div>
        {
          path.map((bookmark, i) => (
            <React.Fragment>
              <span> &gt; </span>
              <div
                className="dir"
                key={`dir-${i}`}
                onClick={() => chooseDirectory(bookmark.id)}
              >
                {bookmark.title}
              </div>
            </React.Fragment>
          ))
        }
      </div>

      <div className="floatRight">
        <div className="navGroup floatLeft">
          {
            Object.values(ThumbnailSize).map((size, i) => (
              <>
                { i !== 0 && <span> </span>}
                <label className="navRadio" title={`${size} thumbnail sizes`}>
                  <input
                    type="radio"
                    value={size}
                    name={size}
                    onChange={handleThumbChange}
                    checked={thumbnailSize === size}
                  />
                  { Object.values(ThumbnailSize)[i] }
                </label>
              </>
            ))
          }
        </div>

        <div className="button" id="settings" title="Settings" onClick={toggleOptions}/>
      </div>
    </div>
  );
};

export default Navbar;
