// src/features/versions/components/VersionDiff.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Typography, Tag, Space, Spin, Empty } from 'antd';
import type { DiffResult } from '../../../shared/types/ipc';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  promptId: string;
  versionId: string | null;
  onClose: () => void;
}

export const VersionDiff: React.FC<Props> = ({ open, promptId, versionId, onClose }) => {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !versionId) {
      setDiff(null);
      return;
    }

    const loadDiff = async () => {
      setLoading(true);
      try {
        // Получаем список версий, чтобы найти предыдущую
        const versions = await window.versionAPI.list(promptId);
        const currentIdx = versions.findIndex(v => v.id === versionId);
        
        // Сравниваем с предыдущей версией (если есть)
        const previousVersion = currentIdx < versions.length - 1 ? versions[currentIdx + 1] : null;
        
        const result = await window.versionAPI.diff(
          previousVersion?.id ?? null,
          versionId
        );
        setDiff(result);
      } catch (e: any) {
        console.error('Diff error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadDiff();
  }, [open, versionId, promptId]);

  const title = diff
    ? `Сравнение: v${diff.oldVersion.versionNumber} → v${diff.newVersion.versionNumber}`
    : 'Сравнение версий';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && !diff && (
        <Empty description="Нет данных для сравнения" />
      )}

      {!loading && diff && (
        <>
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fafafa', borderRadius: 6 }}>
            <Space wrap>
              <Tag color="green">+ {diff.stats.added} добавлено</Tag>
              <Tag color="red">- {diff.stats.removed} удалено</Tag>
              <Tag>{diff.stats.unchanged} без изменений</Tag>
            </Space>
          </div>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.6,
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {diff.lines.map((line, idx) => {
              let bgColor = 'transparent';
              let textColor = '#24292e';
              let prefix = ' ';

              if (line.type === 'added') {
                bgColor = '#e6ffed';
                textColor = '#22863a';
                prefix = '+';
              } else if (line.type === 'removed') {
                bgColor = '#ffeef0';
                textColor = '#cb2431';
                prefix = '-';
              }

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    padding: '0 12px',
                    display: 'flex',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <span style={{ width: 20, flexShrink: 0, userSelect: 'none', opacity: 0.5 }}>
                    {prefix}
                  </span>
                  <span style={{ flex: 1 }}>{line.content || ' '}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
};