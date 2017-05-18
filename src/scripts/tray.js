'use strict';

import { remote } from 'electron';
import path from 'path';

const { Tray, Menu } = remote;

const mainWindow = remote.getCurrentWindow();

const icons = {
    win32: {
        dir: 'windows'
    },

    linux: {
        dir: 'linux'
    },

    darwin: {
        dir: 'osx',
        icon: 'icon-trayTemplate.png'
    }
};

const _iconTray = path.join(__dirname, 'images', icons[process.platform].dir, icons[process.platform].icon || 'icon-tray.png');
const _iconTrayAlert = path.join(__dirname, 'images', icons[process.platform].dir, icons[process.platform].iconAlert || 'icon-tray-alert.png');
const _iconTBAlert = path.join(__dirname, 'images', icons[process.platform].dir, icons[process.platform].iconAlert || 'changes.png'); //#367 to add visual effect when a message is waiting

function createAppTray () {
    const _tray = new Tray(_iconTray);
    mainWindow.tray = _tray;

    const contextMenuShow = Menu.buildFromTemplate([{
        label: 'Show',
        click () {
            mainWindow.show();
        }
    }, {
        label: 'Quit',
        click () {
            remote.app.quit();
        }
    }]);

    const contextMenuHide = Menu.buildFromTemplate([{
        label: 'Hide',
        click () {
            mainWindow.hide();
        }
    }, {
        label: 'Quit',
        click () {
            remote.app.quit();
        }
    }]);

    if (!mainWindow.isMinimized() && !mainWindow.isVisible()) {
        _tray.setContextMenu(contextMenuShow);
    } else {
        _tray.setContextMenu(contextMenuHide);
    }

    const onShow = function () {
        _tray.setContextMenu(contextMenuHide);
    };

    const onHide = function () {
        _tray.setContextMenu(contextMenuShow);
    };

    mainWindow.on('show', onShow);
    mainWindow.on('hide', onHide);

    _tray.setToolTip(remote.app.getName());

    _tray.on('right-click', function (e, b) {
        _tray.popUpContextMenu(undefined, b);
    });

    _tray.on('click', () => {
        mainWindow.show();
    });

    mainWindow.destroyTray = function () {
        mainWindow.removeListener('show', onShow);
        mainWindow.removeListener('hide', onHide);
        _tray.destroy();
    };
}

function setImage (title) {
    if (title === '•') {
        title = "Dot";
    } else if (!isNaN(parseInt(title)) && title > 9) {
        title = "9Plus";
    }

    const _iconPath = path.join(__dirname, 'images', icons[process.platform].dir, `icon-tray${title}.png`);
    mainWindow.tray.setImage(_iconPath);
}

function showTrayAlert (showAlert, title) {
    if (mainWindow.tray === null || mainWindow.tray === undefined) {
        return;
    }
    if (!mainWindow.isVisible()) { 
        mainWindow.minimize(); //#367 to show minimized
        mainWindow.blur(); //#367 to keep on blinking
    }
    mainWindow.flashFrame(showAlert);
    if (showAlert) {
            mainWindow.setOverlayIcon(_iconTBAlert,  "unsaved changes"); //#367 to add visual effect when a message is waiting
        } else {
            mainWindow.setOverlayIcon(null,"saved changes"); //#367 reset visual effect
        }
    if (process.platform !== 'darwin') {
        setImage(title);
    } else {
        if (showAlert) {
            mainWindow.tray.setImage(_iconTrayAlert);
        } else {
            mainWindow.tray.setImage(_iconTray);
        }
        mainWindow.tray.setTitle(title);
    }

}

function removeAppTray () {
    mainWindow.destroyTray();
}

function toggle () {
    if (localStorage.getItem('hideTray') === 'true') {
        createAppTray();
        localStorage.setItem('hideTray', 'false');
    } else {
        removeAppTray();
        localStorage.setItem('hideTray', 'true');
    }
}

if (localStorage.getItem('hideTray') !== 'true') {
    createAppTray();
}

export default {
    showTrayAlert,
    toggle
};
