import { configManager } from './configManager.js'
import { menuManager } from './menuManager.js'

class windowManager {
  constructor() {
    // Class attributes
    this.config = new configManager()
    this.menu = new menuManager()

    // call startup functions
    this.init()
  }

  async init() {
    browser.menus.onClicked.addListener(async (info) => {
      switch (info.menuItemId) {
        case this.menu.helpId:
          this.menu.openHelp()
          break
        case this.menu.thresholdId:
          this.config.askForCurrentConfig()
          break
        case this.menu.repinId:
          let config = await this.config.getConfiguration().then(
            (value) => value,
            (error) => console.error(error)
          )
          config.repinTabs = false
          if (info.checked) {
            config.repinTabs = true
          }
          this.config.setConfiguration(config)
          break
        case this.menu.splitAllId:
          this.split(true)
          break
        case this.menu.splitCurrentId:
          this.split(false)
          break
        case this.menu.mergeId:
          this.merge()
          break
        case this.menu.moveLeftId:
          this.move('left')
          break
        case this.menu.moveRightId:
          this.move('right')
          break
        default:
          break
      }
    })

    browser.commands.onCommand.addListener(async (command) => {
      switch (command) {
        case this.menu.splitAllId:
          this.split(true)
          break
        case this.menu.splitCurrentId:
          this.split(false)
          break
        case this.menu.mergeId:
          this.merge()
          break
        case this.menu.moveLeftId:
          this.move('left')
          break
        case this.menu.moveRightId:
          this.move('right')
          break
        default:
          break
      }
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

  async split(all) {
    // ask for confirmation before splitting tabs into windows
    let isSplit = false
    await this.config.askForSplitPermission(all).then(
      (value) => (isSplit = value[0]),
      (error) => console.error(error)
    )

    if (!isSplit) {
      return
    }

    let windows = []
    if (all) {
      windows = await this.getCurrentWindows().then(
        (value) => value,
        (error) => console.error(error)
      )
    } else {
      windows.push(await browser.windows.getCurrent())
    }

    const config = await this.config.getConfiguration().then(
      (value) => value,
      (error) => console.error(error)
    )

    // For each window get all tabs, push pinned tabs into repin array after unpinning
    // and push newly created windows into createdWindowsPromises array
    let repin = []
    let lastActiveTab = null
    let createdWindowsPromises = []
    const promises = windows.map(async (windowObj) => {
      const tabs = await browser.tabs.query({
        windowId: windowObj.id
      })
      tabs.map((tab) => {
        if (tab.pinned) {
          repin.push(
            browser.tabs.update(tab.id, {
              pinned: false
            })
          )
        }
        if (windowObj.focused && tab.active) {
          lastActiveTab = tab
        }
        return tab.id
      })
      if (tabs.length < 2) {
        return
      }
      tabs.map(async (tab) => {
        createdWindowsPromises.push(
          browser.windows.create({
            tabId: tab.id
          })
        )
      })
    })

    // Solve all Promises and repin previously unpinned tabs
    await Promise.all(promises)
    const repinTabs = await Promise.all(repin)
    const createdWindows = await Promise.all(createdWindowsPromises)

    if (config.repinTabs) {
      this.afterRepin(repinTabs)
    }
    this.refocus(lastActiveTab, createdWindows)

    this.menu.calculateTemporaryMenu()
  }

  async merge() {
    const windows = await this.getCurrentWindows().then(
      (value) => value,
      (error) => console.error(error)
    )

    const config = await this.config.getConfiguration().then(
      (value) => value,
      (error) => console.error(error)
    )

    // For each window map tabs to window objects, unpin pinned tabs and push them into repin array
    const windowMap = new Map()
    let biggestCount = 0
    let biggest = null
    let repin = []
    let lastActiveTab = null
    const promises = windows.map(async (windowObj) => {
      const tabs = await browser.tabs.query({
        windowId: windowObj.id
      })
      windowMap.set(
        windowObj,
        tabs.map((tab) => {
          if (tab.pinned) {
            repin.push(browser.tabs.update(tab.id, { pinned: false }))
          }
          if (windowObj.focused && tab.active) {
            lastActiveTab = tab
          }
          return tab.id
        })
      )
      if (tabs.length > biggestCount) {
        biggest = windowObj
        biggestCount = tabs.length
      }
    })

    // Solve all Promises and repin previously unpinned tabs
    await Promise.all(promises)
    const repinTabs = await Promise.all(repin)
    windows.forEach(async (windowObj) => {
      if (windowObj === biggest) {
        return
      }
      browser.tabs.move(windowMap.get(windowObj), {
        index: -1,
        windowId: biggest.id
      })
    })

    if (config.repinTabs) {
      this.afterRepin(repinTabs)
    }

    this.refocus(lastActiveTab, biggest)

    this.menu.calculateTemporaryMenu()
  }

  // Move tabs on left / right into new window
  async move(direction) {
    direction = direction.toLowerCase()
    const currentWindow = await browser.windows.getCurrent()
    const tabs = await browser.tabs.query({
      windowId: currentWindow.id
    })
    const currentTab = await browser.tabs.query({
      active: true,
      currentWindow: true,
      windowId: currentWindow.id
    })
    let move = []
    let repin = []

    const config = await this.config.getConfiguration().then(
      (value) => value,
      (error) => console.error(error)
    )

    if (direction === 'left') {
      tabs.forEach((tab) => {
        if (tab.index <= currentTab[0].index) {
          if (tab.pinned === true) {
            repin.push(browser.tabs.update(tab.id, { pinned: false }))
          }
          move.push(tab.id)
        }
      })
      if (move.length > 0) {
        // Create new window and solve all promises
        let newWindow = await browser.windows.create().then(
          (window) => window,
          (error) => console.error(error)
        )
        const repinTabs = await Promise.all(repin)
        await browser.tabs.move(move, {
          windowId: newWindow.id,
          index: -1
        })
        browser.tabs.remove(newWindow.tabs[0].id)
        this.refocus(currentTab[0], newWindow)
        if (config.repinTabs) {
          this.afterRepin(repinTabs)
        }
      }
    } else if (direction === 'right') {
      tabs.forEach((tab) => {
        if (tab.index > currentTab[0].index) {
          if (tab.pinned === true) {
            repin.push(browser.tabs.update(tab.id, { pinned: false }))
          }
          move.push(tab.id)
        }
      })
      if (move.length > 0) {
        // Create new window and solve all promises
        let newWindow = await browser.windows.create().then(
          (window) => window,
          (error) => console.error(error)
        )
        const repinTabs = await Promise.all(repin)
        await browser.tabs.move(move, {
          windowId: newWindow.id,
          index: -1
        })
        browser.tabs.remove(newWindow.tabs[0].id)
        if (config.repinTabs) {
          this.afterRepin(repinTabs)
        }
      }
    }
  }

  // Repin previously pinned tabs
  async afterRepin(repinTabs) {
    repinTabs.forEach(async (tab) => {
      browser.tabs.update(tab.id, { pinned: true })
    })
  }

  // Refocus previously selected tab
  async refocus(lastActiveTab, windows) {
    if (!Array.isArray(windows)) {
      browser.tabs.update(lastActiveTab.id, { active: true })
      return
    }

    windows.forEach((window) => {
      const tabs = window.tabs
      tabs.forEach(async (tab) => {
        if (tab.id === lastActiveTab.id) {
          browser.windows.update(window.id, { focused: true })
          browser.tabs.update(lastActiveTab.id, { active: true })
        }
      })
    })
  }
}

new windowManager()
