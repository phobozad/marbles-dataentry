# marbles-dataentry
This repository contains data entry tools for LFG Marbles (http://marbles.win)

## MarblersCopier
When run, MarblesCopier will:
 1. Find an open Marbles On Stream window
 2. Click the button to copy results
 3. Immediately click the close button on the annoying popup
 4. Paste the results into the companion `marblescopier-listener` app that feeds the data into the data entry tool.

To use, run the pre-compiled *.exe under releases (compiled with Aut2Exe) or compile using the below instructions

To click the copy button when Marbles On Stream shows the "Season Disabled" banner and the button has moved, pass the `/offseason` flag to the app:

`marblescopier-x.x.x.exe /offseason`

To specify arbitrary coordinates to click (in case the buttons move after a MoS update), pass the `/coords <copy button X> <copy button Y> <close button X> <close button Y>` flag to the app:

`marblescopier-x.x.x.exe /coords 296 108 960 655`

### Compiling

Run the `marblescopier\compile-app.ps1` file to automatically download the Aut2Exe app and compile the script into a self-contained `*.exe`.
This can be run by right clicking the `compile-app.ps1` file and selecting "run with powershell" or by launching a powershell CLI window and executing the file from there (inside the `marblescopier` folder).

Or manually download AutoIT (https://www.autoitscript.com/site/autoit/downloads/)
and either run the script directly from the *.au3 file or use Aut2Exe to compile the *.au3 into a self-contained *.exe file.

**Note: Windows defender seems to incorrectly trigger on the .exe file if you compile it, so you may need to tell it to ignore/not quarrantine the file when you build it.**

## Data Entry WebUI
The `postgame-winner-info.html` page under `webui` will generate a quick blurb about the top 5 players with interesting stats about them.  This is intended for the announcer to read off at the end of each track.

This connects to Airtable to allow auto-complete of player names and for pulling current stats.  Currently it refreshes the player data every 15 seconds and locally caches it for faster performance and reduced API calls to Airtable.  Race data is pulled every 30 seconds and cached locally.

This will also allow data entry to create new race entries into the database, recording the results of a round.  By also running the `marblescopier-listener` companion app, every time the `marblescopier` script is run, the webpage will have the race results auto-populated.

This runs entirely locally in a browser with no additional installation needed.  However, it does require a `settings.js` file to configure the Airtables API key, Base ID, table to pull stats from and field name for player names (for autocomplete & stats lookup).

### Installation/Use
Copy settings.js.example to settings.js in the main folder and edit with appropriate settings
Double-click the `webui/postgame-winner-info.html` to open in Chrome (or other browser, but tested against Chrome)

## marblescopier-listener
The `marblescopier-listener` companion app will work in conjunction with the `marblescopier` script.  The `marblescopier` script will paste the output from Marbles on Stream into it.  With the WebUI open on the same PC, the data will then get pushed into that browser interface in order to save into Airtable.

Communication between `marblescopier` and `marblescopier-listener` is via copy/paste keyboard automation.
Communication between `marblescopier-listener` and the WebUI is via WebSocket using TCP Port 8069 by default (configurable)

The only configurable parameter is the websocket port, which is in the `settings.js` file shared between both WebUI and `marblescopier-listener` in the main parent folder.

The companion app is built in nodejs.

### Installation
#### Windows
**Download & double-click to run the pre-compiled version that comes with NodeJS bundled in (e.g. from Releases link) or run from source using below steps:**

1.	Install NodeJS 14+ from https://nodejs.org/en/ (LTS release reccomended).
	* The "Tools for Native Modules" isn't required to use this app, so this can be left unchecked during installation.
2.	Download the app using a git pull or by downloading a ZIP file of the repo from github and extracting to a folder.
3.	Run the "Node.js command prompt" shortcut that is now in the start menu
	* This just runs `C:\Program Files\nodejs\nodevars.bat` assuming default install location was selected for NodeJS
4.	Navigate in the command prompt to the folder that holds this app
	```
	cd "c:\users\username\downloads\marbles-dataentry\marblescopier-listener"
	```
5.	Install the required NodeJS modules (This must be run inside the app's folder)
	```
	npm install
	```
6.	Copy the `settings.js.example` file to `settings.js` in the parent folder
7.	Start the App (marblescopier-listener.js) using NodeJS
	```
	node marblescopier-listener.js
	```
For subsequent launches, just run the `node marblescopier-listener.js` command to start the app from within the Node.js command prompt.  To simplify this, you could create a batch file that can just be double-clicked to launch.

## Compiling

To compile to a native *.exe that can be run on another machine without installing nodejs:

```
git clone http://x.x.x.x/marbles-dataentry
cd marbles-dataentry
npm install
npm install -g pkg
```

On Windows:
```
npm run buildwin
npm run packagewin
```

Be sure to run the `*.exe` from the `marblescopier-listener` folder, so it can find the settings file.
