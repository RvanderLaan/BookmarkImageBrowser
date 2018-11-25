import React from 'react';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface IDirectoryProps {
  bookmark : BookmarkTreeNode;
  chooseDirectory: (id: string) => Promise<any>;
}

const Directory = ({ bookmark, chooseDirectory } : IDirectoryProps) => {

  return (
    <div
      className="tile folder"
      onClick={async () => await chooseDirectory(bookmark.id)}
      title={bookmark.dateAdded ? `Bookmarked: ${new Date(bookmark.dateAdded).toLocaleString()}` : ''}
    >
      <span>{bookmark.title}</span>
    </div>
  )
};

export default Directory;
