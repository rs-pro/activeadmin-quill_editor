# Repository Guidelines

## Project Structure & Module Organization
The gem code lives in `lib/activeadmin` and `lib/formtastic`, with the public entry point in `lib/activeadmin_quill_editor.rb`. Ruby assets and templates that Active Admin mounts ship from `app/assets` and `app/views`. Front-end bundles exposed to consuming apps sit in `index.js` and the `app/assets/javascripts/activeadmin/quill_editor` tree. System specs exercise the dummy Rails app under `spec/dummy`, while reusable page helpers reside in `spec/page_objects`.

## Build, Test, and Development Commands
`make up` builds the Docker environment defined in `extra/docker-compose.yml` and prepares the dummy app; add `RUBY`, `RAILS`, or `ACTIVEADMIN` env vars to test matrix combinations. Run `make specs` (or directly `bin/rspec --fail-fast`) to execute the suite, and `make lint` to invoke `bin/rubocop` inside the container. Use `make shell` for interactive debugging and `make server` to boot the dummy Rails instance at `SERVER_PORT`.

## Coding Style & Naming Conventions
Follow the `.rubocop.yml` rules: two-space indentation, trailing commas on multiline literals, double quotes where interpolation occurs, and `snake_case` for Ruby identifiers. Use `CamelCase` for classes and modules under the `ActiveadminQuillEditor` namespace, mirroring existing files. JavaScript additions in `app/assets/javascripts` should align with the lintable ES module style in `index.js`; run `npx eslint index.js` if you modify the package entry point.

## Testing Guidelines
RSpec powers the suite; place feature-level coverage in `spec/system`, supporting components in `spec/page_objects`, and pure Ruby behaviour in `spec`. Prefer descriptive example names (`it "renders toolbar buttons"`) and keep factories in the dummy app to mirror real usage. Start tests with `make specs`; use `bin/rspec spec/system/editor_spec.rb` to target a file.

## Commit & Pull Request Guidelines
Recent history follows conventional prefixes (`fix:`, `ci:`, `chore:`); keep messages in the imperative mood and limit the subject to 72 characters. Every pull request should link related GitHub issues, summarize user-facing changes, and note any docs or assets touched. Include screenshots or GIFs when altering the editor UI, and confirm that both `make specs` and `make lint` pass in the PR description. Request review from a maintainer and re-run the pipeline after rebases.

## Security & Configuration Tips
Store local-only overrides in `extra/.env` (kept out of version control) and avoid committing credentials to the dummy app. The docker-compose services mount the repository directly, so prefer editing files via your host editor rather than inside the container to prevent permission drift.
