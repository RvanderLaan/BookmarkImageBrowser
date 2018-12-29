import React, {ChangeEvent, useState, useEffect} from 'react';
import {ThumbnailSize} from "./thumbnail";

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface INavbarProps {
  path : BookmarkTreeNode[],
  searchQuery: string,
  chooseDirectory: (id : string) => any,
  onSearch: (query?: string) => any,
  toggleOptions: () => any,
  setThumnailSize: (size : ThumbnailSize) => any,
  thumbnailSize: ThumbnailSize,
  onDirUp : () => any,
  onDirLeft : () => any,
  onDirRight : () => any,
}

const Navbar = ({
  path, searchQuery, chooseDirectory, onSearch, toggleOptions, setThumnailSize, thumbnailSize, onDirUp, onDirLeft, onDirRight
} : INavbarProps) => {
  const handleThumbChange = (e : any) => setThumnailSize(e.target.value);

  const handleSearchChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };
  const handleSearchKey = (e : React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onSearch('');
    }
  }
  const clearSearch = () => onSearch('');

  return (
    <div id="navbar">
      <div id="buttons">
        <div onClick={onDirUp} className="button" id="up" title="Directory up"/>
        <div onClick={onDirLeft} className="button" id="left" title="Directory left"/>
        <div onClick={onDirRight} className="button" id="right" title="Directory right"/>
      </div>

      <div className={`navGroup ${searchQuery && 'grey-text'}`}>
        <div className="dir" onClick={() => { chooseDirectory('0'); onSearch(''); }}>All</div>
        {
          path.map((bookmark, i) => (
            <span key={`dir-${i}`}>
              <span> &gt; </span>
              <div
                className="dir"
                onClick={() => { chooseDirectory(bookmark.id); onSearch(''); }}
              >
                {bookmark.title}
              </div>
            </span>
          ))
        }
      </div>

      <div className="floatRight">
        <div id="searchbar">
          <input
            type="text"
            onKeyDown={handleSearchKey}
            onChange={handleSearchChange}
            placeholder="Search"
            value={searchQuery}
          />
          <div
            className="button"
            onClick={clearSearch}
            title="Clear search"
          >x</div>
        </div>

        <div className="navGroup floatLeft">
          {
            Object.values(ThumbnailSize).map((size, i) => (
              <span key={`thumb-size-${i}`}>
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
              </span>
            ))
          }
        </div>

        <div className="button" id="settings" title="Settings" onClick={toggleOptions}/>
      </div>
    </div>
  );
};

export default Navbar;
