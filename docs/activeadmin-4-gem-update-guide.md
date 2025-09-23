# ActiveAdmin 4 Gem Update Guide

This guide documents the process of updating a gem to support ActiveAdmin 4 with Propshaft, Tailwind CSS, and modern Rails 8 asset pipeline.

## Overview

ActiveAdmin 4 represents a significant architectural shift from previous versions:
- **CSS**: From Sprockets/SCSS to Tailwind CSS with custom build process
- **JavaScript**: From jQuery to vanilla JavaScript with ES modules
- **Asset Pipeline**: From Sprockets to Propshaft (Rails 8 default)
- **Styling**: From pre-built CSS to user-built Tailwind CSS

## Key Changes Required

### 1. Gem Structure Changes

#### Remove CSS Assets
ActiveAdmin 4 gems should NOT ship CSS files. Users build their own CSS with Tailwind.

```
# Remove these directories/files:
vendor/assets/stylesheets/
app/assets/stylesheets/*.scss
```

#### JavaScript Assets
Keep only initialization JavaScript in vendor/assets:
```
vendor/assets/javascripts/your_gem_name.js  # Vanilla JS, no jQuery
```

### 2. Engine Configuration

Update `lib/your_gem/engine.rb`:

```ruby
module YourGem
  class Engine < ::Rails::Engine
    # Propshaft automatically includes vendor/assets and app/assets paths

    initializer 'your_gem.assets' do |app|
      # For Propshaft (Rails 8 default)
      if defined?(Propshaft)
        app.config.assets.precompile += %w[
          your_gem_name.js
        ]
      # For Sprockets (legacy support)
      elsif app.config.respond_to?(:assets)
        app.config.assets.precompile += %w[
          your_gem_name.js
        ]
      end
    end
  end
end
```

### 3. JavaScript Migration

#### Remove jQuery Dependencies
Convert all jQuery code to vanilla JavaScript:

```javascript
// Old (jQuery)
$(document).ready(function() {
  $('.quill-editor').each(function() {
    // initialization
  });
});

// New (Vanilla JS)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.quill-editor').forEach(function(element) {
    // initialization
  });
});
```

#### Event Handling
Use modern event delegation:

```javascript
// Support both Turbo and non-Turbo apps
['DOMContentLoaded', 'turbo:load', 'turbolinks:load'].forEach(function(eventName) {
  document.addEventListener(eventName, initializeEditors);
});
```

### 4. Test/Dummy App Setup

#### Package.json
Create a proper `package.json` for the test app:

```json
{
  "name": "your-gem-test-app",
  "private": true,
  "scripts": {
    "build:js": "node esbuild.config.js",
    "build:css": "bundle exec rake active_admin:build",
    "build": "npm run build:js && npm run build:css"
  },
  "dependencies": {
    "@activeadmin/activeadmin": "^4.0.0-beta16",
    "@rails/ujs": "^7.1.3",
    "your-required-npm-package": "^x.x.x"
  },
  "devDependencies": {
    "esbuild": "^0.19.0",
    "tailwindcss": "^3.4.17"
  }
}
```

#### Tailwind Configuration
Create `tailwind.config.js`:

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
    './app/javascript/**/*.js'
  ],
  darkMode: "class",
  plugins: [
    require('@activeadmin/activeadmin/plugin')
  ]
};
```

#### CSS Source File Structure
Place source CSS OUTSIDE of Rails asset paths to avoid Propshaft conflicts:

```
spec/dummy/
  app/
    css/                              # NOT in assets/
      active_admin_source.css         # Source file for Tailwind
    assets/
      builds/
        active_admin.css              # Built output
      config/
        manifest.js                   # Propshaft manifest
```

#### Active Admin CSS Source
Create `app/css/active_admin_source.css` (or `app/assets/stylesheets/active_admin.css` per the gist):

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* Import vendor styles if needed */
@import "../../../node_modules/your-package/dist/styles.css";

/* Custom component styles */
@layer components {
  .your-component {
    @apply border border-gray-300 rounded-md;
  }
}
```

#### Build Task
Create `lib/tasks/active_admin.rake`:

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
```

#### ESBuild Configuration
Create `esbuild.config.js`:

```javascript
const esbuild = require('esbuild');
const railsEnv = process.env.RAILS_ENV || 'development';

const config = {
  entryPoints: ['app/javascript/active_admin.js'],
  bundle: true,
  sourcemap: railsEnv !== 'production',
  format: 'esm',
  outdir: 'app/assets/builds',
  publicPath: '/assets',
  loader: {
    '.js': 'js',
  },
  minify: railsEnv === 'production',
  plugins: [],
};

