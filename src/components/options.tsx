import React, { useState, useEffect } from 'react';

import {
  version,
  pixivClientId,
  pixivClientSecret,
  getCookie,
  setCookie,
  twitterClientId,
  twitterClientSecret
} from "../config";

export async function getPixivToken() : Promise<string> {
  const username = getCookie('pixivUsername');
  const password = getCookie('pixivPassword');

  if (username && username !== '' && password && password !== '') {
    const tokenUrl = "https://oauth.secure.pixiv.net/auth/token";
    const formData = new FormData();
    formData.append("client_id", pixivClientId);
    formData.append("client_secret", pixivClientSecret);
    formData.append("grant_type", "password");
    formData.append("username", username);
    formData.append("password", password);

    // Else you get an email every time the token is requested/refreshed
    const deviceToken = getCookie('pixivDeviceToken');
    if (deviceToken) {
      formData.append("device_token", deviceToken);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      body: formData
    });

    const json = await response.json();

    if (json.response) {
      const pixivToken = json.response["access_token"];
      setCookie('pixivDeviceToken', json.response["device_token"]);
      setCookie('pixivToken', pixivToken);
      return pixivToken;
    } else {
      setCookie('pixivToken', '');
      throw new Error('Unable to get valid Pixiv response. Probably incorrect username or password')
    }
  } else {
    setCookie('pixivToken', '');
    throw new Error('No username or password');
  }
}

export async function getTwitterToken() : Promise<string> {
  // Base64 encoded
  const basicAuth = window.btoa(`${twitterClientId}:${twitterClientSecret}`);

  const tokenUrl = "https://api.twitter.com/oauth2/token";
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  const json = await response.json();
  if (json.access_token) {
    const accessToken = json["access_token"];
    setCookie('twitterToken', accessToken);
    return accessToken;
  } else {
    console.error(response.statusText);
    throw new Error('Unable to get valid Twitter response, check the console.');
  }
}

enum SubmitStatus {
  NONE,
  LOADING,
  SUCCESS,
  ERROR,
  STORED,
}

const options = () => {
  const [pixivStatus, setPixivStatus] = useState(SubmitStatus.NONE);
  const [twitterStatus, setTwitterStatus] = useState(SubmitStatus.LOADING);

  function handleSubmit(e : React.SyntheticEvent) {
    e.preventDefault();
    const form : any = e.target;
    setCookie('pixivUsername', form['username'].value);
    setCookie('pixivPassword', form['password'].value);

    setPixivStatus(SubmitStatus.LOADING);
    getPixivToken()
      .then(() => setPixivStatus(SubmitStatus.SUCCESS))
      .catch(() => setPixivStatus(SubmitStatus.ERROR));
  }

  // Check if already logged in and fetch twitter token
  useEffect(() => {
    const pixivToken = getCookie('pixivToken');
    if (pixivToken && pixivToken !== '') {
      setPixivStatus(SubmitStatus.STORED);
    }

    // Since twitter tokens do not expire, just check if it has been stored
    const twitterToken = getCookie('twitterToken');
    if (!twitterToken || twitterToken === '') {
      setTwitterStatus(SubmitStatus.ERROR);
    } else {
      setTwitterStatus(SubmitStatus.STORED);
    }
  }, []);

  return (
    <div id="options">
      <h3>Settings</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Pixiv Username:</label>
          <input type="text" name="username" id="pixivUsername" defaultValue={getCookie('pixivUsername')}/>
        </div>
        <div>
          <label>Pixiv Password :</label>
          <input type="password" name="password" id="pixivPassword" defaultValue={getCookie('pixivPassword')}/>
        </div>
        <button>Login to Pixiv</button>
      </form>

      <p><b>Pixiv Status: </b>
        { pixivStatus === SubmitStatus.LOADING && <>Loading...</>}
        { pixivStatus === SubmitStatus.ERROR && <>Error! Are you sure the username and password are correct?</>}
        { pixivStatus === SubmitStatus.SUCCESS && <>Logged in! <button onClick={() => location.reload()}>Reload?</button></>}
        { pixivStatus === SubmitStatus.STORED && <>Already logged in, hi {getCookie('pixivUsername')}!</>}
        { pixivStatus === SubmitStatus.NONE && <>No token found, log in above</>}
      </p>
      <p><b>Twitter Status: </b>
        { twitterStatus === SubmitStatus.LOADING && <>Loading...</>}
        { twitterStatus === SubmitStatus.ERROR && <>Error! Something went wrong, check the console</>}
        { twitterStatus === SubmitStatus.SUCCESS && <>Fetched a token! <button onClick={() => location.reload()}>Reload?</button></>}
        { twitterStatus === SubmitStatus.STORED && <>Found an existing token!</>}
      </p>
      <p><b>Source:</b> <a href="https://github.com/RvanderLaan/BookmarkImageBrowser">Github</a></p>
      <p><b>Version:</b> {version}</p>
    </div>
  );
};

export default options;
