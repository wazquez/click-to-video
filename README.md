# click-to-video

A demo web page for **Video Support** with Cisco Webex Contact Center (WxCC) and
Webex Instant Connect. A visitor clicks a button, enters a name and email, and a
Webex video session opens in a new tab while an agent is requested in the
background.

**Live demo:** https://wazquez.github.io/click-to-video/

## How it works

```
Browser (this page)  --POST name/email/params-->  Backend (be-ic-work-items, Cloud Run)
                                                    1. creates an Instant Connect meeting (host + guest links)
                                                    2. creates a WxCC work item for an agent (host link)
Browser  <--------- { guestUrl, originId } ------  3. returns only the guest link
Browser opens guestUrl in a new tab
```

The page is plain static HTML with no build step. The modal comes from
[`video-support.js`](video-support.js), a self-contained ES module that renders
inside a Shadow DOM (see [`video-support.README.md`](video-support.README.md)).
The backend lives in a separate repo, `be-ic-work-items`.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The demo page. Imports the widget and configures it. |
| `video-support.js` | Reusable widget (modal + form + request). |
| `video-support.README.md` | How to use the widget on any other page. |

## URL parameters

The same page can demo different destinations. Each parameter falls back to a
default when omitted.

| Parameter | Default | Description |
| --- | --- | --- |
| `region` | `emea` | WxCC region: `us` or `emea`. Selects the backend's routing tenant. |
| `destinationId` | `vvazquezICVideo` | WxCC routing destination (business address) ID. |
| `channel` | `vvazquezVideo` | WxCC channel. |
| `verticalType` | `gen` | Instant Connect vertical/template. |

Example:

```
https://wazquez.github.io/click-to-video/?region=us&destinationId=<id>&channel=<channel>
```

The defaults belong to the EMEA tenant, so for `region=us` pass the US
`destinationId` and `channel` too. The browser console logs the values in use and
whether each came from the URL or the default (`[WxCC]: video support parameters`).

## Run locally

The page uses an ES module, which browsers block on `file://`. Serve it over HTTP:

```bash
python3 -m http.server 5500
# or use the VS Code "Live Server" extension (port 5500)
```

Then open http://localhost:5500/. Use port **5500**, because the backend only
allows `http://localhost:5500` and `http://127.0.0.1:5500` by default.

To point the page at a local backend, change `endpoint` in the module script at the
bottom of `index.html` (for example `http://localhost:3000/api/start-session`).

## Deploy

The site is published with GitHub Pages from the `main` branch, root folder. Pushing
to `main` redeploys it in a minute or two. All paths are relative, so it works under
`/click-to-video/`.

## Backend and CORS

The page calls the backend directly from the visitor's browser, so the backend must
allow this page's origin. On the backend, `ALLOWED_ORIGINS` must include
`https://wazquez.github.io` (origin only, no path or trailing slash). Without it the
browser blocks the request and the form shows "Something went wrong."

The endpoint URL is public in the page source. The backend rate-limits requests;
CORS only restricts browsers, not other callers.
