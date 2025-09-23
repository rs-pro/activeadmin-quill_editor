# ActiveAdmin 4 Migration Guide for Gem Maintainers

## Overview

This document provides a comprehensive guide for gem maintainers on how to update their gems to support ActiveAdmin 4, based on the changes made to the `activeadmin-searchable_select` gem. The migration involved addressing significant changes in asset handling, JavaScript module systems, dependency management, and CSS selectors.

## Key Migration Steps

### 1. Update Dependency Constraints

#### Ruby Version Requirements
- **Minimum Ruby version**: 3.2 (Ruby 3.0 and 3.1 are dropped in ActiveAdmin 4)
- Update your gemspec: `spec.required_ruby_version = '>= 3.2'`

#### Rails Version Requirements
- **Minimum Rails version**: 7.0 (Rails 6.1 support dropped)
- ActiveAdmin 4 supports Rails 7.x and 8.x

#### ActiveAdmin Version
```ruby
# In gemspec
spec.add_runtime_dependency 'activeadmin', ['>= 1.x', '< 5']
```

### 2. Asset Pipeline Migration

ActiveAdmin 4 moved away from the traditional Rails asset pipeline to modern JavaScript bundlers.

#### Key Changes:
- ActiveAdmin 4 assumes `cssbundling-rails` and `importmap-rails` are installed
- No longer uses `register_stylesheet` or `register_javascript` methods
- Requires explicit JavaScript module initialization

#### CSS bundling pattern (Rails 7 cssbundling + Tailwind)

- Build CSS to `app/assets/builds/active_admin.css` and expose it via `app/assets/config/manifest.js`:
  - `//= link_tree ../builds`
  - `//= link active_admin.css`
  - `//= link active_admin.js`
  - `//= link trumbowyg/icons.svg` (when using Trumbowyg)
- Keep a single Tailwind config at the Rails app root (avoid duplicates). Using ESM works well:
  - `tailwind.config.mjs` with `import activeAdminPlugin from '@activeadmin/activeadmin/plugin'`
- Source file `app/assets/stylesheets/active_admin_source.css` contains Tailwind directives, gem overrides and imports.
- If Tailwind CLI does not inline vendor `@import` from `node_modules`, concatenate vendor CSS before building. Example build script:

```json
// spec/internal/package.json
{
  "scripts": {
    "build:css": "node ./build_css.js"
  }
}
```

```js
// spec/internal/build_css.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = __dirname;
const inputPath = path.join(root, 'app/assets/stylesheets/active_admin_source.css');
const vendorCssPath = path.join(root, 'node_modules/trumbowyg/dist/ui/trumbowyg.css');
const tmpPath = path.join(root, 'app/assets/stylesheets/__aa_tmp.css');
const outPath = path.join(root, 'app/assets/builds/active_admin.css');
const src = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/);
const vendorCss = fs.readFileSync(vendorCssPath, 'utf8');
const tailwind = ['@tailwind base;','@tailwind components;','@tailwind utilities;'].join('\n');
const body = src.slice(3).filter(l => !l.includes('trumbowyg.css')).join('\n');
fs.writeFileSync(tmpPath, `${tailwind}\n\n${vendorCss}\n\n${body}`);
spawnSync('npx', ['tailwindcss','-c', path.join(root,'tailwind.config.mjs'),'-i', tmpPath,'-o', outPath], { stdio: 'inherit', cwd: root });
fs.unlinkSync(tmpPath);
```

This ensures vendor CSS (e.g., Trumbowyg) ships inside the built `active_admin.css` while keeping Tailwind at the top of the cascade so overrides behave as expected.

#### JavaScript Module Support

Create multiple module formats to support different bundlers:

