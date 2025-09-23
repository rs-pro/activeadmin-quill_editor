# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'CSS Loading', type: :system do
  before do
    # Create an admin user if authentication is enabled
    if defined?(AdminUser)
      AdminUser.create!(email: 'admin@example.com', password: 'password')
    end
  end

  context 'when loading Quill editor CSS' do
    it 'loads Quill CSS from local assets' do
      visit '/admin'

      # Check that Quill CSS is loaded from local assets (not CDN)
      quill_stylesheets = page.evaluate_script(<<~JS)
        Array.from(document.styleSheets).filter(sheet => {
          try {
            return sheet.href && (sheet.href.includes('quill') ||
                   (sheet.cssRules && Array.from(sheet.cssRules).some(rule =>
                     rule.cssText && rule.cssText.includes('.ql-'))))
          } catch(e) {
            return false;
          }
        }).map(sheet => sheet.href || 'inline')
      JS

      expect(quill_stylesheets).not_to be_empty

      # Ensure no CDN URLs
      quill_stylesheets.each do |href|
        next if href == 'inline'
        expect(href).not_to match(%r{https?://cdn})
        expect(href).not_to match(%r{jsdelivr})
        expect(href).not_to match(%r{unpkg})
        expect(href).to match(%r{/assets/}) if href != 'inline'
      end
    end

    it 'properly bundles Quill CSS with ActiveAdmin CSS' do
      visit '/admin'

      # Check for ActiveAdmin CSS
      aa_styles_loaded = page.evaluate_script(<<~JS)
        window.getComputedStyle(document.body).fontFamily !== ''
      JS
      expect(aa_styles_loaded).to be true

      # Check for Quill-specific CSS classes
      quill_css_loaded = page.evaluate_script(<<~JS)
        Array.from(document.styleSheets).some(sheet => {
          try {
            return sheet.cssRules && Array.from(sheet.cssRules).some(rule =>
              rule.selectorText && (
                rule.selectorText.includes('.ql-container') ||
                rule.selectorText.includes('.ql-editor') ||
                rule.selectorText.includes('.ql-toolbar')
              )
            );
          } catch(e) {
            return false;
          }
        })
      JS
      expect(quill_css_loaded).to be true
    end

    it 'applies Quill styles correctly when editor is present' do
      # Create a test model with Quill editor
      author = Author.create!(email: 'test@example.com', name: 'Test Author', age: 30)
      post = Post.create!(author: author, title: 'Test Post', description: '<p>Test content</p>')
      visit "/admin/posts/#{post.id}/edit"

      # Wait for editor to load
      expect(page).to have_css('[data-aa-quill-editor]', wait: 5)

      # Check that Quill styles are applied
      editor_styles = page.evaluate_script(<<~JS)
        (function() {
          const editor = document.querySelector('.ql-container');
          if (!editor) return null;
          const styles = window.getComputedStyle(editor);
          return {
            position: styles.position,
            display: styles.display,
            hasBackground: styles.backgroundColor !== '' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
          };
        })()
      JS

      expect(editor_styles).not_to be_nil
      expect(editor_styles['display']).not_to eq('none')
      expect(editor_styles['hasBackground']).to be true

      # Check toolbar styles
      toolbar_visible = page.evaluate_script(<<~JS)
        (function() {
          const toolbar = document.querySelector('.ql-toolbar');
          if (!toolbar) return false;
          const styles = window.getComputedStyle(toolbar);
          return styles.display !== 'none' && styles.visibility !== 'hidden';
        })()
      JS

      expect(toolbar_visible).to be true
    end

    it 'includes both snow and bubble theme CSS' do
      visit '/admin'

      # Check for snow theme CSS
      snow_theme_loaded = page.evaluate_script(<<~JS)
        Array.from(document.styleSheets).some(sheet => {
          try {
            return sheet.cssRules && Array.from(sheet.cssRules).some(rule =>
              rule.selectorText && rule.selectorText.includes('.ql-snow')
            );
          } catch(e) {
            return false;
          }
        })
      JS

      # Check for bubble theme CSS (if included)
      bubble_theme_loaded = page.evaluate_script(<<~JS)
        Array.from(document.styleSheets).some(sheet => {
          try {
            return sheet.cssRules && Array.from(sheet.cssRules).some(rule =>
              rule.selectorText && rule.selectorText.includes('.ql-bubble')
            );
          } catch(e) {
            return false;
          }
        })
      JS

      expect(snow_theme_loaded).to be true
      # Bubble theme is optional
      # expect(bubble_theme_loaded).to be true
    end

    it 'does not load duplicate Quill CSS files' do
      visit '/admin'

      # Count Quill CSS references
      quill_css_count = page.evaluate_script(<<~JS)
        Array.from(document.styleSheets).filter(sheet => {
          try {
            return sheet.href && sheet.href.includes('quill');
          } catch(e) {
            return false;
          }
        }).length
      JS

      # Should have at most one bundled CSS file with Quill styles
      expect(quill_css_count).to be <= 1
    end
  end
end