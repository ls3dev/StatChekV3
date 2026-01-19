# StatCheck

Instantly find players and organize them into custom Cheks you can revisit anytime.

---

## Overview

How many times have you blanked mid-debate trying to recall your own "Top 10" list? Sports fans constantly create mental rankings but have nowhere to save them properly. StatCheck fixes this by providing a dedicated space to build and organize player lists that are always ready when you need them. Whether you're debating at a bar, in a group chat, or writing online, your curated takes on players, teams, and eras are just a tap away—transforming scattered opinions into organized, retrievable knowledge.

---

## Current Status

| | |
|---|---|
| **Version** | 1.0.0 (Pre-Release) |
| **Platform** | iOS, Android, Web |
| **Backend** | ✅ Live on Convex (cloud sync active) |
| **Domain** | ✅ Connected and ready |
| **Launch Target** | Thursday/Friday this week 🚀 |
| **Current Focus** | Final testing & deployment |

---

## Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| Player Search | Search bar with real-time player lookup |
| Player Cards | View player info, photo, team, position |
| Sports Reference Links | Quick access to Basketball Reference stats |
| Custom Links | Add your own links to player cards (3 free per player) |
| Custom Lists ("Cheks") | Create named lists (e.g., "Top 10 Centers All-Time") |
| Add Players to Lists | Add players from search or player card |
| Drag-to-Reorder | Long-press and drag players to reorder in lists |
| Swipe-to-Delete | Swipe left on players to remove from lists |
| Dark/Light Mode | System-aware theme with manual toggle |
| Recent Players | Quick access to recently viewed players (horizontal scroll) |
| **Cloud Sync** | ✅ **Real-time sync across devices via Convex** |
| **Anonymous Auth** | ✅ **No signup required - instant start** |
| **Offline-First** | ✅ **Works offline, syncs when back online** |
| **Sync Indicators** | ✅ **Visual feedback for sync status** |

### 🔨 In Progress

| Feature | Status |
|---------|--------|
| Better Auth Integration | Setting up for account upgrades |
| App Store screenshots | Pending |
| Onboarding flow | Pending |

### 📋 Roadmap

#### High Priority
- [x] **Backend Integration** - ✅ Cloud sync live with Convex + anonymous auth
- [ ] **Better Auth Setup** - Optional account upgrade from anonymous
- [ ] **All Historical Players** - Add complete NBA, NFL, MLB player databases
- [ ] **Onboarding** - First-time user walkthrough
- [ ] **App Store Screenshots** - Marketing assets for submission

#### Medium Priority
- [ ] Player stats display on cards
- [ ] Share lists with friends
- [ ] Export lists as image/text
- [ ] List descriptions and notes

#### Future Ideas
- [ ] Compare players side-by-side
- [ ] Community lists / trending lists
- [ ] Fantasy sports integration
- [ ] Push notifications for player news

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile framework |
| Expo | Development toolchain & build service |
| Expo Router | File-based navigation |
| React Native Reanimated | Animations & gestures |
| TypeScript | Type safety across the stack |

### Backend ✅ Live
| Technology | Purpose |
|------------|---------|
| Convex | Real-time database & cloud sync |
| Anonymous Auth | Device-based persistent sessions (no signup required) |
| Better Auth | Optional account upgrades (in progress) |
| Expo Secure Store | Secure device ID storage |

### Tools
| Tool | Purpose |
|------|---------|
| Figma | UI/UX design |
| GitHub | Version control |
| EAS | Expo build & submit service |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/ls3dev/statchekV3.git
cd statchekV3

# Install dependencies (monorepo)
npm install

# Set up environment variables
cd apps/mobile
cp .env.example .env
# Add your EXPO_PUBLIC_CONVEX_URL to .env

# Start development server
npm run dev
```

### Running on Device
- **iOS Simulator:** Press `i` in terminal
- **Android Emulator:** Press `a` in terminal
- **Physical Device:** Scan QR code with Expo Go app

---

## Project Structure

```
statchekV3/                    # Monorepo root
├── apps/
│   ├── mobile/                # React Native mobile app
│   │   ├── app/              # Expo Router screens
│   │   │   ├── (tabs)/       # Tab navigation
│   │   │   └── list/[id].tsx # List detail
│   │   ├── components/       # UI components
│   │   ├── context/          # React Context (Convex-powered)
│   │   ├── hooks/            # Custom hooks
│   │   ├── data/             # Static player data
│   │   └── types/            # TypeScript types
│   └── web/                  # Next.js web app (planned)
└── packages/
    └── convex/               # Convex backend (shared)
        └── convex/
            ├── schema.ts     # Database schema
            ├── userLists.ts  # List operations
            ├── playerLinks.ts # Link operations
            ├── recentPlayers.ts # Recent activity
            └── userSettings.ts  # User preferences
```

---

## Milestones

### Milestone 1: MVP ✅ Complete!
- [x] Core player search
- [x] Player cards with links
- [x] Custom lists with CRUD
- [x] Drag-to-reorder players
- [x] **Cloud backend with Convex**
- [x] **Real-time sync**
- [x] **Anonymous authentication**
- [x] **Offline-first architecture**
- [ ] App Store submission

### Milestone 2: Launch Week (Target: This Week! 🚀)
- [x] Domain connected
- [x] Backend live and tested
- [ ] Better Auth integration (optional upgrades)
- [ ] Final testing
- [ ] **Launch: Thursday or Friday**

### Milestone 3: Post-Launch (Q1 2025)
- [ ] All historical players (NBA, NFL, MLB)
- [ ] Onboarding flow
- [ ] App Store submission
- [ ] Marketing website
- [ ] Social sharing features

---

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)

---

## Contact

Built by [@ls3dev](https://github.com/ls3dev)
