// src/features/versions/components/VersionHistory.tsx
import React, { useEffect, useState } from 'react';
import { List, Button, Tag, Typography, Empty, Popconfirm, message, Space } from 'antd';
import { HistoryOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons';
import type { PromptVersionDTO } from '../../../shared/types/ipc';

const { Text } = Typography;

interface Props {
  promptId: string;
  currentVersionNumber: number;
  onRestore: (versionId: string) => Promise<void>;
  onCompare: (versionId: string) => void;
}

export const VersionHistory: React.FC<Props> = ({
  promptId,
  currentVersionNumber,
  onRestore,
  onCompare,
}) => {
  const [versions, setVersions] = useState<PromptVersionDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const list = await window.versionAPI.list(promptId);
      setVersions(list);
    } catch (e: any) {
      message.error('Ошибка загрузки версий: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [promptId]);

  const handleRestore = async (version: PromptVersionDTO) => {
    try {
      await onRestore(version.id);
      message.success(`Восстановлена версия v${version.versionNumber}`);
      await loadVersions();
    } catch (e: any) {
      message.error('Ошибка восстановления: ' + e.message);
    }
  };

  if (versions.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <Empty description="Нет истории версий" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <HistoryOutlined />
        <Text strong>История версий ({versions.length})</Text>
      </div>
      <List
        loading={loading}
        size="small"
        dataSource={versions}
        renderItem={(version) => {
          const isCurrent = version.versionNumber === currentVersionNumber;
          const date = new Date(version.createdAt).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <List.Item
              style={{
                padding: '8px 16px',
                backgroundColor: isCurrent ? '#e6f4ff' : undefined,
              }}
              actions={[
                <Button
                  key="view"
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onCompare(version.id)}
                >
                  Сравнить
                </Button>,
                !isCurrent && (
                  <Popconfirm
                    key="restore"
                    title={`Восстановить версию v${version.versionNumber}?`}
                    description="Будет создана новая версия на основе этой. Старые версии сохранятся."
                    onConfirm={() => handleRestore(version)}
                    okText="Восстановить"
                    cancelText="Отмена"
                  >
                    <Button type="text" size="small" icon={<RollbackOutlined />}>
                      Восстановить
                    </Button>
                  </Popconfirm>
                ),
              ].filter(Boolean) as React.ReactNode[]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={isCurrent ? 'blue' : 'default'}>v{version.versionNumber}</Tag>
                    {isCurrent && <Tag color="green">текущая</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ fontSize: 12, color: '#666' }}>{date}</div>
                    {version.changeNote && (
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {version.changeNote}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};