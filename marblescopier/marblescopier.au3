; https://www.autoitscript.com/autoit3/docs/functions/AutoItSetOption.htm#MouseCoordMode
; Set coordinate mode to relative client (e.g. relative within the window's viewport)
AutoItSetOption("MouseCoordMode","2")

; Find the window, used several times below so define it here for easy updates/tweaks
$windowTitle = "[TITLE:Marbles On Stream; CLASS:UnrealWindow]"

; Coordinates based on 1280x800 size window:
; Copy Button: 256,96	Close Button: 640,484

; Coordinates based on 1920x1017 size window:
; Copy Button: 380,120	Close Button: 960,608


;; Caculated offsets for any resolution
; Copy Button X-coord: 0.2 * horizontal resolution
; Copy Button Y-coord: 0.12 * vertical resolution

; Close button X-coord: 0.5 * horizontal resolution
; Close button Y-coord: 0.6 * vertical resolution




; Set marbles to be active window
WinActivate($windowTitle)
; Wait for window to be active before clicking
WinWaitActive($windowTitle,"",5)


; Wait for window to be active before getting window size
; If we do this before the window is active, the return results may be incorrect
$windowResolution=WinGetClientSize($windowTitle)

$copyX = int($windowResolution[0] * 0.2)
$copyY = int($windowResolution[1] * 0.12)

$closeX = int($windowResolution[0] * 0.5)
$closeY = int($windowResolution[1] * 0.6)


If WinActive($windowTitle) Then
	; Click copy to clipboard
	MouseClick("left",$copyX,$copyY,1,0)
	; Click close button on popup
	MouseClick("left",$closeX,$closeY,1,0)

	;Paste into special node.js listener which will communicate to the browser
	WinActivate("Marbles Race Result Paste Listener")
	WinWaitActive("Marbles Race Result Paste Listener","",5)
	SendKeepActive("Marbles Race Result Paste Listener")
	; Need to use really janky keystrokes to paste into CLI window
	send('!{SPACE}ep{ENTER}{ENTER}{ENTER}')
EndIf