1. **ESM Module** (`your_gem.esm.js`):
```javascript
import $ from 'jquery';
import select2 from 'select2';  // Or your jQuery plugin

// Critical: Initialize jQuery plugins on the jQuery object for production builds
// This ensures the plugin methods are available on jQuery selections
select2($);

// Ensure jQuery is globally available for other scripts
window.$ = window.jQuery = $;

// Your initialization code wrapped in a DOM ready handler
$(() => {
  // Initialize your plugin on specific selectors
  $('.your-selector').yourPlugin({
    // plugin options
  });
  
  // Listen for Turbo/Turbolinks events for dynamic content
  $(document).on('turbo:load turbolinks:load', () => {
    $('.your-selector').yourPlugin();
  });
  
  // For ActiveAdmin's dynamic content (filters, forms)
  $(document).on('has_many_add:after', '.has_many_container', () => {
    $('.your-selector').yourPlugin();
  });
});

// Export for use as a module
export default function initializeYourGem() {
  // Initialization logic
}
```

2. **Traditional Module** (`your_gem.js` for backward compatibility):
```javascript
//= require jquery
//= require select2

(function($) {
  'use strict';
  
  $(document).ready(function() {
    $('.your-selector').yourPlugin();
  });
  
  // Turbolinks/Turbo support
  $(document).on('turbo:load turbolinks:load', function() {
    $('.your-selector').yourPlugin();
  });
})(jQuery);
```

3. **CDN-compatible version** (for importmap users):
```javascript
// Assumes jQuery and plugins are loaded via CDN
(() => {
  'use strict';
  
  const $ = window.jQuery || window.$;
  
  if (!$) {
    console.error('jQuery is required for YourGem');
    return;
  }
  
  // Wait for DOM ready
  $(() => {
    $('.your-selector').yourPlugin();
  });
})();
```

### 3. Installation Generator

Create a generator to help users set up your gem with different bundlers:

```ruby
module YourGem
  module Generators
    class InstallGenerator < Rails::Generators::Base
      class_option :bundler,
                   type: :string,
                   default: 'esbuild',
                   enum: %w[esbuild importmap webpack]

      def setup_javascript
        case options[:bundler]
        when 'esbuild'
          setup_esbuild
        when 'importmap'
          setup_importmap
        when 'webpack'
          setup_webpack
        end
      end
      
      private
      
      def setup_esbuild
        # Add imports to app/javascript/active_admin.js
        append_to_file 'app/javascript/active_admin.js' do
          <<~JS
            import $ from 'jquery';
            import yourPlugin from 'your-plugin';
            
            // Initialize plugin on jQuery
            yourPlugin($);
            window.$ = window.jQuery = $;
            
            import '@your-scope/your-gem';
          JS
        end
      end
      
      def setup_importmap
        # Add pins to config/importmap.rb
        append_to_file 'config/importmap.rb' do
          <<~RUBY
            pin "jquery", to: "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"
            pin "your-plugin", to: "https://cdn.jsdelivr.net/npm/your-plugin/dist/plugin.min.js"
            pin "your-gem", to: "your-gem.js"
          RUBY
        end
      end
    end
  end
end
```

### 4. NPM Package Publishing

If your gem includes JavaScript, consider publishing an NPM package:

#### Package.json Configuration
```json
{
  "name": "@activeadmin/your-gem",
  "version": "1.0.0",
  "description": "Your gem description for ActiveAdmin",
  "main": "src/index.js",
  "module": "src/index.js",
  "exports": {
    ".": {
      "import": "./src/index.js",
      "require": "./src/index.js",
      "default": "./src/index.js"
    },
    "./css": "./src/styles.scss"
  },
  "peerDependencies": {
    "jquery": ">= 3.0, < 5",
    "select2": "^4.0.13"  // Add your dependencies here
  },
  "files": [
    "src/**/*",
    "app/assets/**/*",
    "vendor/assets/**/*"
  ],
  "scripts": {
    "prepare_sources": "mkdir -p src && cp -r app/assets/javascripts/active_admin/* src/ && cp -r app/assets/stylesheets/active_admin/* src/",
    "prepublishOnly": "npm run prepare_sources"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/your-gem.git"
  },
  "keywords": ["activeadmin", "rails", "your-feature"],
  "author": "Your Name",
  "license": "MIT"
}
```

