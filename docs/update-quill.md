# Quill Editor Migration Guide for ActiveAdmin 4

## Overview
This guide helps you migrate the activeadmin-quill_editor gem to support ActiveAdmin 4 with modern Rails 8+ and Propshaft asset pipeline.

## Key Changes Made

### 1. Removed jQuery Dependency
**Before**: JavaScript relied on jQuery for initialization and DOM manipulation
**After**: Pure vanilla JavaScript with modern event listeners

### 2. Asset Pipeline Updates
**Before**: Sprockets-based asset compilation with CDN dependencies
**After**: Propshaft-compatible with NPM-based Quill installation

### 3. Ruby and Rails Version Requirements
- **Minimum Ruby**: 3.2+ (previously 3.0+)
- **Rails Support**: 7.0+ with ActiveAdmin 2.9-4.x
- **ActiveAdmin 4**: Full support with Propshaft

## Installation & Setup

### Step 1: Update Your Gemfile
```ruby
gem 'activeadmin_quill_editor', '~> 2.0'
```

### Step 2: Install Quill via NPM
```bash
# In your Rails app root
npm install quill@^2.0.2
```

Or add to `package.json`:
```json
{
  "dependencies": {
    "quill": "^2.0.2"
  }
}
```

### Step 3: Configure JavaScript (Rails 8 with esbuild)

Create or update `app/javascript/active_admin.js`:
```javascript
// Import ActiveAdmin (if using AA4)
import '@activeadmin/activeadmin';

// Import Quill
import Quill from 'quill';
window.Quill = Quill;

// The gem's initialization will auto-load when included
```

### Step 4: Configure CSS

#### With Tailwind CSS (ActiveAdmin 4)
In `app/assets/stylesheets/active_admin.tailwind.css`:
```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* Quill styles */
@import "quill/dist/quill.snow.css";
@import "quill/dist/quill.bubble.css";
```

#### With Sass/SCSS (Legacy)
In `app/assets/stylesheets/active_admin.scss`:
```scss
@import "active_admin/base";
@import "quill/dist/quill.snow";
// Optional bubble theme
@import "quill/dist/quill.bubble";
```

### Step 5: Build Configuration

#### esbuild.config.js
```javascript
const esbuild = require('esbuild');
const path = require('path');

const config = {
  entryPoints: ['app/javascript/active_admin.js'],
  bundle: true,
  sourcemap: true,
  format: 'iife',
  outdir: 'app/assets/builds',
  publicPath: '/assets',
};

// Build or watch
if (process.argv.includes('--watch')) {
  esbuild.context(config).then(ctx => {
    ctx.watch();
  });
} else {
  esbuild.build(config);
}
```

#### package.json scripts
```json
{
  "scripts": {
    "build:js": "node esbuild.config.js",
    "build:css": "tailwindcss -i app/assets/stylesheets/active_admin.tailwind.css -o app/assets/builds/active_admin.css -m",
    "build": "npm run build:js && npm run build:css"
  }
}
```

## Usage

### Basic Usage
```ruby
# app/admin/posts.rb
ActiveAdmin.register Post do
  permit_params :title, :content, :description

  form do |f|
    f.inputs do
      f.input :title
      f.input :content, as: :quill_editor
      f.input :description, as: :quill_editor, input_html: {
        data: {
          options: {
            theme: 'snow',
            modules: {
              toolbar: [
                ['bold', 'italic', 'underline'],
                ['link', 'image'],
                [{ list: 'ordered' }, { list: 'bullet' }]
              ]
            }
          }
        }
      }
    end
    f.actions
  end
end
```

### Custom Toolbar Configuration
```ruby
f.input :content, as: :quill_editor, input_html: {
  data: {
    options: {
      theme: 'snow',  # or 'bubble'
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'script': 'sub' }, { 'script': 'super' }],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
    }
  }
}
```

### Image Upload Support (Optional)
```bash
npm install quill-image-uploader
```

Configure in your form:
```ruby
f.input :content, as: :quill_editor, input_html: {
  data: {
    plugins: {
      image_uploader: {
        server_url: '/admin/upload',
        field_name: 'file'
      }
    }
  }
}
```

## JavaScript API

The gem exposes these global functions:

```javascript
// Get all Quill editor instances
const editors = getQuillEditors();

// Get editor by index (0-based)
const firstEditor = getQuillEditorByIndex(0);

// Get editor by element ID
const editor = getQuillEditorByElementId('post_content');

// Access Quill API directly
editor.getContents();
editor.setText('New content');
editor.format('bold', true);
```

## Migration from Legacy Versions

### Removing jQuery Dependencies

**Old initialization (jQuery)**:
```javascript
$(document).ready(function() {
  // Initialization code
});
```

**New initialization (Vanilla JS)**:
```javascript
// Automatically handled by the gem
// Or manually initialize:
document.addEventListener('DOMContentLoaded', function() {
  // Custom initialization if needed
});
```

### Asset Pipeline Changes

**Old (Sprockets)**:
```javascript
//= require activeadmin/quill_editor/quill
//= require activeadmin/quill_editor_input
```

**New (Propshaft/esbuild)**:
```javascript
import Quill from 'quill';
// Gem's initialization auto-loads
```

## Troubleshooting

### Issue: Quill not initializing
**Solution**: Ensure JavaScript is properly included:
- Check that `window.Quill` is defined
- Verify the gem's JS is loaded after Quill
- Check browser console for errors

### Issue: Styles not loading
**Solution**: Verify CSS imports:
- Ensure Quill CSS is imported
- Check that Tailwind processes the styles
- Verify no CSS conflicts with ActiveAdmin

### Issue: Form submission not saving content
**Solution**: The gem automatically handles form submission. Check:
- Hidden input field is present in HTML
- No JavaScript errors preventing update
- Strong parameters permit the field

## Testing Your Implementation

### RSpec System Tests
```ruby
# spec/system/admin_posts_spec.rb
require 'rails_helper'

RSpec.describe 'Admin Posts', type: :system do
  it 'creates a post with Quill editor' do
    visit '/admin/posts/new'

    # Fill in Quill editor
    within '[data-aa-quill-editor]' do
      find('.ql-editor').set('Test content')
    end

    click_button 'Create Post'

    expect(page).to have_content('Post was successfully created')
    expect(Post.last.content).to include('Test content')
  end
end
```

## Version Compatibility Matrix

| Gem Version | ActiveAdmin | Rails | Ruby | Quill |
|-------------|-------------|-------|------|-------|
| 2.0.x       | 2.9-4.x     | 7.0-8.x | 3.2+ | 2.x   |
| 1.x         | 2.x-3.x     | 6.1-7.x | 3.0+ | 1.x   |

## Additional Resources

- [Quill Documentation](https://quilljs.com/)
- [ActiveAdmin 4 Migration Guide](https://github.com/activeadmin/activeadmin/wiki)
- [Propshaft Documentation](https://github.com/rails/propshaft)
- [Rails 8 Asset Pipeline Guide](https://guides.rubyonrails.org/asset_pipeline.html)

## Support

For issues or questions:
- GitHub Issues: https://github.com/rs-pro/activeadmin-quill_editor/issues
- ActiveAdmin Community: https://github.com/activeadmin/activeadmin/discussions