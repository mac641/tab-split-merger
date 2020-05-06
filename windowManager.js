class windowManager {
  constructor() {
    // Introduce class attributes
    this.managerId = "windowManager";
    this.configId = "configuration";
    this.splitId = "splitTabs";
    this.windows = [];

    // init menus and config
    this.init();
    this.calculateSplitTabsContextMenu();

    // register split() / askForThresholdConfig() on onClicked event of menus
    browser.menus.onClicked.addListener((info) => {
      if (info.menuItemId === this.splitId) {
        this.split();
      } else if (info.menuItemId === this.configId) {
        this.askForThresholdConfig();
      }
    });

    // register calculateSplitTabsContextMenu() on onFocusChanged event
    browser.windows.onFocusChanged.addListener(() => {
      this.getCurrentWindows().then(
        (value) => (this.windows = value),
        (error) => console.error(error)
      );
      this.calculateSplitTabsContextMenu();
    });
  }

  async init() {
    // Get current windows and assign to class attribute
    this.getCurrentWindows().then(
      (value) => (this.windows = value),
      (error) => console.error(error)
    );

    // Add constant menu items
    browser.menus.remove(this.managerId);
    browser.menus.create({
      id: this.managerId,
      title: "Window Manager",
      contexts: ["all", "tab"]
    });
    browser.menus.remove(this.configId);
    browser.menus.create({
      id: this.configId,
      title: "Set confirmation threshold",
      contexts: ["all", "tab"],
      parentId: this.managerId
    });

    // set default configuration
    const config = (await this.getConfiguration()).threshold;
    const defaultThreshold = { threshold: 2 };
    if (
      config === null ||
      config === undefined ||
      config === defaultThreshold.threshold
    ) {
      this.setConfiguration(defaultThreshold);
    }
  }

  async getCurrentWindows() {
    // get current window as window.Window object wrapped in Promise
    const currentWindow = await browser.windows.getCurrent();

    // get all windows as window.Window array wrapped in Promise
    const windows = await browser.windows.getAll({});

    // Remove incognito windows and return
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
    browser.storage.local.set(threshold).then(
      () => {},
      (error) => {
        console.error(error);
      }
    );
  }

  async askForThresholdConfig() {
    // Get activeTab and ask for new threshold config value
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
      .then(
        (value) => value,
        () => {}
      );

    // Parse config string to Number and guard illegal values
    const configNumber = Number(configPrompt[0]);
    if (
      configPrompt[0] !== null &&
      configPrompt[0] !== undefined &&
      configNumber !== null &&
      configNumber !== undefined &&
      configNumber !== NaN
    ) {
      this.setConfiguration({ threshold: configNumber });
    }
  }

  async askForSplitPermission() {
    // get confirmationThreshold, windowCount, numberOfTabs and activeTab
    const confirmationThreshold = (await this.getConfiguration()).threshold;
    const windowCount = this.windows.length;
    const numberOfTabs = await browser.tabs
      .query({})
      .then((value) => value.length);
    const activeTab = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    // if numberOfTabs < confirmationThreshold return true wrapped in Array wrapped in Promise -> same as confirm does below
    if (numberOfTabs < confirmationThreshold) {
      return Promise.resolve([true]);
    }

    // Inject js code into current active tab because background scripts are unable to access JavaScript API of browser window (including window.confirm, window.alert, etc.)
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

  async calculateSplitTabsContextMenu() {
    // remove contextMenu with id 'split-tabs'
    browser.menus.remove(this.splitId);

    // get all tabs and run fulfilled arrow function if Promise is resolved
    browser.tabs.query({}).then(
      (tabs) => {
        // TODO: is there a better way? how to avoid forEach loops wrapped in map?
        this.windows.map((window) => {
          // check how many tabs exist in each window
          let tabByWindowCount = 0;
          tabs.forEach((tab) => {
            if (tab.windowId === window.id) tabByWindowCount += 1;
          });

          // if at least two tabs exist in one window, remove contextMenu with id 'split-tabs' and create new contextMenu
          if (tabByWindowCount > 1) {
            browser.menus.remove(this.splitId);
            browser.menus.create({
              id: this.splitId,
              title: "Split all tabs into windows",
              contexts: ["all", "tab"],
              parentId: this.managerId
            });
          }
        });
      },
      (error) => {
        return console.error(error);
      }
    );
  }

  async split() {
    // ask for confirmation before splitting tabs into windows
    let isSplit = false;
    await this.askForSplitPermission().then(
      (value) => (isSplit = value[0]),
      (error) => console.error(error)
    );

    if (!isSplit) {
      return;
    }

    // set up variables and get all firefox windows
    const windowMap = new Map();
    let repin = [];
    const promises = this.windows.map(async (windowObj) => {
      // for each window get all tabs
      const tabs = await browser.tabs.query({
        windowId: windowObj.id
      });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          // if tab is pinned, add to pinned list and unpin it to make it moveable
          if (tab.pinned) {
            // push pinned tabs into array for repinning later on
            repin.push(
              browser.tabs.update(tab.id, {
                pinned: false
              })
            );
          }
          return tab.id;
        })
      );
      if (tabs.length < 2) {
        return;
      }
      tabs.map((tab) => {
        // create new window for each tab
        browser.windows.create({ tabId: tab.id });
      });
    });

    // Solve all Promises and repin previously unpinned tabs
    Promise.all(promises);
    // TODO: add configuration option
    const repinTabs = await Promise.all(repin);
    repinTabs.forEach((tab) => {
      browser.tabs.update(tab.id, { pinned: true });
    });
  }
}

new windowManager();
