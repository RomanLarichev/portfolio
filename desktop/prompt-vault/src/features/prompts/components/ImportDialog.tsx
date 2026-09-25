// src/features/prompts/components/ImportDialog.tsx
import React, { useState } from 'react';
import { Modal, Button, Typography, Listy, Tag, Alert, Space, App, Spin } from 'antd';
import { FileAddOutlined, CheckCircleOutlined, FileMarkdownOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ImportPreviewResult } from '../../../shared/types/ipc';

const { Text, Paragraph } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

// Объединённый элемент preview с указанием файла-источника
interface UnifiedPreviewItem {
  fileName: string;
  format: 'markdown' | 'json';
  item: ImportPreviewResult['items'][number];
}

export const ImportDialog: React.FC<Props> = ({ open, onClose, onImported }) => {
  const { message } = App.useApp();
  const [step, setStep] = useState<'select' | 'preview' | 'committing'>('select');
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ path: string; result: ImportPreviewResult }[]>([]);
  const [loading, setLoading] = useState(false);

  // Получаем массив путей и делаем preview для каждого файла
  const handleSelectFiles = async () => {
    const paths = await window.importExportAPI.selectFile();
    if (!paths || paths.length === 0) return;

    setFilePaths(paths);
    setLoading(true);

    try {
      // Параллельно получаем preview для всех выбранных файлов
      const results = await Promise.all(
        paths.map(async (p) => {
          try {
            const result = await window.importExportAPI.importPreview(p);
            return { path: p, result };
          } catch (e: any) {
            return {
              path: p,
              result: {
                format: 'markdown',
                items: [],
                errors: [`Ошибка чтения: ${e.message}`],
              },
            };
          }
        })
      );
      setPreviews(results);
      setStep('preview');
    } catch (e: any) {
      message.error('Ошибка чтения файлов: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Импортируем все файлы последовательно, суммируем результаты
  const handleCommit = async () => {
    if (filePaths.length === 0) return;
    setStep('committing');

    let totalImported = 0;
    const allErrors: string[] = [];

    try {
      for (const path of filePaths) {
        try {
          const result = await window.importExportAPI.importCommit(path);
          totalImported += result.imported;
          allErrors.push(...result.errors);
        } catch (e: any) {
          allErrors.push(`Ошибка файла ${path.split(/[/\\]/).pop()}: ${e.message}`);
        }
      }

      if (totalImported > 0) {
        message.success(`✅ Импортировано: ${totalImported} промпт(а/ов) из ${filePaths.length} файл(а/ов)`);
        onImported();
        handleClose();
      } else {
        message.warning('Ничего не импортировано');
      }

      if (allErrors.length > 0) {
        Modal.warning({
          title: 'Предупреждения при импорте',
          content: (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {allErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ),
        });
      }
    } catch (e: any) {
      message.error('Ошибка импорта: ' + e.message);
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('select');
    setFilePaths([]);
    setPreviews([]);
    onClose();
  };

  // Объединяем все items из всех файлов в один список
  const allItems: UnifiedPreviewItem[] = previews.flatMap(({ path, result }) =>
    result.items.map((item) => ({
      fileName: path.split(/[/\\]/).pop() || path,
      format: result.format,
      item,
    }))
  );

  const allErrors = previews.flatMap(({ path, result }) =>
    result.errors.map((e) => `${path.split(/[/\\]/).pop()}: ${e}`)
  );

  const totalFiles = filePaths.length;
  const totalPrompts = allItems.length;

  return (
    <Modal
      title="Импорт промптов"
      open={open}
      onCancel={handleClose}
      footer={
        step === 'select' ? [
          <Button key="cancel" onClick={handleClose}>Отмена</Button>,
          <Button key="select" type="primary" icon={<FileAddOutlined />} onClick={handleSelectFiles} loading={loading}>
            Выбрать файлы
          </Button>,
        ] : step === 'preview' ? [
          <Button key="back" onClick={() => setStep('select')}>Назад</Button>,
          <Button key="cancel" onClick={handleClose}>Отмена</Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleCommit}
            disabled={totalPrompts === 0 || allErrors.length > 0}
          >
            Импортировать ({totalPrompts})
          </Button>,
        ] : null
      }
      width={720}
    >
      {step === 'select' && (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <FileAddOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
          <div>
            <Text strong>Выберите файлы для импорта</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Поддерживаемые форматы: .md (Markdown), .json (бэкап PromptVault).<br />
              Можно выбрать несколько файлов одновременно (зажмите Ctrl или Shift).
            </Text>
          </div>
          <Alert
            title="Безопасный импорт"
            description="Все импортированные промпты будут созданы как новые. Существующие данные не будут перезаписаны."
            type="info"
            showIcon
            style={{ marginTop: 16, textAlign: 'left' }}
          />
        </div>
      )}

      {step === 'preview' && (
        <div>
          <Alert
            title={`Выбрано файлов: ${totalFiles} · Найдено промптов: ${totalPrompts}`}
            description={filePaths.map((p, i) => (
              <div key={i} style={{ fontSize: 12, color: '#595959' }}>
                • {p.split(/[/\\]/).pop()}
              </div>
            ))}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {allErrors.length > 0 && (
            <Alert
              title="Ошибки парсинга"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {allErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <Listy
              size="small"
              bordered
              dataSource={allItems}
              renderItem={(entry) => {
                const { fileName, format, item } = entry;
                return (
                  <Listy.Item>
                    <Listy.Item.Meta
                      avatar={
                        format === 'json'
                          ? <FileTextOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                          : <FileMarkdownOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      }
                      title={
                        <Space wrap>
                          <Text strong>{item.title}</Text>
                          <Tag color="blue">{item.type}</Tag>
                          <Tag style={{ fontSize: 10 }}>{fileName}</Tag>
                          {item.categoryName && <Tag color="green">{item.categoryName}</Tag>}
                          {item.projectName && <Tag>{item.projectName}</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2 }}
                            style={{ fontSize: 12, marginBottom: 4 }}
                          >
                            {item.contentPreview}
                          </Paragraph>
                          <Space size={4} wrap>
                            {item.tags.slice(0, 5).map((t) => (
                              <Tag key={t} style={{ fontSize: 10 }}>#{t}</Tag>
                            ))}
                            {item.versionsCount > 1 && (
                              <Tag style={{ fontSize: 10 }}>📜 {item.versionsCount} версий</Tag>
                            )}
                            <Tag color="green" style={{ fontSize: 10 }}>✨ будет создан как новый</Tag>
                          </Space>
                        </div>
                      }
                    />
                  </Listy.Item>
                );
              }}
            />
          </div>
        </div>
      )}

      {step === 'committing' && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Импортируем {totalFiles} файл(а/ов)...</Text>
          </div>
        </div>
      )}
    </Modal>
  );
};