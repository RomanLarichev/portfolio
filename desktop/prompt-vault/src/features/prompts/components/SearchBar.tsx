// src/features/prompts/components/SearchBar.tsx
import React from 'react';
import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { usePromptStore } from '../../../stores/prompt.store';

export const SearchBar: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    sortBy, 
    sortOrder, 
    setSort, 
    projects, 
    categories, 
    setProjectFilter, 
    setCategoryFilter, 
    activeProjectId, 
    activeCategoryId 
  } = usePromptStore();

  return (
    <div style={{ 
      padding: '12px 16px', 
      borderBottom: '1px solid var(--ant-color-border-secondary)',
      backgroundColor: 'var(--ant-color-bg-container)' // 🔧 ИСПРАВЛЕНО: используем токен темы
    }}>
      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
        <Input
          placeholder="Поиск по названию или содержимому..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
        <Space wrap>
          <Select
            style={{ width: 150 }}
            placeholder="Проект"
            allowClear
            value={activeProjectId === 'none' ? undefined : activeProjectId}
            onChange={(val) => setProjectFilter(val || 'none')}
            options={[
              { label: 'Без проекта', value: 'none' },
              ...projects.map((p: any) => ({ label: p.name, value: p.id })),
            ]}
          />
          <Select
            style={{ width: 150 }}
            placeholder="Категория"
            allowClear
            value={activeCategoryId === 'none' ? undefined : activeCategoryId}
            onChange={(val) => setCategoryFilter(val || 'none')}
            options={[
              { label: 'Без категории', value: 'none' },
              ...categories.map((c: any) => ({ label: c.name, value: c.id })),
            ]}
          />
          <Select
            style={{ width: 180 }}
            value={`${sortBy}-${sortOrder}`}
            onChange={(val) => {
              const [by, order] = (val as string).split('-');
              setSort(by as any, order as 'asc' | 'desc');
            }}
            options={[
              { label: 'Сначала новые', value: 'updatedAt-desc' },
              { label: 'Сначала старые', value: 'updatedAt-asc' },
              { label: 'По названию (А-Я)', value: 'title-asc' },
              { label: 'По частоте использования', value: 'usageCount-desc' },
            ]}
          />
        </Space>
      </Space>
    </div>
  );
};