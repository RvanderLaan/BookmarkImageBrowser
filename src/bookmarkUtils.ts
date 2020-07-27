import { isDeveloping } from "./config";

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface IBookmarkProvider {
  getBookmark(id : string) : Promise<BookmarkTreeNode>;
  getBookmarks(directoryId : string) : Promise<BookmarkTreeNode[]>;
  getDirectoryPath(id : string) : Promise<BookmarkTreeNode[]>;
  findPreviousDirectory(bookmarks : BookmarkTreeNode[], targetId : string) : BookmarkTreeNode | null;
  searchBookmarks(query : string) : Promise<BookmarkTreeNode[]>;
}

class BookmarkProvider implements IBookmarkProvider {
  getBookmark(id : string) : Promise<BookmarkTreeNode> {
    return new Promise((resolve) => chrome.bookmarks.get(id,
      (results) => resolve(results[0])));
  }
  getBookmarks(directoryId : string) : Promise<BookmarkTreeNode[]> {
    return new Promise((resolve) => chrome.bookmarks.getChildren(directoryId, resolve));
  }
  async getDirectoryPath(id : string) : Promise<BookmarkTreeNode[]> {
    return new Promise<BookmarkTreeNode[]>((resolve) => {
      chrome.bookmarks.get(id, async (bookmarks) => {
        if (id !== '0') {
          const parentDirs = await this.getDirectoryPath(bookmarks[0].parentId || '0');
          parentDirs.push(bookmarks[0]);
          return resolve(parentDirs)
        } else {
          return resolve([]);
        }
      });
    });
  }
  findPreviousDirectory(bookmarks : BookmarkTreeNode[], targetId : string) : BookmarkTreeNode | null {
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
  searchBookmarks(query : string) : Promise<BookmarkTreeNode[]> {
    return new Promise((resolve) => chrome.bookmarks.search(query, resolve));
  }
}

const testImages: BookmarkTreeNode[] = [
  {
    title: 'Reddit post',
    url: 'https://www.reddit.com/r/chloe/comments/flfju7/chloe_character_sheet/',
    id: 'reddit',
  },
  {
    title: 'Twitter image, grabbed 27-7-2020',
    url: 'https://pbs.twimg.com/media/EcPupsaVcAEImzB?format=jpg&name=4096x4096',
    id: 'twitter-img1',
  },
  {
    title: 'DeviantArt',
    url: 'https://www.deviantart.com/radittz/art/Wicked-Necromancer-524980368',
    id: 'deviant-art',
  },
  {
    title: 'Imgur album',
    url: 'https://imgur.com/a/f5z8Y/',
    id: 'imgur-album',
  },
  {
    title: 'Missing image (404)',
    url: 'https://cdn.awwni.me/1zthmx.jpg',
    id: 'missing'
  },
  {
    title: 'Animated gif',
    url: 'https://fauux.neocities.org/16c.gif',
    id: 'gif'
  }
];

class MockBookmarkProvider implements IBookmarkProvider {
  static getRandomBookmark = () => ({
    url: `https://placekitten.com/${Math.round(100 + 500 * Math.random())}/${Math.round(100 + 500 * Math.random())}`,
    title: 'Placeholder Bookmark',
    id: 'abc123',
  });
  static getRandomDirectory= () => ({
    title: 'Placeholder Directory',
    id: 'abc123'
  });

  async getBookmark(id : string) : Promise<BookmarkTreeNode> {
    return testImages.find(bookmark => bookmark.id === id)!;
    // return MockBookmarkProvider.getRandomBookmark();
  }
  async getBookmarks(directoryId : string) : Promise<BookmarkTreeNode[]> {
    return testImages;
    // Placeholder images
    // return Array.from(new Array(Math.round(1 + Math.random() * 32)), MockBookmarkProvider.getRandomBookmark);
  }
  async getDirectoryPath(id : string) : Promise<BookmarkTreeNode[]> {
    return Array.from(new Array(4), MockBookmarkProvider.getRandomDirectory);
  }
  findPreviousDirectory(bookmarks : BookmarkTreeNode[], targetId : string) : BookmarkTreeNode | null {
    return MockBookmarkProvider.getRandomDirectory();
  }
  async searchBookmarks(query : string) : Promise<BookmarkTreeNode[]> {
    return this.getBookmarks('');
  }
}

const provider = isDeveloping ? MockBookmarkProvider : BookmarkProvider;

export default provider;
