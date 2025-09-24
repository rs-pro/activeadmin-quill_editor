# frozen_string_literal: true

source 'https://rubygems.org'

def eval_version(dependency, version)
  return [dependency] if version.empty?

  # Handle versions that already have operators like ~>, >=, etc.
  if version.match?(/^[~<>=]/)
    [dependency, version]
  else
    # Add ~> operator and ensure version has at least 2 dots
    version.count('.') < 2 ? [dependency, "~> #{version}.0"] : [dependency, "~> #{version}"]
  end
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
active_admin_requirement =
  if active_admin_ver.empty?
    '~> 4.0.0.beta16'
  elsif active_admin_ver.match?(/[a-zA-Z]/) || active_admin_ver.match?(/^[~<>=]/)
    active_admin_ver
  else
    target = Gem::Version.new(active_admin_ver)
    if target >= Gem::Version.new('4.0')
      '~> 4.0.0.beta16'
    else
      active_admin_ver.count('.') < 2 ? "~> #{active_admin_ver}.0" : "~> #{active_admin_ver}"
    end
  end

gem 'activeadmin', active_admin_requirement

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
  gem 'importmap-rails' # Required for ActiveAdmin 4
  gem 'propshaft'
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
gem 'appraisal'
gem 'pry-rails'
