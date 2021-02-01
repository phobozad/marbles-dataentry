$packageVersion = Read-Host 'Package Version (omit "v" - just numeric)'
$packageDir = "marbles-dataentry-$packageVersion"

# Build
cd marblescopier
.\compile-app.ps1
cd ..

cd marblescopier-listener
npm install
npm run buildwin
npm run packagewin
cd ..

# Package
Remove-Item -Path $packageDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Name $packageDir -ItemType Directory | Out-Null
cd $packageDir
New-Item -Name marblescopier-listener -ItemType Directory | Out-Null
New-Item -Name marblescopier -ItemType Directory | Out-Null
New-Item -Name webui -ItemType Directory | Out-Null
Copy-Item -Path ..\settings.js.example -Destination settings.js -Force
Copy-Item -Path ..\LICENSE -Force -Recurse
Copy-Item -Path ..\README.md -Force -Recurse
Copy-Item -Path ..\webui -Force -Recurse
Copy-Item -Path ..\marblescopier-listener\build\*.exe .\marblescopier-listener\ -Force -Recurse
Copy-Item -Path ..\marblescopier\build\*.exe .\marblescopier\ -Force -Recurse

Compress-Archive "*" "..\\marbles-dataentry-$packageVersion-win64.zip" -Force
cd ..
Remove-Item -Path $packageDir -Recurse -Force