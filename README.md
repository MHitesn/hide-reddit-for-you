# Hide "For You" for Reddit

A tiny Chrome extension that hides the **"For You"** tab Reddit added to the home page, which Reddit doesn't let you turn off.

- Removes the tab completely, with no empty gap left behind
- If Reddit opens on the "For You" feed, switches you to your regular feed
- Needs no permissions, collects no data, and runs only on reddit.com

<img src="docs/welcome.png" alt="Welcome screen" width="480">

## Install

Chrome only installs Web Store extensions with one click, so this one takes about a minute to set up by hand:

1. **[Download the latest release](../../releases/latest)**. Get the `hide-reddit-for-you-vX.Y.Z.zip` file under *Assets*.
2. Unzip it. You'll get a folder called `hide-reddit-for-you`. Move it somewhere permanent, such as your Documents folder. **Don't delete it**, because Chrome loads the extension from this folder.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the `hide-reddit-for-you` folder.
6. Refresh reddit.com. The "For You" tab is gone.

It also works in other Chromium browsers, such as Edge, Brave, Arc, Opera and Vivaldi. The extensions page is at `edge://extensions`, `brave://extensions` and so on.

## Update

Download the new release, replace the old folder's contents with the new files, then click the ↻ reload icon on the extension's card in `chrome://extensions`.

## Uninstall

Click **Remove** on the extension's card in `chrome://extensions`, then delete the folder.

## Privacy

This extension requests **no permissions**. It has no analytics, makes no network requests and stores nothing. The whole thing is a few small files you can read in this repo. The main script is [`content.js`](content.js).

## The tab came back?

Reddit changes its layout often. If the tab reappears, please [open an issue](../../issues). It helps if you include the HTML around the tabs: right-click the tab, choose **Inspect**, then right-click the highlighted line and choose **Copy → Copy outerHTML**.

## Support

This extension is free. If it made Reddit a little calmer for you, you can [buy me a coffee on PayPal](https://www.paypal.com/ncp/payment/M6H8UYBTBDUVN). Thank you!

## License

[MIT](LICENSE). Not affiliated with or endorsed by Reddit, Inc.
