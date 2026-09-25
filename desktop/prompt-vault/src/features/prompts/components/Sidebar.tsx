// src/features/prompts/components/Sidebar.tsx
import React, { useState } from 'react';
import { Menu, Badge, Typography, Button, Popconfirm, Divider, theme } from 'antd';
import {
  FileTextOutlined,
  StarOutlined,
  InboxOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  HistoryOutlined,
  ClearOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { usePromptStore } from '../../../stores/prompt.store';
import { ExportDialog } from './ExportDialog';
import { ImportDialog } from './ImportDialog';

const { Text } = Typography;

interface SidebarProps {
  onNewPrompt: () => void;
  onSettingsOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewPrompt, onSettingsOpen }) => {
  // 🔧 Токены темы — на верхнем уровне компонента (не внутри IIFE!)
  const { token } = theme.useToken();

  const {
    filter,
    setFilter,
    prompts,
    loadPrompts,
    selectedIds,
    // 🔧 STAGE 8
    recentPrompts,
    selectPrompt,
    clearRecentPrompts,
  } = usePromptStore();

  const activeCount = prompts.length;
  const isApiReady = typeof window !== 'undefined' && !!(window as any).promptAPI;

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div style={{ padding: '16px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>PromptVault</div>
        <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
          Личный менеджер промптов
        </div>

        {/* 🔧 Индикатор API — цвета из токенов темы */}
        <div
          style={{
            fontSize: 10,
            marginTop: 8,
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: isApiReady ? token.colorSuccessBg : token.colorErrorBg,
            color: isApiReady ? token.colorSuccess : token.colorError,
            fontWeight: 600,
            border: `1px solid ${isApiReady ? token.colorSuccessBorder : token.colorErrorBorder}`,
          }}
        >
          {isApiReady ? '✅ API подключено' : '❌ API не найдено'}
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[filter]}
        onClick={({ key }) => setFilter(key as any)}
        style={{ borderRight: 0, background: 'transparent' }}
        items={[
          {
            key: 'active',
            icon: <FileTextOutlined />,
            label: (
              <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                Все промпты{' '}
                <Badge count={activeCount} style={{ backgroundColor: token.colorPrimary }} />
              </span>
            ),
          },
          { key: 'favorites', icon: <StarOutlined />, label: 'Избранное' },
          { key: 'archived', icon: <InboxOutlined />, label: 'Архив' },
        ]}
      />

      {/* 🔧 STAGE 8: Блок "Недавние" */}
      {recentPrompts.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ padding: '0 16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                <HistoryOutlined /> Недавние
              </Text>
              <Popconfirm
                title="Очистить историю?"
                onConfirm={clearRecentPrompts}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  title="Очистить"
                />
              </Popconfirm>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {recentPrompts.slice(0, 8).map((item) => (
                <div
                  key={item.promptId}
                  onClick={() => selectPrompt(item.promptId)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = token.colorFillTertiary)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <Text ellipsis style={{ fontSize: 12 }}>
                    {item.title}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          onClick={onNewPrompt}
          disabled={!isApiReady}
          style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: isApiReady ? token.colorPrimary : token.colorBgContainerDisabled,
            color: isApiReady ? '#fff' : token.colorTextDisabled,
            border: 'none',
            borderRadius: 6,
            cursor: isApiReady ? 'pointer' : 'not-allowed',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <PlusOutlined /> Новый промпт
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setExportOpen(true)}
            disabled={!isApiReady}
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: token.colorBgContainer,
              color: token.colorPrimary,
              border: `1px solid ${token.colorPrimary}`,
              borderRadius: 6,
              cursor: isApiReady ? 'pointer' : 'not-allowed',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <ExportOutlined /> Экспорт
            {selectedIds.length > 0 && (
              <Badge
                count={selectedIds.length}
                style={{
                  backgroundColor: token.colorPrimary,
                  fontSize: 10,
                  marginLeft: 4,
                }}
              />
            )}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            disabled={!isApiReady}
            style={{
              flex: 1,
              padding: '6px 8px',
              backgroundColor: token.colorBgContainer,
              color: token.colorSuccess,
              border: `1px solid ${token.colorSuccess}`,
              borderRadius: 6,
              cursor: isApiReady ? 'pointer' : 'not-allowed',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <ImportOutlined /> Импорт
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            onClick={onSettingsOpen}
            disabled={!isApiReady}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: token.colorBgContainer,
              color: token.colorTextSecondary,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: 6,
              cursor: isApiReady ? 'pointer' : 'not-allowed',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <SettingOutlined /> Настройки
          </button>
        </div>

        {!isApiReady && (
          <div
            style={{
              fontSize: 11,
              color: token.colorError,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            Запустите через Electron
          </div>
        )}

        {/* 🔧 STAGE 8: подсказка по хоткеям */}
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: token.colorTextTertiary,
            textAlign: 'center',
          }}
        >
          <kbd>Ctrl+K</kbd> палитра · <kbd>Ctrl+/</kbd> помощь
        </div>
      </div>

      {/* Диалоговые окна экспорта и импорта */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        selectedIds={selectedIds}
      />
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={loadPrompts}
      />
    </div>
  );
};