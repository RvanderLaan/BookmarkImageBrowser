import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

// Chrome is not defined in development
if (chrome && chrome.webRequest) {
  // Chrome specific settings
  // Set referer to request (requirement for pixiv links)
  chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
      const newRef = "http://www.pixiv.net/";
      let gotRef = false;
      for (let n of details.requestHeaders || []) {
        gotRef = n.name.toLowerCase() === "referer";
        if (gotRef) {
          n.value = newRef;
          break;
        }
      }
      if (!gotRef) {
        if (!details.requestHeaders){
          details.requestHeaders = [];
        }
        details.requestHeaders.push({name: "Referer", value: newRef});
      }
      return {requestHeaders: details.requestHeaders};
    }, {
      urls: ["*://*.pixiv.net/*", "*://i.pximg.net/*"]
    }, [
      "requestHeaders",
      "blocking",
      "extraHeaders",
    ]
  );
}