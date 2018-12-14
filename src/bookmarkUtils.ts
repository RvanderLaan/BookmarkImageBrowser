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
export function searchBookmarks(query : string) : Promise<BookmarkTreeNode[]> {
  return new Promise((resolve) => chrome.bookmarks.search(query, resolve));
}

export function debounce<F extends Function>(func:F, wait:number):F {
  let timeoutID:number;

  if (!Number.isInteger(wait)) {
    console.log("Called debounce without a valid number")
    wait = 300;
  }

  // conversion through any necessary as it wont satisfy criteria otherwise
  return <F><any>function(this:any, ...args: any[]) {
      clearTimeout(timeoutID);
      const context = this;

      timeoutID = window.setTimeout(function() {
		    func.apply(context, args);
      }, wait);
   };
};