#### Preparing JavaScript Assets for NPM

Create a script to copy your assets to the NPM package structure:

```bash
#!/bin/bash
# scripts/prepare_npm_package.sh

# Create src directory for NPM
mkdir -p src

# Copy JavaScript files
cp -r app/assets/javascripts/active_admin/* src/

# Copy SCSS files if needed
cp -r app/assets/stylesheets/active_admin/* src/

# Ensure ESM module is included
cp app/assets/javascripts/active_admin/your_gem.esm.js src/index.js
```

### 5. CSS Selector Updates

ActiveAdmin 4 introduced several CSS class changes:

| ActiveAdmin 3.x | ActiveAdmin 4.x |
|----------------|-----------------|
| `.filter_form` | `.filters-form` |
| `.tabs` component | Removed - use divs with Tailwind |
| `.columns` component | Replaced with Tailwind grid |

Update your JavaScript and CSS accordingly:
```javascript
// Old
$('.filter_form select').select2();

// New
$('.filters-form select').select2();
```

### 6. Testing Updates with Combustion

#### Complete Combustion Workflow for ActiveAdmin 4 Gems

**CRITICAL**: This workflow is specifically for testing ActiveAdmin extension gems with Combustion.

##### Step 1: Add Dependencies to Gemfile

```ruby
# Gemfile (for development/testing)
gem 'combustion'
gem 'importmap-rails', '~> 2.0'  # Required for ActiveAdmin 4
```

##### Step 2: Run Combustion Generator (MANDATORY!)

```bash
# NEVER manually create spec/internal structure!
bundle exec combust
```

This creates:
- `spec/internal/` - minimal Rails app structure  
- `config.ru` - in gem root for `bundle exec rackup`
- Basic Rails directories and config files

##### Step 3: Set Up Test App Structure

After generator, create these files:

```bash
# Create necessary directories
mkdir -p spec/internal/app/models
mkdir -p spec/internal/app/admin
mkdir -p spec/internal/app/assets/stylesheets
mkdir -p spec/internal/app/javascript
mkdir -p spec/internal/config/initializers
```

##### Basic Combustion Configuration
```ruby
# spec/rails_helper.rb
ENV['RAILS_ENV'] ||= 'test'

require 'combustion'

# Initialize Combustion with only needed components
Combustion.path = 'spec/internal'
Combustion.initialize!(:active_record, :action_controller, :action_view) do
  config.load_defaults Rails::VERSION::STRING.to_f if Rails::VERSION::MAJOR >= 7
end

require 'rspec/rails'
require 'capybara/rails'
```

##### Step 4: Configure config.ru (CRITICAL Loading Order!)

```ruby
# config.ru - MUST control loading order for ActiveAdmin!
require "rubygems"
require "bundler"

# DON'T use Bundler.require - it loads gems too early!
Bundler.setup(:default, :development)

# Load Rails and combustion first
require 'combustion'

# Initialize Combustion with Rails components
Combustion.initialize! :active_record, :action_controller, :action_view do
  config.load_defaults Rails::VERSION::STRING.to_f if Rails::VERSION::MAJOR >= 7
end

# NOW we can load ActiveAdmin and its dependencies after Rails is initialized
require 'importmap-rails'
require 'active_admin'
require 'your_activeadmin_gem'

run Combustion::Application
```

##### Step 5: Configure ActiveAdmin Assets

