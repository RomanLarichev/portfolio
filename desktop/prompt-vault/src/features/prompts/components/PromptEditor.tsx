// src/features/prompts/components/PromptEditor.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Form, Input, Select, Button, Space, Typography, Divider, Tabs, App } from 'antd';
import {
  SaveOutlined,
  CopyOutlined,
  StarFilled,
  StarOutlined,
  CopyFilled,
  HistoryOutlined,
} from '@ant-design/icons';
import { usePromptStore } from '../../../stores/prompt.store';
import { renderPrompt } from '../utils/render';
import { VersionHistory } from '../../versions/components/VersionHistory';
import { VersionDiff } from '../../versions/components/VersionDiff';
import { MasterPromptEditor } from './MasterPromptEditor';
import { VariablesPanel } from './VariablesPanel';
import { useHotkeys } from '../../../hooks/useHotkeys';
import {
  parseVariables,
  substituteVariables,
  type ParsedVariable,
} from '../../../domain/services/variable.parser';

const { TextArea } = Input;
const { Title, Text } = Typography;

export const PromptEditor: React.FC = () => {
  // 🔧 ИСПРАВЛЕНО: Получаем message из контекста App
  const { message } = App.useApp();

  const { prompts, selectedId, updatePrompt, toggleFavorite, loadPrompts } = usePromptStore();
  const [form] = Form.useForm();
  const [topic, setTopic] = useState('');
  const [saving, setSaving] = useState(false);
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null);
  const [versionCount, setVersionCount] = useState(1);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const isDirty = usePromptStore((s) => s.isDirty);
  const setDirty = usePromptStore((s) => s.setDirty);
  const draftContent = usePromptStore((s) => s.draftContent);
  const setDraftContent = usePromptStore((s) => s.setDraftContent);
  const autosaveEnabled = usePromptStore((s) => s.autosaveEnabled);

  const selected = prompts.find((p) => p.id === selectedId) ?? null;

  const variables = useMemo<ParsedVariable[]>(() => {
    if (!selected) return [];
    return parseVariables(selected.content);
  }, [selected?.content]);

  useEffect(() => {
    if (selected) {
      form.setFieldsValue({
        title: selected.title,
        content: selected.content,
        type: selected.type,
        description: selected.description ?? '',
      });
      window.versionAPI
        .list(selected.id)
        .then((versions) => {
          setVersionCount(versions.length);
        })
        .catch(() => {
          setVersionCount(1);
        });
    } else {
      setVersionCount(1);
      setVariableValues({});
      setTopic('');
    }
  }, [selected?.id, form]);

  const rendered = useMemo(() => {
    if (!selected) return '';
    let result = renderPrompt(selected.content, topic);
    result = substituteVariables(result, variableValues);
    return result;
  }, [selected?.content, topic, variableValues]);

  useEffect(() => {
    if (!selected || !isDirty || !autosaveEnabled) return;
    const timeout = setTimeout(async () => {
      try {
        const values = form.getFieldsValue();
        await updatePrompt({
          id: selected.id,
          title: values.title,
          content: values.content,
          type: values.type,
          description: values.description || undefined,
        });
        console.log('[Autosave] Сохранено автоматически');
      } catch (e) {
        console.error('[Autosave] Ошибка:', e);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [draftContent, isDirty, autosaveEnabled, selected?.id]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updatePrompt({
        id: selected.id,
        title: values.title,
        content: values.content,
        type: values.type,
        description: values.description || undefined,
      });
      message.success('Сохранено (создана новая версия, если изменился контент)');
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(rendered);
    message.success('Скопировано с подставленными переменными');
    await window.promptAPI.bumpUsage(selected.id);
  };

  const handleDuplicate = async () => {
    if (!selected) return;
    try {
      const copy = await window.promptAPI.duplicate(selected.id);
      message.success(`Создана копия: ${copy.title}`);
      await loadPrompts();
    } catch (e: any) {
      message.error('Ошибка дублирования: ' + e.message);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!selected) return;
    try {
      await window.promptAPI.restoreVersion(selected.id, versionId);
      await loadPrompts();
    } catch (e: any) {
      message.error('Ошибка восстановления: ' + e.message);
    }
  };

  useHotkeys([
    {
      key: 's',
      ctrl: true,
      handler: () => {
        if (selected && isDirty) {
          handleSave();
        }
      },
      enabled: !!selected,
    },
  ]);

  if (!selected) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        Выберите промпт из списка или создайте новый
      </div>
    );
  }

  const handleFormChange = (_: any, allValues: any) => {
    const hasChanges =
      allValues.title !== selected.title ||
      allValues.content !== selected.content ||
      allValues.type !== selected.type ||
      (allValues.description || '') !== (selected.description || '');
    
    if (hasChanges !== isDirty) {
      setDirty(hasChanges);
    }
    if (hasChanges) {
      setDraftContent(allValues.content ?? '');
    }
  };

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'nowrap',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          <Title
            level={4}
            style={{
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {selected.title}
          </Title>
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
            (Версий: {versionCount})
          </Text>
          {isDirty && (
            <Text type="warning" style={{ fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
              ● несохранено
            </Text>
          )}
        </div>
        <Space style={{ flexShrink: 0 }}>
          <Button
            type="text"
            icon={selected.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={() => toggleFavorite(selected.id)}
          />
          <Button icon={<CopyFilled />} onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            Копировать готовый
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Сохранить
          </Button>
        </Space>
      </div>

      {variables.length > 0 && (
        <VariablesPanel variables={variables} onValuesChange={setVariableValues} />
      )}

      {selected.type === 'MASTER_PROMPT' ? (
        <MasterPromptEditor
          prompt={selected}
          onUpdate={async (patch) => {
            await updatePrompt({
              id: selected.id,
              content: (patch as any).sections ?? selected.content,
            } as any);
          }}
        />
      ) : (
        <Tabs
          defaultActiveKey="editor"
          style={{ height: 'calc(100% - 60px)' }}
          items={[
            {
              key: 'editor',
              label: <span><SaveOutlined /> Редактор</span>,
              children: (
                <div style={{ height: '100%', overflow: 'auto' }}>
                  <Form form={form} layout="vertical" onValuesChange={handleFormChange}>
                    <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Обязательно' }]}>
                      <Input placeholder="Название промпта" />
                    </Form.Item>
                    <Form.Item name="type" label="Тип" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { value: 'PROMPT', label: 'Prompt' },
                          { value: 'MASTER_PROMPT', label: 'Master Prompt' },
                          { value: 'SYSTEM_PROMPT', label: 'System Prompt' },
                          { value: 'TEMPLATE', label: 'Template' },
                          { value: 'INSTRUCTION', label: 'Instruction' },
                          { value: 'SNIPPET', label: 'Snippet' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="description" label="Описание">
                      <Input.TextArea rows={2} placeholder="Краткое описание" />
                    </Form.Item>
                    <Form.Item
                      name="content"
                      label="Текст промпта"
                      rules={[{ required: true, message: 'Обязательно' }]}
                      extra="Используйте [[тема]], [[]] или {{variable}} как переменные"
                    >
                      <TextArea
                        rows={12}
                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                        placeholder="Текст промпта..."
                      />
                    </Form.Item>
                  </Form>
                  <Divider />
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Тема для подстановки ([[тема]] / [[]]):</Text>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Введите тему — она заменит [[тема]] и [[]]"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Text strong>🔍 Готовый промпт (preview):</Text>
                    <pre
                      style={{
                        marginTop: 8,
                        padding: 12,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 6,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 300,
                        overflow: 'auto',
                      }}
                    >
                      {rendered}
                    </pre>
                  </div>
                </div>
              ),
            },
            {
              key: 'versions',
              label: <span><HistoryOutlined /> Версии ({versionCount})</span>,
              children: (
                <div style={{ height: '100%', overflow: 'auto' }}>
                  <VersionHistory
                    promptId={selected.id}
                    currentVersionNumber={versionCount}
                    onRestore={handleRestoreVersion}
                    onCompare={(versionId) => setDiffVersionId(versionId)}
                  />
                </div>
              ),
            },
          ]}
        />
      )}
      <VersionDiff
        open={!!diffVersionId}
        promptId={selected.id}
        versionId={diffVersionId}
        onClose={() => setDiffVersionId(null)}
      />
    </div>
  );
};