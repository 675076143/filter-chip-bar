import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'filter-chip-bar',
    brandUrl: 'https://github.com/675076143/filter-chip-bar',
    brandTarget: '_blank',

    appBg: '#ffffff',
    appContentBg: '#ffffff',
    appBorderColor: '#e4e4e7',
    appBorderRadius: 8,

    textColor: '#27272a',
    textInverseColor: '#fafafa',
    textMutedColor: '#71717a',

    barBg: '#fafafa',
    barSelectedColor: '#18181b',
    barTextColor: '#71717a',

    inputBg: '#ffffff',
    inputBorder: '#e4e4e7',
    inputTextColor: '#27272a',

    fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontCode: '"Fira Code", "JetBrains Mono", "SF Mono", Menlo, monospace',
  }),
});