```ruby
# spec/internal/app/assets/stylesheets/active_admin.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```ruby
# spec/internal/config/importmap.rb
pin "@activeadmin/activeadmin", to: "active_admin.js", preload: true
```

```javascript
// spec/internal/app/javascript/active_admin.js
// Placeholder for ActiveAdmin JS
console.log("ActiveAdmin loaded");
```

##### Step 6: Set Up Test Models and Admin Resources

```ruby
# spec/internal/db/schema.rb
ActiveRecord::Schema.define do
  create_table :active_admin_comments, force: true do |t|
    t.string :namespace
    t.text :body
    t.references :resource, polymorphic: true
    t.references :author, polymorphic: true
    t.timestamps
  end

  create_table :posts, force: true do |t|
    t.string :title
    t.text :body
    t.text :description
    t.timestamps
  end
end
```

```ruby
# spec/internal/config/routes.rb
Rails.application.routes.draw do
  ActiveAdmin.routes(self)
  root to: 'admin/dashboard#index'
end
```

```ruby
# spec/internal/config/initializers/active_admin.rb
ActiveAdmin.setup do |config|
  config.site_title = "Test App"
  config.authentication_method = false
  config.current_user_method = false
  config.batch_actions = true
end
```

##### Step 7: Configure rails_helper.rb

```ruby
# spec/rails_helper.rb
ENV['RAILS_ENV'] ||= 'test'

require 'combustion'

Combustion.path = 'spec/internal'
Combustion.initialize!(:active_record, :action_controller, :action_view) do
  config.load_defaults Rails::VERSION::STRING.to_f if Rails::VERSION::MAJOR >= 7
end

require 'rspec/rails'
require 'capybara/rails'
```

##### Step 8: Running the Test App

```bash
# Start the test app server
bundle exec rackup
# Visit http://localhost:9292/admin
```

#### Critical Testing Pitfall: Model Registration Conflicts

**Problem**: Dynamic ActiveAdmin registrations in tests conflict with static admin files.

**Solution**: Choose ONE approach per model:

1. **Static Registration** (for consistent configs):
```ruby
# spec/internal/app/admin/users.rb
ActiveAdmin.register User do
  permit_params :name, :email
  # Fixed configuration
end
```

2. **Dynamic Registration** (for varying configs):
```ruby
# spec/support/active_admin_helpers.rb
module ActiveAdminHelpers
  module_function

  def setup
    ActiveAdmin.application = nil
    yield  # Dynamic registration block
    reload_routes!
  end
  
  def reload_routes!
    Rails.application.reload_routes!
  end
end

# In test - NO static admin file for Post model
ActiveAdminHelpers.setup do
  ActiveAdmin.register(Post) do
    # Test-specific configuration
  end
end
```

**Important**: Never mix static and dynamic registration for the same model!

#### Capybara Configuration with Playwright
```ruby
# spec/support/capybara.rb
require 'capybara-playwright-driver'

Capybara.register_driver :playwright do |app|
  Capybara::Playwright::Driver.new(
    app,
    browser_type: :chromium,
    headless: true,
    viewport: { width: 1920, height: 1080 }
  )
end

Capybara.default_driver = :rack_test
Capybara.javascript_driver = :playwright

# Important: Set server for JS tests
Capybara.server = :puma, { Silent: true }
```

#### Waiting for JavaScript/AJAX in Tests
```ruby
# spec/support/wait_helpers.rb
module WaitHelpers
  def wait_for_ajax
    Timeout.timeout(Capybara.default_max_wait_time) do
      sleep 0.1
      loop until finished_all_ajax_requests?
    end
  end
  
  def finished_all_ajax_requests?
    page.evaluate_script('jQuery.active').zero?
  end
  
  # For Select2 or similar plugins
  def wait_for_select2
    expect(page).to have_css('.select2-container', wait: 5)
  end
end

RSpec.configure do |config|
  config.include WaitHelpers, type: :feature
end
```

### 7. Production Build Issues

Common production issues and solutions:

#### Issue: JavaScript plugin not initialized
**Solution**: Explicitly initialize jQuery plugins
```javascript
import select2 from 'select2';
import $ from 'jquery';

