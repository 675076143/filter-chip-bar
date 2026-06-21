import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'padded',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: 'hsl(240 10% 3.9%)' },
      ],
    },
  },
  globalTypes: {
    locale: {
      name: 'Language',
      description: 'Switch documentation language',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English', right: '🇬🇧' },
          { value: 'zh', title: '中文', right: '🇨🇳' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.backgrounds === 'dark';
      return (
        <div className={isDark ? 'dark' : ''} style={{ minHeight: '100%' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
