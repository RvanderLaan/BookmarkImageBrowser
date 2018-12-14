type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

import {flickrApiKey, tumblrApiKey, imgurApiKey, getCookie} from './config';

// URL Utils
// Some inspiration from https://github.com/erikdesjardins/Reddit-Enhancement-Suite/tree/master/lib/modules/hosts
export const isDirectImage = (url : string) => url.match(/\.(jpeg|jpg|gif|png|svg)/) !== null;
export const isDeviantArtImage = (url : string) => url.indexOf('deviantart.com/art/') > 0;
export const isPixivImage = (url : string) => url.indexOf('pixiv.net') >= 0 && url.indexOf('illust_id=') >= 0;
export const isInstagramImage = (url : string) => url.indexOf('instagram.com/p/') >= 0;
export const isFlickrImage = (url : string) => url.indexOf('flickr.com/photos/') >= 0;
export const isTumblrImage = (url : string) => url.indexOf('.tumblr.com/post/') >= 0;
export const isImgurImage = (url : string) => url.indexOf('imgur.com/') >= 0;
export const isRedditImage = (url : string) => url.indexOf('reddit.com/r/') >= 0 && url.indexOf('/comments/') > 0;
export const isTwitterImage = (url : string) => url.indexOf('twitter.com/') !== -1 && url.indexOf('/status/') !== -1;

export async function isContentTypeImage(url : string) {
  try {
    const headers = await fetch(url, {method: 'HEAD', mode: "no-cors"});
    const type = headers.headers.get('Content-type') || '';
    return type.indexOf('image/') !== -1;
  } catch (e) {
    return false;
  }
}

export function isAnyImage(url : string) : boolean {
  return isDirectImage(url)
    || isDeviantArtImage(url)
    || isPixivImage(url)
    || isInstagramImage(url)
    || isFlickrImage(url)
    || isTumblrImage(url)
    || isImgurImage(url)
    || isRedditImage(url)
    || isTwitterImage(url);
}

function removeUrlParams(url : string) : string {
  const qIdx = url.lastIndexOf('?');
  if (qIdx > 0) {
    return url.substr(0, qIdx);
  }
  return url;
}

// Fetching utils
export interface IImageData {
  bookmark: BookmarkTreeNode;
  url: string;
  title: string;
  previewUrl?: string;
  width?: number;
  height?: number;
}

export async function fetchDirectImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  let url = bookmark.url || '';
  const filename = bookmark.title || url.substring(url.lastIndexOf('/')+1);
  let previewUrl = url;

  if (url.endsWith('.gifv')) {
    // gifv -> gif
    url = url.substr(0, url.length - 1);
    previewUrl = url;
  } else if (url.endsWith(':large')) {
    // Twitter images are :large by default
    url = url.substr(0, url.length - 6);
    previewUrl = `${url}:medium`;
  }

  return {
    bookmark,
    title: filename,
    url: url,
    previewUrl,
  };
}

export async function fetchDeviantArtImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = bookmark.url || '';
  const oembed_url = `https://backend.deviantart.com/oembed?url=${url}&format=json`;
  const response = await fetch(oembed_url);
  const data = await response.json();

  return {
    bookmark,
    title: `${data.author_name}: ${data.title}`,
    previewUrl: data.thumbnail_url,
    url: data.url,
  };
}
export async function fetchPixivImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = bookmark.url || '';
  const idIdx = url.indexOf('&illust_id=') + 11;
  const id = url.substring(idIdx, idIdx + 8);
  const pixivToken = getCookie('pixivToken');

  const apiWorksUrl = `https://public-api.secure.pixiv.net/v1/works/${id}.json?image_sizes=medium,large`;
  const response = await fetch(apiWorksUrl, {
    headers: {
      'Authorization': "Bearer " + pixivToken,
    }
  });
  const data = await response.json();

  if (data.status === "success") {
    const response = data.response[0];
    return {
      bookmark,
      title: `${response.user.name} - ${response.title}`,
      previewUrl: data.response[0].image_urls.medium,
      url: data.response[0].image_urls.large,
    };
  } else {
    throw new Error(JSON.stringify(data, null, 2));
  }
}

export async function fetchInstagramImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = bookmark.url || '';
  const idIdx = url.indexOf('/p/') + 3;
  const id = url.substring(idIdx, idIdx + 11);

  const baseUrl = `https://www.instagram.com/p/${id}/media/`;

  return {
    bookmark,
    title: bookmark.title,
    previewUrl: `${baseUrl}?size=m`,
    url: `${baseUrl}?size=l`,
  };
}

export async function fetchFlickrImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = bookmark.url || '';
  const subUrl = url.substring(url.indexOf('/photos/') + 8);
  const id = subUrl.substr(subUrl.indexOf('/') + 1, 11);

  const baseUrl = 'https://api.flickr.com/services/rest/?method=flickr.photos.getSizes';
  const imageSizeUrl = `${baseUrl}&photo_id=${id}&api_key=${flickrApiKey}&format=json&nojsoncallback=1`;
  const response = await fetch(imageSizeUrl);
  const json = await response.json();
  if (json.stat !== 'ok') throw new Error(json.message);

  const mediumUrl = json.sizes.find((size : any) => size.label === 'Medium').source;
  const largeUrl = json.sizes[json.sizes.length - 1].source;

  return {
    bookmark,
    title: bookmark.title,
    previewUrl: mediumUrl,
    url: largeUrl
  };
}

