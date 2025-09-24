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

**IMPORTANT**: Do NOT copy the gem's JavaScript file into your application. The gem provides `activeadmin_quill_editor.js` via its vendor/assets directory. You should import it, not duplicate it.

Create or update `app/javascript/active_admin.js`:
```javascript
// Import ActiveAdmin - this already includes all features and Rails UJS
// DO NOT import Rails separately as it's already included and started in ActiveAdmin
import '@activeadmin/activeadmin';

// Import Quill from NPM and make it globally available
import Quill from 'quill';
window.Quill = Quill;

// Import the image uploader plugin if available (optional)
try {
  const ImageUploader = require('quill-image-uploader');
  window.ImageUploader = ImageUploader.default || ImageUploader;
} catch(e) {
  // Image uploader is optional (silent failure)
}

// Import the Quill Editor initialization module from the gem
// This imports from vendor/assets/javascripts/activeadmin/quill_editor.js
import QuillEditorModule from 'activeadmin/quill_editor';

// Now that Quill is available, initialize the editors
// This ensures proper initialization order without setTimeout hacks
if (window.QuillEditor && window.QuillEditor.init) {
  window.QuillEditor.init();
} else if (QuillEditorModule && QuillEditorModule.init) {
  QuillEditorModule.init();
}
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
#!/usr/bin/env node
const esbuild = require('esbuild');
const path = require('path');

// IMPORTANT: Set up the alias to resolve the gem's JavaScript file
// For production apps, you can get the gem path dynamically:
const { execSync } = require('child_process');
const gemPath = execSync('bundle show activeadmin_quill_editor', { encoding: 'utf-8' }).trim();
// Or for development/testing with a local gem:
// const gemPath = path.resolve(__dirname, '../..'); // Adjust based on your setup

// Configuration for esbuild with proper module resolution
const config = {
  entryPoints: ['app/javascript/active_admin.js'],
  bundle: true,
  sourcemap: true,
  format: 'iife',
  outdir: 'app/assets/builds',
  publicPath: '/assets',
  loader: {
    '.js': 'js',
  },
  // Define global Quill for the initialization script
  define: {
    'global': 'window'
  },
  // CRITICAL: Use alias to import the gem's JavaScript from vendor/assets
  alias: {
    'activeadmin/quill_editor': path.join(gemPath, 'vendor/assets/javascripts/activeadmin/quill_editor.js')
  }
};

// Check if we're in watch mode
const watchMode = process.argv.includes('--watch');

if (watchMode) {
  // Start the build with watch mode
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  }).catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
} else {
  // Single build
  esbuild.build(config).then(() => {
    console.log('Build completed');
  }).catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
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

## Complete Example Files

These are complete working examples from our test suite that you can use as reference:

### tailwind.config.js
```javascript
const execSync = require('child_process').execSync;
const activeAdminPath = execSync('bundle show activeadmin', { encoding: 'utf-8' }).trim();

