// src/features/prompts/components/HotkeyHelpModal.tsx
import React from 'react';
import { Modal, Typography, Table } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

interface HotkeyRow {
  key: string;
  action: string;
  category: string;
}

const HOTKEYS: HotkeyRow[] = [
  { key: 'Ctrl + K', action: 'Открыть палитру команд (быстрый поиск)', category: 'Навигация' },
  { key: 'Ctrl + N', action: 'Создать новый промпт', category: 'Навигация' },
  { key: 'Ctrl + /', action: 'Показать эту справку', category: 'Навигация' },
  { key: 'Ctrl + S', action: 'Сохранить текущий промпт', category: 'Редактор' },
  { key: 'Esc', action: 'Закрыть модальное окно / отменить', category: 'Общие' },
];

export const HotkeyHelpModal: React.FC<Props> = ({ open, onClose }) => {
  const columns = [
    {
      title: 'Сочетание',
      dataIndex: 'key',
      key: 'key',
      width: 180,
      render: (key: string) => (
        <code
          style={{
            backgroundColor: '#f5f5f5',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          {key}
        </code>
      ),
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 140,
    },
  ];

  // Группируем по категориям
  const groupedData = HOTKEYS.reduce((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push({ ...row, key: `${row.category}-${row.key}` });
    return acc;
  }, {} as Record<string, Array<HotkeyRow & { key: string }>>);

  return (
    <Modal
      title={
        <span>
          <QuestionCircleOutlined style={{ marginRight: 8 }} />
          Горячие клавиши
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        На macOS используйте <kbd>Cmd</kbd> вместо <kbd>Ctrl</kbd>.
      </Text>

      {Object.entries(groupedData).map(([category, rows]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 8 }}>
            {category}
          </Title>
          <Table
            dataSource={rows}
            columns={columns}
            rowKey="key"
            pagination={false}
            size="small"
          />
        </div>
      ))}
    </Modal>
  );
};