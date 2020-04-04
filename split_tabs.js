class windowManager {
  constructor() {
    browser.contextMenus.onClicked.addListener(() => {
      this.split();
    });
    browser.windows.onFocusChanged.addListener(() => {
      this.calculateContextMenu();
    });
    this.calculateContextMenu();
  }

  async getCurrentWindows() {
    const currentWindow = await browser.windows.getCurrent();
    const windows = await browser.windows.getAll({});
    return windows.filter((windowObj) => {
      return windowObj.incognito === currentWindow.incognito;
    });
  }

  async calculateContextMenu() {
    const windows = await this.getCurrentWindows();
    const id = "split-tabs";
    browser.contextMenus.remove(id);
    if (windows.length >= 1) {
      browser.contextMenus.create({
        id,
        title: "Split all tabs into windows",
        contexts: ["all", "tab"],
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