export async function fetchTumblrImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = bookmark.url || '';
  const subUrl = url.substring(url.indexOf('/post/') + 6);
  const id = subUrl.substring(0, subUrl.indexOf('/'));
  const user = url.substring(url.indexOf('/') + 2, url.indexOf('.'));

  const baseUrl = 'https://api.tumblr.com/v2/blog';
  const postUrl = `${baseUrl}/${user}/posts/photo?id=${id}&api_key=${tumblrApiKey}`;

  const response = await fetch(postUrl);
  const json = await response.json();
  if (json.meta.status !== 200) throw new Error(json.meta.msg);

  const post = json.response.posts[0];
  const photo = post.photos[0];
  const mediumUrl = photo['alt_sizes'].find((size : any) => size.width <= 500).url;
  const originalUrl = photo['original_size'].url;
  return {
    bookmark,
    title: bookmark.title,
    previewUrl: mediumUrl,
    url: originalUrl
  };
}

export async function fetchImgurImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = removeUrlParams(bookmark.url || '');

  const opts = {
    headers: {
      'Authorization': `Client-ID ${imgurApiKey}`
    }
  };

  const id = url.substring(url.lastIndexOf('/') + 1);

  let postUrl : string;
  if (url.indexOf('/gallery/') !== -1) {
    postUrl = `https://api.imgur.com/3/album/${id}/images`;
  } else if (url.indexOf('/a/') !== -1) {
    postUrl = `https://api.imgur.com/3/album/${id}/images`;
  } else {
    postUrl = `https://api.imgur.com/3/image/${id}`;
  }

  const response = await fetch(postUrl, opts);
  const json = await response.json();
  if (!json.success) throw new Error(json.data.error);

  // Pick first image if it's an album
  const isAlbum = Array.isArray(json.data);
  const data = isAlbum ? json.data[0] : json.data;

  // Todo: Could make use of MP4 when it's a gif
  const originalUrl : string = data.link;
  const extension = originalUrl.substr(0, originalUrl.lastIndexOf('.'));
  const baseImageUrl = originalUrl.substr(0, originalUrl.length - extension.length - 1);
  const previewUrl = `${baseImageUrl}l.${extension}`;
  return {
    bookmark,
    title: `${isAlbum ? 'Album: ' : ''}${data.title || bookmark.title}`,
    url: originalUrl,
    previewUrl,
  };
}

export async function fetchRedditImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  let url = removeUrlParams(bookmark.url || '');
  const requestUrl = `${url}.json?limit=1`;
  const response = await fetch(requestUrl);
  const json = await response.json();
  if (json.error) throw new Error(json.message);

  // Fetch link of post and use that to fetchAnyImage
  const post = (Array.isArray(json) ? json[0] : json).data.children[0];
  const postUrl : string = post.data.url;
  if (isRedditImage(postUrl)) {
    return Promise.reject('Reddit post is another reddit post, not an image');
  }
  const fakeBookmark = bookmark;
  fakeBookmark.url = postUrl;
  return fetchAnyImage(fakeBookmark, bookmark.url);
}

export async function fetchTwitterImage(bookmark : BookmarkTreeNode) : Promise<IImageData> {
  const url = bookmark.url || '';
  const idIdx = url.indexOf('/status/') + 8;
  let idIdxEnd = url.substr(idIdx).indexOf('/');
  idIdxEnd = idIdxEnd === -1 ? url.length : (idIdx + idIdxEnd);
  const id = url.substring(idIdx, idIdxEnd);
  const token = getCookie('twitterToken');

  const apiWorksUrl = `https://api.twitter.com/1.1/statuses/lookup.json?id=${id}&trim_user=1`;
  const response = await fetch(apiWorksUrl, {
    headers: {
      'Authorization': "Bearer " + token,
    }
  });
  const data = await response.json();

  if (data.length >= 1 && data[0].entities && data[0].entities.media && data[0].entities.media[0]) {

    const url = data[0].entities.media[0].media_url;
    return {
      bookmark,
      title: bookmark.title,
      previewUrl: `${url}:medium`,
      url,
    };
  } else {
    throw new Error(JSON.stringify(data, null, 2));
  }
}

/**
 * Only works for images checked with isAnyImage
 * @param bookmark
 * @param urlOverride Override the url when the actual url is different than that of the given bookmark
 */
export async function fetchAnyImage(bookmark : BookmarkTreeNode, urlOverride? : string) : Promise<IImageData> {
  const url = bookmark.url || '';
  if (isDirectImage(url))     return fetchDirectImage(bookmark);
  if (isDeviantArtImage(url)) return fetchDeviantArtImage(bookmark);
  if (isPixivImage(url))      return fetchPixivImage(bookmark);
  if (isInstagramImage(url))  return fetchInstagramImage(bookmark);
  if (isFlickrImage(url))     return fetchFlickrImage(bookmark);
  if (isTumblrImage(url))     return fetchTumblrImage(bookmark);
  if (isImgurImage(url))      return fetchImgurImage(bookmark);
  if (isRedditImage(url))     return fetchRedditImage(bookmark);
  if (isTwitterImage(url))    return fetchTwitterImage(bookmark);

  // Check header
  const hasImageHeader = await isContentTypeImage(bookmark.url || '');
  if (!hasImageHeader){
    throw new Error(`Bookmark is not an image: ${bookmark.url}`);
  }
  return {
    bookmark,
    title: bookmark.title,
    url: urlOverride || bookmark.url || '',
  };
}
