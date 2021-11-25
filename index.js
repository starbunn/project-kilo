const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron'),
      fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const BypassHangup = false; 
// Set to false when commiting, this just forces it (when true) to force mainwindow to not hide & autostarts devtools which REALLY helps for debugging.

let mainWindow,
    loaderMain,
    windowInfo;

function createWindow () {
    async function autoUpdate() {
        while (true) {
            try {
                let builtString;
                
                if (mainWindow.isMaximized()) {
                    builtString = `{\n  "width": ${windowInfo.width},\n  "height": ${windowInfo.height},\n  "x": ${windowInfo.x},\n  "y": ${windowInfo.y},\n  "isMaximized": true,\n  "isDevMode": ${windowInfo.isDevMode},\n  "bypassConfig":${windowInfo.bypassConfig}\n}`;
                } else {
                    builtString = `{\n  "width": ${mainWindow.getSize()[0]},\n  "height": ${mainWindow.getSize()[1]},\n  "x": ${mainWindow.getPosition()[0]},\n  "y": ${mainWindow.getPosition()[1]},\n  "isMaximized": ${mainWindow.isMaximized()},\n  "isDevMode": ${windowInfo.isDevMode},\n  "bypassConfig":${windowInfo.bypassConfig}\n}`;
                }

                await fs.promises.writeFile('./config.json', builtString);
                windowInfo = JSON.parse(builtString);
            } catch (e) {
                console.warn(e);
            }

            await sleep(2500);
        }
    }

    try {
        let magic = fs.readFileSync("./config.json");
        windowInfo = JSON.parse(magic);
    } catch (err) {
        try {
            let loadedJSON = `{\n  "width": 800,\n  "height": 600,\n  "x": null,\n  "y": null,\n  "isMaximized": true,\n  "isDevMode": false,\n  "bypassConfig":false\n}`;
            fs.writeFileSync("./config.json", loadedJSON);
            windowInfo = JSON.parse(loadedJSON);
        } catch (e) {
            console.error(`There were 2 errors loading the configuration! ${err}; ${e}`);   
        }
    }

    let config = {
        width: windowInfo.width,
        height: windowInfo.height,
        x: windowInfo.x,
        y: windowInfo.y,
        frame: false,
        backgroundColor: '#FFF',
        title: "Concrete",
        icon: __dirname + "/src/logo.png",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            enableRemoteModule: true,
            preload: __dirname + "/src/preload.js"
        } 
    }

    if (windowInfo.x == null || windowInfo.y == null) {
        config.center = true;
        config.x = null;
        config.y = null;
    }

    if (process.platform !== 'win32') {
        config.frame = true;
    }

    mainWindow = new BrowserWindow(config);

    if (!BypassHangup) {
        mainWindow.hide();
    } else {
        mainWindow.openDevTools();
    }

    loaderMain = new BrowserWindow({
        width: 253,
        height: 452,
        frame: false,
        backgroundColor: '#FFF',
        title: "Concrete is Loading...",
        icon: __dirname + "/src/logo.png",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            enableRemoteModule: true,
        } 
    });

    loaderMain.hide();

    loaderMain.loadFile(__dirname + "/loader/loader.html");

    require('@electron/remote/main').initialize();
    require("@electron/remote/main").enable(mainWindow.webContents)

    mainWindow.loadFile('./src/index.html');
    
    const menu = new Menu();
    let menuSub = [{
        label: 'Reload',
        accelerator: "Ctrl+R",
        click: () => {
            mainWindow.webContents.send('reload', 'reloadWindow')
        }
    }, {
        label: "Refresh Renderer",
        accelerator: "Ctrl+Shift+R",
        click: () => {
            mainWindow.webContents.send('refresh', 'reloadRenderer')
        }
    }, {
        label: 'Quit',
        accelerator: "Ctrl+Q",
        click: () => {
            app.quit();
        }
    }
];

    if (windowInfo.isDevMode) {
        menuSub.push({
            label: 'Dev Tools',
            accelerator: "Ctrl+Shift+I",
            click: () => {
                mainWindow.webContents.openDevTools();
            }
        });
    }

    menu.append(new MenuItem({
        label: 'Concrete',
        submenu: menuSub
    }));
    
    Menu.setApplicationMenu(menu);

    mainWindow.webContents.once('dom-ready', () => {autoUpdate()});
    loaderMain.webContents.once('dom-ready', () => {
        loaderMain.show();
        loaderMain.focus();
    });

    ipcMain.on('ready', async(event, arg) => {
        try {
            if (process.platform !== 'win32') {
                mainWindow.webContents.send('lenox', 'hid');
            }
            loaderMain.close();
            await sleep(750);
            mainWindow.show();
            if (windowInfo.isMaximized) {
                mainWindow.maximize();
            }
            mainWindow.focus();
        } catch (e) {}
    })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

async function restart() {
    console.log("Restarting...");
    app.relaunch();
    app.exit();
}

ipcMain.on('restart', async(event, arg) => {
    restart();
})