// This is critical for production builds
select2($);
```

#### Issue: jQuery not globally available
**Solution**: Ensure global assignment
```javascript
window.$ = window.jQuery = $;
```

#### Issue: Assets not loading in production
**Solution**: Use CDN fallbacks or vendor assets
```ruby
# In your gem's engine.rb
class Engine < ::Rails::Engine
  initializer 'your_gem.assets' do |app|
    if Rails.env.production?
      # Add fallback assets
    end
  end
end
```

### 8. CI/CD Updates

Update your GitHub Actions workflow:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ruby: ['3.2', '3.3']
        rails: ['7.0', '7.1', '7.2', '8.0']
        activeadmin: ['4.0.0.beta16']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true
      
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install npm dependencies
        run: npm install
      
      - name: Install Playwright browsers
        run: npx playwright install chromium
      
      - name: Run tests
        run: bundle exec rspec
```

### 9. Appraisals Configuration

Use Appraisal gem to test against multiple versions:

```ruby
# Appraisals file
appraise 'rails-7.x-active-admin-4.x' do
  gem 'rails', '~> 7.0'
  gem 'activeadmin', '~> 4.0.0.beta16'
  gem 'propshaft'  # Required - Sprockets not supported
end

appraise 'rails-8.x-active-admin-4.x' do
  gem 'rails', '~> 8.0'
  gem 'activeadmin', '~> 4.0.0.beta16'
  # Rails 8 includes Propshaft by default
end
```

### 10. Common Pitfalls and Solutions

#### Pitfall 1: Select2 or similar jQuery plugins not working
**Root Cause**: Plugin not attached to jQuery object in production
**Solution**: Explicitly call `plugin($)` after importing
```javascript
import select2 from 'select2';
import $ from 'jquery';
select2($);  // Critical - attaches plugin to jQuery
```

#### Pitfall 2: CSS classes not found
**Root Cause**: ActiveAdmin 4 changed many CSS selectors
**Solution**: Search and replace old selectors with new ones
- `.filter_form` → `.filters-form`
- `.select2-container` needs explicit initialization in tests

#### Pitfall 3: Tests passing locally but failing in CI
**Root Cause**: Missing JavaScript dependencies or browser drivers
**Solution**: 
```yaml
# .github/workflows/ci.yml
- name: Install Playwright browsers
  run: npx playwright install chromium
```

#### Pitfall 4: Assets not compiling in production
**Root Cause**: Missing bundler configuration
**Solution**: Provide clear setup instructions for each bundler type in your README

#### Pitfall 5: Model registration conflicts in tests
**Root Cause**: Static admin files override dynamic test registrations
**Solution**: 
- Delete static admin files for models that need dynamic config
- Keep static files only for models with consistent config
- Never mix both approaches for the same model

#### Pitfall 6: Input HTML options not passing through
**Root Cause**: Options can be lost during form DSL processing
**Solution**: Test with clean models not affected by other registrations
```ruby
# Test with a model that has no static admin file
ActiveAdmin.register(TestModel) do
  form do |f|
    f.input :field, as: :searchable_select, 
            input_html: { class: 'custom-class' }
  end
end
```

#### Pitfall 7: Flaky JavaScript tests
**Root Cause**: Not waiting for AJAX/DOM updates
**Solution**: Add proper wait helpers
```ruby
def wait_for_select2
  expect(page).to have_css('.select2-container', wait: 5)
end
```

#### Pitfall 8: Rails 8 compatibility issues
**Root Cause**: Formtastic 5.0 changes, Ransack updates
**Solution**: 
- Test against multiple Rails versions using Appraisal
- Ensure Ransack methods are defined in models
```ruby
def self.ransackable_attributes(_auth_object = nil)
  %w[name title]
end
```

