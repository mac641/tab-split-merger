import { configManager } from "./configManager.js";
import { menuManager } from "./menuManager.js";

// TODO: adjust privacy measures
class windowManager {
  constructor() {
    // Class attributes
    this.config = new configManager();
    this.menu = new menuManager();
    this.isRepinTabs = true;
    this.windows = [];

    // call startup functions
    this.setCurrentWindows();
    this._init();
  }

  async _init() {
    browser.menus.onClicked.addListener(async (info) => {
      if (info.menuItemId === this.menu.splitId) {
        this.split();
      } else if (info.menuItemId === this.menu.thresholdId) {
        this.config.askForThresholdConfig();
      } else if (info.menuItemId === this.menu.mergeId) {
        this.merge();
      } else if (info.menuItemId === this.menu.repinId) {
        let config = await this.config.getConfiguration().then(
          (value) => value,
          (error) => console.error(error)
        );
        if (info.checked) {
          config.repinTabs = true;
        } else {
          config.repinTabs = false;
        }
        this.config.setConfiguration(config);
      }
    });
  }

  async setCurrentWindows() {
    this._getCurrentWindows().then(
      (value) => (this.windows = value),
      (error) => console.error(error)
    );
  }

  async _getCurrentWindows() {
    // get current window as window.Window object and all windows as window.Window array
    const currentWindow = await browser.windows.getCurrent();
    const windows = await browser.windows.getAll({});

    // Remove incognito windows and return
    return windows.filter((windowObj) => {
      return windowObj.incognito === currentWindow.incognito;
    });
  }

  // TODO: split / merge -> reduce code duplication when implementing in separate class
  async split() {
    // ask for confirmation before splitting tabs into windows
    let isSplit = false;
    await this.config.askForSplitPermission().then(
      (value) => (isSplit = value[0]),
      (error) => console.error(error)
    );

    if (!isSplit) {
      return;
    }

    await this.setCurrentWindows();
    const windows = this.windows;

    // FIXME: Repining after splitting tabs doesn't work -> pinned tabs are simply ignored...WHYY?
    if (this.isRepinTabs) {
      splitRepinTabs(windows);
    } else {
      splitIgnorePinnedTabs(windows);
    }

    async function splitRepinTabs(windows) {
      // For each window get all tabs, map them to current window object and push pinned tabs into repin array after unpinning
      let repin = [];
      const promises = windows.map(async (windowObj) => {
        const tabs = await browser.tabs.query({
          windowId: windowObj.id
        });
        tabs.map((tab) => {
          if (tab.pinned) {
            repin.push(
              browser.tabs.update(tab.id, {
                pinned: false
              })
            );
          }
          return tab.id;
        });
        if (tabs.length < 2) {
          return;
        }
        tabs.map((tab) => {
          browser.windows.create({
            tabId: tab.id
          });
        });
      });

      // Solve all Promises and repin previously unpinned tabs
      await Promise.all(promises);
      const repinTabs = await Promise.all(repin);
      repinTabs.forEach(async (tab) => {
        await browser.tabs.update(tab.id, { pinned: true }).then(
          () => {},
          (error) => console.error(error)
        );
        console.log(tab);
      });
    }

    async function splitIgnorePinnedTabs(windows) {
      const promises = windows.map(async (windowObj) => {
        const tabs = await browser.tabs.query({
          windowId: windowObj.id
        });
        if (tabs.length < 2) {
          return;
        }
        tabs.map((tab) => {
          browser.windows.create({
            tabId: tab.id
          });
        });
      });

      // Solve all Promises and repin previously unpinned tabs
      await Promise.all(promises);
    }
    this.menu.calculateTemporaryMenu();
  }

  // FIXME: biggest = null when merge windows is clicked, when selecting merge windows again it works just as intended
  async merge() {
    const windowMap = new Map();
    let biggestCount = 0;
    let biggest = null;
    let repin = [];

    // For each window map tabs to window objects, unpin pinned tabs and push them into repin array
    await this.setCurrentWindows();
    const promises = this.windows.map(async function (windowObj) {
      const tabs = await browser.tabs.query({
        windowId: windowObj.id
      });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          if (tab.pinned) {
            repin.push(browser.tabs.update(tab.id, { pinned: false }));
          }
          return tab.id;
        })
      );
      if (tabs.length > biggestCount) {
        biggest = windowObj;
        biggestCount = tabs.length;
      }
    });

    // Solve all Promises and repin previously unpinned tabs
    await Promise.all(promises);
    const repinTabs = await Promise.all(repin);
    this.windows.forEach((windowObj) => {
      if (windowObj === biggest) {
        return;
      }
      browser.tabs.move(windowMap.get(windowObj), {
        index: -1,
        windowId: biggest.id
      });
    });
    repinTabs.forEach((tab) => {
      browser.tabs.update(tab.id, { pinned: true });
    });
    this.menu.calculateTemporaryMenu();
  }
}

new windowManager();
