class windowManager {
  constructor() {
    // init contextMenus and config
    this.init();
    this.calculateSplitTabsContextMenu();

    // register onClicked Listener on split() / askForThresholdConfig() function
    browser.contextMenus.onClicked.addListener((info) => {
      if (info.menuItemId === "split-tabs") {
        this.split();
      } else if (info.menuItemId === "configuration") {
        this.askForThresholdConfig();
      }
    });

    // register claculateSplitTabsContextMenu() on windows.onFocusChanged() -> event is fired when currently focused window was changed
    browser.windows.onFocusChanged.addListener(() => {
      this.calculateSplitTabsContextMenu();
    });
  }

  async init() {
    // Add main menu item
    browser.contextMenus.remove("windowManager");
    browser.contextMenus.create({
      id: "windowManager",
      title: "Window Manager",
      contexts: ["all", "tab"]
    });

    // Add configuration sub menu item
    browser.contextMenus.remove("configuration");
    browser.contextMenus.create({
      id: "configuration",
      title: "Set confirmation threshold",
      contexts: ["all", "tab"],
      parentId: "windowManager"
    });

    // set default configuration
    const config = (await this.getConfiguration()).threshold;
    if (config === null || config === undefined || config === 2) {
      this.setConfiguration(2);
    }
  }

  async getCurrentWindows() {
    // asynchronous function that returns Promise containing the currently focused window as windows.Window object
    const currentWindow = await browser.windows.getCurrent();

    // asynchronous function containing all open windows as an array of windows.Window objects wrapped in a Promise
    const windows = await browser.windows.getAll({});

    // apply filter to remove incognito windows from array
    return windows.filter((windowObj) => {
      return windowObj.incognito === currentWindow.incognito;
    });
  }

  async getConfiguration() {
    const configItems = await browser.storage.local.get().then(
      (value) => value,
      (error) => console.error(error)
    );

    return configItems;
  }

  async setConfiguration(threshold) {
    await browser.storage.local
      .set({
        threshold: threshold
      })
      .then(
        (value) => {},
        (error) => {
          console.error(error);
        }
      );
  }

  async askForThresholdConfig() {
    const activeTab = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const configPrompt = await browser.tabs
      .executeScript(activeTab.id, {
        code: `window.prompt("Type a number which specifies the amount of windows to be ignored before asking for confirmation", ${
          (await this.getConfiguration()).threshold
        })`
      })
      .then((value) => value);

    if (configPrompt[0] !== null) {
      this.setConfiguration(Number(configPrompt[0]));
    }
  }

  async calculateSplitTabsContextMenu() {
    const windows = await this.getCurrentWindows();
    const id = "split-tabs";

    // remove contextMenu with id 'split-tabs'
    browser.contextMenus.remove(id);

    // get all tabs and run asynchronous function 'createContextMenus' if Promise is fulfilled
    await browser.tabs
      .query({})
      .then(createContextMenus, (error) => console.error(error));

    // TODO: is there a better way? how to avoid forEach loops wrapped in map?
    async function createContextMenus(tabs) {
      windows.map((window) => {
        // check how many tabs exist in each window
        let tabByWindowCount = 0;
        tabs.forEach((tab) => {
          if (tab.windowId === window.id) tabByWindowCount += 1;
        });

        // if at least two tabs exist in one window, remove contextMenu with id 'split-tabs' and create new contextMenu
        if (tabByWindowCount > 1) {
          browser.contextMenus.remove(id);
          browser.contextMenus.create({
            id,
            title: "Split all tabs into windows",
            contexts: ["all", "tab"],
            parentId: "windowManager"
          });
        }
      });
    }
  }

  async askForSplitPermission() {
    // get current confirmationTreshold
    const confirmationThreshold = (await this.getConfiguration()).threshold;

    // get windows and assign their amount
    const windowCount = (await this.getCurrentWindows()).length;

    // get tabs and assign their amount
    const numberOfTabs = await browser.tabs
      .query({})
      .then((value) => value.length);

    if (numberOfTabs < confirmationThreshold) {
      return Promise.resolve([true]);
    }

    // Inject code into current active tab because background scripts are unable to access JavaScript API of browser window (including window.confirm, window.alert, etc.)
    const activeTab = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const confirm = await browser.tabs.executeScript(activeTab.id, {
      code: `window.confirm(
        \`You are going to open ${
          numberOfTabs - windowCount
        } additional windows.\nAre you sure?\`
      )`
    });

    // Return promise including user choice whether or not to split
    return confirm;
  }

  async split() {
    // ask for confirmation before splitting tabs into windows
    const isSplit = await this.askForSplitPermission().then(
      (value) => value[0],
      (error) => console.error(error)
    );

    if (!isSplit) {
      return;
    }

    const windowMap = new Map();
    const windows = await this.getCurrentWindows(); // Get all currently opened browser windows
    let repin = [];
    const promises = windows.map(async (windowObj) => {
      // for each window get all tabs
      const tabs = await browser.tabs.query({
        windowId: windowObj.id
      });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          if (tab.pinned) {
            // add the tabs of the window in an array
            repin.push(
              browser.tabs.update(tab.id, {
                pinned: false
              })
            ); // if tab is pinned, add to pinned list and unpin it to make it moveable
          }
          return tab.id;
        })
      );
      if (tabs.length < 2) {
        return;
      }
      tabs.map(async (tab) => {
        // for each tab open a new window
        browser.windows.create({ tabId: tab.id });
      });
    });

    await Promise.all(promises);
    const repinTabs = await Promise.all(repin);
    repinTabs.forEach((tab) => {
      browser.tabs.update(tab.id, { pinned: true });
    });
  }
}

new windowManager();
