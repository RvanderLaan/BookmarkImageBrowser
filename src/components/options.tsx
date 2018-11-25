import React, { useState, useEffect } from 'react';

import { version, pixivClientId, pixivClientSecret, getCookie, setCookie } from "../config";

export async function getPixivToken() : Promise<string> {
  const username = getCookie('username');
  const password = getCookie('password');

  if (username && username !== '' && password && password !== '') {
    const tokenUrl = "https://oauth.secure.pixiv.net/auth/token";
    const formData = new FormData();
    formData.append("client_id", pixivClientId);
    formData.append("client_secret", pixivClientSecret);
    formData.append("grant_type", "password");
    formData.append("username", username);
    formData.append("password", password);

    // Else you get an email every time the token is requested/refreshed
    const deviceToken = getCookie('deviceToken');
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
      setCookie('deviceToken', json.response["device_token"]);
      setCookie('pixivToken', pixivToken);
      return pixivToken;
    } else {
      throw new Error('Unable to get valid Pixiv response. Probably incorrect username or password')
    }
  } else {
    throw new Error('No username or password');
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
  const [status, setStatus] = useState(SubmitStatus.NONE);

  function handleSubmit(e : React.SyntheticEvent) {
    e.preventDefault();
    const form : any = e.target;
    setCookie('username', form['username'].value);
    setCookie('password', form['password'].value);
    getPixivToken()
      .then(() => setStatus(SubmitStatus.SUCCESS))
      .catch(() => setStatus(SubmitStatus.ERROR));
  }

  // Check if already logged in
  useEffect(() => {
    const pixivToken = getCookie('pixivToken');
    if (pixivToken && pixivToken !== '') {
      setStatus(SubmitStatus.STORED);
    }
  }, []);

  return (
    <div id="options">
      <h3>Settings</h3>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Pixiv Username:</label>
          <input type="text" name="username" id="pixivUsername" defaultValue={getCookie('username')}/>
        </div>
        <div>
          <label>Pixiv Password :</label>
          <input type="password" name="password" id="pixivPassword" defaultValue={getCookie('password')}/>
        </div>
        <button>Login to Pixiv</button>
      </form>

      { status === SubmitStatus.LOADING && <p>Loading...</p>}
      { status === SubmitStatus.ERROR && <p>Error! Are you sure the username and password are correct?</p>}
      { status === SubmitStatus.SUCCESS && <p>Logged in! <button onClick={() => location.reload()}>Reload?</button></p>}
      { status === SubmitStatus.STORED && <p>Already logged in, hi {getCookie('username')}!</p>}

      <p>(Needed to access the Pixiv API for retrieving images.)</p>

      {/* TODO: Add github link */}
      <p><b>Source:</b> <a href="github here">Github</a></p>
      <p><b>About:</b> Made by ThaRemo, {version}</p>
      <p><b>Contact:</b> <a href="mailto:rrm.remi@gmail.com">E-mail</a></p>
    </div>
  );
};

export default options;
