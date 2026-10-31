import { esc } from '../lib/dom.js';
import { appLink } from '../lib/app-link.js';
import { note } from '../ui/components.js';
import { pageHead, reveal } from '../ui/shell.js';
import { icon, doodle } from '../ui/icons.js';

/** @param {HTMLElement} main */
export function render(main) {
  const url = appLink(import.meta.env.VITE_PWA_URL);
  const open = url
    ? `<a class="m-btn" href="${esc(url)}" target="_blank" rel="noopener">${icon.phone}<span>Open the MIRAS app</span></a>`
    : `<span class="m-btn m-btn--ghost" role="link" aria-disabled="true">${icon.phone}<span>App link coming soon</span></span>`;
  const status = url
    ? note('<p>The app opens in your browser. Add it to your home screen with the steps below and it opens full screen like any other app.</p>', 'paper')
    : note('<p>The app has not been published at a public address yet, so there is nothing to open. This page will show the link as soon as it is.</p>', 'demo');

  main.innerHTML = `
    ${pageHead({ label: 'Get app', title: 'Take MIRAS with you', lead: 'MIRAS is a web app, so there is no app store to visit. You open it in your phone’s browser and add it to your home screen.', art: doodle.hands, extra: `<div class="m-actions" style="margin-top:24px">${open}</div>` })}
    <section class="m-section"><div class="m-wrap">
      ${status}
      <div class="p-split" style="margin-top:40px">
        <section class="p-box" data-reveal aria-labelledby="a1"><h3 id="a1">On an Android phone (Chrome)</h3>
          <ol>
            <li>Open the app link in Chrome.</li>
            <li>Tap the menu (three dots) at the top right.</li>
            <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
            <li>Confirm. MIRAS appears with your other apps.</li>
          </ol>
        </section>
        <section class="p-box" data-reveal aria-labelledby="a2"><h3 id="a2">On an iPhone (Safari)</h3>
          <ol>
            <li>Open the app link in Safari. Other browsers on iPhone cannot add it.</li>
            <li>Tap the Share button.</li>
            <li>Tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong>. MIRAS appears on your home screen.</li>
          </ol>
        </section>
        <section class="p-box" data-reveal aria-labelledby="a3"><h3 id="a3">What to expect</h3>
          <ul>
            <li>You can use it in the browser without installing anything.</li>
            <li>Saved places and your plan stay on your phone. There is no account.</li>
            <li>Guides you save for offline use open with a weak or no signal.</li>
            <li>Features that use AI, such as the camera story and Memories captions, need an internet connection. Photos you choose for a Memories reel are sent to an AI model to write captions.</li>
            <li>The app still contains sample content. Anything unconfirmed is labelled, and <a href="/labels/">this page explains the labels</a>.</li>
          </ul>
        </section>
      </div>
    </div></section>`;
  reveal(main);
}
