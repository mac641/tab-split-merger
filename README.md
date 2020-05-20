# Window Manager for Firefox

## Features

### Main Features

- Split tabs into multiple windows

- Merge all windows

### Configuration Features

- Choose whether or not pinned tabs will be repinned

- Configure when you will be prompted for confirmation when splitting tabs into windows

## Installation

> In Firefox: Open the about:debugging page, click "This Firefox" (in newer versions of Firefox), click "Load Temporary Add-on".

Then navigate to the downloaded directory and select `manifest.json`.

[MDN: Your first extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)

## Usage

This extension adds menu options to all open tabs except those in *Private Windows*. You can find them by performing a *right click* on the currently *active tab* (It only works on active tabs since the extension has no host permission).  
At the bottom of this menu you should see a option called **Window Manager**. Just move your mouse over it and wait for the sub menu to open.

### Set confirmation threshold

This option is always visible.  
By clicking it, you will be prompted for an Integer number, which specifies the amount of windows to be ignored before asking for confirmation when splitting tabs into windows.  
**Default value: 2**

### Repin tabs

This option is always visible.  
It is a checkbox, which tells the extension whether or not it will be repinning tabs when splitting tabs to windows / merging windows.  
**Default value: true**

### Split tabs in current window

This option is only visible when there are multiple tabs in the currently focused window.
By clicking it, you will be prompted for confirmation based on the value set as *confirmation threshold*.  
If you are prompted, you can click **Cancel** to stop the operation or **Ok** to run the operation, which will end up all your tabs in separate windows.

### Split tabs in all windows

This option is only visible when there is more than one window with multiple tabs.
By clicking it, you will be prompted for confirmation based on the value set as *confirmation threshold*.  
If you are prompted, you can click **Cancel** to stop the operation or **Ok** to run the operation, which will end up all your tabs in separate windows.

### Merge windows

This option is only visible when there are multiple firefox window instances open (*Private windows are ignored*).  
By clicking it, all tabs are moved to the window, which has the most currently opened tabs.

## Known Issues

### Tree Style Tab

If used together with the addon "Tree Style Tab", the subordinated tabs will be merged again into one window, after splitting tabs into windows.

### Never Remember History

If Firefox is configured to *Never remember history*, the extension won't work, because every window instance is handled as *private browsing*.

## Credits

- Inspired by [jonathanKingston/merge-windows](https://github.com/jonathanKingston/merge-windows)
