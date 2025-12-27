# PurePlay - Safe Video Player for Kids

PurePlay is a secure, child-friendly web application designed to provide a distraction-free and safe video viewing experience. It allows parents to curate a list of YouTube videos associated with their account and strictly controls the playback environment to prevent navigation to external content, algorithm recommendations, or inappropriate suggestions.

![PurePlay Logo](/logo.png)

## 🌟 Key Features

### 🛡️ Child-Safe Player
*   **Fortress Mode**: A custom-built player (`SafeVideoPlayer`) wraps the YouTube iframe.
    *   **Clicks Blocked**: Transparent overlay prevents all direct interaction with the YouTube interface (no clicking channel name, title, or "Watch on YouTube").
    *   **Algorithm Shield**: End screens are intercepted to prevent "Up Next" auto-play of unapproved content.
    *   **Custom Controls**: Large, touch-friendly Play, Pause, Volume, Seek, and Fullscreen buttons managed by the app.
    *   **No Metadata**: Removes video titles, descriptions, and comments to keep focus purely on the content.

### 🔒 Strict Parental Controls
*   **Ephemeral Access**: Access to the Settings page is strictly controlled.
    *   **Zero Persistence**: Entering the password grants a **10-second** entry ticket. This ticket is consumed immediately upon loading the settings page.
    *   **Re-Verification**: Page refreshes, back-navigation, or new tabs ALWAYS require re-entering the password.
    *   **Guard Page**: Preventing accidental access by curious kids.

### 📱 Progressive Web App (PWA)
*   **Installable**: Can be added to the Home Screen on iOS and Android.
*   **Fullscreen Experience**: Launches in standalone mode without browser bars.
*   **Mobile Optimized**: Responsive design that prevents accidental zooming and maximizes video size (`viewport-fit=cover`).

### ⚡ Performance & Caching
*   **Smart Caching**: The video list (`GetAllYTV`) is cached on the server using Next.js Data Cache tags (`ytv-list`).
*   **Instant Updates**: Adding or deleting a video automatically invalidates the cache, ensuring the list is always fresh without manual reloads.

---

## 🛠️ Technology Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
*   **Icons**: Lucide React
*   **PWA**: `next-pwa`

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository_url>
    cd pureplay
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # Critical: Ensure PWA plugin is installed
    npm install next-pwa
    ```

3.  **Run Development Server**
    *   *Note: Because `next-pwa` relies on Webpack, you must use the `--webpack` flag in Next.js 16.*
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

4.  **Build for Production**
    ```bash
    npm run build
    npm start
    ```

---

## 📂 Project Structure

```
app/
├── api/                # Backend API Proxies (Auth, YTV)
│   ├── auth/           # Login, Password Reset, Guard Check
│   └── ytv/            # Video Management (Add, Delete, Get, Cache)
├── home/
│   ├── settings/       # Parental Control Panel
│   │   ├── guard/      # Password Protection Gate
│   │   └── page.tsx    # Manage Videos & Password
│   ├── showvideo/      # The Safe Player Page
│   └── page.tsx        # Main Video Grid
├── login/              # Initial App Login
└── layout.tsx          # Root Layout & PWA Metadata

components/
├── ui/                 # Reusable shadcn/ui components
└── ...

lib/
└── ytv-api.ts          # Cached Fetch Helpers
```

---

## 🔐 Security Details

### Access Token Logic
1.  User enters password at `/home/settings/guard`.
2.  Server verifies credentials (`POST /api/auth/check-password`).
3.  On success, a **Timestamp Token** is stored in `sessionStorage`.
    ```javascript
    sessionStorage.setItem("settings_temp_access", Date.now().toString())
    ```
4.  User is redirected to `/home/settings`.
5.  Settings page checks if `Token Time < 10 seconds ago`.
    *   **Yes**: Grant access.
    *   **No**: Redirect back to Guard.

This logic ensures that even if a child finds an open tab minutes later, or refreshes the page, they are locked out.

---

## 📱 Mobile features
*   **"almost-fullscreen"** layout for video playback.
*   **Maximize Button**: Triggers browser native fullscreen.
*   **Touch Targets**: Enlarged buttons for easier control.
