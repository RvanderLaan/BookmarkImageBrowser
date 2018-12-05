export const version = '0.2.1';

export const flickrApiKey = '5d6a692a5a09bb9d18da1aae7f62e6a0';
export const tumblrApiKey = 'dHwiC2BpOli30sSYhp0sUCWhc2wtauoFU0mhfvNvOQJUrIFRml';
export const imgurApiKey = '94740425601045d';

export const pixivClientId = 'bYGKuGVw91e0NMfPGp44euvGt59s';
export const pixivClientSecret = 'HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK';

export const twitterClientId = 'ihMxbZ9Gv6wMVgAvjzrJOcpUN';
export const twitterClientSecret = 'r2hquHmffztBxcnjdRKh7demPpzWGxlwTiVspEXgbmIIRr12DE';

// Most secure way to store client side info, e.g. API keys, passwords
export function getCookie(name : string) : string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return undefined;
}
export function setCookie(name : string, value : string) {
  document.cookie = name + "=" + value + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
}
