# ActiveAdmin Quill Editor - Rails 8 & Propshaft Migration Guide

## Executive Summary

This document outlines the necessary changes to modernize the `activeadmin_quill_editor` gem for compatibility with:
- **Rails 8.x** with Propshaft asset pipeline
- **ActiveAdmin 4.x**
- **Ruby 3.3+**
- Modern JavaScript without jQuery dependencies

**Note**: This gem already has a full test application at `spec/dummy/` and comprehensive system tests. We'll update these existing resources rather than creating new ones from scratch.

## Key Changes Overview

### 1. Asset Pipeline Migration (Propshaft)

Propshaft automatically serves assets from `vendor/assets` and `app/assets` directories in gems. The key changes:

1. **Remove Sprockets directives** - No more `//= require` statements
2. **Place precompiled assets in vendor/assets** - Propshaft serves them directly
3. **Use ES6 modules** for JavaScript initialization
4. **No asset compilation** - Serve Quill.js directly as minified files

### 2. File Structure Changes

```
activeadmin_quill_editor/
├── vendor/assets/              # Static assets served by Propshaft
│   ├── javascripts/
│   │   └── quill.min.js        # Quill 2.x minified (no jQuery)
│   └── stylesheets/
│       ├── quill.snow.css      # Theme CSS
│       └── quill.bubble.css    # Alternative theme
├── app/assets/                  # Gem-specific code
│   ├── javascripts/
│   │   └── activeadmin_quill_editor.js  # ES6 initializer
│   └── stylesheets/
│       └── activeadmin_quill_editor.css # Custom styles
└── lib/
    ├── activeadmin/
    │   └── quill_editor/
    │       └── engine.rb        # Rails engine configuration
    └── formtastic/
        └── inputs/
            └── quill_editor_input.rb  # Form input class
```

## Detailed Implementation

### 3. JavaScript Modernization

Replace jQuery-dependent code with vanilla JavaScript:

```javascript
// app/assets/javascripts/activeadmin_quill_editor.js
(function() {
  'use strict';

  const defaultToolbar = [
    ['bold', 'italic', 'underline'],
    ['link', 'blockquote', 'code-block'],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'align': [] }, { list: 'ordered' }, { list: 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['image'],
    ['clean']
  ];

  function initQuillEditor(container) {
    if (!container || container.classList.contains('quill-editor--active')) {
      return;
    }

    const content = container.querySelector('[data-aa-quill-content]');
    if (!content) return;

    // Parse options from data attributes
    const options = JSON.parse(container.dataset.options || '{}');
    const theme = options.theme || 'snow';
    const modules = options.modules || { toolbar: defaultToolbar };

    // Initialize Quill
    const editor = new Quill(content, {
      theme: theme,
      modules: modules
    });

    // Store reference and mark as active
    container._quillEditor = editor;
    container.classList.add('quill-editor--active');

    // Handle form submission
    const form = container.closest('form.formtastic');
    if (form && !form._quillSubmitHandler) {
      form._quillSubmitHandler = true;
      form.addEventListener('submit', function(e) {
        updateQuillInputs(form);
      });
    }
  }

  function updateQuillInputs(form) {
    form.querySelectorAll('[data-aa-quill-editor]').forEach(container => {
      const editor = container._quillEditor;
      const input = container.querySelector('input[type="hidden"]');

      if (editor && input) {
        input.value = editor.root.innerHTML;
      }
    });
  }

  function initAllEditors() {
    document.querySelectorAll('[data-aa-quill-editor]').forEach(initQuillEditor);
  }

  // Initialize on various events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllEditors);
  } else {
    initAllEditors();
  }

  // Support for Turbo/Turbolinks
  document.addEventListener('turbo:load', initAllEditors);
  document.addEventListener('turbolinks:load', initAllEditors);

  // Support for ActiveAdmin has_many fields
  document.addEventListener('has_many_add:after', function(e) {
    e.detail?.container?.querySelectorAll('[data-aa-quill-editor]').forEach(initQuillEditor);
  });

  // Public API
  window.QuillEditorHelpers = {
    initEditor: initQuillEditor,
    initAll: initAllEditors,
    getEditor: (elementOrId) => {
      const element = typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;
      return element?._quillEditor;
    }
  };
})();
```

