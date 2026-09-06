# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.1] - 2026-09-06

### Fixed

- **Reset keyboard shortcut never fired in any major browser.** It was bound to `Ctrl/⌘+Shift+R`, which Chrome, Firefox, and Edge intercept at the browser level as the "hard reload" shortcut before the keydown event ever reaches page JavaScript — so `event.preventDefault()` in the app's shortcut handler had no chance to run, and pressing it just reloaded the page instead of resetting the selection. Rebound the shortcut to `Alt+Shift+R` in `js/app.js`, which isn't reserved by any major browser, while keeping the "R for Reset" mnemonic. The in-app shortcuts-help modal (`?`) updates automatically since it renders from the same shortcut list.
