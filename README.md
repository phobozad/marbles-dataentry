# marbles-dataentry
This repository contains data entry tools for LFG Marbles (http://marbles.win)

## MarblersCopier
When run, MarblesCopier will:
 1. Find an open Marbles On Stream window
 2. Click the button to copy results
 3. Immediately click the close button on the annoying popup
 4. Paste the results into an already-open notepad window

To use, run the pre-compiled *.exe under releases (compiled with Aut2Exe)

Or download AutoIT (https://www.autoitscript.com/site/autoit/downloads/)
and either run the script directly from the *.au3 file or use Aut2Exe to compile the *.au3 (or a modifed version of it) into a self-contained *.exe file.

**Note: Windows defender seems to incorrectly trigger on the .exe file if you compile it, so you may need to tell it to ignore/not quarrantine the file when you build it.**

## Postgame-Winner-Info
The `postgame-winner-info.html` page will generate a quick blurb about the top 5 players with interesting stats about them (currently just number of wins).  This is intended for the announcer to read off at the end of each track.

This connects to Airtable to allow auto-complete of player names and for pulling current stats.  Currently it refreshes the player data every 15 seconds and locally caches it for faster performance and reduced API calls to Airtable.

This runs entirely locally in a browser with no additional installation needed.  However, it does require a `settings.js` file to configure the Airtables API key, Base ID, table to pull stats from and field name for player names (for autocomplete & stats lookup).

### Installation/Use
Copy settings.js.example to settings.js and edit with appropriate settings
Double-click the `postgame-winner-info.html` to open in Chrome (or other browser, but tested against Chrome)
