class windowManager {
  constructor() {
    browser.contextMenus.onClicked.addListener(() => {
      this.merge();
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

  async merge() {
    const windowMap = new Map();
    const windows = await this.getCurrentWindows();
    let repin = [];
    const promises = windows.map(async function (windowObj) {
      const tabs = await browser.tabs.query({ windowId: windowObj.id });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          if (tab.pinned) {
            repin.push(browser.tabs.update(tab.id, { pinned: false }));
          }
          return tab.id;
        })
      );
      if (tabs.length < 2) {
        return;
      }
      tabs.map((tab) => {
        browser.windows.create({ tabId: tab.id });
      });
    });
    await Promise.all(promises);
  }
}

new windowManager();
