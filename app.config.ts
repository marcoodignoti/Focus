import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Focus',
    slug: 'Focus',
    scheme: 'com.marcoodignoti.focus',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
        image: './src/assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#111116'
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.marcoodignoti.focus'
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './src/assets/adaptive-icon.png',
            backgroundColor: '#111116'
        },
        package: 'com.marcoodignoti.focus',
        predictiveBackGestureEnabled: true
    },
    web: {
        favicon: './src/assets/favicon.png',
        bundler: 'metro'
    },
    
    plugins: [
        ['expo-router', { origin: false }],
        'expo-font',
        'expo-splash-screen',
        '@react-native-community/datetimepicker',
        [
            'expo-build-properties',
            {
                ios: {
                    useHermesV1: true,
                    buildReactNativeFromSource: true
                },
                android: {
                    useHermesV1: true,
                    buildReactNativeFromSource: true
                }
            }
        ]
    ],
    experiments: {
        typedRoutes: true,
        reactCompiler: true
    },
    extra: {
        eas: {
            projectId: 'ae2006b2-9409-4104-b563-2adaf1281420'
        }
    },
    updates: {
        url: 'https://u.expo.dev/ae2006b2-9409-4104-b563-2adaf1281420',
        enabled: true,
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
        enableBsdiffPatchSupport: true
    },
    runtimeVersion: {
        policy: 'appVersion'
    }
});
