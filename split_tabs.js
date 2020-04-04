class windowManager {
  constructor() {
    // register onClicked Listener on split() function
    browser.contextMenus.onClicked.addListener(() => {
      this.split();
    });

    // register claculateContextMenu() on windows.onFocusChanged() -> event is fired when currently focused window was changed
    browser.windows.onFocusChanged.addListener(() => {
      this.calculateContextMenu();
    });
    this.calculateContextMenu();
  }

  async getCurrentWindows() {
    // returns Promise containing the currently focused window as windows.Window object
    const currentWindow = await browser.windows.getCurrent();

    // asynchronous function containing all open windows as an array of windows.Window objects
    const windows = await browser.windows.getAll({});

    // apply filter to remove incognito windows from array
    return windows.filter((windowObj) => {
      return windowObj.incognito === currentWindow.incognito;
    });
  }

  async calculateContextMenu() {
    const windows = await this.getCurrentWindows();
    const id = 'split-tabs';
    
    // remove contextMenu with id 'split-tabs'
    browser.contextMenus.remove(id);

    // if at least one window exists, create contextMenu 'Split all tabs into windows'
    // TODO: check for amount of tabs instead of amount of windows
    if (windows.length >= 1) {
      browser.contextMenus.create({
        id,
        title: 'Split all tabs into windows',
        contexts: ['all', 'tab', 'windows'],
      });
    }
  }

  async split() {
    const windowMap = new Map();
    const windows = await this.getCurrentWindows(); // Get all currently opened browser windows
    let repin = [];
    const promises = windows.map(async function (windowObj) { // for each of the windows,
      const tabs = await browser.tabs.query({ windowId: windowObj.id });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          if (tab.pinned) { // add the tabs of the window in an array 
            repin.push(browser.tabs.update(tab.id, { pinned: false })); // if tab is pinned, add to pinned list and unpin it to make it moveable
          }
          return tab.id;
        })
      );
      if (tabs.length < 2) {
        return;
      }
      tabs.map((tab) => { // for each tab open a new window
        browser.windows.create({ tabId: tab.id });
      });
    });
    await Promise.all(promises);
  }
}

new windowManager();
