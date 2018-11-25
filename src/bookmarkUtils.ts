type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

export function getBookmark(id : string) : Promise<BookmarkTreeNode> {
  return new Promise((resolve) => chrome.bookmarks.get(id,
    (results) => resolve(results[0])));
}
export function getBookmarks(directoryId : string) : Promise<BookmarkTreeNode[]> {
  return new Promise((resolve) => chrome.bookmarks.getChildren(directoryId, resolve));
}
export function getDirectoryPath(id : string) : Promise<BookmarkTreeNode[]> {
  return new Promise<BookmarkTreeNode[]>((resolve) => {
    chrome.bookmarks.get(id, async (bookmarks) => {
      if (id !== '0') {
        const parentDirs = await getDirectoryPath(bookmarks[0].parentId || '0');
        parentDirs.push(bookmarks[0]);
        return resolve(parentDirs)
      } else {
        return resolve([]);
      }
    });
  });
}
export function findPreviousDirectory(bookmarks : BookmarkTreeNode[], targetId : string) : BookmarkTreeNode | null {
  // Loop over all bookmarks in the parent directory, and choose the one previous of the current one
  let previous : BookmarkTreeNode | null = null;
  for (let bookmark of bookmarks) {
    if (bookmark.id === targetId) {
      return previous;
    } else if (!bookmark.url) {
      previous = bookmark;
    }
  }
  return null;
}