### 4. Updated Formtastic Input Class

```ruby
# lib/formtastic/inputs/quill_editor_input.rb
module Formtastic
  module Inputs
    class QuillEditorInput < Formtastic::Inputs::TextInput
      def to_html
        input_wrapping do
          label_html <<
            template.content_tag(:div, input_html_options) do
              builder.hidden_field(input_name) <<
                template.content_tag(:div, 'data-aa-quill-content': '1') do
                  object.send(method).try(:html_safe)
                end
            end
        end
      end

      def input_html_options
        super.tap do |options|
          options['data-aa-quill-editor'] = '1'
          # Merge any custom options
          if options[:data] && options[:data][:options]
            options['data-options'] = options[:data][:options].to_json
          end
        end
      end
    end
  end
end
```

### 5. Engine Configuration for Propshaft

```ruby
# lib/activeadmin/quill_editor/engine.rb
require 'active_admin'

module ActiveAdmin
  module QuillEditor
    class Engine < ::Rails::Engine
      engine_name 'activeadmin_quill_editor'

      # Propshaft automatically includes these paths
      # vendor/assets and app/assets are included by default

      initializer 'activeadmin_quill_editor.assets' do |app|
        # Ensure our assets are in the precompile list
        if defined?(Propshaft)
          app.config.assets.precompile += %w[
            activeadmin_quill_editor.js
            activeadmin_quill_editor.css
            quill.min.js
            quill.snow.css
            quill.bubble.css
          ]
        end
      end
    end
  end
end
```

## Test Application Setup (Using Existing spec/dummy)

### 6. Update Existing Test App

The gem already has a full Rails test application at `spec/dummy/`. We need to update it for Rails 8 and Propshaft:

```ruby
# spec/dummy/config/application.rb
require_relative 'boot'
require 'rails/all'

Bundler.require(*Rails.groups)

module Dummy
  class Application < Rails::Application
    config.load_defaults Rails::VERSION::STRING.to_f

    # Add Propshaft configuration for Rails 8
    if Rails.version.to_f >= 8.0
      # Propshaft is default in Rails 8
      config.assets.paths << Rails.root.join("../../vendor/assets/javascripts")
      config.assets.paths << Rails.root.join("../../vendor/assets/stylesheets")
    else
      # For Rails 7.x, explicitly use Propshaft
      config.assets = Propshaft::Railtie.config.assets
    end
  end
end
```

### 7. Update Test App Asset Configuration

```ruby
# spec/dummy/config/initializers/assets.rb
# Add Quill editor assets to precompile list
Rails.application.config.assets.precompile += %w[
  quill.min.js
  quill.snow.css
  quill.bubble.css
  activeadmin_quill_editor.js
  activeadmin_quill_editor.css
]
```

```javascript
// spec/dummy/app/assets/javascripts/active_admin.js
// For test app, import the gem's assets
//= require activeadmin_quill_editor
```

## CI/CD Configuration

### 8. GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    strategy:
      fail-fast: false
      matrix:
        ruby: ['3.3', '3.4']
        gemfile:
          - rails_7.x_active_admin_4.x
          - rails_8.x_active_admin_4.x

    env:
      BUNDLE_GEMFILE: ${{ github.workspace }}/gemfiles/${{ matrix.gemfile }}.gemfile
      RAILS_ENV: test

    steps:
      - uses: actions/checkout@v4

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: spec/dummy/package-lock.json

      - name: Install npm dependencies
        working-directory: spec/dummy
        run: npm ci

      - name: Build assets
        working-directory: spec/dummy
        run: npm run build

      - name: Setup test database
        run: bundle exec rake db:setup

      - name: Run tests
        run: bundle exec rspec

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage.json
```

### 9. Appraisals Configuration

```ruby
# Appraisals
appraise 'rails-7.x-active-admin-4.x' do
  gem 'rails', '~> 7.0'
  gem 'activeadmin', '~> 4.0.0.beta'
  gem 'sqlite3', '~> 2.0'
  gem 'propshaft', '~> 1.0'
