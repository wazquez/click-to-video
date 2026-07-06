# Video Support widget

A single, self-contained ES module that adds a "Video Support" modal to any web
page. It collects a name + email, POSTs them to your backend, and opens the
returned `guestUrl` (a Webex instant session) in a new tab.

Everything renders inside a **Shadow DOM**, so the host page's CSS can't affect
it and the widget's styles can't leak out.

## Install

No npm, no build step. Copy `video-support.js` into your project and import it.

```js
import { initVideoSupport, openVideoSupport } from './video-support.js';
```

## Use

```js
initVideoSupport({
  endpoint: 'https://your-be.com/api/start-session', // required
  region: 'emea',
  destinationId: 'vvazquezICVideo',
  channel: 'vvazquezVideo',
  verticalType: 'gen',
});

// Wire it to YOUR OWN button:
document.querySelector('#my-support-btn')
  .addEventListener('click', openVideoSupport);
```

The module does **not** create a button — you attach `openVideoSupport` to
whatever element you like.

## Config

| Option          | Required | Default                        | Description                          |
| --------------- | -------- | ------------------------------ | ------------------------------------ |
| `endpoint`      | yes      | `''`                           | URL that receives the POST.          |
| `region`        | no       | `'emea'`                       | Sent in the request body.            |
| `destinationId` | no       | `''`                           | Sent in the request body.            |
| `channel`       | no       | `''`                           | Sent in the request body.            |
| `verticalType`  | no       | `'gen'`                        | Sent in the request body.            |
| `accentColor`   | no       | `'#00b4d8'`                    | Primary color (button, focus, links).|
| `submitText`    | no       | `'Request Video Support'`      | Submit button label.                 |
| `title`         | no       | `'Video Support'`              | Modal heading.                       |
| `subtitle`      | no       | (see source)                   | Modal sub-text.                      |

## Request / response contract

The widget POSTs JSON:

```json
{
  "name": "Victor Elvis",
  "email": "elvis@email.com",
  "verticalType": "gen",
  "destinationId": "vvazquezICVideo",
  "channel": "vvazquezVideo",
  "region": "emea"
}
```

Your backend must respond with JSON containing `guestUrl`:

```json
{
  "guestUrl": "https://instant.webex.com/visit/o2dwUVR",
  "originId": "2b93432e-5ee3-4df8-b008-0f455986e0a5"
}
```

The widget opens `guestUrl` in a new tab. If `guestUrl` is missing, it shows an
error.

## Backend / CORS

Because the POST comes from the **customer's** origin (not yours), your backend
must return CORS headers allowing that origin, e.g.:

```
Access-Control-Allow-Origin: https://customer-site.com
Access-Control-Allow-Headers: Content-Type
```

(and handle the `OPTIONS` preflight for `Content-Type: application/json`).

## Popup blockers

`window.open` runs after the `await fetch`, so it's no longer strictly inside the
click handler. Most browsers allow it (it follows a user action), but aggressive
popup blockers may block it. If that becomes a problem, switch to opening a blank
tab on click and setting its `location` once the response arrives.

## API

- `initVideoSupport(config)` — build & configure the widget. Call once. Returns
  `{ open, close }`.
- `openVideoSupport()` — open the modal.
- `closeVideoSupport()` — close the modal.
