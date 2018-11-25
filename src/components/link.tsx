import React from 'react';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface ILinkProps {
  bookmark : BookmarkTreeNode;
}

const Link = ({ bookmark } : ILinkProps) => {

  return (
    <div
      className="tile link"
      title={bookmark.dateAdded ? `Bookmarked: ${new Date(bookmark.dateAdded).toLocaleString()}` : ''}
    >
      <a href={bookmark.url} target="_blank">
        <img src={`http://www.google.com/s2/favicons?domain=${bookmark.url}`} alt="Icon" />
        {bookmark.title}
      </a>
    </div>
  )
};

export default Link;