end

appraise 'rails-8.x-active-admin-4.x' do
  gem 'rails', '~> 8.0'
  gem 'activeadmin', '~> 4.0.0.beta'
  gem 'sqlite3', '~> 2.0'
  # Propshaft is default in Rails 8
end
```

## Migration Steps

### 10. Step-by-Step Migration Process

1. **Update gemspec dependencies**
   ```ruby
   spec.required_ruby_version = '>= 3.3'
   spec.add_dependency 'activeadmin', '~> 4.0.0.beta'
   spec.add_dependency 'rails', '>= 7.0'
   ```

2. **Download and place Quill assets**
   ```bash
   # Download Quill 2.x from CDN or npm
   curl -o vendor/assets/javascripts/quill.min.js \
     https://cdn.jsdelivr.net/npm/quill@2/dist/quill.min.js
   curl -o vendor/assets/stylesheets/quill.snow.css \
     https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css
   ```

3. **Update JavaScript initialization**
   - Remove jQuery dependencies
   - Implement vanilla JS initialization
   - Add Turbo/Turbolinks support

4. **Update test suite**
   - Migrate to Combustion
   - Add modern browser tests
   - Configure CI matrix testing

5. **Update documentation**
   - Installation instructions for Propshaft
   - Usage examples without jQuery
   - Migration guide from old versions

## Usage in Rails 8 Application

### Installation

```ruby
# Gemfile
gem 'activeadmin_quill_editor', '~> 2.0'
```

```scss
// app/assets/stylesheets/active_admin.scss
@import 'quill.snow';
@import 'activeadmin_quill_editor';
```

```javascript
// app/javascript/active_admin.js (or equivalent)
import 'activeadmin_quill_editor';
```

### Form Usage

```ruby
form do |f|
  f.inputs do
    f.input :title
    f.input :content, as: :quill_editor, input_html: {
      data: {
        options: {
          theme: 'snow',
          modules: {
            toolbar: [
              ['bold', 'italic'],
              ['link', 'image']
            ]
          }
        }
      }
    }
  end
  f.actions
end
```

## Benefits of This Approach

1. **No NPM package needed** - Assets served directly from vendor directory
2. **Propshaft compatible** - Works with Rails 8 default asset pipeline
3. **No jQuery dependency** - Modern vanilla JavaScript
4. **Smaller bundle size** - Only ~200KB for Quill vs 450KB+ for alternatives
5. **Simple integration** - Drop-in replacement for text areas
6. **Maintained compatibility** - Works with Rails 7.x and 8.x

## Testing Locally

```bash
# Clone and setup
git clone https://github.com/yourusername/activeadmin_quill_editor.git
cd activeadmin_quill_editor
bundle install

# Run tests for specific Rails version
RAILS_VERSION=8.0 bundle exec rspec

# Or use appraisals
bundle exec appraisal rails-8.x-active-admin-4.x rspec

# Start test app server
cd spec/dummy
bundle install
bundle exec rails server
```

## Existing Test Coverage

The gem already includes comprehensive system tests at `spec/system/`:
- `quill_editor_spec.rb` - Editor functionality tests (formatting, links, etc.)
- `quill_js_spec.rb` - JavaScript API tests

Additional test cases from activeadmin_trumbowyg to consider adding:
- CSS loading verification tests
- Dark mode support tests
- Multiple editors on same page
- Has-many nested forms
- Turbo/Turbolinks compatibility tests

## Notes

- Quill.js file size: ~200KB minified (vs SunEditor's 450KB)
- No compilation step needed with Propshaft
- Assets are fingerprinted automatically by Propshaft
- Compatible with both importmap-rails and jsbundling-rails setups