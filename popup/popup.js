// import { configManager } from '../background/configManager.js'
// import { menuManager } from '../background/menuManager.js'
// import { windowManager } from '../background/windowManager.js'

class popup {
  constructor() {
    this.adaptToTheme()
  }

  async adaptToTheme() {
    browser.theme.getCurrent().then(
      function (theme) {
        if (theme && theme.colors) {
          const colors = [
            `--color-background: ${theme.colors.popup}`,
            `--color-primary: ${theme.colors.popup_text}`
          ]
          document.body.setAttribute('style', colors.join(';'))
          console.log(theme.colors)
        }
      },
      (error) => console.error(error)
    )
  }
}

new popup()
