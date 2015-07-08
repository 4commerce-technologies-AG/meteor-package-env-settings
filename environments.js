// use for file access
var fs = Npm.require('fs');
// using this meteor lib, gives secure access to folder structure
var files = Npm.require("./mini-files");

// save reference to serverDir
var serverDir = files.pathResolve(__meteor_bootstrap__.serverDir);

// Taken from meteor/tools/bundler.js#L1509
// currently the directory structure has not changed for build
var assetBundlePath = files.pathJoin(serverDir, 'assets', 'app');

// location of the private config folders
var configPath = files.pathJoin(assetBundlePath, 'config');

// when showing error messages, we want to show the shortest path
// to the private asset ressource and not the absolute path from bundle
function assetPath(path) {
  return path.replace(assetBundlePath, '').substring(1);
}

// helper function to search for path and regex-match 
// recursive. if nothing is given as arguments, result
// is all files from one path
function locateFiles(path, recursive_, match_, files_) {
  match_ = match_ || /.+/;
  recursive_ = false || recursive_;
  files_ = files_ || [];
  // check if directory exists otherwise ignore configurations from there
  var isDirectory = false;
  try { isDirectory = fs.statSync(path).isDirectory() } catch(e) {}
  // loop directory entries
  if (isDirectory) {
    var list = fs.readdirSync(path);
    for (var i in list) {
      var entry = files.pathJoin(path, list[i]);
      if (fs.statSync(entry).isDirectory()) {
        if (recursive_) {
          locateFiles(entry, recursive_, match_, files_);
        }
      } else {
        if (entry && entry.match(match_)) {
          files_.push(entry);
        }
      }
    }
  }
  return files_;
}

// this function loops through an array of filenames
// and tries to load and instantiate them.
// result is the deepMerge for all files 
function loadConfigFiles(filenames, config) {
  config = config || {}
  _.each(filenames, function(filename) {
    var content = loadConfigFile(filename);
    if(content !== false) {
      // try to parse the content and return instantiated object 
      var config_ = parseConfig(content, filename);
      // check that no public attribute is used at root
      if (config_ && _.has(config_, 'public')) {
       throw new Meteor.Error('It is not allowed to include public settings at server or public config files on <root> level! Error in file ' + assetPath(filename) + '.' );
      }
      // merge objects
      _.deepExtend(config, config_, true);
    }
  });
}

// this function reads the content from filesystem
function loadConfigFile(filename) {
  // load the server side config
  var errorMsg = 'Could not find config file ' + assetPath(filename) + ' in your meteor app!';
  try {
    var res = fs.readFileSync(filename);
    if(!res) {
      throw new Meteor.Error( 'The file ' + assetPath(filename) + ' does not exist!' );
    } else {
      return res;
    }
  } catch(error) {
  }
}

// this function checks and loads the content for yaml and json files
function parseConfig(content, filename) {
  try {
    return YAML.safeLoad(content);
  } catch (e) {
    throw new Meteor.Error('The content of file ' + assetPath(filename) + ' does not contain valid YAML!' );
  }
}

// read complete set of config files and return a new settings object
// directory structure will be read by
// config/(server|public).(json|yaml|yml)
// config/(server|public)/*.(json|yaml|yml) ! not recursive sub-directories
// config/$NODE_ENV/(server|public).(json|yaml|yml)
// config/$NODE_ENV/(server|public)/*.(json|yaml|yml) ! not recursive sub-directories
function getConfig(configPath, scope) {
  var config = {}
  var match_file_ = new RegExp("/" + scope + "\.(json|yml|yaml)$");
  var match_files_ = new RegExp("[^/]+\.(json|yml|yaml)$");
  
  loadConfigFiles(locateFiles(configPath, false, match_file_), config);
  loadConfigFiles(locateFiles(files.pathJoin(configPath, scope), false, match_files_), config);
  loadConfigFiles(locateFiles(files.pathJoin(configPath, process.env.NODE_ENV), false, match_file_), config);
  loadConfigFiles(locateFiles(files.pathJoin(configPath, process.env.NODE_ENV, scope), false, match_files_), config);

  return config;
}

// this packages will autoload settings from private assets folder
// located at private/config (see function getConfig)
Meteor.startup(function () {

  // extend the global settings
  var serverConfig = getConfig(configPath, 'server');
  if (Meteor.settings) {
    _.deepExtend(Meteor.settings, serverConfig, true);
  } else {
    Meteor.settings = serverConfig;
  }

  // extend Meteor.settings.public
  var publicConfig = getConfig(configPath, 'public');
  if (Meteor.settings.public) {
    _.deepExtend(Meteor.settings.public, publicConfig, true);
  } else {
    Meteor.settings.public = publicConfig;
    // check if we need to append the new public settings also
    // to the runtime_environment. this happens, when no settings
    // before via --settings or METEOR_SETTINGS was set.
    // taken from packages/meteor/server_environments.js
    // Push a subset of settings to the client.
    // ----
    // if PR on github is accepted
    // https://github.com/meteor/meteor/pull/4704
    // then this won't be necessary anymore
    if (typeof __meteor_runtime_config__ === "object") {
      __meteor_runtime_config__.PUBLIC_SETTINGS = Meteor.settings.public;
    }
  }

  // extend Meteor.settings and Meteor.settings.public with some useful addtional attributes
  Meteor.settings.environment = {
    env: process.env.NODE_ENV,
    serverDir: serverDir    
  }
  Meteor.settings.public.environment = {
    env: process.env.NODE_ENV
  }

});
