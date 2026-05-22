import {app, BrowserWindow} from 'electron';
import squirrelStartup from 'electron-squirrel-startup';
import MenuBuilder from './electron/menu';
import path from 'path';
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
import "./api/api";

import {Environment} from "./enums";
import {BACKENDS, cleanUpBackend, setBackend, terminateBackend} from "./utils/backend";
import {taskQueue} from "./utils/taskQueue";
import {cmArgs} from "./utils/command-line-arguments";
import {logToDevTools} from "./utils/logHandler";

if (squirrelStartup) {
    const squirrelEvent = process.argv[1];
    if (squirrelEvent === '--squirrel-uninstall') {  // on uninstall
        console.log("Running cleanup tasks for uninstallation");

        // clean up WSL backend
        logToDevTools("Cleaning up WSL backend");
        for (const backend in BACKENDS) {
            logToDevTools(`Cleaning up backend ${backend}`);
            setBackend(backend).then(async () => {
                await cleanUpBackend(Environment.TACTIC);
            });
        }

        // handle removing shortcuts on Windows when uninstalling
        app.exit();
    } else {  // on install
        app.exit();
    }
}

// when started with --version or -v, print the version and exit
if (cmArgs['version']) {
    console.log(`${app.getName()} v${app.getVersion()}`);
    app.exit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 760,
        height: 760,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false,  // hide the window until it is ready
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // show main window when it is ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // open the DevTools when in not packaged (proxy for development environment)
        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools({
                mode: 'detach',
            });
        }
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', async (event) => {
    event.preventDefault();
    console.log("Application will quit");
    console.log("Running cleanup tasks");

    console.log("Clearing task queue");
    taskQueue.clear(); // clear all tasks

    try {
        await terminateBackend(Environment.TACTIC);
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        app.exit();
    }
});
