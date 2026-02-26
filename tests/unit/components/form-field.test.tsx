/**
 * フォームフィールドコンポーネント 単体テスト
 * 既存実装へのテスト追加（ソースコード変更なし）
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  FormField,
  TextInput,
  TextArea,
  Select,
} from '@/components/form/FormField';

describe('フォームフィールドコンポーネント', () => {
  describe('FormField - フォームフィールドラッパー', () => {
    it('Given ラベルと子要素, When レンダリング, Then ラベルと子要素が表示される', () => {
      render(
        <FormField id="test" label="テストラベル">
          <input id="test" />
        </FormField>
      );

      expect(screen.getByText('テストラベル')).toBeInTheDocument();
      expect(screen.getByLabelText('テストラベル')).toBeInTheDocument();
    });

    it('Given required=true, When レンダリング, Then 必須マーク(*)が表示される', () => {
      render(
        <FormField id="test" label="名前" required>
          <input id="test" />
        </FormField>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('Given hintテキスト, When エラーなし, Then ヒントが表示される', () => {
      render(
        <FormField id="test" label="名前" hint="ヒントテキスト">
          <input id="test" />
        </FormField>
      );

      expect(screen.getByText('ヒントテキスト')).toBeInTheDocument();
    });

    it('Given errorメッセージ, When レンダリング, Then エラーが表示される', () => {
      render(
        <FormField id="test" label="名前" error="エラーメッセージ">
          <input id="test" />
        </FormField>
      );

      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
    });

    it('Given hintとerror両方指定, When レンダリング, Then errorが優先されhintは非表示', () => {
      render(
        <FormField id="test" label="名前" hint="ヒント" error="エラー">
          <input id="test" />
        </FormField>
      );

      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.queryByText('ヒント')).not.toBeInTheDocument();
    });
  });

  describe('TextInput - テキスト入力フィールド', () => {
    it('Given 基本props, When レンダリング, Then input要素がラベル付きで表示される', () => {
      render(<TextInput id="email" label="メール" />);

      const input = screen.getByLabelText('メール');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('Given error指定, When レンダリング, Then エラースタイル(border-red-500)が適用される', () => {
      render(<TextInput id="email" label="メール" error="必須です" />);

      const input = screen.getByLabelText('メール');
      expect(input.className).toContain('border-red-500');
    });

    it('Given error指定, When レンダリング, Then aria-invalidがtrueに設定される', () => {
      render(<TextInput id="email" label="メール" error="必須です" />);

      const input = screen.getByLabelText('メール');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('Given error指定, When レンダリング, Then aria-describedbyが設定される', () => {
      render(<TextInput id="email" label="メール" error="必須です" />);

      const input = screen.getByLabelText('メール');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('Given errorなし, When レンダリング, Then aria-invalidがfalseでdescribedbyなし', () => {
      render(<TextInput id="email" label="メール" />);

      const input = screen.getByLabelText('メール');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('Given HTML属性(placeholder等), When レンダリング, Then 属性がパススルーされる', () => {
      render(
        <TextInput
          id="email"
          label="メール"
          placeholder="入力してください"
          type="email"
          maxLength={100}
        />
      );

      const input = screen.getByLabelText('メール');
      expect(input).toHaveAttribute('placeholder', '入力してください');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('maxlength', '100');
    });

    it('Given errorなし, When レンダリング, Then 通常スタイル(border-base-900/20)が適用される', () => {
      render(<TextInput id="email" label="メール" />);

      const input = screen.getByLabelText('メール');
      expect(input.className).toContain('border-base-900/20');
      expect(input.className).not.toContain('border-red-500');
    });
  });

  describe('TextArea - テキストエリアフィールド', () => {
    it('Given デフォルトprops, When レンダリング, Then rows=4のtextareaが表示される', () => {
      render(<TextArea id="desc" label="説明" />);

      const textarea = screen.getByLabelText('説明');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('Given rows=8, When レンダリング, Then rows=8が適用される', () => {
      render(<TextArea id="desc" label="説明" rows={8} />);

      const textarea = screen.getByLabelText('説明');
      expect(textarea).toHaveAttribute('rows', '8');
    });

    it('Given error指定, When レンダリング, Then エラースタイルが適用される', () => {
      render(<TextArea id="desc" label="説明" error="入力必須" />);

      const textarea = screen.getByLabelText('説明');
      expect(textarea.className).toContain('border-red-500');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Select - セレクトフィールド', () => {
    const options = [
      { value: 'small', label: 'S' },
      { value: 'medium', label: 'M' },
      { value: 'large', label: 'L' },
    ];

    it('Given options配列, When レンダリング, Then 全optionが表示される', () => {
      render(<Select id="size" label="サイズ" options={options} />);

      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('Given placeholder指定, When レンダリング, Then disabledなplaceholder optionが表示される', () => {
      render(
        <Select
          id="size"
          label="サイズ"
          options={options}
          placeholder="選択してください"
        />
      );

      const placeholder = screen.getByText('選択してください');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveAttribute('disabled');
      expect(placeholder).toHaveAttribute('value', '');
    });

    it('Given error指定, When レンダリング, Then エラースタイルが適用される', () => {
      render(
        <Select id="size" label="サイズ" options={options} error="選択必須" />
      );

      const select = screen.getByLabelText('サイズ');
      expect(select.className).toContain('border-red-500');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('Given errorなし, When レンダリング, Then 通常スタイルが適用される', () => {
      render(<Select id="size" label="サイズ" options={options} />);

      const select = screen.getByLabelText('サイズ');
      expect(select.className).toContain('border-base-900/20');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });
  });
});
