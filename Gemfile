# frozen_string_literal: true

source 'https://rubygems.org'

def eval_version(dependency, version)
  return [dependency] if version.empty?

  version.count('.') < 2 ? [dependency, "~> #{version}.0"] : [dependency, version]
end

if ENV['DEVEL'] == '1'
  gem 'activeadmin_quill_editor', path: './'
else
  gemspec
end

ruby_ver = ENV.fetch('RUBY_VERSION', '')

rails_ver = ENV.fetch('RAILS_VERSION', '')
rails = eval_version('rails', rails_ver)
gem(*rails)

active_admin_ver = ENV.fetch('ACTIVEADMIN_VERSION', '')
if active_admin_ver.empty?
  # Use ActiveAdmin 4 beta by default for development
  gem 'activeadmin', '~> 4.0.0.beta'
else
  active_admin = eval_version('activeadmin', active_admin_ver)
  gem(*active_admin)
end

ruby32 = ruby_ver.empty? || Gem::Version.new(ruby_ver) >= Gem::Version.new('3.2')
rails72 = rails_ver.empty? || Gem::Version.new(rails_ver) >= Gem::Version.new('7.2')
sqlite3 = ruby32 && rails72 ? ['sqlite3'] : ['sqlite3', '~> 1.4']
gem(*sqlite3)

gem 'zeitwerk', '~> 2.6.18' unless ruby32

# NOTE: to avoid error: uninitialized constant ActiveSupport::LoggerThreadSafeLevel::Logger
gem 'concurrent-ruby', '1.3.4'

# Misc
gem 'bigdecimal'
gem 'csv'
gem 'mutex_m'
gem 'puma'

# Asset pipeline - use Propshaft for Rails 8, Sprockets for older versions
rails80 = rails_ver.empty? || Gem::Version.new(rails_ver) >= Gem::Version.new('8.0')
if rails80
  gem 'propshaft'
  gem 'importmap-rails'  # Required for ActiveAdmin 4
else
  gem 'sassc'
  gem 'sprockets-rails'
end

# Testing
gem 'capybara'
gem 'cuprite'
gem 'rspec_junit_formatter'
gem 'rspec-rails'
gem 'simplecov', require: false
gem 'super_diff'

# Linters
gem 'fasterer'
gem 'rubocop'
gem 'rubocop-capybara'
gem 'rubocop-packaging'
gem 'rubocop-performance'
gem 'rubocop-rails'
gem 'rubocop-rspec'
gem 'rubocop-rspec_rails'

# Tools
gem 'pry-rails'
