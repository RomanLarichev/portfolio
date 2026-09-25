// src/features/prompts/components/ExportDialog.tsx
import React, { useState } from 'react';
import { Modal, Radio, Checkbox, Button, Space, Typography, Alert, App } from 'antd';
import { FileMarkdownOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ExportFormat, ExportOptions } from '../../../shared/types/ipc';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  selectedIds: string[]; // Пустой массив = вся библиотека
}

export const ExportDialog: React.FC<Props> = ({ open, onClose, selectedIds }) => {
  const { message } = App.useApp();
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeVersions, setIncludeVersions] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [loading, setLoading] = useState(false);

  const isAllLibrary = selectedIds.length === 0;

  // Правильная грамматика
  const countText = isAllLibrary
    ? 'вся библиотека'
    : selectedIds.length === 1
    ? '1 промпт'
    : `${selectedIds.length} промпта`;

  const handleExport = async () => {
    setLoading(true);
    try {
      const options: ExportOptions = { format, includeVersions, includeTags };
      let result;

      if (isAllLibrary) {
        result = await window.importExportAPI.exportAll(options);
      } else if (selectedIds.length === 1) {
        result = await window.importExportAPI.exportSingle(selectedIds[0], options);
      } else {
        result = await window.importExportAPI.exportMultiple(selectedIds, options);
      }

      if (result) {
        message.success(`✅ Экспортировано: ${result.count} шт. → ${result.filename}`);
        onClose();
      } else {
        message.info('Экспорт отменён');
      }
    } catch (e: any) {
      message.error('Ошибка экспорта: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Экспорт промптов"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button key="export" type="primary" onClick={handleExport} loading={loading}>
          Экспортировать
        </Button>,
      ]}
      width={560}
    >
      <Alert
        title={`Будет экспортировано: ${countText}`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {!isAllLibrary && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 6,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Вы отметили галочками {selectedIds.length} промпт(а/ов) в списке. Чтобы
            экспортировать всю библиотеку, снимите все галочки.
          </Text>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Формат файла:
        </Text>
        <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
          <Space orientation="vertical">
            <Radio value="markdown">
              <Space>
                <FileMarkdownOutlined />
                <div>
                  <div>Markdown (.md)</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Совместимо с Obsidian, Notion, GitHub. Один файл на промпт.
                  </Text>
                </div>
              </Space>
            </Radio>
            <Radio value="json">
              <Space>
                <FileTextOutlined />
                <div>
                  <div>JSON (.json)</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Полный бэкап: все промпты, версии, теги в одном файле.
                  </Text>
                </div>
              </Space>
            </Radio>
          </Space>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Включить в экспорт:
        </Text>
        <Space orientation="vertical">
          <Checkbox
            checked={includeVersions}
            onChange={(e) => setIncludeVersions(e.target.checked)}
          >
            Историю версий
          </Checkbox>
          <Checkbox
            checked={includeTags}
            onChange={(e) => setIncludeTags(e.target.checked)}
          >
            Теги, проект и категорию
          </Checkbox>
        </Space>
      </div>
    </Modal>
  );
};