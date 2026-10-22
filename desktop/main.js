// Fire Chords for macOS: a window around the songbook web app.
// The page itself comes from GitHub Pages (so it updates on its own) and its service worker keeps it working offline.
// Everything the page stores — songs, minuses, marks, settings — lives in this app's own data folder
// (~/Library/Application Support/Fire Chords), which survives app updates.
const {app,BrowserWindow,shell,session,systemPreferences}=require('electron');

const HOME='https://armarzak.github.io/songbook-/';
const own=url=>url.startsWith(HOME);
const outside=url=>url.replace(/^x-safari-/,''); // the page asks iOS for Safari this way; here the default browser opens it

function createWindow(){
  const win=new BrowserWindow({
    width:1100,height:820,minWidth:380,minHeight:520,
    title:'Fire Chords',backgroundColor:'#000000',
    webPreferences:{contextIsolation:true,sandbox:true}
  });
  win.loadURL(HOME);
  // links to other sites (YouTube, Ultimate Guitar, Songsterr…) open in the normal browser
  win.webContents.setWindowOpenHandler(({url})=>{
    if(own(url))win.loadURL(url); else shell.openExternal(outside(url));
    return {action:'deny'};
  });
  win.webContents.on('will-navigate',(e,url)=>{if(!own(url)){e.preventDefault();shell.openExternal(outside(url))}});
}

app.whenReady().then(()=>{
  // the tuner and chord practice use the microphone; copy/paste is used by import
  const allowed=['media','clipboard-read','clipboard-sanitized-write','fullscreen'];
  session.defaultSession.setPermissionRequestHandler((wc,perm,done,details)=>{
    if(!allowed.includes(perm))return done(false);
    if(perm==='media'&&process.platform==='darwin'&&(details.mediaTypes||[]).includes('audio'))
      return systemPreferences.askForMediaAccess('microphone').then(done,()=>done(false));
    done(true);
  });
  session.defaultSession.setPermissionCheckHandler((wc,perm)=>allowed.includes(perm));
  createWindow();
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
