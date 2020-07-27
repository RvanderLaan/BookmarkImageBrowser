export const version = '0.2.5';

export const isDeveloping = !chrome || !chrome.bookmarks;

export const flickrApiKey = '5d6a692a5a09bb9d18da1aae7f62e6a0';
export const tumblrApiKey = 'dHwiC2BpOli30sSYhp0sUCWhc2wtauoFU0mhfvNvOQJUrIFRml';
export const imgurApiKey = '94740425601045d';

export const pixivClientId = 'MOBrBDS8blbauoSck0ZfDbtuzpyT';
export const pixivClientSecret = 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj';
export const pixivServerHash = '28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c';

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
