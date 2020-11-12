export class configManager {
  constructor() {
    // Class attributes
    this.defaultThreshold = 2
    this.defaultRepinTabs = true
    this.windows = []

    // call startup functions
    this.init()
  }

  async init() {
    this.setCurrentWindows()

    // set default configuration
    const currentConfig = await this.getConfiguration()
    const defaultConfig = {
      threshold: this.defaultThreshold,
      repinTabs: this.defaultRepinTabs
    }
    if (isConfigValid(currentConfig, defaultConfig)) {
      this.setConfiguration(defaultConfig)
    }

    // check of Object.keys().length to avoid overwriting
    function isConfigValid(currentConfig, defaultConfig) {
      return (
        Object.keys(currentConfig).length === 0 ||
        currentConfig === null ||
        currentConfig === undefined ||
        (currentConfig.threshold === defaultConfig.threshold &&
          currentConfig.repinTabs === defaultConfig.repinTabs)
      )
    }
  }

  async getConfiguration() {
    const config = await browser.storage.local.get().then(
      (value) => value,
      (error) => console.error(error)
    )

    return Promise.resolve(config)
  }

  async setConfiguration(config) {
    browser.storage.local.set(config).then(
      () => {},
      (error) => {
        console.error(error)
      }
    )
  }

  async setCurrentWindows() {
    this.getCurrentWindows().then(
      (value) => (this.windows = value),
      (error) => console.error(error)
    )
  }

  async getCurrentWindows() {
    // get current window as window.Window object and all windows as window.Window array
    const currentWindow = await browser.windows.getCurrent()
    const windows = await browser.windows.getAll({})

    // Remove incognito windows and return
    return windows.filter((windowObj) => {
      return windowObj.incognito === currentWindow.incognito
    })
  }

  async askForCurrentConfig() {
    const currentConfig = await this.getConfiguration()

    // Get activeTab and ask for new threshold config value
    const activeTab = await browser.tabs.query({
      active: true,
      currentWindow: true
    })
    const thresholdPrompt = await browser.tabs
      .executeScript(activeTab.id, {
        code: `window.prompt("Type a number", ${currentConfig.threshold})`
      })
      .then(
        (value) => value,
        () => {}
      )

    // Parse config string to Number and guard illegal values
    const configNumber = Number(thresholdPrompt[0])
    if (isConfigValid(thresholdPrompt, configNumber)) {
      currentConfig.threshold = configNumber
      this.setConfiguration(currentConfig)
    }

    function isConfigValid(thresholdPrompt, configNumber) {
      return (
        thresholdPrompt[0] !== null &&
        thresholdPrompt[0] !== undefined &&
        configNumber !== null &&
        configNumber !== undefined &&
        configNumber !== NaN
      )
    }
  }

  async askForSplitPermission(all) {
    // get confirmationThreshold, windowCount, numberOfTabs and activeTab
    await this.setCurrentWindows()
    const confirmationThreshold = (await this.getConfiguration()).threshold
    let windowCount = 0
    let numberOfTabs = 0
    if (all) {
      windowCount = this.windows.length
      numberOfTabs = await browser.tabs.query({}).then((value) => value.length)
    } else {
      const currentWindow = await browser.windows.getCurrent()
      windowCount = 1
      numberOfTabs = await browser.tabs
        .query({ windowId: currentWindow.id })
        .then((value) => value.length)
    }
    const activeTab = await browser.tabs.query({
      active: true,
      currentWindow: true
    })

    // if numberOfTabs - windowCount <= confirmationThreshold return true wrapped in Array wrapped in Promise -> same as confirm does below
    if (numberOfTabs - windowCount <= confirmationThreshold) {
      return Promise.resolve([true])
    }

    // Inject js code into current active tab because background scripts are unable to access JavaScript API of browser window (including window.confirm, window.alert, etc.)
    const confirm = await browser.tabs.executeScript(activeTab.id, {
      code: `window.confirm(
        \`You are about to open ${
          numberOfTabs - windowCount
        } additional windows.\nAre you sure?\`
      )`
    })

    return confirm
  }
}
