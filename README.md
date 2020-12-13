# Tab Split Merger for Firefox
![Mozilla Add-on](https://img.shields.io/amo/users/%7B7f59e59d-6ece-4399-9c0d-b98d36c4db8c%7D)
![Mozilla Add-on](https://img.shields.io/amo/v/%7B7f59e59d-6ece-4399-9c0d-b98d36c4db8c%7D)
![Mozilla Add-on](https://img.shields.io/amo/stars/%7B7f59e59d-6ece-4399-9c0d-b98d36c4db8c%7D)

**Download Link: [Firefox Browser Add-Ons - Tab-Split-Merger](https://addons.mozilla.org/en-US/firefox/addon/tab-split-merger/)**

## Features
### Main Features
* Split tabs into multiple windows
* Merge all windows
* Move windows to the left / right of the currently active tab into a new window

### Configuration Features
* Choose whether or not pinned tabs will be repinned
* Configure when you will be prompted for confirmation when splitting tabs into windows

## Installation
> In Firefox: Open the about:debugging page, click "This Firefox" (in newer versions of Firefox), click "Load Temporary 
Add-on".

Then navigate to the downloaded directory and select `manifest.json`.

[MDN: Your first extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)

## Usage
This extension adds menu options to all open tabs except those in *Private Windows*. You can find them by performing a 
*right click* on the currently *active tab* (It only works on active tabs since the extension has no host permission).  
At the bottom of this menu you should see a option called **Tab Split Merger**. Just move your mouse over it and wait for 
the sub menu to open.

### Split tabs in current window
This option is only visible if there are multiple tabs in the currently focused window.
By clicking it, you will be prompted for confirmation based on the value set as *confirmation threshold*.  
If you are prompted, you can click **Cancel** to stop the operation or **Ok** to run the operation, which will end up all 
your tabs in separate windows.

Keyboard shortcuts

  * Default: `Alt+Shift+D`
  * macOS: `MacCtrl+Shift+D`

### Split tabs in all windows
This option is only visible if there is more than one window with multiple tabs.
By clicking it, you will be prompted for confirmation based on the value set as *confirmation threshold*.  
If you are prompted, you can click **Cancel** to stop the operation or **Ok** to run the operation, which will end up all 
your tabs in separate windows.

Keyboard shortcuts

  * Default: `Alt+Shift+S`
  * macOS: `MacCtrl+Shift+S`

### Merge windows
This option is only visible if there are multiple firefox window instances open (*Private windows are ignored*).  
By clicking it, all tabs are moved to the window, which has the most currently opened tabs.

Keyboard shortcuts

  * Default: `Alt+Shift+M`
  * macOS: `MacCtrl+Shift+M`

### Move tabs on the left into a new window
This option is only visible if there are multiple tabs in the currently active window and the currently active tab is 
not the leftmost.
By clicking it, all tabs on the left of the currently active tab are moved into a new window. The currently active will be 
included.

Keyboard shortcuts

  * Default: `Alt+Shift+Y`
  * macOS: `MacCtrl+Shift+Y`

### Move tabs on the right into a new window
This option is only visible if there are multiple tabs in the currently active window and the currently active tab is 
not the rightmost.
By clicking it, all tabs on the right of the currently active tab are moved into a new window. The currently active will be 
excluded.

Keyboard shortcuts

  * Default: `Alt+Shift+X`
  * macOS: `MacCtrl+Shift+X`

### Set confirmation threshold
This option is always visible.  
By clicking it, you will be prompted for an Integer number, which specifies the amount of windows to be ignored before 
asking for confirmation when splitting tabs into windows.  
**Default value: 2**

### Repin tabs
This option is always visible.  
It is a checkbox, which tells the extension whether or not it will be repinning tabs when splitting tabs to windows / 
merging windows.  
**Default value: true**

## Known Issues
### Tree Style Tab
If used together with the addon "Tree Style Tab", the subordinated tabs will be merged again into one window, after 
splitting tabs into windows.

### Never Remember History
If Firefox is configured to *Never remember history*, the extension won't work, because every window instance is handled as 
*private browsing*.

## Credits
* Inspired by [jonathanKingston/merge-windows](https://github.com/jonathanKingston/merge-windows)
