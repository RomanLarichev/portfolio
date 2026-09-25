// src/features/prompts/components/MasterPromptEditor.tsx
import React, { useState, useMemo } from 'react';
import {
  Form, Input, Select, Button, Space, Card, Typography, Divider,
  Segmented, message, Tag, Collapse,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, MenuOutlined, ArrowUpOutlined, ArrowDownOutlined,
  EditOutlined, EyeOutlined, ColumnWidthOutlined,
} from '@ant-design/icons';
import { MarkdownPreview } from './MarkdownPreview';
import {
  MasterSectionTypeSchema,
  MasterPromptStatusSchema,
  SECTION_TITLES,
  type MasterPromptSection,
  type MasterPromptSectionType,
} from '../../../domain/models/master-prompt';
import type { PromptDTO } from '../../../shared/types/ipc';
import { randomUUID } from '../../../utils/uuid'; // создадим ниже

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Panel } = Collapse;

interface Props {
  prompt: PromptDTO;
  onUpdate: (patch: Partial<PromptDTO>) => Promise<void>;
}

type ViewMode = 'edit' | 'preview' | 'split';

export const MasterPromptEditor: React.FC<Props> = ({ prompt, onUpdate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sections, setSections] = useState<MasterPromptSection[]>(() => {
    try {
      const parsed = prompt.sections ? JSON.parse(prompt.sections) : [];
      return parsed.length > 0 ? parsed : createDefaultSections();
    } catch {
      return createDefaultSections();
    }
  });

  const [stage, setStage] = useState<string>(prompt.stage ?? 'PLANNING');
  const [status, setStatus] = useState<string>((prompt as any).masterStatus ?? 'DRAFT');

  // Собираем всё содержимое секций в один markdown для preview
  const fullMarkdown = useMemo(() => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    return sorted
      .filter((s) => s.content.trim().length > 0)
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
  }, [sections]);

  // Word / char count
  const { wordCount, charCount } = useMemo(() => {
    const text = sections.map((s) => s.content).join(' ');
    return {
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      charCount: text.length,
    };
  }, [sections]);

  const handleSectionChange = (id: string, patch: Partial<MasterPromptSection>) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setSections(updated);
  };

  const handleAddSection = () => {
    const newSection: MasterPromptSection = {
      id: randomUUID(),
      type: 'CUSTOM',
      title: 'Новая секция',
      content: '',
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const reOrdered = sorted.map((s, i) => ({ ...s, order: i }));
    setSections(reOrdered);
  };

  const handleSave = async () => {
    try {
      await onUpdate({
        sections: JSON.stringify(sections),
        stage,
      } as any);
      message.success('Master Prompt сохранён (создана новая версия)');
    } catch (e: any) {
      message.error('Ошибка сохранения: ' + e.message);
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Панель метаданных */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Этап
            </Text>
            <Select
              style={{ width: 160 }}
              value={stage}
              onChange={setStage}
              options={[
                { value: 'PLANNING', label: '📋 Planning' },
                { value: 'DEVELOPMENT', label: '⚙️ Development' },
                { value: 'TESTING', label: '🧪 Testing' },
                { value: 'COMPLETED', label: '✅ Completed' },
              ]}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Статистика
            </Text>
            <Space size={4}>
              <Tag color="blue">{wordCount} слов</Tag>
              <Tag>{charCount} симв.</Tag>
              <Tag color="purple">{sections.length} секций</Tag>
            </Space>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              options={[
                { label: <span><EditOutlined /> Edit</span>, value: 'edit' },
                { label: <span><ColumnWidthOutlined /> Split</span>, value: 'split' },
                { label: <span><EyeOutlined /> Preview</span>, value: 'preview' },
              ]}
            />
          </div>
        </Space>
      </Card>

      {/* Основное содержимое */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden' }}>
        {/* Левая часть: редактор секций */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            style={{
              flex: viewMode === 'split' ? 1 : 1,
              overflow: 'auto',
              paddingRight: viewMode === 'split' ? 8 : 0,
              borderRight: viewMode === 'split' ? '1px solid #f0f0f0' : undefined,
            }}
          >
            <Collapse
              accordion={false}
              defaultActiveKey={sortedSections.map((s) => s.id)}
              items={sortedSections.map((section) => ({
                key: section.id,
                label: (
                  <Space>
                    <Tag color="purple">{SECTION_TITLES[section.type] ?? section.type}</Tag>
                    <Text strong>{section.title}</Text>
                    {section.content.length > 0 && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        ({section.content.length} симв.)
                      </Text>
                    )}
                  </Space>
                ),
                extra: (
                  <Space size={4} onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      onClick={() => handleMoveSection(section.id, 'up')}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      onClick={() => handleMoveSection(section.id, 'down')}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteSection(section.id)}
                    />
                  </Space>
                ),
                children: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Space>
                      <Select
                        style={{ width: 200 }}
                        value={section.type}
                        onChange={(v) =>
                          handleSectionChange(section.id, {
                            type: v as MasterPromptSectionType,
                            title: SECTION_TITLES[v as MasterPromptSectionType] ?? section.title,
                          })
                        }
                        options={MasterSectionTypeSchema.options.map((t) => ({
                          value: t,
                          label: SECTION_TITLES[t],
                        }))}
                      />
                      <Input
                        style={{ flex: 1 }}
                        value={section.title}
                        onChange={(e) => handleSectionChange(section.id, { title: e.target.value })}
                        placeholder="Заголовок секции"
                      />
                    </Space>
                    <TextArea
                      rows={8}
                      value={section.content}
                      onChange={(e) => handleSectionChange(section.id, { content: e.target.value })}
                      placeholder="Содержимое секции (поддерживается Markdown)"
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                ),
              }))}
            />

            <div style={{ marginTop: 12 }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddSection} block>
                Добавить секцию
              </Button>
            </div>

            <Divider />

            <Button type="primary" onClick={handleSave} block size="large">
              💾 Сохранить Master Prompt
            </Button>
          </div>
        )}

        {/* Правая часть: Markdown preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
            }}
          >
            <MarkdownPreview content={fullMarkdown} />
          </div>
        )}
      </div>
    </div>
  );
};

function createDefaultSections(): MasterPromptSection[] {
  const types: MasterPromptSectionType[] = [
    'ROLE', 'OBJECTIVE', 'CONTEXT', 'REQUIREMENTS', 'CONSTRAINTS', 'EXIT_CRITERIA',
  ];
  return types.map((type, idx) => ({
    id: randomUUID(),
    type,
    title: SECTION_TITLES[type],
    content: '',
    order: idx,
  }));
}