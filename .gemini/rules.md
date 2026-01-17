# 🎯 English Tales - Antigravity Code Rules

> Bu kurallar her kod yazımında otomatik olarak uygulanır. Refactor sonradan değil, ilk yazımda yapılır.

---

## 🏗️ Mimari Kurallar

### Component Decomposition
- **Maksimum 300 satır**: Bir dosya 300 satırı aştığında otomatik olarak parçalanır (styling dahil)
- **Single Responsibility**: Her component, hook veya service tek bir iş yapar
- **Atomic Design**: `atoms → molecules → organisms → templates` hiyerarşisi takip edilir

### Dosya Organizasyonu
```
components/
├── atoms/           # Küçük, tekrar kullanılabilir parçalar
├── molecules/       # Atom kombinasyonları
│   └── [feature]/   # Feature bazlı gruplama
├── organisms/       # Kompleks UI blokları
hooks/
├── use[Feature].ts  # Feature bazlı custom hooks
├── index.ts         # Barrel exports
```

---

## 📝 TypeScript Kuralları

### Kesin Kurallar
- ❌ **`any` YASAK** - Her zaman explicit type kullan
- ✅ **Strict mode** aktif (`strictNullChecks`, `noImplicitAny`)
- ✅ **Interface over Type** - Props için interface tercih et
- ✅ **Named exports** - Default export yerine named export

### Import Patterns
```typescript
// ✅ Doğru
import { FC, memo, useState, useCallback } from 'react';
import { View, Text } from 'react-native';

// ❌ Yanlış
import React from 'react';
import * as RN from 'react-native';
```

### Props Tanımlama
```typescript
// ✅ Doğru
interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary';
}

// ❌ Yanlış
type ButtonProps = {
  label: any;
  onPress: Function;
}
```

---

## ⚛️ React Native Kuralları

### Functional Components
```typescript
// ✅ Doğru - Named export, explicit return type
export const MyComponent: FC<Props> = memo(({ title, onPress }) => {
  // hooks first
  const styles = useStyles();
  const [state, setState] = useState(false);
  
  // handlers with useCallback
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
});
```

### Hook Kullanım Sırası
1. `useStyles()` / `useTheme()`
2. `useState()`
3. `useRef()`
4. `useMemo()`
5. `useCallback()`
6. `useEffect()`

### Memoization
- **`memo()`**: Tüm pure component'lerde kullan
- **`useCallback()`**: Event handler'larda kullan
- **`useMemo()`**: Expensive computation'larda kullan

---

## 🎨 Styling Kuralları

### createStyles Pattern
```typescript
// ✅ Her zaman hoisted function declaration
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });
}

// Component içinde
const styles = useStyles(createStyles);
```

### Naming Conventions
- `container` - Ana wrapper
- `content` - İç content area
- `header`, `body`, `footer` - Bölümler
- `[element]Container` - Element wrapper'ları
- `[element]Text` - Text stilleri

---

## 📁 Kod Organizasyonu

### Barrel Exports (index.ts)
```typescript
// components/molecules/settings/index.ts
export { AccountSection } from './AccountSection';
export { PreferencesSection } from './PreferencesSection';
export { SubscriptionSection } from './SubscriptionSection';
```

### Logic Extraction
- UI logic → Custom hook (`use[Feature].ts`)
- Business logic → Service/Store
- Validation → Utils
- Constants → `constants/` folder

---

## 🔄 Refactoring Triggers

Kod yazılırken otomatik kontrol et:
1. **Dosya > 300 satır** → Decompose et
2. **3+ useState** → Custom hook'a çıkar
3. **Duplicate code** → Util/helper'a çıkar
4. **Nested ternaries** → Early return pattern
5. **Callback içinde callback** → Separate handlers

---

## 📋 Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Hooks: `use[Feature].ts`
- Utils: `camelCase.ts`
- Types: `[feature].types.ts`

### Variables & Functions
```typescript
// Handlers: handle[Action]
const handlePress = useCallback(() => {}, []);
const handleSubmit = useCallback(() => {}, []);

// Booleans: is/has/should prefix
const isLoading = true;
const hasError = false;
const shouldRefetch = true;

// Arrays: plural
const users = [];
const items = [];
```

---

## ✅ Pre-Commit Checklist

Her kod yazımında otomatik kontrol:
- [ ] TypeScript strict mode hataları yok
- [ ] `any` kullanımı yok
- [ ] Component < 300 satır (styling dahil)
- [ ] Props interface tanımlı
- [ ] Hooks sırası doğru
- [ ] `memo()` uygulandı
- [ ] Handlers `useCallback` ile wrap edildi
- [ ] Styles `createStyles` pattern kullanıyor
- [ ] Named exports kullanılıyor
- [ ] Import order düzgün

---

## 🚫 Anti-Patterns (YAPMA!)

```typescript
// ❌ Inline styles
<View style={{ flex: 1, padding: 10 }}>

// ❌ Anonymous functions in JSX
<Button onPress={() => doSomething()} />

// ❌ Magic numbers
<View style={{ marginTop: 16 }}>

// ❌ Nested ternaries
{condition1 ? (condition2 ? <A /> : <B />) : <C />}

// ❌ Index as key
{items.map((item, index) => <Item key={index} />)}
```

