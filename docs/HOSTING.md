# Hosting MIRAS

Plain answer first: **for the demo, run it on your own laptop and put an HTTPS tunnel in front of it.** Everything below is the reason, and what to do if a public link is needed.

## 1. The demo setup (recommended)

1. `npm ci`, then `npm run build`, then `npm run start`. The server listens on port 3000.
2. In a second terminal, start a tunnel. Phones only allow the camera and microphone on `https://` addresses.
   - `cloudflared tunnel --url http://localhost:3000`, or
   - `ngrok http 3000`
3. In `.env`, set `TRUST_PROXY=true`. Behind a tunnel the real visitor address arrives in a header, and this setting tells the rate limiter to read it (from `cf-connecting-ip`, or the last `x-forwarded-for` value). Leave it `false` when nothing is in front of the server: then any visitor could fake those headers.
4. Run `npm run preflight`, and `npm run ai:check` if you want to test Gemini on its own.

Things to know:
- **A free quick tunnel gets a new address every time it starts.** A home-screen icon installed from the old address stops working. Do not restart the tunnel after installing the icon.
- **Anyone with the tunnel link can open the app while it runs.** Do not post it.
- **Phones on the same Wi-Fi share one limit.** With `TRUST_PROXY=true` visitors are told apart by their public address, and two phones on one network have the same one. The limits (camera 20 photos a minute, voice drafts 10 in 10 minutes, enquiries 3 in 10 minutes) then apply to both phones together. Do not hammer the buttons during the demo.
- The rate limiter lives in memory. Restarting the server resets it.
- Data (enquiries, listings, uploaded photos) is stored in `./data` on the laptop (`MIRAS_DATA_DIR`). Back it up with `npm run data:backup`.

## 2. If a public link is needed

Use **one VM or one container** with a **persistent disk** mounted at the folder `MIRAS_DATA_DIR` points to. Run `npm run build && npm run start` behind an HTTPS reverse proxy, and set `TRUST_PROXY=true` only if that proxy is yours and always sets the forwarded headers.

Check before you rely on it: the disk really survives a restart (create an enquiry, restart, find it), and `/api/health` answers.

## 3. Do not deploy to serverless hosts (including Vercel)

MIRAS keeps its database (SQLite) and uploaded photos in files on disk. Serverless hosts give each request a temporary disk that is thrown away, so **enquiries, listings and uploads would be lost**, and several server instances would not see each other's data. This is not a setting you can switch off. Do not deploy MIRAS there.

## 4. What this has not been tested on

Nothing here was tested on a real tunnel, a real VM or a real phone. The commands are standard, but the first run is the test.
