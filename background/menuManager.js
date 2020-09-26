export class menuManager {
  constructor() {
    // Class attributes
    this.managerId = 'tabSplitMerger'
    this.thresholdId = 'configConfirmationThreshold'
    this.splitAllId = 'splitAllTabs'
    this.splitCurrentId = 'splitCurrentTabs'
    this.splitLeftId = 'splitLeft'
    this.splitRightId = 'splitRight'
    this.mergeId = 'mergeWindows'
    this.repinId = 'configRepinTabs'

    // call startup functions
    this.init()
    this.calculateTemporaryMenu()

    // add event listeners
    browser.windows.onFocusChanged.addListener(() => {
      this.calculateTemporaryMenu()
    })
    browser.tabs.onCreated.addListener(() => {
      this.calculateTemporaryMenu()
    })
    browser.tabs.onAttached.addListener(() => {
      this.calculateTemporaryMenu()
    })
    browser.tabs.onRemoved.addListener(() => {
      this.calculateTemporaryMenu()
    })
  }

  async init() {
    // Add constant menu items
    browser.menus.remove(this.managerId)
    browser.menus.create({
      id: this.managerId,
      title: 'Tab Split Merger',
      contexts: ['all', 'tab']
    })
    browser.menus.remove(this.thresholdId)
    browser.menus.create({
      id: this.thresholdId,
      title: 'Set confirmation threshold',
      contexts: ['all', 'tab'],
      parentId: this.managerId
    })
    browser.menus.remove(this.repinId)
    browser.menus.create({
      id: this.repinId,
      type: 'checkbox',
      title: 'Repin tabs',
      contexts: ['all', 'tab'],
      checked: true,
      parentId: this.managerId
    })
    browser.menus.remove('separator-1')
    browser.menus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['all', 'tab'],
      parentId: this.managerId
    })
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

  async calculateTemporaryMenu() {
    await this.getCurrentWindows().then(
      (value) => (this.windows = value),
      (error) => console.error(error)
    )
    this.calculateSplitTabsMenu()
    this.calculateMergeMenu()
  }

  async calculateSplitTabsMenu() {
    browser.menus.remove(this.splitAllId)
    browser.menus.remove(this.splitCurrentId)

    // check how many tabs exist and create split menu if there are at least 2
    browser.tabs.query({}).then(
      (tabs) => {
        this.windows.map((window) => {
          let tabByWindowCount = 0
          tabs.forEach((tab) => {
            if (tab.windowId === window.id) tabByWindowCount += 1
          })

          if (tabByWindowCount > 1) {
            if (window.focused === true) {
              browser.menus.remove(this.splitCurrentId)
              browser.menus.create({
                id: this.splitCurrentId,
                title: 'Split tabs in current window',
                contexts: ['all', 'tab'],
                parentId: this.managerId
              })
            }
            if (this.windows.length > 1) {
              browser.menus.remove(this.splitAllId)
              browser.menus.create({
                id: this.splitAllId,
                title: 'Split tabs in all windows',
                contexts: ['all', 'tab'],
                parentId: this.managerId
              })
            }
          }
        })
      },
      (error) => {
        return console.error(error)
      }
    )
  }

  async calculateMergeMenu() {
    browser.menus.remove(this.mergeId)
    if (this.windows.length > 1) {
      browser.menus.create({
        id: this.mergeId,
        title: 'Merge windows',
        contexts: ['all', 'tab'],
        parentId: this.managerId
      })
    }
  }
}
