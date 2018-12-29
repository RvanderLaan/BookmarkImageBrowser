import React from 'react';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface ILinkProps {
  bookmark : BookmarkTreeNode;
}

const Link = ({ bookmark } : ILinkProps) => {

  // Todo: Other way to find icon: 
  // `${new URL(bookmark.url || '').origin}/favicon.ico`

  return (
    <div
      className="tile link"
      title={bookmark.dateAdded ? `Bookmarked: ${new Date(bookmark.dateAdded).toLocaleString()}` : ''}
    >
      <a href={bookmark.url} target="_blank">
        <img src={`http://www.google.com/s2/favicons?domain=${bookmark.url}`} alt="Icon" width="16" height="16" />
        {bookmark.title}
      </a>
    </div>
  )
};

export default Link;
