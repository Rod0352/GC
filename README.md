# GC — Government & Citizens

A working preview of the GC app. It runs on your own computer, in your web browser. Nothing you type is sent anywhere, and every person, office and bill in it is made up for demo purposes.

You do not need any technical background to run it. Set aside about 10 minutes the first time.

## First time: set up

1. **Install Node.js.** Go to [nodejs.org](https://nodejs.org), click the download button marked **LTS**, open the file it downloads, and click through the installer with the default choices.
2. **Download GC.** Go to [github.com/Rod0352/GC](https://github.com/Rod0352/GC), click the green **Code** button, then **Download ZIP**.
3. **Unzip it.** Double-click the downloaded file. You get a folder called `GC-main`. Move it to your Desktop so it is easy to find.
4. **Open a terminal.** This is a window where you type commands.
   - Mac: press `Command` + `Space`, type `Terminal`, press `Enter`.
   - Windows: click Start, type `PowerShell`, press `Enter`.
5. **Point the terminal at GC.** Type `cd` followed by a space. Do not press Enter yet. Open the `GC-main` folder, drag the `frontend` folder inside it onto the terminal window, then press `Enter`.
6. **Install GC's parts.** Type this and press `Enter`. It takes a minute or two and prints a lot of text.

   ```
   npm install
   ```

## Every time: start it

1. Open a terminal and point it at GC (steps 4 and 5 above).
2. Type this and press `Enter`:

   ```
   npm run dev
   ```

3. The terminal prints a line like `Local: http://localhost:5173/`. Open your web browser and go to that address.
4. Leave the terminal window open while you use GC.

## Try it

Click **Sign in**, then pick one of the three **Demo accounts** at the bottom. No password is needed.

| Demo account | What you see |
| --- | --- |
| **Citizen** | A resident of district VA-11: a home feed, representatives, legislation, communities, and messages to their representative's office. |
| **Office staff** | A staffer in a congressional office. Choose the office when asked. They answer constituent inquiries and draft posts, which need approval. |
| **Elected official** | The member of Congress. Same office, with the power to publish posts and approve staff. |

Things to show in a presentation:

- As **Citizen**, open **Government**, pick Rep. Jane Doe, and send an inquiry. It appears under **Messages**.
- As **Office staff**, open **Inquiries**, reply to one, then write a post under **Posts**. It waits for approval.
- As **Elected official**, open **Posts** and approve a waiting post.
- To switch accounts, click **Personal** or **Office** at the top right, then **Sign out**.
- **Create account** walks through the full sign-up. Use ZIP code `22030` to see a district and representatives; other ZIP codes show the state only for now.

Everything resets when you close the browser tab.

## Stop it

Click the terminal window, then press `Control` + `C`. You can close the window after that.

## Get the latest version

Delete the `GC-main` folder, then repeat the set-up steps from step 2. You can skip step 1.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| `command not found: npm` or `npm is not recognized` | Node.js is not installed yet, or the terminal was open while you installed it. Finish step 1, close the terminal, and open a new one. |
| `Could not read package.json` or `ENOENT` | The terminal is not pointed at the `frontend` folder. Redo step 5. |
| The browser says the site can't be reached | GC is not running. Start it again, and use the exact address the terminal prints. |
| The address is not `5173` | That is fine. Another program was using that number, so GC picked the next one. Use the address the terminal prints. |
| Anything else | Copy the last few lines the terminal printed and send them to Rodney. |

## For developers

Vite + React + TypeScript, in `frontend/`. `npm run lint` and `npm run build` must pass before a commit. Project rules and a code map are in `CLAUDE.md`.
