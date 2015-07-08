Package.describe({
  name: '4commerce:environments',
  version: '1.0.0',
  summary: 'Autoload and merge settings (YAML, JSON) for server and client from private assets based on NODE_ENV.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/4commerce-technologies-AG/meteor-package-environments',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('underscore');
  api.use('meteorblackbelt:underscore-deep@0.0.3');
  api.use('udondan:yml@3.2.2_1', 'server');
  api.addFiles('environments.js','server');
  api.use('templating', 'client');
  api.addFiles('environments-client.js','client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('4commerce:environments');
  api.addFiles('environments-tests.js');
});
