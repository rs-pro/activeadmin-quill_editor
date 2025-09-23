# frozen_string_literal: true

lib = File.expand_path('lib', __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'activeadmin/quill_editor/version'

Gem::Specification.new do |spec|
  spec.name          = 'activeadmin_quill_editor'
  spec.version       = ActiveAdmin::QuillEditor::VERSION
  spec.summary       = 'Quill Editor for ActiveAdmin'
  spec.description   = 'An Active Admin plugin to use Quill Rich Text Editor'
  spec.license       = 'MIT'
  spec.authors       = ['Mattia Roccoberton']
  spec.email         = 'mat@blocknot.es'
  spec.homepage      = 'https://github.com/rs-pro/activeadmin-quill_editor'

  spec.required_ruby_version = '>= 3.0'

  spec.metadata['homepage_uri']    = spec.homepage
  spec.metadata['changelog_uri']   = 'https://github.com/rs-pro/activeadmin-quill_editor/blob/main/CHANGELOG.md'
  spec.metadata['source_code_uri'] = spec.homepage

  spec.metadata['rubygems_mfa_required'] = 'true'

  spec.files         = Dir['{app,lib,vendor}/**/*', 'LICENSE.txt', 'Rakefile', 'README.md']
  spec.require_paths = ['lib']

  spec.add_runtime_dependency 'activeadmin', '>= 2.9', '< 5' # rubocop:disable Gemspec/AddRuntimeDependency
  spec.add_runtime_dependency 'rails', '>= 6.0'
end
