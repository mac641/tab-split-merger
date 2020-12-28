export class menuManager {
  constructor() {
    // Class attributes
    this.managerId = 'tabSplitMerger'
    this.helpId = 'help'
    this.thresholdId = 'configConfirmationThreshold'
    this.splitAllId = 'splitAllTabs'
    this.splitCurrentId = 'splitCurrentTabs'
    this.moveLeftId = 'moveLeft'
    this.moveRightId = 'moveRight'
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
    browser.tabs.onHighlighted.addListener(() => {
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
    browser.menus.remove(this.helpId)
    browser.menus.create({
      id: this.helpId,
      title: 'Help',
      contexts: ['all', 'tab'],
      parentId: this.managerId
    })
    browser.menus.remove('separator-1')
    browser.menus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['all', 'tab'],
      parentId: this.managerId
    })
    browser.menus.remove(this.thresholdId)
    browser.menus.create({
      id: this.thresholdId,
      title: 'Set max window threshold',
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
    browser.menus.remove('separator-2')
    browser.menus.create({
      id: 'separator-2',
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

  // Redirect to github docs
  async openHelp() {
    const currentWindow = await browser.windows.getCurrent()
    const currentTab = await browser.tabs
      .query({
        active: true,
        windowId: currentWindow.id
      })
      .then(
        (value) => value[0],
        (error) => console.error(error)
      )
    const url =
      'https://github.com/mac641/tab-split-merger/blob/master/README.md'
    browser.tabs.create({
      active: true,
      index: currentTab.index + 1,
      url: url,
      windowId: currentWindow.id
    })
  }

  async calculateTemporaryMenu() {
    await this.getCurrentWindows().then(
      (value) => (this.windows = value),
      (error) => console.error(error)
    )

    this.calculateSplitTabsMenu()
    this.calculateMoveMenu()
    this.calculateMergeMenu()
  }

  async calculateSplitTabsMenu() {
    browser.menus.remove(this.splitAllId)
    browser.menus.remove(this.splitCurrentId)

    // get all tabs and sort by window
    browser.tabs.query({}).then((tabs) => {
      this.windows.map((window) => {
        let tabByWindowCount = 0
        tabs.forEach((tab) => {
          if (tab.windowId === window.id) {
            tabByWindowCount += 1
          }
        })

        // check how many tabs exist and create split menu if there are at least 2
        if (tabByWindowCount > 1) {
          if (window.focused) {
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
    }),
      (error) => {
        return console.error(error)
      }
  }

  async calculateMoveMenu() {
    browser.menus.remove(this.moveLeftId)
    browser.menus.remove(this.moveRightId)

    // get clickedTab and create context menu options based on its result
    await browser.tabs
      .query({
        active: true,
        currentWindow: true
      })
      .then((value) => {
        const clickedTab = value[0]
        browser.tabs.query({ currentWindow: true }).then((tabs) => {
          // create move option for tabs to the left
          if (clickedTab.index > 0) {
            browser.menus.remove(this.moveLeftId)
            browser.menus.create({
              id: this.moveLeftId,
              title: 'Move all tabs located on the left',
              contexts: ['all', 'tab'],
              parentId: this.managerId
            })
          }

          // create move option for tabs to the right
          if (clickedTab.index < tabs.length - 1) {
            browser.menus.remove(this.moveRightId)
            browser.menus.create({
              id: this.moveRightId,
              title: 'Move all tabs located on the right',
              contexts: ['all', 'tab'],
              parentId: this.managerId
            })
          }
        })
      }),
      (error) => {
        return console.error(error)
      }
  }

  async calculateMergeMenu() {
    browser.menus.remove(this.mergeId)
    if (this.windows.length > 1) {
      browser.menus.remove(this.mergeId)
      browser.menus.create({
        id: this.mergeId,
        title: 'Merge windows',
        contexts: ['all', 'tab'],
        parentId: this.managerId
      })
    }
  }
}
