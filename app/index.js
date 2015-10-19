'use strict';

var join = require('path').join;
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var shell = require('shelljs');
//var apigeeSdk = require('apigee-sdk-mgmt-api');

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
    this.pkg = require('../package.json');
  },

  askFor: function() {
    var done = this.async();
    // welcome message
    if (!this.options['skip-welcome-message']) {
      this.log(require('yosay')());
      this.log(chalk.magenta(
        'Sample Generator of OAuth Authorization Code Grant Type Proxies.'
      ));
    }

    var prompts = [{
        type: 'input',
        name: 'apiname',
        message: 'Your api name',
        required: true,
        store   : true,
        default: this.appname // Default to current folder name
      }, {
        type: 'input',
        name: 'basepath',
        message: 'Basepath',
        required: true,
        store   : true,
        default: '/v1' // Default to current folder name
      }, {
        type: 'input',
        name: 'mgmtapiurl',
        message: 'Management API URL Endpoint',
        required: true,
        store   : true,
        default: 'https://api.enterprise.apigee.com' // Default to current folder name
      }, {
        type: 'input',
        name: 'orgname',
        message: 'Organization Name',
        required: true,
        store   : true,
      }

    ];

    this.prompt(prompts, function(answers) {
      this.apiname = this._.slugify(answers.apiname);
      this.orgname = answers.orgname;
      this.mgmtapiurl = answers.mgmtapiurl;
      this.basepath = answers.basepath;
      done();
    }.bind(this));
  },

  replaceSetEnv: function() {
    this.fs.copyTpl(
      this.templatePath('setenv.sh'),
      this.destinationPath('setenv.sh'), {
        orgname: this.orgname,
      }
    );
  },

  apiProxyLoginApp: function() {
    this.bulkDirectory('login-app/apiproxy', 'login-app/apiproxy');
  },

  apiProxyWebApp: function() {
    this.bulkDirectory('webserver-app/apiproxy', 'webserver-app/apiproxy');
    //shell.exec('apigeetool --version');
  },

  install: function(){
    shell.exec('apigeetool --version');
  },

  /*
    gruntfile: function () {
      this.template('Gruntfile.js');
    },
  */

/*
    apiProxyLoginApp: function() {
    this.bulkDirectory('login-app/apiproxy/policies', 'login-app/apiproxy/policies');
    this.bulkDirectory('login-app/apiproxy/proxies', 'login-app/apiproxy/proxies');
    this.bulkDirectory('login-app/apiproxy/resources', 'login-app/apiproxy/resources');
    this.bulkDirectory('login-app/apiproxy/targets', 'alogin-app/piproxy/targets');
    this.copy('login-app/apiproxy/loginapp.xml', 'login-app/apiproxy/loginapp.xml');
  },

  grunt: function() {
    this.bulkDirectory('grunt/conf', 'grunt/conf');
    this.bulkDirectory('grunt/lib', 'grunt/lib');
    this.bulkDirectory('grunt/tasks', 'grunt/tasks');
    this.copy('grunt/search-and-replace-files.js', 'grunt/search-and-replace-files.js');
  },

  node: function() {
    this.bulkDirectory('node', 'node');
  },
  tests: function() {
    this.copy('tests/forecastweather-grunt-plugin-api.js', 'tests/' + this.apiname + '.js');
    this.fs.copyTpl(
      this.templatePath('tests/forecastweather-grunt-plugin-api-test-data.js'),
      this.destinationPath('tests/' + this.apiname + '-test-data.js'), {
        orgname: this.orgname,
        basepath : this.basepath,
      }
    );
    this.fs.copyTpl(
      this.templatePath('tests/forecastweather-grunt-plugin-api-prod-data.js'),
      this.destinationPath('tests/' + this.apiname + '-prod-data.js'), {
        orgname: this.orgname,
        basepath : this.basepath,
      }
    );
    //this.copy('tests/forecastweather-grunt-plugin-api-test-data.js', 'test/' + this.apiname + '-test-data.js');
    //this.copy('tests/forecastweather-grunt-plugin-api-prod-data.js', 'test/' + this.apiname + '-prod-data.js');
  },

  config: function() {
    this.bulkDirectory('config', 'config');
  },

  git: function() {
    this.template('gitignore', '.gitignore');
  },

  others: function() {
    this.copy('travis.yml', '.travis.yml');
    this.copy('Gruntfile.js', 'Gruntfile.js');
  },

  copyApigeeConfigTemplate: function() {
    this.fs.copyTpl(
      this.templatePath('grunt/apigee-config.js'),
      this.destinationPath('grunt/apigee-config.js'), {
        apiname: this.apiname,
        orgname: this.orgname,
        mgmtapiurl: this.mgmtapiurl,
        basepath : this.basepath,
        gitrevision: "<%= grunt.option('gitRevision') %>",
        apidescriptorfile: "target/apiproxy/<%= apigee_profiles[grunt.option('env')].apiproxy %>.xml"
      }
    );
  },

  copyDefault: function() {
    this.fs.copyTpl(
      this.templatePath('apiproxy/proxies/default.xml'),
      this.destinationPath('apiproxy/proxies/default.xml'), {
        basepath: this.basepath,
      }
    );
  },

  copyPackage: function() {
    this.fs.copyTpl(
      this.templatePath('package.json'),
      this.destinationPath('package.json'), {
        apiname: this.apiname,
      }
    );
  },

  copyReadme: function() {
    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('README.md'), {
        apiname: this.apiname,
      }
    );
  },

  install: function() {
    this.npmInstall();
  }*/
});