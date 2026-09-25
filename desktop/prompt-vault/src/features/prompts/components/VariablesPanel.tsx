// src/features/prompts/components/VariablesPanel.tsx
import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Space, Typography, Tag, AutoComplete, Tooltip, Divider } from 'antd';
import { BulbOutlined, ClearOutlined, HistoryOutlined } from '@ant-design/icons';
import { useVariablesStore } from '../../../stores/variables.store';
import type { ParsedVariable } from '../../../domain/services/variable.parser';

const { Text, Title } = Typography;

interface Props {
  variables: ParsedVariable[];
  onValuesChange: (values: Record<string, string>) => void;
}

export const VariablesPanel: React.FC<Props> = ({ variables, onValuesChange }) => {
  const { currentValues, setValue, clearValues, addToHistory, getHistory } = useVariablesStore();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // Инициализация значений из дефолтов
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    variables.forEach((v) => {
      initialValues[v.name] = currentValues[v.name] || v.defaultValue || '';
    });
    setLocalValues(initialValues);
    onValuesChange(initialValues);
  }, [variables]);

  const handleChange = (name: string, value: string) => {
    const newValues = { ...localValues, [name]: value };
    setLocalValues(newValues);
    setValue(name, value);
    onValuesChange(newValues);
  };

  const handleBlur = (name: string, value: string) => {
    if (value.trim()) {
      addToHistory(name, value);
    }
  };

  const handleClear = () => {
    const clearedValues: Record<string, string> = {};
    variables.forEach((v) => {
      clearedValues[v.name] = v.defaultValue || '';
    });
    setLocalValues(clearedValues);
    clearValues();
    onValuesChange(clearedValues);
  };

  const handleFillFromHistory = (name: string, value: string) => {
    handleChange(name, value);
  };

  if (variables.length === 0) {
    return null;
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <BulbOutlined style={{ color: '#faad14' }} />
          <span>Переменные ({variables.length})</span>
        </Space>
      }
      extra={
        <Tooltip title="Очистить все значения">
          <Button type="text" size="small" icon={<ClearOutlined />} onClick={handleClear} />
        </Tooltip>
      }
      style={{ marginBottom: 16 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {variables.map((variable) => {
          const history = getHistory(variable.name);
          
          return (
            <div key={variable.name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace' }}>
                  {`{{${variable.name}}}`}
                </Tag>
                {variable.description && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {variable.description}
                  </Text>
                )}
              </div>
              
              <AutoComplete
                style={{ width: '100%' }}
                value={localValues[variable.name] || ''}
                onChange={(value) => handleChange(variable.name, value)}
                onBlur={() => handleBlur(variable.name, localValues[variable.name] || '')}
                options={history.map((h) => ({ value: h, label: h }))}
                placeholder={variable.defaultValue ? `По умолчанию: ${variable.defaultValue}` : 'Введите значение'}
              >
                <Input
                  prefix={history.length > 0 ? <HistoryOutlined style={{ color: '#bfbfbf' }} /> : null}
                  suffix={
                    variable.defaultValue && !localValues[variable.name] ? (
                      <Tooltip title="Использовать значение по умолчанию">
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleChange(variable.name, variable.defaultValue!)}
                        >
                          Default
                        </Button>
                      </Tooltip>
                    ) : null
                  }
                />
              </AutoComplete>
            </div>
          );
        })}
      </div>

      <Divider style={{ margin: '12px 0' }} />
      
      <Text type="secondary" style={{ fontSize: 11 }}>
        💡 Значения автоматически подставляются при копировании промпта
      </Text>
    </Card>
  );
};