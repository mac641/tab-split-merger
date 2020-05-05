class windowManager {
  managerId: string = "windowManager";
  configId: string = "configuration";
  splitId: string = "split-tabs";

  constructor() {
    // init menus and config
    this.init();
    this.calculateSplitTabsContextMenu();

    // register onClicked Listener on split() / askForThresholdConfig() function
    browser.menus.onClicked.addListener((info) => {
      if (info.menuItemId === this.splitId) {
        this.split();
      } else if (info.menuItemId === this.configId) {
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
    browser.menus.remove(this.managerId);
    browser.menus.create({
      id: this.managerId,
      title: "Window Manager",
      contexts: ["all", "tab"]
    });

    // Add configuration sub menu item
    browser.menus.remove(this.configId);
    browser.menus.create({
      id: this.configId,
      title: "Set confirmation threshold",
      contexts: ["all", "tab"],
      parentId: this.managerId
    });

    // set default configuration
    const config: number = (await this.getConfiguration()).threshold;
    const defaultThreshold: browser.storage.StorageObject = { threshold: 2 };
    if (
      config === null ||
      config === undefined ||
      config === defaultThreshold.threshold
    ) {
      this.setConfiguration(defaultThreshold);
    }

    return new Promise<string>((resolve) => resolve("Initialized"));
  }

  async getCurrentWindows() {
    // asynchronous function that returns Promise containing the currently focused window as windows.Window object
    const currentWindow: browser.windows.Window = await browser.windows.getCurrent();

    // asynchronous function containing all open windows as an array of windows.Window objects wrapped in a Promise
    const windows: browser.windows.Window[] = await browser.windows.getAll({});

    // apply filter to remove incognito windows from array
    return windows.filter((windowObj: browser.windows.Window) => {
      return windowObj.incognito === currentWindow.incognito;
    });
  }

  async getConfiguration() {
    // TODO: figure out why void | browser.storage.StorageObject is necessary
    const configItems: void | browser.storage.StorageObject = await browser.storage.local
      .get()
      .then(
        (value) => value,
        (error) => console.error(error)
      );

    return configItems;
  }

  // TODO: take Object as parameter for easier editing with multiple config entries
  async setConfiguration(threshold: browser.storage.StorageObject) {
    await browser.storage.local.set(threshold).then(
      () => {},
      (error) => {
        console.error(error);
      }
    );
  }

  async askForThresholdConfig() {
    const activeTab: browser.tabs.Tab[] = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    // TODO: put executeScript code in separate file
    // TODO: check if promise is seen as object in ts
    const configPrompt: object = await browser.tabs
      .executeScript(activeTab.find(id), {
        code: `window.prompt("Type a number which specifies the amount of windows to be ignored before asking for confirmation", ${
          (await this.getConfiguration()).threshold
        })`
      })
      .then((value) => value);

    // TODO: check if NaN
    if (configPrompt[0] !== null) {
      this.setConfiguration(Number(configPrompt[0]));
    }
  }

  async askForSplitPermission() {
    // get current confirmationTreshold
    const confirmationThreshold: number = (await this.getConfiguration())
      .threshold;

    // get windows and assign their amount
    const windows: number = (await this.getCurrentWindows()).length;

    // get tabs and assign their amount
    const tabs: number = await browser.tabs
      .query({})
      .then((value) => value.length);

    // if tabs < confirmationThreshold return true wrapped in Array wrapped in Promise -> same as confirm does below
    if (tabs < confirmationThreshold) {
      return new Promise<boolean[]>((resolve) => resolve(new Array(true)));
    }

    // Inject js code into current active tab because background scripts are unable to access JavaScript API of browser window (including window.confirm, window.alert, etc.)
    const activeTab: void | browser.tabs.Tab[] = await browser.tabs
      .query({
        active: true,
        currentWindow: true
      })
      .then(
        (value) => value,
        (error) => console.error(error)
      );
    // TODO: put executeScript code in separate file
    const confirm: object[] = await browser.tabs.executeScript(
      activeTab.indexOf(id),
      {
        code: `window.confirm(
        \`You are going to open ${
          tabs - windows
        } additional windows.\nAre you sure?\`
      )`
      }
    );

    // Return promise including user choice whether or not to split
    return confirm;
  }

  async calculateSplitTabsContextMenu() {
    const windows = await this.getCurrentWindows();

    // remove contextMenu with id 'split-tabs'
    browser.menus.remove(this.splitId);

    // get all tabs and run asynchronous function 'createmenus' if Promise is fulfilled
    await browser.tabs
      .query({})
      .then(createMenus, (error) => console.error(error));

    // TODO: is there a better way? how to avoid forEach loops wrapped in map?
    // TODO: is there a better way to not use any as function parameter
    async function createMenus(tabs: any[]) {
      windows.map((window) => {
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
    }
  }

  async split() {
    // ask for confirmation before splitting tabs into windows
    const isSplit:
      | boolean
      | void
      | object = await this.askForSplitPermission().then(
      (value) => value[0],
      (error) => console.error(error)
    );

    if (!isSplit) {
      return;
    }

    // set up variables and get all firefox windows
    const windowMap = new Map();
    const windows = await this.getCurrentWindows();
    let repin = [];
    const promises = windows.map(async (windowObj) => {
      // for each window get all tabs
      const tabs = await browser.tabs.query({
        windowId: windowObj.id
      });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          // if tab is pinned, add to pinned list and unpin it to make it moveable
          if (tab.pinned) {
            // add the tabs of the window in an array
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
      tabs.map(async (tab) => {
        // for each tab open a new window
        browser.windows.create({ tabId: tab.id });
      });
    });

    // Solve all Promises and repin previously unpinned tabs
    await Promise.all(promises);
    // TODO: probably add configuration option
    const repinTabs = await Promise.all(repin);
    repinTabs.forEach((tab) => {
      browser.tabs.update(tab.id, { pinned: true });
    });
  }
}

new windowManager();
