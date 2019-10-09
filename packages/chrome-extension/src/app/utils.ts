/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export function runScriptOnPage(scriptString: string) {
  const scriptTag = document.createElement("script");
  scriptTag.setAttribute("type", "text/javascript");
  scriptTag.innerText = scriptString;
  document.body.appendChild(scriptTag);
  scriptTag.remove();
}

export function runAfterPagePushState(callback: () => void) {
  runScriptOnPage(`
  var _wr = function(type) {
      var orig = history[type];
      return function() {
          var rv = orig.apply(this, arguments);
          var e = new Event(type);
          e.arguments = arguments;
          window.dispatchEvent(e);
          return rv;
      };
  };
  history.replaceState = _wr('replaceState');`);

  window.addEventListener("replaceState", () => {
    console.debug("[Kogito] replaceState event happened");
    callback();
  });
  window.addEventListener("popstate", () => {
    console.debug("[Kogito] popstate event happened");
    callback();
  });
}

export function removeAllChildren(node: Node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function mainContainer() {
  return document.getElementById("kogito-container");
}

export function createAndGetMainContainer() {
  if (!mainContainer()) {
    document.body.insertAdjacentHTML("beforeend", `<div id="kogito-container"></div>`);
  }
  return mainContainer()!;
}

export function iframeFullscreenContainer() {
  const element = () => document.getElementById("kogito-iframe-fullscreen-container")!;
  if (!element()) {
    document.body.insertAdjacentHTML("afterbegin", `<div id="kogito-iframe-fullscreen-container"></div>`);
  }
  return element();
}

export function waitUntil(halt: () => boolean, times: { interval: number; timeout: number }) {
  return new Promise((res, rej) => {
    asyncLoop(halt, times.interval, times.timeout, new Date().getTime(), res, rej);
  });
}

function asyncLoop(
  halt: () => boolean,
  interval: number,
  timeout: number,
  start: number,
  onHalt: () => void,
  onTimeout: (...args: any[]) => void
) {
  //timeout check
  if (new Date().getTime() - start >= timeout) {
    onTimeout("async loop timeout");
    return;
  }

  //check condition
  if (halt()) {
    onHalt();
    return;
  }

  //loop
  setTimeout(() => asyncLoop(halt, interval, timeout, start, onHalt, onTimeout), interval);
}