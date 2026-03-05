# Best Practices React Native + Expo (SDK 55 - Febbraio 2026)
**Versione: 2026.02**  
**Stack ufficiale premium:** Expo SDK 55 + React Native 0.83 + React 19.2 + New Architecture (sempre attivo) + React Compiler

Queste best practices sono quelle seguite dalle app top-chart (retention >60%, bundle <30 MB, 60/120 FPS stabili).  
Obiettivo: codice pulito, performante, scalabile e manutenibile per sempre.

## 1. Stack Tecnologico Obbligatorio

| Area                  | Scelta Ufficiale 2026                          | Note |
|-----------------------|------------------------------------------------|------|
| **Expo**              | SDK 55 (RN 0.83 + React 19.2)                 | New Architecture sempre attivo |
| **Architettura**      | New Architecture (Fabric + TurboModules + JSI) | Legacy Architecture rimosso |
| **Compiler**          | React Compiler (v1.0 stabile)                  | Auto-memoizzazione |
| **JS Engine**         | Hermes v1 (opt-in)                             | `useHermesV1: true` + bytecode diffing |
| **Dev Workflow**      | Development Builds + EAS                       | Expo Go solo per demo |
| **Build & Deploy**    | EAS Build + Submit + Update + Workflows        | CI/CD nativo |

**Configurazione minima `app.config.ts` / `eas.json`**:
```ts
// app.config.ts
export default ({ config }) => ({
  ...config,
  expo: {
    plugins: [
      ['expo-build-properties', { 
        ios: { useHermesV1: true },
        android: { useHermesV1: true }
      }]
    ],
    updates: {
      enableBsdiffPatchSupport: true,
      runtimeVersion: { policy: "appVersion" }
    }
  }
});
```

## 2. Architettura Progetto (Feature-Sliced / Feature-First)

```
src/
├── app/                  # Expo Router (file-based routing)
├── features/             # Ogni feature è self-contained
│   └── auth/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── store/
│       ├── types/
│       └── ui/
├── components/           # UI condivisi (design system)
├── lib/                  # utils, api-client, config, constants
├── hooks/                # hooks globali
├── constants/
├── utils/
├── assets/
└── types/
```

## 3. Regole di Codice (React Compiler Mindset)

- **NON usare** `useMemo`, `useCallback`, `React.memo` di default.
- Calcola tutto direttamente nel corpo del componente (derived state).
- `useEffect` solo per:
  - Sottoscrizioni con cleanup (WebSocket, listeners, geolocation, focus/measure)
  - Codice imperativo puro
- Mai per fetching, sync stato o derivazioni.
- Usa sempre `useReducer` per logica complessa.
- `npx expo install` per ogni pacchetto.
- TypeScript strict mode + ESLint + Prettier + Husky.

**Regola d’oro**: “No code runs faster than no code”.

## 4. State & Data Management

- **Data fetching**: TanStack Query v5+ (obbligatorio per tutto)
- **Global state**: Zustand o Jotai (atomico)
- **Local state**: useReducer o derived state
- **Auth**: Clerk / Supabase / Firebase + TanStack Query
- **Offline**: Expo SQLite + TanStack Query o WatermelonDB

## 5. UI/UX & Design System

- **Styling**: NativeWind (Tailwind) + Gluestack-UI o Tamagui
- Dark mode nativo
- Accessibilità completa (`react-native-a11y`)
- Immagini: `expo-image` + ottimizzazione
- Liste: **FlashList**
- Animazioni: Reanimated 4 + Gesture Handler (worklets su UI thread)

## 6. Navigazione

- **Expo Router v7** (file-based, obbligatorio)
- Nested layouts, parallel routes, API routes
- Deep linking + universal links
- Gestione stato navigazione con Zustand/TanStack

## 7. Performance & Ottimizzazioni

- React Compiler sempre attivo
- Hermes v1 + OTA con 75% di update più piccoli
- Profiling: Flipper + React Profiler + Sentry + `react-native-performance`
- Evita JS thread blocking
- App size <30 MB target
- TTI <1.5s, FPS >58 su device medio

## 8. Testing, Qualità & Sicurezza

- Unit: Jest + @testing-library/react-native
- E2E: Maestro o Detox
- Error monitoring: Sentry (con source maps)
- Analytics: Amplitude / Mixpanel
- Sicurezza: `expo-secure-store`, Zod validation, rate limiting
- CI/CD: EAS Workflows

## 9. Deploy & Growth

- EAS Update con channels (development/preview/production)
- Update istantanei nel root `_layout.tsx`
- Push notifications trigger-based
- ASO ottimizzato
- Ratings post-valore