#### Pitfall 9: Combustion and ActiveAdmin Loading Order Issues  
**Root Cause**: ActiveAdmin requires Rails components at load time, conflicts with Combustion's initialization
**Critical Issue**: ActiveAdmin's `Bundler.require` loads before Rails is initialized by Combustion
**Symptoms**:
- `uninitialized constant Formtastic::ActionView`
- `uninitialized constant ActiveSupport::Autoload`
- `uninitialized constant #<Class:ActiveAdmin>::Importmap`
- Rackup fails with various Rails component loading errors
**Solution**: 
- Use `Bundler.setup` instead of `Bundler.require` in config.ru
- Load ActiveAdmin AFTER Combustion initializes Rails
- Include importmap-rails for ActiveAdmin 4
- Don't require ActiveAdmin components in gem's main file
```ruby
# Bad: In lib/your_gem.rb
require 'active_admin'  # This loads too early!
require 'formtastic/inputs/your_input'

# Good: In engine.rb
initializer 'your_gem.setup', after: :load_config_initializers do
  require 'active_admin' if defined?(Rails.application)
  ActiveSupport.on_load(:active_admin) do
    require 'formtastic/inputs/your_input'
  end
end
```

#### Pitfall 10: ActiveAdmin 4 Asset Pipeline Requirements (CRITICAL FOR COMBUSTION GEMS)
**Root Cause**: ActiveAdmin 4 uses Tailwind CSS v3 with custom plugin, requires compilation
**Critical Issue**: CSS must be compiled through Tailwind with ActiveAdmin plugin
**Symptoms**:
- Unstyled admin pages (no proper layout, just basic HTML)
- CSS file exists but has 0 bytes or wrong content
- `The asset "active_admin.css" is not present in the asset pipeline`

**Complete Solution for Combustion-based Gems**:

1. **Add Dependencies** (Gemfile):
```ruby
gem 'importmap-rails', '~> 2.0'
gem 'tailwindcss-rails'  # For bundled tailwindcss executable
```

2. **Install NPM packages** (in spec/internal):
```bash
cd spec/internal
npm init -y
npm install --save-dev tailwindcss@^3  # Use v3, not v4!
npm install --save-dev @activeadmin/activeadmin  # For plugin (optional)
```

3. **Copy ActiveAdmin Plugin** (from Ruby gem):
```bash
cp $(bundle show activeadmin)/plugin.js spec/internal/activeadmin-plugin.js
```

4. **Create Tailwind Config** (spec/internal/tailwind.config.mjs):
```javascript
import activeAdminPlugin from './activeadmin-plugin.js';
import { execSync } from 'child_process';

const activeAdminPath = execSync('bundle show activeadmin', { encoding: 'utf-8' }).trim();

export default {
  content: [
    `${activeAdminPath}/app/views/**/*.{arb,erb,html,rb}`,
    './app/admin/**/*.{arb,erb,html,rb}',
    './app/views/**/*.{arb,erb,html}',
    './app/javascript/**/*.js'
  ],
  darkMode: 'selector',
  plugins: [activeAdminPlugin]
}
```

5. **Create Source CSS** (spec/internal/app/assets/stylesheets/active_admin_source.css):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

6. **Build CSS**:
```bash
cd spec/internal
npx tailwindcss -c tailwind.config.mjs \
  -i app/assets/stylesheets/active_admin_source.css \
  -o app/assets/stylesheets/active_admin_compiled.css \
  --minify
```

7. **Configure Sprockets** (spec/internal/app/assets/stylesheets/active_admin.css):
```css
/*
 * This imports the compiled Tailwind CSS with ActiveAdmin styles
 *= require ./active_admin_compiled
 */
```

8. **Update Manifest** (spec/internal/app/assets/config/manifest.js):
```javascript
//= link_tree ../builds
//= link active_admin.css
```

