import React, {Component} from 'react';
import Navbar from "./components/navbar";
import Thumbnail, {ThumbnailSize} from "./components/thumbnail";
import FullImage from "./components/fullImage";
import Link from "./components/link";
import Directory from "./components/directory";
import Options, {getPixivToken, getTwitterToken} from "./components/options";
import {fetchAnyImage, IImageData, isAnyImage, isContentTypeImage} from './imageUtils';
import {getCookie, setCookie} from "./config";
import {findPreviousDirectory, getBookmark, getBookmarks, getDirectoryPath} from "./bookmarkUtils";

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface IAppProps {}

interface IAppState {
  currentId : string;
  bookmarks : BookmarkTreeNode[];
  path : BookmarkTreeNode[];
  splitBookmarks: {
    directories: BookmarkTreeNode[];
    links: BookmarkTreeNode[];
    images: BookmarkTreeNode[];
  },
  fullImage: IImageData | undefined,
  showOptions: boolean,
  thumbnailSize : ThumbnailSize
}

class App extends Component<IAppProps, IAppState> {
  constructor(props : IAppProps) {
    super(props);
    this.state = {
      currentId: '0',
      path: [],
      bookmarks: [],
      splitBookmarks: {
        directories: [],
        links: [],
        images: [],
      },
      fullImage: undefined,
      showOptions: false,
      thumbnailSize: getCookie('thumbnailSize') as ThumbnailSize || ThumbnailSize.LARGE
    };
    this.chooseDirectory = this.chooseDirectory.bind(this);
    this.onDirLeft = this.onDirLeft.bind(this);
    this.onDirRight = this.onDirRight.bind(this);
    this.onDirUp = this.onDirUp.bind(this);
    this.showFullImage = this.showFullImage.bind(this);
    this.hideFullImage = this.hideFullImage.bind(this);
    this.toggleOptions = this.toggleOptions.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.prevFullImage = this.prevFullImage.bind(this);
    this.nextFullImage = this.nextFullImage.bind(this);
    this.setThumbnailSize = this.setThumbnailSize.bind(this);
  }
  async componentWillMount() {
    // When you go back (pop), choose that directory
    window.onpopstate = async (event) => {
      await this.chooseDirectory(event.state, true);
    };

    document.addEventListener('keydown', this.handleKeyDown);

    // Fetch pixiv token, expires after some time, so fetch every time
    if (getCookie('pixivToken')) {
      getPixivToken().then().catch(console.error);
    }

    // Fetch twitter token - only need to fetch it once
    if (!getCookie('twitterToken')) {
      getTwitterToken().then().catch(console.error);
    }

    // If a directory ID is in the URL, use it to show that directory
    let currentId = '0';
    const params = location.search;
    if (params.length > 1) {
      currentId = params.substr(1, params.length);
    }
    await this.chooseDirectory(currentId);
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
  handleKeyDown(e : any) {
    if (this.state.fullImage) {
      if (e.key === 'ArrowLeft') this.prevFullImage().then();
      else if (e.key === 'ArrowRight') this.nextFullImage().then();
    } else {
      if (e.key === 'ArrowLeft') this.onDirLeft().then();
      else if (e.key === 'ArrowRight') this.onDirRight().then();
    }
  }
  async chooseDirectory(id : string, doNotPushState? : boolean) {
    const bookmarks = await getBookmarks(id);

    if (!doNotPushState) {
      history.pushState(id, "Directory " + id, window.location.pathname + "?" + id);
    }

    const directories : BookmarkTreeNode[] = [];
    const links       : BookmarkTreeNode[] = [];
    const images      : BookmarkTreeNode[] = [];

    bookmarks.forEach((bookmark) => {
      const url = bookmark.url;
      if (!url) {
        directories.push(bookmark);
      } else if (isAnyImage(bookmark.url || '')) {
        images.push(bookmark);
      } else {
        links.push(bookmark);
      }
    });

    this.setState({
      currentId: id,
      bookmarks,
      path: await getDirectoryPath(id),
      splitBookmarks: {
        directories,
        links,
        images
      }
    });

    // Check if links are images asynchronously
    links.forEach((link) => {
      isContentTypeImage(link.url || '')
        .then((isImage) => {
          if (isImage) {
            // If it's an image due to its content type header, move it to the images list
            this.setState((state) => {
              const { splitBookmarks } = state;
              splitBookmarks.links.splice(splitBookmarks.links.indexOf(link), 1);
              splitBookmarks.images.push(link);
            });
          }
        });
    });
  }
  async onDirUp() {
    const current = await getBookmark(this.state.currentId);
    await this.chooseDirectory(current.parentId || '0');
  }
  async onDirLeft() {
    const { currentId } = this.state;
    const current = await getBookmark(currentId);
    const parentBookmarks = await getBookmarks(current.parentId || '0');
    const previousDir = findPreviousDirectory(parentBookmarks, currentId);
    if (previousDir) {
      await this.chooseDirectory(previousDir.id);
    }
  }
  async onDirRight() {
    const { currentId } = this.state;
    const current = await getBookmark(currentId);
    const parentBookmarks = await getBookmarks(current.parentId || '0');
    const previousDir = findPreviousDirectory(parentBookmarks.reverse(), currentId);
    if (previousDir) {
      await this.chooseDirectory(previousDir.id);
    }
  }
  showFullImage(imageData : IImageData) {
    this.setState({ fullImage: imageData });
  }
  async hideFullImage() {
    this.setState({ fullImage: undefined });
  }
  async nextFullImage() {
    const { bookmarks, fullImage } = this.state;
    if (fullImage) {
      const i = bookmarks.indexOf(fullImage.bookmark);
      const next = bookmarks[(i + 1) % bookmarks.length];
      // Todo: This has already been fetched in the Thumbnail, but how to get it? All states in App?
      const data = await fetchAnyImage(next);
      this.showFullImage(data);
    }
  }
  async prevFullImage() {
    const { bookmarks, fullImage } = this.state;
    if (fullImage) {
      const i = bookmarks.indexOf(fullImage.bookmark);
      const next = bookmarks[(i - 1 + bookmarks.length) % bookmarks.length];
      const data = await fetchAnyImage(next);
      this.showFullImage(data);
    }
  }
  toggleOptions() {
    this.setState({ showOptions: !this.state.showOptions });
  }
  setThumbnailSize(size : ThumbnailSize) {
    setCookie('thumbnailSize', size);
    this.setState({ thumbnailSize: size });
  }
  convertImageToLink(bookmark : BookmarkTreeNode, directoryId : string) {
    this.setState((state) => {
      const { splitBookmarks } = state;
      // Don't convert if the function is called after switching to a new directory
      if (directoryId === state.currentId) {
        const imageIndex = splitBookmarks.images.indexOf(bookmark);
        if (imageIndex >= 0) {
          // Remove from image list
          const removedImage = splitBookmarks.images.splice(imageIndex, 1)[0];
          // Add it to links
          splitBookmarks.links.splice(state.splitBookmarks.links.length, 0, removedImage);
        }
      }
      return { splitBookmarks };
    });
  }
  render() {
    const { currentId, path, splitBookmarks, fullImage, showOptions, thumbnailSize } = this.state;
    return (
      <React.Fragment>
        { fullImage && (
          <FullImage
            imageData={fullImage}
            hideFullImage={this.hideFullImage}
          />
        )}

        <Navbar
          path={path}
          chooseDirectory={this.chooseDirectory}
          toggleOptions={this.toggleOptions}
          onDirUp={this.onDirUp}
          onDirLeft={this.onDirLeft}
          onDirRight={this.onDirRight}
          thumbnailSize={thumbnailSize}
          setThumnailSize={this.setThumbnailSize}
        />

        { showOptions && <Options /> }

        <div id="content">
          <div id="bookmarks">
            { splitBookmarks.directories.map((bookmark, index) => (
                <Directory
                  bookmark={bookmark}
                  chooseDirectory={this.chooseDirectory}
                  key={`folder-${currentId}-${index}-${bookmark.title}`}
                />
            ))}
            { splitBookmarks.links.map((bookmark, index) => (
                <Link bookmark={bookmark} key={`link-${currentId}-${index}-${bookmark.title}`} />
            ))}
          </div>

          <div id="images">
            { splitBookmarks.images.map((bookmark, index) => (
                <Thumbnail
                  bookmark={bookmark}
                  key={`image-${currentId}-${index}-${bookmark.title}`}
                  showFullImage={this.showFullImage}
                  size={thumbnailSize}
                  convertToLink={() => this.convertImageToLink(bookmark, currentId)}
                />
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default App;
