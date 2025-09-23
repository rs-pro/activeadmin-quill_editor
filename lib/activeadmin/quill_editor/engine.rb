# frozen_string_literal: true

require 'active_admin'

module ActiveAdmin
  module QuillEditor
    class Engine < ::Rails::Engine
      engine_name 'activeadmin_quill_editor'

      # Propshaft automatically includes vendor/assets and app/assets paths
      # No need for explicit asset path configuration with Propshaft

      initializer 'activeadmin_quill_editor.assets' do |app|
        # For Propshaft (Rails 8 default)
        if defined?(Propshaft)
          app.config.assets.precompile += %w[
            activeadmin_quill_editor.js
          ]
        # For Sprockets (legacy support)
        elsif app.config.respond_to?(:assets)
          app.config.assets.precompile += %w[
            activeadmin/quill_editor_input.js
            activeadmin_quill_editor.js
          ]
        end
      end

      initializer 'activeadmin_quill_editor.formtastic' do
        ActiveSupport.on_load :active_admin do
          require 'formtastic/inputs/quill_editor_input'
        end
      end
    end
  end
end