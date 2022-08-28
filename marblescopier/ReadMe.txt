
This script can be run in three modes as of MarblesCopier v0.2.0.

The default mode is the same as always - it will press the copy and close buttons when they are in their normal location.

The Off-Season mode will press the copy button in its alternate location when Marbles On Stream is between seasons.
During this time, a "Season Disabled" banner appears and the "Copy to Clipboard" button is shifted down slightly.

To run in Off-Season mode, pass the /offseason flag to the program when running:
marblescopier.exe /offseason


The Manual Coordinate mode will allow you to specify the exact pixel coordinates within the Marbles On Stream window to click by passing them into the app.
These are relative coordinates within the Marbles On Stream window.  An easy way to determine these is to take a screenshot of Marbles and then look at the pixel coordinates in an image editor.  The top-left of the window (excluding the Windows title bar) is "0,0".

To run in Manual Coordinate mode, pass the /coords flag to the program when running and specify the copy button X & Y coordinates and then the popup close button X & Y coordinates.  Separate each with a space.  For example, to click the copy button at (296,108) and click the "close" button at (960,655), run the app like so:

marblescopier.exe /coords 296 108 960 655
