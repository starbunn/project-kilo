#!/bin/bash
echo Please wait...
mkdir /tmp/maker /tmp/maker/fira /tmp/maker/icons
echo [x] Downloading required packages...
echo [1/3] Downloading Fira Code...
curl https://api.github.com/repos/tonsky/FiraCode/releases/latest | grep "browser_download_url" | cut -d : -f 2,3 | tr -d \" | wget -i -
mv Fira_Code_v*.zip /tmp/maker/fira.zip
echo "[2/3] Downloading & Installing Open Sans..."
curl "https://raw.githubusercontent.com/googlefonts/opensans/main/fonts/ttf/OpenSans-Regular.ttf" > ../src/gfonts/ops1.ttf
echo [3/3] Downloading VSCode Icons...
git clone https://github.com/vscode-icons/vscode-icons.git
cp -R vscode-icons /tmp/maker/icons
rm -rf vscode-icons
echo [x] Installing required packages...
echo [1/2] Installing Fira Code...
yes A | unzip /tmp/maker/fira.zip -d /tmp/maker/fira
mv /tmp/maker/fira/ttf/FiraCode-Regular.ttf "$PWD/../themes/fonts/Fira Code/FiraCode-Regular.ttf"
echo [2/2] Installing VSCode Fluent Icons...
cp -R /tmp/maker/icons/vscode-icons/icons/* $PWD/../themes/icons/vscode-fluent-icons/src
echo [x] "Getting LICENSE's..."
echo [1/2] Getting Fira Code...
curl "https://raw.githubusercontent.com/tonsky/FiraCode/master/LICENSE" > $PWD/../themes/fonts/Fira\ Code/license.txt
echo [2/2] Getting VSCode Icons...
curl "https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/LICENSE" > $PWD/../themes/icons/vscode-fluent-icons/license.txt
echo [x] Cleaning up...
rm -rf /tmp/maker
printf 1 > maker.done
echo [x] Done!
echo You can finish setup by going back a directory,
echo Running npm install,
echo And npm start.
