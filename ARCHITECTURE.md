# Architecture & Design Patterns

## Folder Structure

```text
app/            # Expo Router file-based pages
  (auth)/       # Authentication flow
  (tabs)/       # Main navigation tabs
  reading/      # Reading experience pages
  story/        # Story detail pages
components/     # UI components (Atomic and Common)
  reading/      # Specialized reading components
  skeletons/    # Loading states
hooks/          # Custom shared logic and data fetching hooks
i18n/           # Localization files and config
services/       # External services (Firebase, Sanity, Storage)
store/          # Zustand state management
theme/          # Unistyles configuration and design tokens
utils/          # Helper functions (haptics, mapping, etc.)
```

## State Management (Zustand)
We use small, modular stores for specific features:
- `authStore`: User session and profile management.
- `themeStore`: UI theme switching logic.
- `downloadStore`: Offline content management.
- `progressStore`: User reading progress and statistics.

## Data Fetching (TanStack Query)
Centralized in `hooks/useQueries.ts`.
- Uses `queryKeys` object for consistent cache management.
- Implements `staleTime` and `gcTime` for efficient data invalidation.

## Theming (Unistyles)
The project uses `react-native-unistyles` for its styling system.
- **Design Tokens:** Defined in `theme/tokens.ts`.
- **Breakpoints:** Responsive layout support.
- **Runtime Styling:** Efficient theme switching without deep re-renders.

## Testing Strategy
- **Unit Tests:** Business logic, utils, and store actions.
- **Component Tests:** Focused on UI interactions and accessibility.
```
