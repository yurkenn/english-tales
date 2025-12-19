# English Tales 📚

Beautifully illustrated stories for English learners.

## 🚀 Modern Architecture
This app is built with a focus on performance, maintainability, and developer experience.

- **Framework:** Expo (React Native) with Expo Router (File-based routing)
- **Theming:** [react-native-unistyles](https://github.com/jpb06/react-native-unistyles) (Modern, type-safe, and high-performance)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Lightweight and modular store management)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest) (Declarative async data management)
- **CMS:** [Sanity.io](https://www.sanity.io/) (Headless CMS for rich story content)
- **Backend:** Firebase (Authentication and user data storage)

## 🌍 Localization
Fully prepared for multi-language support using `i18next`. Currently supporting:
- English (Primary)
- Turkish
- Spanish
- German
- French

## 🛠️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file with your Firebase and Sanity credentials.

3. **Run the app:**
   ```bash
   npm run ios     # Run on iOS Simulator
   npm run android # Run on Android Emulator
   ```

## 🧪 Testing
Includes Unit and Component testing infrastructure.
```bash
npm test
```

## 📖 Architecture
Detailed architecture overview is available in [ARCHITECTURE.md](./ARCHITECTURE.md).
