# StatChek

Instantly find players and organize them into custom Cheks you can revisit anytime.

---

## Overview

How many times have you blanked mid-debate trying to recall your own "Top 10" list? Sports fans constantly create mental rankings but have nowhere to save them properly. StatChek fixes this by providing a dedicated space to build and organize player lists that are always ready when you need them. Whether you're debating at a bar, in a group chat, or writing online, your curated takes on players, teams, and eras are just a tap away—transforming scattered opinions into organized, retrievable knowledge.

---

## Current Status

| | |
|---|---|
| **Version** | 1.0.0 (Pre-Release) |
| **Platform** | iOS, Android |
| **Current Focus** | App Store submission prep |

---

## Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| Player Search | Search bar with real-time player lookup |
| Player Cards | View player info, photo, team, position |
| Sports Reference Links | Quick access to Basketball Reference stats |
| Custom Links | Add your own links to player cards |
| Custom Lists ("Cheks") | Create named lists (e.g., "Top 10 Centers All-Time") |
| Add Players to Lists | Add players from search or player card |
| Drag-to-Reorder | Long-press and drag players to reorder in lists |
| Swipe-to-Delete | Swipe left on players to remove from lists |
| Dark/Light Mode | System-aware theme with manual toggle |
| Recent Players | Quick access to recently viewed players |

### 🔨 In Progress

| Feature | Status |
|---------|--------|
| App Store screenshots | Pending |
| Onboarding flow | Pending |

### 📋 Roadmap

#### High Priority
- [ ] **Backend Integration** - User accounts, cloud sync (Supabase + Clerk)
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
| AsyncStorage | Local data persistence |

### Backend (Planned)
| Technology | Purpose |
|------------|---------|
| Supabase | Database & real-time sync |
| Clerk | User authentication |

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

# Install dependencies
npm install

# Start development server
npx expo start
```

### Running on Device
- **iOS Simulator:** Press `i` in terminal
- **Android Emulator:** Press `a` in terminal
- **Physical Device:** Scan QR code with Expo Go app

---

## Project Structure

```
statchekV3/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── lists.tsx      # Lists tab
│   │   └── profile.tsx    # Profile/settings
│   └── list/[id].tsx      # List detail screen
├── components/            # Reusable components
│   ├── player-card/       # Player card components
│   └── lists/             # List-related components
├── context/               # React Context providers
├── hooks/                 # Custom hooks
├── data/                  # Static data (players.json)
├── constants/             # Theme, design tokens
└── types/                 # TypeScript types
```

---

## Milestones

### Milestone 1: MVP (Target: Q1 2025)
- [x] Core player search
- [x] Player cards with links
- [x] Custom lists with CRUD
- [x] Drag-to-reorder players
- [ ] App Store submission

### Milestone 2: Beta (Target: Q2 2025)
- [ ] User authentication (Clerk)
- [ ] Cloud sync (Supabase)
- [ ] All historical players (NBA, NFL, MLB)
- [ ] Onboarding flow
- [ ] Beta testers

### Milestone 3: Launch (Target: Q3 2025)
- [ ] Public App Store release
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
