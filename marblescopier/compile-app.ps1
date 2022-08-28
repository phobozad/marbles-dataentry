$copierAppVersion="0.2.0"

Remove-Item -Path build -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Name build -ItemType Directory | Out-Null

Write-Output "Checking for AutoIt Aut2Exe tool..."
if(Test-Path ..\autoit-v3\install\Aut2Exe\Aut2exe.exe -PathType Leaf)
{
    Write-Output "AutoIt Found, compiling"
}
else{
    Write-Output "No AutoIt files found, downloading from https://www.autoitscript.com/files/autoit3/autoit-v3.zip"
    Invoke-WebRequest -Uri https://www.autoitscript.com/files/autoit3/autoit-v3.zip -OutFile .\build\autoit-v3.zip
    Expand-Archive .\build\autoit-v3.zip -DestinationPath ..\autoit-v3 -Force
    del .\build\autoit-v3.zip
    Write-Output "Compiling..."
}
..\autoit-v3\install\Aut2Exe\Aut2exe /in .\marblescopier.au3 /out .\build\marblescopier-$copierAppVersion.exe /comp 0
write-Output "Done."