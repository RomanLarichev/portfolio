// src/App.tsx
import React, { useEffect, useState } from 'react';
import { ConfigProvider, Layout, App as AntApp, theme } from 'antd';
import { Sidebar } from './features/prompts/components/Sidebar';
import { PromptList } from './features/prompts/components/PromptList';
import { PromptEditor } from './features/prompts/components/PromptEditor';
import { CreatePromptModal } from './features/prompts/components/CreatePromptModal';
import { SearchBar } from './features/prompts/components/SearchBar';
import { CommandPalette } from './features/prompts/components/CommandPalette';
import { HotkeyHelpModal } from './features/prompts/components/HotkeyHelpModal';
import { SettingsModal } from './features/prompts/components/SettingsModal';
import { usePromptStore } from './stores/prompt.store';
import { useHotkeys } from './hooks/useHotkeys';
import type { AppSettings } from './shared/types/ipc';

const { Sider, Content } = Layout;

const App: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  const loadPrompts = usePromptStore((s) => s.loadPrompts);
  const loadReferences = usePromptStore((s) => s.loadReferences);
  const loadRecentPrompts = usePromptStore((s) => s.loadRecentPrompts);

  useEffect(() => {
    loadReferences();
    loadPrompts();
    loadRecentPrompts();

    if (window.settingsAPI) {
      window.settingsAPI.get().then((settings) => {
        setCurrentTheme(settings.theme);
      });
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const getThemeAlgorithm = () => {
    if (currentTheme === 'dark') return theme.darkAlgorithm;
    if (currentTheme === 'system') {
      return systemPrefersDark ? theme.darkAlgorithm : theme.defaultAlgorithm;
    }
    return theme.defaultAlgorithm;
  };

  const handleSettingsChange = (settings: AppSettings) => {
    setCurrentTheme(settings.theme);
  };

  useHotkeys([
    { key: 'k', ctrl: true, handler: () => setPaletteOpen(true), ignoreInInputs: false },
    { key: 'n', ctrl: true, handler: () => setCreateOpen(true), ignoreInInputs: false },
    { key: '/', ctrl: true, handler: () => setHelpOpen(true), ignoreInInputs: false },
    { key: ',', ctrl: true, handler: () => setSettingsOpen(true), ignoreInInputs: false },
  ]);

  return (
    <ConfigProvider
      theme={{
        algorithm: getThemeAlgorithm(),
        token: { borderRadius: 6 },
      }}
    >
      <AntApp>
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
          <Sider
            width={260}
            theme="light"
            style={{ borderRight: '1px solid var(--ant-color-border-secondary)', height: '100vh' }}
          >
            <Sidebar
              onNewPrompt={() => setCreateOpen(true)}
              onSettingsOpen={() => setSettingsOpen(true)}
            />
          </Sider>

          <Layout style={{ overflow: 'hidden' }}>
            {/* SearchBar: фон из токена темы */}
            <div
              style={{
                flexShrink: 0,
                borderBottom: '1px solid var(--ant-color-border-secondary)',
                backgroundColor: 'var(--ant-color-bg-container)',
              }}
            >
              <SearchBar />
            </div>

            <Content style={{ display: 'flex', overflow: 'hidden' }}>
              <div
                style={{
                  width: 380,
                  borderRight: '1px solid var(--ant-color-border-secondary)',
                  backgroundColor: 'var(--ant-color-bg-layout)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <PromptList />
              </div>

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: 'var(--ant-color-bg-container)',
                }}
              >
                <PromptEditor />
              </div>
            </Content>
          </Layout>
        </Layout>

        <CreatePromptModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <HotkeyHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSettingsChange={handleSettingsChange}
        />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;