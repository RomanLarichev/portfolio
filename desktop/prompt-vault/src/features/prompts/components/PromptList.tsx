// src/features/prompts/components/PromptList.tsx
import React from 'react';
import {
  Card,
  Empty,
  Tag,
  Button,
  Tooltip,
  Popconfirm,
  Typography,
  Checkbox,
  Skeleton,
  theme,
} from 'antd';
import {
  StarFilled,
  StarOutlined,
  CopyOutlined,
  DeleteOutlined,
  InboxOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { usePromptStore } from '../../../stores/prompt.store';
import type { PromptDTO } from '../../../shared/types/ipc';

const { Text, Paragraph } = Typography;

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PROMPT: { label: 'Prompt', color: 'blue' },
  MASTER_PROMPT: { label: 'Master', color: 'purple' },
  SYSTEM_PROMPT: { label: 'System', color: 'orange' },
  TEMPLATE: { label: 'Template', color: 'cyan' },
  INSTRUCTION: { label: 'Instruction', color: 'green' },
  SNIPPET: { label: 'Snippet', color: 'magenta' },
};

export const PromptList: React.FC = () => {
  const {
    prompts,
    selectedId,
    selectedIds,
    selectPrompt,
    toggleSelectPrompt,
    toggleFavorite,
    archivePrompt,
    restorePrompt,
    deletePermanently,
    filter,
    error,
    clearError,
    isLoading,
  } = usePromptStore();

  // 🔧 Получаем токены текущей темы (светлой или тёмной)
  const { token } = theme.useToken();

  const handleCopy = async (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(content);
  };

  // Логика "Выбрать все" для текущего фильтра
  const allSelected =
    prompts.length > 0 && prompts.every((p) => selectedIds.includes(p.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    const store = usePromptStore.getState();
    const currentVisibleIds = prompts.map((p) => p.id);
    if (allSelected) {
      // Снимаем выделение только с видимых промптов
      const newIds = store.selectedIds.filter(
        (id) => !currentVisibleIds.includes(id),
      );
      usePromptStore.setState({ selectedIds: newIds });
    } else {
      // Добавляем все видимые (с учётом уже выбранных из других фильтров)
      const merged = Array.from(
        new Set([...store.selectedIds, ...currentVisibleIds]),
      );
      usePromptStore.setState({ selectedIds: merged });
    }
  };

  // 🔧 STAGE 9: Ошибка — приоритет выше скелетона
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Empty
          description={
            <div>
              <div
                style={{
                  color: token.colorError,
                  fontWeight: 'bold',
                  marginBottom: 8,
                }}
              >
                {error}
              </div>
              <Button type="primary" onClick={clearError}>
                Попробовать снова
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // 🔧 STAGE 9: Skeleton loader — только при первой загрузке
  if (isLoading && prompts.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} size="small" styles={{ body: { padding: '12px 16px' } }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  // 🔧 STAGE 9: Пустое состояние
  if (prompts.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <Empty
          description={
            filter === 'archived'
              ? 'Архив пуст'
              : filter === 'favorites'
              ? 'Нет избранных промптов'
              : 'Пока нет промптов. Создайте первый!'
          }
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 🔧 Панель "Выбрать все" — фон из токена темы */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: token.colorBgLayout,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleSelectAll}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            {selectedIds.length > 0
              ? `Выбрано: ${selectedIds.length}`
              : 'Выбрать все'}
          </Text>
        </Checkbox>
        {selectedIds.length > 0 && (
          <Button
            type="link"
            size="small"
            onClick={() => usePromptStore.getState().clearSelection()}
          >
            Сбросить
          </Button>
        )}
      </div>

      {/* Список промптов */}
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
          overflow: 'auto',
        }}
      >
        {prompts.map((p) => (
          <PromptCard
            key={p.id}
            prompt={p}
            isSelectedEditor={p.id === selectedId}
            isSelectedExport={selectedIds.includes(p.id)}
            isArchivedView={filter === 'archived'}
            onSelect={() => selectPrompt(p.id)}
            onToggleSelect={() => toggleSelectPrompt(p.id)}
            onToggleFavorite={() => toggleFavorite(p.id)}
            onCopy={(e) => handleCopy(e, p.content)}
            onArchive={() => archivePrompt(p.id)}
            onRestore={() => restorePrompt(p.id)}
            onDelete={() => deletePermanently(p.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface PromptCardProps {
  prompt: PromptDTO;
  isSelectedEditor: boolean;
  isSelectedExport: boolean;
  isArchivedView: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onToggleFavorite: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

// 🔧 STAGE 9: React.memo для оптимизации ре-рендеров
const PromptCard = React.memo<PromptCardProps>(
  ({
    prompt,
    isSelectedEditor,
    isSelectedExport,
    isArchivedView,
    onSelect,
    onToggleSelect,
    onToggleFavorite,
    onCopy,
    onArchive,
    onRestore,
    onDelete,
  }) => {
    // 🔧 Токены темы для карточки
    const { token } = theme.useToken();

    const typeInfo = TYPE_LABELS[prompt.type] ?? {
      label: prompt.type,
      color: 'default',
    };
    const date = new Date(prompt.updatedAt).toLocaleDateString('ru-RU');

    return (
      <Card
        size="small"
        hoverable
        onClick={onSelect}
        style={{
          borderColor: isSelectedEditor
            ? token.colorPrimary
            : isSelectedExport
            ? token.colorSuccess
            : undefined,
          backgroundColor: isSelectedEditor
            ? token.colorPrimaryBg
            : isSelectedExport
            ? token.colorSuccessBg
            : undefined,
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 8 }}>
            {/* Чекбокс для множественного выбора */}
            <Checkbox
              checked={isSelectedExport}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ marginTop: 4 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Text strong style={{ fontSize: 14 }} ellipsis>
                  {prompt.title}
                </Text>
                <Tag color={typeInfo.color} style={{ margin: 0 }}>
                  {typeInfo.label}
                </Tag>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                {prompt.project && (
                  <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                    {prompt.project.name}
                  </Tag>
                )}
                {prompt.category && (
                  <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                    {prompt.category.name}
                  </Tag>
                )}
                {prompt.tags?.slice(0, 3).map((t: any) => (
                  <Tag key={t.id} style={{ margin: 0, fontSize: 11 }}>
                    #{t.name}
                  </Tag>
                ))}
                {prompt.tags && prompt.tags.length > 3 && (
                  <Tag style={{ margin: 0, fontSize: 11 }}>
                    +{prompt.tags.length - 3}
                  </Tag>
                )}
              </div>

              <Paragraph
                type="secondary"
                ellipsis={{ rows: 2 }}
                style={{ fontSize: 12, marginBottom: 4 }}
              >
                {prompt.content}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {date}
                {prompt.usageCount > 0 &&
                  ` · использован ${prompt.usageCount} раз`}
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {!isArchivedView && (
              <>
                <Tooltip
                  title={
                    prompt.isFavorite ? 'Убрать из избранного' : 'В избранное'
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      prompt.isFavorite ? (
                        <StarFilled style={{ color: '#faad14' }} />
                      ) : (
                        <StarOutlined />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                  />
                </Tooltip>
                <Tooltip title="Копировать">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={onCopy}
                  />
                </Tooltip>
                <Tooltip title="В архив">
                  <Button
                    type="text"
                    size="small"
                    icon={<InboxOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive();
                    }}
                  />
                </Tooltip>
              </>
            )}
            {isArchivedView && (
              <>
                <Tooltip title="Восстановить">
                  <Button
                    type="text"
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore();
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title="Удалить навсегда?"
                  description="Это действие нельзя отменить. Все версии будут удалены."
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    onDelete();
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="Удалить"
                  cancelText="Отмена"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="Удалить навсегда">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                </Popconfirm>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  },
);

PromptCard.displayName = 'PromptCard';