9. **Create Build Task** (lib/tasks/active_admin.rake):
```ruby
namespace :active_admin do
  desc 'Build Active Admin Tailwind stylesheets'
  task :build do
    require 'fileutils'
    
    input = File.expand_path('../../spec/internal/app/assets/stylesheets/active_admin_source.css', __dir__)
    output = File.expand_path('../../spec/internal/app/assets/stylesheets/active_admin_compiled.css', __dir__)
    config = File.expand_path('../../spec/internal/tailwind.config.mjs', __dir__)
    
    FileUtils.mkdir_p(File.dirname(output))
    
    command = ['npx', 'tailwindcss', '-c', config, '-i', input, '-o', output, '--minify']
    puts "Building Tailwind CSS: #{command.join(' ')}"
    system(*command, exception: true)
    puts "Tailwind CSS build complete: #{output}"
  end
end
```

#### Pitfall 11: Formtastic Custom Inputs Not Loading in Combustion
**Root Cause**: Loading order issues with ActiveAdmin, Formtastic, and custom inputs
**Symptoms**:
- `Formtastic::UnknownInputError: Unable to find input class YourInput`
- Input works in production but not in Combustion test environment

**Solutions**:

1. **Immediate Fix in config.ru** (for Combustion):
```ruby
# config.ru
require 'combustion'
Combustion.initialize! :active_record, :action_controller, :action_view

require 'importmap-rails'
require 'active_admin'
require 'your_gem'

# Critical: Explicitly require custom inputs after everything else
require 'formtastic/inputs/your_input'

run Combustion::Application
```

2. **Engine Initialization Fix**:
```ruby
# lib/your_gem/engine.rb
initializer 'your_gem.setup', after: :load_config_initializers do
  require 'active_admin' if defined?(Rails.application)
  
  # Load immediately AND hook into ActiveAdmin
  require 'formtastic/inputs/your_input'
  
  ActiveSupport.on_load(:active_admin) do
    require 'formtastic/inputs/your_input'
  end
end
```

3. **Workaround Using Standard Inputs**:
```ruby
# If custom input isn't loading, use standard input with same attributes
f.input :field, as: :text, input_html: { 
  class: 'your-input-class', 
  'data-your-attribute': true 
}
```

**Note**: After making these changes, restart the server for them to take effect.

## Migration Checklist

- [ ] Update Ruby version requirement to >= 3.2
- [ ] Update Rails version requirement to >= 7.0
- [ ] Update ActiveAdmin dependency to support 4.x
- [ ] Create ESM JavaScript modules
- [ ] Add installation generator for different bundlers
- [ ] Publish NPM package (if applicable)
- [ ] Update CSS selectors (`.filter_form` → `.filters-form`)
- [ ] Fix jQuery plugin initialization for production
- [ ] Update test suite for new asset handling
- [ ] Configure CI for multiple version testing
- [ ] Update documentation with setup instructions
- [ ] Test with esbuild, webpack, and importmap
- [ ] Add CDN fallbacks for JavaScript dependencies
- [ ] Handle both Sprockets and Propshaft

## Example Implementation

See the full implementation in the `activeadmin-searchable_select` gem:
- [Installation Generator](../lib/generators/active_admin/searchable_select/install/install_generator.rb)
- [ESM Module](../app/assets/javascripts/active_admin/searchable_select.esm.js)
- [Package.json](../package.json)
- [CI Configuration](../.github/workflows/ci.yml)

## Resources

- [ActiveAdmin 4.0 Breaking Changes](./activeadmin-4-changes.md)
- [ActiveAdmin 4.0 Release Notes](https://github.com/activeadmin/activeadmin/releases)
- [Rails 7+ Asset Pipeline Guide](https://guides.rubyonrails.org/asset_pipeline.html)
- [esbuild Rails Documentation](https://github.com/rails/jsbundling-rails)
- [Importmap Rails Documentation](https://github.com/rails/importmap-rails)

## Conclusion

Migrating a gem to support ActiveAdmin 4 requires careful attention to:
1. Modern JavaScript module systems
2. Flexible asset pipeline support
3. Updated CSS selectors and components
4. Proper jQuery plugin initialization
5. Comprehensive testing across different setups

The key to success is providing multiple paths for users with different asset pipeline configurations while maintaining backward compatibility where possible.