---

## ✨ Preferred Patterns

```typescript
// ✅ Theme-based spacing
<View style={styles.container}>

// ✅ Memoized handlers
<Button onPress={handlePress} />

// ✅ Early returns
if (isLoading) return <Loading />;
if (error) return <Error />;
return <Content />;

// ✅ Unique keys
{items.map((item) => <Item key={item.id} />)}
```

---

## 📱 Expo Spesifik Kurallar

### Expo SDK & APIs
- **Expo Router** kullan (navigation için)
- **expo-secure-store** hassas veriler için
- **expo-image** performanslı image loading
- **expo-constants** environment config için
- **expo-font** custom font loading

### Asset Management
```typescript
// ✅ Expo asset sistemi kullan
import { Image } from 'expo-image';

// ❌ React Native Image kullanma
import { Image } from 'react-native';
```

### Environment Variables
```typescript
// ✅ Expo Constants kullan
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig?.extra?.apiUrl;

// ❌ process.env direkt kullanma
const API_URL = process.env.API_URL;
```

---

## 🛡️ Safe Area Yönetimi

### Global SafeArea
```typescript
// ✅ Root'ta tek sefer configure et
<SafeAreaProvider>
  <App />
</SafeAreaProvider>

// Screen'lerde kullan
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top }}>
```

### Anti-Pattern
```typescript
// ❌ Her screen'de SafeAreaView wrap etme
<SafeAreaView>
  <SafeAreaView> // Nested!
    <Content />
  </SafeAreaView>
</SafeAreaView>
```

---

## 🧭 Navigation Kuralları

### Expo Router Patterns
```typescript
// ✅ Type-safe navigation
import { router } from 'expo-router';
router.push('/story/[id]', { id: storyId });

// ✅ Typed params
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams<{ id: string }>();
```

### Deep Linking
- Her route için `_layout.tsx` tanımla
- Param validation yap
- Loading states handle et

---

## 🌍 Internationalization (i18n)

### Her Zaman i18n Ready
```typescript
// ✅ Hardcoded string YASAK
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Text>{t('welcome.title')}</Text>

// ❌ Hardcoded
<Text>Welcome!</Text>
```

### Locale Format
```typescript
// ✅ Tarih/para formatı locale-aware
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
format(date, 'PP', { locale: tr });
```

---

## ⚡ Performance Optimization

### Image Optimization
```typescript
// ✅ expo-image ile optimizasyon
<Image
  source={{ uri }}
  contentFit="cover"
  placeholder={blurhash}
  transition={200}
/>
```

### List Performance
```typescript
// ✅ FlashList tercih et
import { FlashList } from '@shopify/flash-list';
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
/>

// ❌ FlatList büyük listeler için yavaş
```

### Render Optimization
- `memo()` ile gereksiz re-render engelle
- `useCallback` ile handler stabilize et
- `useMemo` ile expensive computation cache'le
- `InteractionManager.runAfterInteractions` kullan

---

## 🔒 Security Kuralları

### Sensitive Data
```typescript
// ✅ SecureStore kullan
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('token', authToken);

// ❌ AsyncStorage'da token tutma
await AsyncStorage.setItem('token', authToken);
```

### Input Validation
- User input her zaman sanitize et
- API response'ları validate et (zod/yup)
- Deep link params validate et

### Network Security
- HTTPS zorunlu
- Certificate pinning değerlendir
- Sensitive data log'lama YASAK

---

## 🚨 Error Handling

### Global Error Boundary
```typescript
// ✅ App root'ta ErrorBoundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Async Error Handling
```typescript
// ✅ try-catch + user feedback
try {
  await fetchData();
} catch (error) {
  Sentry.captureException(error);
  showToast(t('errors.fetchFailed'));
}

// ❌ Silent fail
fetchData().catch(() => {});
```

### Crash Reporting
- Sentry/Crashlytics aktif
- Error boundary'lerde report et
- User-facing error message'lar her zaman i18n



## 📊 State Management

### Zustand Patterns
```typescript
// ✅ Selector ile subscribe
const count = useStore((state) => state.count);

// ❌ Tüm store'u subscribe etme
const store = useStore();
```

### State Co-location
- Local state: `useState`
- Feature state: Context + useReducer
- Global state: Zustand
- Server state: React Query/SWR

---

## 🎯 Özet: Altın Kurallar

1. **İlk adımda clean code** - Sonradan refactor yok
2. **Type-safe her yerde** - `any` kullanma
3. **Memoize by default** - `memo`, `useCallback`, `useMemo`
4. **i18n ready** - Hardcoded string yok
5. **Performance first** - FlashList, expo-image kullan
6. **Security conscious** - SecureStore, validation
7. **Error handling** - User-friendly, logged, reported

---

> 💡 **Not**: Bu kurallar Antigravity tarafından her kod yazımında otomatik olarak uygulanır. Clean code, refactor sonrası değil ilk yazımda oluşturulur.