if (process.argv.includes('--watch')) {
  esbuild.context(config).then((ctx) => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(config).then(() => {
    console.log('Build completed');
  }).catch(() => process.exit(1));
}
```

### 5. ActiveAdmin Initializer

Update `config/initializers/active_admin.rb`:

```ruby
ActiveAdmin.setup do |config|
  # Register CSS (required for AA4 + Propshaft)
  config.register_stylesheet 'active_admin.css'

  # Register JavaScript files
  config.register_javascript 'active_admin.js'
  config.register_javascript 'your_gem_name.js'

  # ... other configuration
end
```

### 6. Propshaft Manifest

Update `app/assets/config/manifest.js`:

```javascript
//= link_tree ../images
//= link_tree ../builds
//= link active_admin.css
//= link active_admin.js
//= link your_gem_name.js
```

### 7. Common Pitfalls & Solutions

#### Issue: CSS not loading / Only Tailwind directives visible
**Cause**: Propshaft serving source file instead of built file
**Solution**:
- Ensure source CSS is outside `app/assets/` or named differently
- Check that build process outputs to `app/assets/builds/`
- Verify `config.register_stylesheet 'active_admin.css'` in initializer

#### Issue: Missing ActiveAdmin layout styles
**Cause**: ActiveAdmin plugin not loaded or content paths missing
**Solution**:
- Ensure `@activeadmin/activeadmin` npm package is installed
- Add ActiveAdmin gem paths to Tailwind content configuration
- Use `require('@activeadmin/activeadmin/plugin')` in Tailwind config

#### Issue: JavaScript not initializing
**Cause**: Turbo/Turbolinks events not handled
**Solution**: Listen for multiple initialization events:
```javascript
['DOMContentLoaded', 'turbo:load', 'turbolinks:load'].forEach(function(eventName) {
  document.addEventListener(eventName, initializeComponents);
});
```

#### Issue: Double asset compilation
**Cause**: Both Sprockets and Propshaft trying to handle same files
**Solution**:
- Remove/rename conflicting files in `app/assets/stylesheets/`
- Use specific file names in manifest instead of `link_tree`

### 8. Testing Setup

#### GitHub Actions Workflow

Create separate workflows for different ActiveAdmin versions:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test-aa4:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ruby: ['3.2', '3.3']
        rails: ['7.1', '8.0']

    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install npm dependencies
        run: |
          cd spec/dummy
          npm install

      - name: Build assets
        run: |
          cd spec/dummy
          npm run build

      - name: Run tests
        run: bundle exec rspec

  test-legacy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ruby: ['3.0', '3.1']
        activeadmin: ['2.14', '3.2']
    # ... legacy test configuration
```

### 9. Migration Checklist

- [ ] Remove all SCSS/CSS assets from gem
- [ ] Convert JavaScript from jQuery to vanilla JS
- [ ] Create test app package.json with dependencies
- [ ] Set up Tailwind configuration
- [ ] Create CSS build process (rake task)
- [ ] Set up JavaScript build (esbuild)
- [ ] Update engine.rb for Propshaft
- [ ] Configure ActiveAdmin initializer
- [ ] Update Propshaft manifest
- [ ] Test with both Turbo and non-Turbo apps
- [ ] Update CI/CD for asset building
- [ ] Document upgrade path for gem users

### 10. User Migration Guide

Provide clear instructions for gem users:

```markdown
## Upgrading to v2.0 (ActiveAdmin 4 Support)

### Installation

1. Update your Gemfile:
   ```ruby
   gem 'activeadmin', '~> 4.0.0.beta'
   gem 'your_gem', '~> 2.0'
   ```

2. Install npm package:
   ```bash
   npm install your-required-package
   ```

3. Update your Tailwind config to include gem styles:
   ```javascript
   // In your tailwind.config.js
   module.exports = {
     content: [
       // ... your existing content
       './vendor/bundle/ruby/*/gems/your_gem-*/app/**/*.rb',
     ]
   }
   ```

4. Import required styles in your CSS:
   ```css
   /* In app/assets/stylesheets/active_admin.css */
   @import "your-package/dist/styles.css";
   ```

5. Build your assets:
   ```bash
   rails assets:precompile
   ```
```

## References

- [ActiveAdmin 4.0 Beta Documentation](https://github.com/activeadmin/activeadmin/tree/master/docs)
- [Propshaft Documentation](https://github.com/rails/propshaft)
- [Tailwind CSS Rails Integration](https://tailwindcss.com/docs/guides/rails)
- [Working Example Gist](https://gist.github.com/amkisko/c704c1a6462d573dfa4820ae07d807a6)