# frozen_string_literal: true

module JavaScriptHelper
  def ensure_quill_loaded
    # Wait for Quill to be available
    Timeout.timeout(10) do
      loop do
        quill_loaded = page.evaluate_script('typeof Quill !== "undefined"')
        break if quill_loaded
        sleep 0.1
      end
    end

    # Wait for initialization script to be loaded
    Timeout.timeout(10) do
      loop do
        init_loaded = page.evaluate_script(<<~JS)
          typeof getQuillEditors === 'function' &&
          typeof getQuillEditorByIndex === 'function' &&
          typeof getQuillEditorByElementId === 'function'
        JS
        break if init_loaded
        sleep 0.1
      end
    end
  rescue Timeout::Error
    raise 'Quill editor failed to load within timeout'
  end

  def wait_for_quill_editor(selector = '[data-aa-quill-editor]')
    expect(page).to have_css(selector, wait: 5)
    ensure_quill_loaded

    # Wait for the editor to be initialized
    page.evaluate_script(<<~JS)
      (function() {
        const editor = document.querySelector('#{selector}');
        if (!editor || !editor._quillEditor) return false;
        return true;
      })()
    JS
  end

  def get_quill_content(index = 0)
    page.evaluate_script("getQuillEditorByIndex(#{index})?.root.innerHTML")
  end

  def set_quill_content(content, index = 0)
    page.evaluate_script(<<~JS)
      (function() {
        const editor = getQuillEditorByIndex(#{index});
        if (editor) {
          editor.root.innerHTML = '#{content.gsub("'", "\\\\'")}';
          return true;
        }
        return false;
      })()
    JS
  end

  def format_quill_text(format, index = 0)
    page.evaluate_script(<<~JS)
      (function() {
        const editor = getQuillEditorByIndex(#{index});
        if (editor) {
          editor.selectAll();
          editor.format('#{format}', true);
          return true;
        }
        return false;
      })()
    JS
  end

  def insert_quill_text(text, index = 0)
    page.evaluate_script(<<~JS)
      (function() {
        const editor = getQuillEditorByIndex(#{index});
        if (editor) {
          const length = editor.getLength();
          editor.insertText(length - 1, '#{text.gsub("'", "\\\\'")}');
          return true;
        }
        return false;
      })()
    JS
  end

  def quill_editor_count
    page.evaluate_script('getQuillEditors().length')
  end

  def quill_has_content?(text, index = 0)
    content = get_quill_content(index)
    return false unless content
    content.include?(text)
  end

  def click_quill_toolbar_button(button_class, index = 0)
    page.evaluate_script(<<~JS)
      (function() {
        const editors = document.querySelectorAll('[data-aa-quill-editor]');
        if (editors[#{index}]) {
          const button = editors[#{index}].querySelector('.ql-toolbar .#{button_class}');
          if (button) {
            button.click();
            return true;
          }
        }
        return false;
      })()
    JS
  end
end

RSpec.configure do |config|
  config.include JavaScriptHelper, type: :system
end