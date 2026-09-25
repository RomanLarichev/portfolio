// src/features/prompts/components/SettingsModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Switch, InputNumber, Typography, Divider, App } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { AppSettings } from '../../../application/services/settings.service';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<Props> = ({ open, onClose, onSettingsChange }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      window.settingsAPI.get().then((settings) => {
        form.setFieldsValue(settings);
      });
    }
  }, [open, form]);

  const handleOk = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const updated = await window.settingsAPI.update(values);
      onSettingsChange(updated);
      message.success('Настройки сохранены');
      onClose();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('Ошибка сохранения: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8 }} />
          Настройки
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={loading}
      width={560}
    >
      <Form form={form} layout="vertical" initialValues={{}}>
        <Divider titlePlacement="left">Внешний вид</Divider>

        <Form.Item name="theme" label="Тема">
          <Select
            options={[
              { value: 'light', label: '☀️ Светлая' },
              { value: 'dark', label: '🌙 Темная' },
              { value: 'system', label: '💻 Системная' },
            ]}
          />
        </Form.Item>

        <Divider titlePlacement="left">Редактор</Divider>

        <Form.Item name="autosaveEnabled" label="Автосохранение" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item
          name="autosaveDelayMs"
          label="Задержка автосохранения (мс)"
          rules={[{ type: 'number', min: 500, max: 10000 }]}
        >
          <InputNumber min={500} max={10000} step={500} style={{ width: '100%' }} />
        </Form.Item>

        <Divider titlePlacement="left">Безопасность</Divider>

        <Form.Item
          name="confirmBeforeDelete"
          label="Подтверждать удаление промптов"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider titlePlacement="left">Язык</Divider>

        <Form.Item name="language" label="Язык интерфейса">
          <Select
            options={[
              { value: 'ru', label: '🇷🇺 Русский' },
              { value: 'en', label: '🇬🇧 English' },
            ]}
          />
        </Form.Item>

        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 Настройки сохраняются локально в базе данных и применяются сразу после сохранения.
        </Text>
      </Form>
    </Modal>
  );
};