module.exports = {
  content: [
    `${activeAdminPath}/vendor/javascript/flowbite.js`,
    `${activeAdminPath}/plugin.js`,
    `${activeAdminPath}/app/views/**/*.{arb,erb,html,rb}`,
    './app/admin/**/*.{arb,erb,html,rb}',
    './app/views/active_admin/**/*.{arb,erb,html,rb}',
    './app/views/admin/**/*.{arb,erb,html,rb}',
    './app/javascript/**/*.js',
    // Quill editor gem files
    '../../lib/**/*.rb',
    '../../app/**/*.rb'
  ],
  darkMode: "class",
  plugins: [
    require('@activeadmin/activeadmin/plugin')
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    }
  },
  // CRITICAL: Safelist for ActiveAdmin 4 dynamic classes
  safelist: [
    // Grid and layout
    'grid', 'gap-4', 'gap-6', 'lg:grid-cols-3', 'md:grid-cols-2',
    'col-span-2', 'col-span-3', 'lg:col-span-2', 'lg:col-span-1',
    // Flexbox
    'flex', 'inline-flex', 'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap',
    'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around',
    'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
    // Spacing
    'space-x-4', 'space-y-4', 'space-x-2', 'space-y-2',
    'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8',
    'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8',
    'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8',
    'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8',
    'mx-0', 'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-5', 'mx-6', 'mx-8', 'mx-auto',
    'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8', 'my-auto',
    'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8',
    'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8',
    'ml-0', 'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8', 'ml-auto',
    'mr-0', 'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8', 'mr-auto',
    // Display
    'block', 'inline-block', 'inline', 'hidden', 'table', 'table-cell', 'table-row',
    'lg:block', 'lg:inline-block', 'lg:hidden', 'lg:flex',
    'md:block', 'md:inline-block', 'md:hidden', 'md:flex',
    'sm:block', 'sm:inline-block', 'sm:hidden', 'sm:flex',
    // Width/Height
    'w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
    'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-48', 'w-64', 'w-96',
    'h-full', 'h-screen', 'h-auto', 'h-12', 'h-16', 'h-32', 'h-64',
    'min-h-screen', 'min-h-full', 'max-w-7xl', 'max-w-full',
    // Typography
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
    'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'text-left', 'text-center', 'text-right', 'text-justify',
    'uppercase', 'lowercase', 'capitalize', 'normal-case',
    'italic', 'not-italic',
    'leading-none', 'leading-tight', 'leading-normal', 'leading-loose',
    // Colors (for dynamic theme)
    'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400',
    'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300',
    'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
    'bg-transparent',
    'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400',
    'border-gray-500', 'border-gray-600', 'border-gray-700', 'border-gray-800',
    // Dark mode
    'dark:bg-gray-700', 'dark:bg-gray-800', 'dark:bg-gray-900',
    'dark:text-gray-50', 'dark:text-gray-100', 'dark:text-gray-200', 'dark:text-gray-300', 'dark:text-gray-400',
    'dark:text-white',
    'dark:border-gray-600', 'dark:border-gray-700', 'dark:border-gray-800',
    // Borders and Rounding
    'border', 'border-0', 'border-2', 'border-4', 'border-8',
    'border-t', 'border-b', 'border-l', 'border-r',
    'border-t-0', 'border-b-0', 'border-l-0', 'border-r-0',
    'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    'rounded-t', 'rounded-b', 'rounded-l', 'rounded-r',
    'rounded-t-md', 'rounded-b-md', 'rounded-l-md', 'rounded-r-md',
    // Shadows
    'shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    // Overflow
    'overflow-auto', 'overflow-hidden', 'overflow-visible', 'overflow-scroll',
    'overflow-x-auto', 'overflow-x-hidden', 'overflow-x-visible', 'overflow-x-scroll',
    'overflow-y-auto', 'overflow-y-hidden', 'overflow-y-visible', 'overflow-y-scroll',
    // Position
    'static', 'fixed', 'absolute', 'relative', 'sticky',
    'top-0', 'right-0', 'bottom-0', 'left-0',
    'inset-0', 'inset-x-0', 'inset-y-0',
    // Z-index
    'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50', 'z-auto',
    // Opacity
    'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
    // Cursor
    'cursor-auto', 'cursor-pointer', 'cursor-not-allowed', 'cursor-wait',
    // Forms
    'form-input', 'form-select', 'form-checkbox', 'form-radio',
    // Tables
    'table-auto', 'table-fixed', 'border-collapse', 'border-separate',
    // Transitions
    'transition', 'transition-all', 'transition-colors', 'transition-opacity',
    'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300',
    'ease-in', 'ease-out', 'ease-in-out', 'ease-linear',
    // Transform
    'transform', 'transform-none',
    'scale-90', 'scale-95', 'scale-100', 'scale-105', 'scale-110',
    // Visibility
    'visible', 'invisible',
    // Quill specific classes
    'ql-toolbar', 'ql-container', 'ql-editor', 'quill-editor',
    'ql-snow', 'ql-bubble'
  ]
};
```

### lib/tasks/active_admin.rake
```ruby
namespace :active_admin do
  desc "Build Active Admin Tailwind stylesheets"
  task build: :environment do
    command = [
      "npx", "tailwindcss",
      "-i", Rails.root.join("app/assets/stylesheets/active_admin.css").to_s,
      "-o", Rails.root.join("app/assets/builds/active_admin.css").to_s,
      "-c", Rails.root.join("tailwind.config.js").to_s,
      "-m"
    ]

    system(*command, exception: true)
  end

  desc "Watch Active Admin Tailwind stylesheets"
  task watch: :environment do
    command = [
      "npx", "tailwindcss",
      "--watch",
      "-i", Rails.root.join("app/assets/stylesheets/active_admin.css").to_s,
      "-o", Rails.root.join("app/assets/builds/active_admin.css").to_s,
      "-c", Rails.root.join("tailwind.config.js").to_s,
      "-m"
    ]

    system(*command)
  end
end

Rake::Task["assets:precompile"].enhance(["active_admin:build"])

Rake::Task["test:prepare"].enhance(["active_admin:build"]) if Rake::Task.task_defined?("test:prepare")
Rake::Task["spec:prepare"].enhance(["active_admin:build"]) if Rake::Task.task_defined?("spec:prepare")
Rake::Task["db:test:prepare"].enhance(["active_admin:build"]) if Rake::Task.task_defined?("db:test:prepare")
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