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
    const id = "split-tabs";

    // remove contextMenu with id 'split-tabs'
    browser.contextMenus.remove(id);

    // get all tabs
    let querriedTabs = browser.tabs.query({});
    querriedTabs.then(createContextMenus, onError);

    // TODO: is there a better way? how to avoid forEach loops wrapped in map?
    function createContextMenus(tabs) {
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
          });
        }
      });
    }

    // TODO: test onError
    function onError(error) {
      browser.tabs.executeScript({ code: `window.alert(${error}.message)` });
    }
  }

  async askForSplitPermission() {
    // TODO: add config entry to enable configuration when prompting for permission should be enabled

    // get windows and assign their amount
    // TODO: check if there's a way to assign length without using two variables
    const windows = await this.getCurrentWindows();
    const windowCount = windows.length;

    // get tabs and assign their amount
    const tabs = await browser.tabs.query({}).then((value) => value);
    const numberOfTabs = tabs.length;

    // Inject code into current active tab because background are unable to access JavaScript API of browser (including window)
    const activeTab = browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const confirm = browser.tabs.executeScript(activeTab.id, {
      code: `window.confirm(
        \`Do you really want to open ${
          numberOfTabs - windowCount
        } additional windows?\`
      )`,
    });

    // Return promise including user choice whether or not to split
    return confirm;
  }

  async split() {
    const windowMap = new Map();
    const windows = await this.getCurrentWindows(); // Get all currently opened browser windows
    let repin = [];
    const promises = windows.map(async function (windowObj) {
      // for each window get all tabs
      const tabs = await browser.tabs.query({
        windowId: windowObj.id,
      });
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          if (tab.pinned) {
            // add the tabs of the window in an array
            repin.push(
              browser.tabs.update(tab.id, {
                pinned: false,
              })
            ); // if tab is pinned, add to pinned list and unpin it to make it moveable
          }
          return tab.id;
        })
      );
      if (tabs.length < 2) {
        return;
      }
    });

    await this.askForSplitPermission().then((value) => {
      // TODO: Make tabs accessible in whole 'split()' function
      if (!value[0]) return;
      tabs.map((tab) => {
        // for each tab open a new window
        browser.windows.create({ tabId: tab.id });
      });
    });

    await Promise.all(promises);
  }
}

new windowManager();
