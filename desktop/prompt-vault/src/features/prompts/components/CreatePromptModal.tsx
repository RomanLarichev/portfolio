// src/features/prompts/components/CreatePromptModal.tsx
import React from 'react';
import { Modal, Form, Input, Select, App } from 'antd';
import { usePromptStore } from '../../../stores/prompt.store';

const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreatePromptModal: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const createPrompt = usePromptStore((s) => s.createPrompt);

  // 🔧 Получаем message из контекста App — предупреждение Ant Design исчезает
  const { message } = App.useApp();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await createPrompt({
        title: values.title,
        content: values.content,
        type: values.type,
        description: values.description || undefined,
      });
      message.success('Промпт создан');
      form.resetFields();
      onClose();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message ?? 'Ошибка создания');
    }
  };

  return (
    <Modal
      title="Новый промпт"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Создать"
      cancelText="Отмена"
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ type: 'PROMPT' }}>
        <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Обязательно' }]}>
          <Input placeholder="Например: Генератор тестов" />
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
        >
          <TextArea
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
            placeholder="Текст промпта. Используйте [[тема]] или [[]] для переменных."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};