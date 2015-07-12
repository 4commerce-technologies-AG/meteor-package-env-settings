# 4commerce:env-settings

This [meteorjs](https://www.meteor.com) package allows you to organize your settings inside your private assets directory. The configuration files will be autoloaded during startup based on the active environment.

Now you can easily switch between settings just by changing the NODE_ENV variable.

The package also allows to specify different configuration files for server and public settings.

Last but not least you can divide your configuration files into partials and get them merged and overloaded during startup. You can define defaults and redefine only a few afterwards based on the active environment (see samples below).

The config files may be written (also mixed) in YAML and JSON notation. 

### Installation

You can add this package to your meteor app like any other package from atmosphere

````
$ meteor add 4commerce:env-settings
````

### Directory structure

All configuration files must be placed in

````
private/config
````

There is the option to create sub-directories for all environments to load a set of configuration files for server and public

*Defaults*

````
private/config/public/
private/config/server/
````

*Per environment*

````
private/config/development/public/
private/config/development/server/

private/config/production/public/
private/config/production/server/
````

> You may name your environments as you like but I advise you to stay with the standards like development, production and testing.

*Single file configurations*

If you do not want to create partials for your configuration files, you also may use (also mixable) the single file naming:

````
private/config/public.yaml
private/config/server.yaml

private/config/production/public.yaml
private/config/production/server.yaml
````

*File extensions*

The loader will only take care of following files, all others are skipped:

````
*.json
*.yaml
*.yml
````

*Loading order*

Below you see the complete pattern matching and also the loading order. Config files are loaded and merged from inner to outer sub-directories. Beware of this when deciding your overloads.

````
private/config/public.(json|yaml|yml)
private/config/public/*.(json|yaml|yml)
private/config/environment/public.(json|yaml|yml)
private/config/environment/public/*.(json|yaml|yml)

private/config/server.(json|yaml|yml)
private/config/server/*.(json|yaml|yml)
private/config/environment/server.(json|yaml|yml)
private/config/environment/server/*.(json|yaml|yml)
````

> Also the file extensions will touch the ordering and you will overload file.json with file.yaml with file.yml. But, I would advise you to use just one type for each file.

### Meteor.settings

The configuration files are loaded during `Meteor.startup()` which is included in the package.

If you place this package somewhere on top of your used packages, you be able to access your settings on a early stage.

After autoload of your configuration files you may access the settings through the standard `Meteor.settings` and `Meteor.settings.public` object. Your `Meteor.settings.public` values are also available on your client app.

Try `console.log(Meteor.settings);` on both client and server and get what has distributed.

[Read more at meteor documentation](http://docs.meteor.com/#/full/meteor_settings)

### Meteor.settings.(public).runtime

In addition we append a few useful properties about the runtime environment automatically during the loading process.

*Server only:*

````
console.log(Meteor.settings.runtime.env); => "development"
````

````
console.log(Meteor.settings.runtime.serverDir); => absolute file path to your meteor server bundle path
````

*Public both:*

````
console.log(Meteor.settings.public.runtime.env); => "development"
````

### Grammar

Your config files may notated in [JSON](https://en.wikipedia.org/wiki/JSON) and [YAML](https://en.wikipedia.org/wiki/YAML) grammar (see links to Wikipedia).

*Example public.yaml:*

````
application:
  name: "My super application"
  version: "1.0"

images:
  upload: "upload-folder"
  max_size: 10
  auto_shrink: true
````

*Example public.json:*

````
{
  "application": {
    "name": "My super application",
    "version": "1.0"
  },

  "images": {
    "upload": "upload-folder",
    "max_size": 10,
    "auto_shrink": true
  }
}
````

I prefer to use [YAML](https://en.wikipedia.org/wiki/YAML) in case of it's easy notation and leveling.

For parsing YAML and JSON we using [js-yaml](https://github.com/nodeca/js-yaml) and getting file content via it's `safeLoad` method. Please be aware that this is defined as loading untrusted data and therefor some features are not enabled. Currently I can't see any loss on that.

You may check your YAML code on their online editor at: http://nodeca.github.io/js-yaml/

### Loading, overloading and merge

After each config file is loaded, parsed and instatiated, we extend that object to the already existing configuration. For that process we are using `_.deepExtend` which do not replace sub-elements but merge or overload them.

For overloading you have to take care about the file loading order which is described at section _Directory Structure_.

Here is a small example.

*config/public.yaml*

````
caches:
  enabled: false
  tmp_path: /tmp
````

*config/production/public.yaml*

````
caches:
  enabled: true
````

*config/testing/public.yaml*

````
caches:
  tmp_path: /dev/null
````


This will result in always `Meteor.settings.public.caches.enabled == false` except when your environment is `production`.

The value of `Meteor.settings.public.caches.tmp_path` gets overwritten on the `testing` environment only

### Partials

If you want to structure your configuration in partials you can use folders to place them to right configuration context.

*config/public/caches.yaml*

````
caches:
  enabled: false
  tmp_path: /tmp
````

*config/public/mail.yaml*

````
smtp:
  server: mail.local
````

*config/production/public/caches.yaml*

````
caches:
  enabled: true
````

*config/testing/public/mail.yaml*

````
smtp:
  server: mail.trash
````

Be aware that the rules of overloading and file ordering is still the same. 

_Attention_: It is not necessary for the loader, that the partials have the same filename at all environments – but, I advise you to name them equal for clearness.

### Meteor option --settings and METEOR_SETTINGS

In case that we merge and overload the content of your config files to the `Meteor.settings` object, you still can initialize it with the standard options.

### Set mission critical / security values

As said in previous paragraph, you still can load some values to your settings via the `METEOR_SETTINGS` env var. So within that you can place your login credentials like Amazon S3 keys etc. without committing them to your repos. All other app settings getting merged by this package.

### Template.helpers

From release 1.2.0 we dropped the dependencies to our helper packages. If you want to get easy access to your public settings while working on your templates, we advise you to install one or both of our template helpers for that.

##### meteor-namespace-template-helper
 
See package [4commerce:meteor-namespace-template-helper](https://atmospherejs.com/4commerce/meteor-namespace-template-helper). This package brings the Meteor namespace (Meteor.user, Meteor.settings.public etc.) directly to templates.

*Example:*

````
<template name="about">
  <span>{{Meteor.settings.public.application.version}}</span>
</template>
````

Read more at the package's homepage [on GitHub](https://github.com/4commerce-technologies-AG/meteor-package-meteor-namespace-template-helper).

##### pubsettings-template-helper

See package [4commerce:pubsettings-template-helper](https://atmospherejs.com/4commerce/pubsettings-template-helper). This package gain access to `Meteor.settings.public` within your templates by a _ShortCut function_.

*Example:*

````
<template name="about">
  <span>{{pubSettings.application.version}}</span>
</template>
````

Read more at the package's homepage [on GitHub](https://github.com/4commerce-technologies-AG/meteor-package-pubsettings-template-helper).

### Changes to Meteor.settings

The object properties of Meteor.settings are allways writeable. We highly advise you not to make changes to your settings inside your server or your client app. If you have to and can not realize your requests within the configuration files, you should make latest changes while inside main startup code. The setting values are not reactive and changes are not (re-)synced between client and server.

### A public element in your config files

The loading process will automatically merge the public settings at the `Meteor.settings.public` element. Therefor and to make sure, that you have not made a typing error, we denied the occurence of a `public` element at root level inside your public and server configurations (only at root level). This should avoid (miss-typed) structures like `Meteor.settings.public.public`. In such a case an error is thrown with the identification of the false file.

### Package dependencies

When you add this package, follwing dependencies will load:

1. [meteorblackbelt:underscore-deep](https://atmospherejs.com/meteorblackbelt/underscore-deep)
2. [udondan:yml](https://atmospherejs.com/udondan/yml)

### Related packages

When you add this package, follwing are usefull to add:

1. [4commerce:meteor-namespace-template-helper](https://atmospherejs.com/4commerce/meteor-namespace-template-helper)
2. [4commerce:pubsettings-template-helper](https://atmospherejs.com/4commerce/pubsettings-template-helper)

### Issues & help

In case of support or error please report your issue request. The issue tracker is available at: https://github.com/4commerce-technologies-AG/meteor-package-env-settings/issues

### Author & Credits

Author: [Tom Freudenberg, 4commerce technologies AG](http://about.me/tom.freudenberg)

Copyright (c) 2015 [Tom Freudenberg](http://www.4commerce.de/), [4commerce technologies AG](http://www.4commerce.de/), released under the MIT license
