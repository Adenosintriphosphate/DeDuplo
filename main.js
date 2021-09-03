const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs')

// SET ENV
// process.env.NODE_ENV = 'development';
process.env.NODE_ENV = 'production';

// let div_id = 0;
// var progress_interval;

const { app, BrowserWindow, Menu, ipcMain, dialog} = electron;

let mainWindow;
var search_paths = [];
var computing = false;
// var duplicate_groups_global;


// start the server
// shell.openPath(app.getAppPath() + '\\imagehash-test\\run_server.bat');
start_server();

// Listen for app to be ready
app.on('ready', function () {
  // Create new Window
  mainWindow = new BrowserWindow({
    // needed to create dark titlebar
    width: 1200,
    height: 600,
    minWidth: 900,
    minHeight: 550,
    frame: false,

    // needs to be defined for newer versions of electron
    webPreferences: {
      // as of version 5:
      nodeIntegration: true,
      // as of version 12:
      contextIsolation: false,
      // needed for custom titlebar controls
      enableRemoteModule: true
    }
  });

  // load html into window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on('ready-to-show', () => {
    mainWindow.focus();
    mainWindow.show();
    // mainWindow.webContents.openDevTools({ mode: 'undocked' });
  });

});

////////////////////////////////////////////////////////////
/////Functions
////////////////////////////////////////////////////////////

function display_duplicate_groups(duplicate_groups) {
  for (var div_id = 0; div_id < duplicate_groups.length; div_id++) {

    mainWindow.webContents.send('add-div', div_id);

    for (var image_id = 0; image_id < duplicate_groups[div_id].length; image_id++) {
      mainWindow.webContents.send('add-image', div_id, duplicate_groups[div_id][image_id], image_id);
    }
  }
}

function display_paths() {
  mainWindow.webContents.send('reset-directories');
  for (var i = 0; i < search_paths.length; i++) {
    mainWindow.webContents.send('add-p', "directories", search_paths[i]);
    console.log(search_paths[i]);
  }
}

function start_server() {
  const process = require('child_process');   
  var ls = process.exec('call "python-server/interface.exe"');
  ls.stdout.on('data', function (data) {
    console.log(data);
  });
  ls.stderr.on('data', function (data) {
    console.log(data);
  });
  ls.on('close', function (code) {
     if (code == 0)
          console.log('Stop');
     else
          console.log('Start');
  });
};

////////////////////////////////////////////////////////////
/////IPC Communication
////////////////////////////////////////////////////////////

ipcMain.on('start-search', function (e) {
  if (computing) {
    console.log("cannot run again")
  }
  else {
    div_id = 0;
    computing = true;
    socket.emit("search_for_dupes", search_paths);
    mainWindow.webContents.send("show-element", "progress-bar");
    mainWindow.webContents.send("update-progressbar", 0);
  }

});

ipcMain.on('open-filedialog', function (e) {
  const options = { properties: ['openDirectory', 'multiSelections'] }
  dialog.showOpenDialog(mainWindow, options).then(result => {
    if (result.closed != true) {
      if (result.filePaths.length > 0) {
        search_paths = result.filePaths
        display_paths()
        mainWindow.webContents.send('show-element', "btn-scan");
      }
    }
  }).catch(err => {
    console.log(err)
  })
});

ipcMain.on('move-images', function (e, image_map) {
  const options = { properties: ['openDirectory'] }
  dialog.showOpenDialog(mainWindow, options).then(result => {
    if (result.closed != true) {
      // ask before moving to prevent accidental moving
      const options = {
        message: "Do you really want to move the selected photos to following directory?",
        detail: result.filePaths[0],
        type: "warning",
        buttons: ["yes", "no"]
      }
      dialog_response = dialog.showMessageBoxSync(mainWindow, options)

      // proceed on "yes"
      if (dialog_response == 0) {
        for (let image_path of image_map.values()) {
          image_path = url.fileURLToPath(image_path);
          var image_filename = path.parse(image_path).base;
          var new_path = path.join(result.filePaths[0], image_filename);

          // if file exists it will be deleted
          // on error, a error box will be displayed
          if (fs.existsSync(image_path)) {
            fs.rename(image_path, new_path, (err) => {
              if (err) {
                dialog.showErrorBox(mainWindow, err)
                console.log(err);
              }
              console.log("File successfully moved");
            });
          } else {
            dialog.showErrorBox(mainWindow, "This file doesn't exist, cannot move")
            console.log("This file doesn't exist, cannot move");
          }
        }
        mainWindow.webContents.send('remove-selected-duplicates');
      }
    }
  });
});

ipcMain.on('delete-images', function (e, image_map) {
  // ask before deleting to prevent accidental deletion
  const options = {
    message: "Do you really want to delete the selected photos?",
    type: "warning",
    buttons: ["yes", "no"]
  }
  dialog_response = dialog.showMessageBoxSync(mainWindow, options)

  // proceed on "yes"
  if (dialog_response == 0) {
    for (let image_path of image_map.values()) {
      image_path = url.fileURLToPath(image_path);

      // if file exists it will be deleted
      // on error, a error box will be displayed
      if (fs.existsSync(image_path)) {
        fs.unlink(image_path, (err) => {
          if (err) {
            dialog.showErrorBox(mainWindow, err)
            console.log(err);
          }
          console.log("File successfully deleted");
        });
      } else {
        dialog.showErrorBox(mainWindow, "This file doesn't exist, cannot delete")
        console.log("This file doesn't exist, cannot delete");
      }
    }
    mainWindow.webContents.send('remove-selected-duplicates');
  }
});

////////////////////////////////////////////////////////////
/////Client for RPC Communication
////////////////////////////////////////////////////////////

const io = require("socket.io-client");
const { systemPreferences } = require('electron');
const { OS } = require('custom-electron-titlebar/common/platform');
const socket = io('http://127.0.0.1:5000');

// client-side
socket.on("connect", () => {
  console.log(socket.id);
});

socket.on("disconnect", () => {
  computing = false;
  console.log("disconnected");
});

socket.on("addpic", () => {
  mainWindow.webContents.send('add-pic');
});

socket.on("receive_duplicate_groups", (duplicate_groups) => {
  display_duplicate_groups(duplicate_groups);
  duplicate_groups_global = duplicate_groups;
  computing = false;
});

socket.on("update-progress", (progress) => {
  console.log(progress);
  mainWindow.webContents.send('update-progressbar', progress);
});

////////////////////////////////////////////////////////////
/////Menu
////////////////////////////////////////////////////////////

// empty array = no menu displayed
const mainMenuTemplate = []


////////////////////////////////////////////////////////////
/////Key Bindings
////////////////////////////////////////////////////////////

// Add developer tools option if in dev
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        role: 'reload'
      },
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    ]
  });
}