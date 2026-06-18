import type { Preview } from '@storybook/react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <ConfigProvider locale={zhCN}>
        <Story />
      </ConfigProvider>
    ),
  ],
};

export default preview;
