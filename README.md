# SQLiteNav

A premium, feature-rich SQLite database explorer and management studio built with React, Electron, and better-sqlite3.

## Features

- **Modern UI**: Sleek dark theme with glassmorphism and smooth animations.
- **Data Explorer**: High-performance table view with server-side sorting, filtering, and pagination.
- **Inline Editing**: Double-click cells to edit data in real-time.
- **Query Console**: Advanced SQL editor with Monaco, autocompletion, and multi-theme support.
- **Smart Columns**: Customizable column visibility and automatic primary key detection.
- **Row Actions**: Copy as JSON, delete with confirmation, and quick edit.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Framer Motion, Lucide Icons.
- **Editor**: Monaco Editor (via @monaco-editor/react).
- **Backend**: Electron, better-sqlite3.
- **Styling**: Vanilla CSS with modern variables and animations.

## Installation

For the latest stable version, visit the [Releases](https://github.com/oliver021/sqlite-navigator/releases) page and download the installer for your operating system:

- **Windows**: Download the `.exe` installer.
- **macOS**: Download the `.dmg` file.
- **Linux**: Download the `.AppImage` file.

> [!IMPORTANT]
> **Security Note**: As this application is not digitally signed with a commercial certificate, your OS may show a security warning.
> - **Windows**: Click "More info" and then "Run anyway".
> - **macOS**: Right-click the app and select "Open", or go to System Settings > Privacy & Security to allow the app.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open a SQLite database file and start exploring!
