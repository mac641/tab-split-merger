## Documentation
This extension adds menu options to all open tabs except those in 
*Private Windows*. You can find them by performing a *right click* on the 
currently *active tab* (It only works on active tabs since the extension has 
no host permission).  
At the bottom of this menu you should see a option called 
**Tab Split Merger**. Just move your mouse over it and wait for the sub menu 
to open.

### Help
This option is always visible.  
By clicking it, you will be redirected to this README file.

### Set max window threshold
This option is always visible.  
By clicking it, you will be prompted for an Integer number, which specifies 
the amount of windows to be ignored before asking for confirmation when 
splitting tabs into windows.  
**Default value: 2**

### Repin tabs
This option is always visible.  
It is a checkbox, which tells the extension whether or not it will be 
repinning tabs when splitting tabs to windows / merging windows.  
**Default value: true**

### Split tabs in current window
This option is only visible if there are multiple tabs in the currently 
focused window. By clicking it, you will be prompted for confirmation based on 
the value set as *confirmation threshold*.  
If you are prompted, you can click **Cancel** to stop the operation or **Ok** 
to run the operation, which will end up all your tabs in separate windows.

Keyboard shortcuts

  * Default: `Alt+Shift+D`
  * macOS: `MacCtrl+Shift+D`

### Split tabs in all windows
This option is only visible if there is more than one window with multiple 
tabs. By clicking it, you will be prompted for confirmation based on the value 
set as *confirmation threshold*.  
If you are prompted, you can click **Cancel** to stop the operation or **Ok** 
to run the operation, which will end up all your tabs in separate windows.

Keyboard shortcuts

  * Default: `Alt+Shift+S`
  * macOS: `MacCtrl+Shift+S`

### Merge windows
This option is only visible if there are multiple firefox window instances 
open (*Private windows are ignored*).  
By clicking it, all tabs are moved to the window, which has the most currently 
opened tabs.

Keyboard shortcuts

  * Default: `Alt+Shift+M`
  * macOS: `MacCtrl+Shift+M`

### Move tabs on the left into a new window
This option is only visible if there are multiple tabs in the currently active 
window and the currently active tab is not the leftmost.
By clicking it, all tabs on the left of the currently active tab are moved 
into a new window. The currently active will be included.

Keyboard shortcuts

  * Default: `Alt+Shift+Y`
  * macOS: `MacCtrl+Shift+Y`

### Move tabs on the right into a new window
This option is only visible if there are multiple tabs in the currently active 
window and the currently active tab is not the rightmost.
By clicking it, all tabs on the right of the currently active tab are moved 
into a new window. The currently active will be excluded.

Keyboard shortcuts

  * Default: `Alt+Shift+X`
  * macOS: `MacCtrl+Shift+X`
