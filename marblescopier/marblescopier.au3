#include <Date.au3>
#include <MsgBoxConstants.au3>

; https://www.autoitscript.com/autoit3/docs/functions/AutoItSetOption.htm#MouseCoordMode
; Set coordinate mode to relative client (e.g. relative within the window's viewport)
AutoItSetOption("MouseCoordMode","2")

; Find the window, used several times below so define it here for easy updates/tweaks
$windowTitle = "[TITLE:Marbles On Stream; CLASS:UnrealWindow]"

; Default coordinate mode = multiplier.  i.e. use a multiplier against the current resolution to calculate the pixel coordinate
; This allows the same values to be used regardless of resolution to handle auto-scale perfectly (based on how MoS procedurally generates the UI layout)
$coordMode = "multiplier"

; Default coordinate multipliers
$copyX_multiplier = 0.2
$copyY_multiplier = 0.1

$closeX_multiplier = 0.5
$closeY_multiplier = 0.6

;; Caculated offsets for any resolution
; Copy Button X-coord: 0.2 * horizontal resolution
; Copy Button Y-coord: 0.1 * vertical resolution
; Copy Button Y-coord for off-season (extra banner from Marbles): 0.14 * vertical resolution

; Close button X-coord: 0.5 * horizontal resolution
; Close button Y-coord: 0.6 * vertical resolution

; Check if we have any command-line parameters passed to us
If $CmdLine[0] > 0 Then
   
	; Off-season mode for MoS - They add a banner on the results screen that moves the copy button down ~50 px
	If StringLower($CmdLine[1]) == "/offseason" Then

		; Override the copy button vertical location
		$copyY_multiplier = 0.14

	; Manual override mode - specify the exact pixel coordinates on the command-line for any ad-hoc/hot-fixes
	ElseIf StringLower($CmdLine[1]) == "/coords" Then

		; Validate we got all 4 coordinate points for manual override mode.  use "<>" for "not equal to" in AutoIt
		If $CmdLine[0] <> 5 Then
			MsgBox($MB_ICONERROR, "MarblesCopier Error", "Invalid number of parameters for manual coordinate mode." & @CRLF & "Usage: " & @ScriptName & " /coords <copy button X> <copy button Y> <close button X> <close button Y>")
			Exit(1)
		EndIF

		; Validate all 4 coordinates are valid numbers
		For $i = 2 To 5
			If Not StringIsInt($CmdLine[$i]) Then
				MsgBox($MB_ICONERROR, "MarblesCopier Error", "Pixel coordinates provided are not valid integer numbers")
				Exit(1)
			EndIf
		Next

		; Set our coordinate mode to pixel mode instead of multiplier mode
		$coordMode = "pixel"

		; Parse all numeric inputs into integers to ensure clean data entry into functions
		$copyX = int($CmdLine[2])
		$copyY = int($CmdLine[3])

		$closeX = int($CmdLine[4])
		$closeY = int($CmdLine[5])
	EndIF
EndIf


; Get the current window so we can return focus to it
$previousWindow = WinGetHandle("[active]")
; Get the current mouse position so we can put the cursor back where it was
$originalMousePos = MouseGetPos()

; Set marbles to be active window
WinActivate($windowTitle)
; Wait for window to be active before clicking
WinWaitActive($windowTitle,"",5)


; Wait for window to be active before getting window size
; If we do this before the window is active, the return results may be incorrect
$windowResolution=WinGetClientSize($windowTitle)


If WinActive($windowTitle) Then

	; Calculate the actual pixel coordinates based on resolution if we're in "multiplier" mode
	; Otherwise for pixel mode we can skip this - the variables are already defined with pixel values from above
	If $coordMode == "multiplier" Then
		$copyX = int($windowResolution[0] * $copyX_multiplier)
		$copyY = int($windowResolution[1] * $copyY_multiplier)

		$closeX = int($windowResolution[0] * $closeX_multiplier)
		$closeY = int($windowResolution[1] * $closeY_multiplier)
	EndIf

	; Click copy to clipboard
	MouseClick("left",$copyX,$copyY,1,0)
	; Click close button on popup
	MouseClick("left",$closeX,$closeY,1,0)
	; Add spacebar press to try and avoid GUI getting stuck and not recognizing our click(s)
	send('{SPACE}')

	;Paste into special node.js listener which will communicate to the browser
	WinActivate("Marbles Race Result Paste Listener")
	WinWaitActive("Marbles Race Result Paste Listener","",5)
	SendKeepActive("Marbles Race Result Paste Listener")
	; Need to use really janky keystrokes to paste into CLI window
	send('!{SPACE}ep{ENTER}{ENTER}{ENTER}')

	; Re-activate old window
	WinActivate($previousWindow)
	; Put mouse cursor back where it was
	MouseMove($originalMousePos[0],$originalMousePos[1],0)

	; Write data to disk as a backup in case of issue
	; Get current timestamp
	$dateTime = _NowCalc()
	; Need to clean up format to be a valid filename
	$dateTime = StringReplace($dateTime,'/','-')
	$dateTime = StringReplace($dateTime,':','_')
	; Write file to working directory
	FileWrite("MarblesResults_" & $dateTime & ".txt", ClipGet())
EndIf

