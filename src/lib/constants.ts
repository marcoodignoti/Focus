import { Ionicons } from '@expo/vector-icons';

export const CURATED_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
    'book', 'briefcase', 'fitness', 'barbell', 'library', 'code-slash',
    'laptop', 'moon', 'sunny', 'cafe', 'leaf', 'musical-notes',
    'pencil', 'brush', 'calculator', 'game-controller'
];

export const ICON_COLORS: Record<string, string> = {
    'book': '#0A84FF', // Blue
    'briefcase': '#00C7BE', // Mint
    'fitness': '#FF453A', // Red
    'barbell': '#FF9F0A', // Orange
    'library': '#BF5AF2', // Light Purple
    'code-slash': '#32ADE6', // Cyan
    'laptop': '#5E5CE6', // Indigo
    'moon': '#AF52DE', // Purple
    'sunny': '#FFD60A', // Yellow
    'cafe': '#8D6E63', // Brown
    'leaf': '#30D158', // Green
    'musical-notes': '#FF375F', // Pink
    'pencil': '#FFCC00', // Gold Yellow
    'brush': '#FF2D55', // Rose Pink
    'calculator': '#30B0C7', // Teal
    'game-controller': '#5856D6', // Deep Indigo
};

export const getIconColor = (iconName: string): string => {
    return ICON_COLORS[iconName] || '#FF453A';
};
