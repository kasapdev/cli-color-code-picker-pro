# CLI Color Code Picker Pro

Pick terminal ANSI colors and text styles visually, preview them in a mock terminal, and copy ready-to-use Bash and Node.js snippets.

> A visual reference and generator for ANSI/SGR escape codes. Click foreground/background swatches from the standard 16-color and full 256-color xterm palettes, toggle bold/italic/underline/blink/reverse, watch a live mock-terminal preview, and copy the exact escape sequence — as raw ANSI, a `bash` one-liner, or a Node.js `console.log`. Everything runs in your browser, offline.

## Overview

CLI Color Code Picker Pro is part of the **Web Utility Suite**. Backend and CLI-tooling work constantly involves coloring terminal output — logging, build scripts, status dashboards — but the actual SGR code numbers (`\x1b[1;38;5;208m`) are easy to forget and annoying to look up. This tool turns picking colors into clicking swatches, and hands you the exact snippet for the language/shell you're writing in.

## Features

- **Standard 16-color palette** — real ANSI/VGA foreground (30–37, 90–97) and background (40–47, 100–107) codes with correctly named colors.
- **Full 256-color palette** — the real xterm 256-color layout: 16 system colors, the 6×6×6 color cube (codes 16–231, computed from the actual `0,95,135,175,215,255` component levels), and the 24-step grayscale ramp (232–255). Apply to foreground or background via a toggle.
- **Text styles** — bold, dim, italic, underline, blink, reverse, all combinable with color selections using their real SGR codes (1, 2, 3, 4, 5, 7).
- **Live mock-terminal preview** — a dark, monospace terminal window renders a CSS approximation of your exact combination against editable preview text.
- **Three copyable output formats** — the raw `\x1b[...m` escape sequence, a ready-to-run `echo -e` Bash command, and a Node.js `console.log(...)` snippet, each generated from the same real SGR code list.
- **Auto-persist** — your last selection is saved to `localStorage` and restored on return.
- **Dark & light themes**, fully responsive down to 360px, accessible, and keyboard-driven.

## Installation

No dependencies, no build step.

```bash
git clone https://github.com/kasapdev/cli-color-code-picker-pro.git
cd cli-color-code-picker-pro
```

Then open `index.html` in any modern browser (double-click it, or `file://` it). That's it.

## Usage

1. Click a swatch in the **Foreground** or **Background** row to pick from the standard 16 colors, or use the **256-color palette** below (switch its target tab between Foreground/Background first).
2. Toggle any **Styles** you want — bold, dim, italic, underline, blink, reverse — they combine with your color choice.
3. Watch the **live preview** terminal update instantly; edit the preview text to test your own string.
4. Copy whichever output format you need — **Raw ANSI**, **Bash**, or **Node.js** — with its dedicated copy button.
5. Click **Reset** to clear everything back to defaults.

## Keyboard Shortcuts

| Action               | Shortcut     |
| -------------------- | ------------ |
| Reset selection      | <kbd>Ctrl/⌘</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> |
| Show shortcuts help  | <kbd>?</kbd> |
| Close dialog         | <kbd>Esc</kbd> |

## Screenshots

> _Screenshots coming soon._

## Roadmap

- [ ] 24-bit true color (`38;2;r;g;b`) picker with a full RGB/hex input
- [ ] Preset themes (Solarized, Dracula, One Dark) mapped onto the 256-color grid
- [ ] Python (`colorama`/raw) and Go (`fatih/color`) output snippets
- [ ] Export a small shell function / npm-style color helper file

## License

MIT Licensed. Part of the [Web Utility Suite](https://github.com/kasapdev).
