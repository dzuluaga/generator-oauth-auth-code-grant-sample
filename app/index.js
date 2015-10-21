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
        name: 'uname',
        message: 'Your user name',
        required: true,
        store   : true,
        default: 'example@example.com' // Default to current folder name
      }, {
        type: 'password',
        name: 'password',
        message: 'Password',
        required: true,
        store   : true,
        default: 'none' // Default to current folder name
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
      }, {
        type: 'input',
        name: 'envname',
        message: 'Environment Name',
        required: true,
        store   : true,
      }

    ];

    this.prompt(prompts, function(answers) {
      this.uname = answers.uname;
      this.orgname = answers.orgname;
      this.envname = answers.envname;
      this.password= answers.password;
      this.mgmtapiurl = answers.mgmtapiurl;
      this.callbackurl = 'https://'+this.orgname+'-'+this.envname+'.apigee.net/web/callback';
      done();
    }.bind(this));
  },


  apiProxySetup: function() {
    //copy user-mgmt-v1
    this.bulkDirectory('user-mgmt-v1/apiproxy', 'user-mgmt-v1/apiproxy');

    //copy oauth2
    this.bulkDirectory('oauth2/apiproxy', 'oauth2/apiproxy');

    //copy provisioning and login-app
    this.bulkDirectory('provisioning', 'provisioning');
    this.bulkDirectory('login-app/apiproxy', 'login-app/apiproxy');

    //copy webserver-app
    this.bulkDirectory('webserver-app/apiproxy', 'webserver-app/apiproxy');
    // this.fs.copyTpl(
    //   this.templatePath('login-app/apiproxy/resources/node/config/config.js'),
    //   this.destinationPath('login-app/apiproxy/resources/node/config/config.js'), {
    //     orgname: this.orgname,
    //     envname: this.envname
    //   }
    // );

  },


//run last
  install: function(){

    // configure login-app and provisioning
    shell.sed('-i','ENVNAME', this.envname, 'login-app/apiproxy/resources/node/config/config.js');
    shell.sed('-i','ORGNAME', this.orgname, 'login-app/apiproxy/resources/node/config/config.js');

    shell.sed('-i','CALLBACKURL', this.callbackurl, 'provisioning/webserver-app.xml');

    // deploy user-mgmt-v1
    shell.cd('user-mgmt-v1');
    shell.exec('apigeetool deployproxy -u '+this.uname+' -p '+this.password+' -o '+this.orgname+' -e '+this.envname+ ' -n user-mgmt-v1 -d .');

    // deploy oauth2
    shell.cd('../oauth2');
    shell.exec('apigeetool deployproxy -u '+this.uname+' -p '+this.password+' -o '+this.orgname+' -e '+this.envname+ ' -n oauth2 -d .');

    // provision login-app
    shell.cd('../provisioning');
    shell.exec('./provision-login-app.sh '+this.uname+' '+this.password+' '+this.orgname+' '+this.envname+' '+this.mgmtapiurl);

    // npm install for login-app
    shell.cd('../login-app/apiproxy/resources/node');
    shell.exec('npm install');

    // deploy login-app
    shell.cd('../../..');
    shell.exec('apigeetool deployproxy -u '+this.uname+' -p '+this.password+' -o '+this.orgname+' -e '+this.envname+ ' -n login-app -d . -U');

    // provision webserver
    shell.cd('../provisioning');
    shell.exec('./provision-webserver.sh '+this.uname+' '+this.password+' '+this.orgname+' '+this.envname+' '+this.mgmtapiurl);

    //capture clientID and secret from last step and put in webserver-app bundle
    var webserverappkey = shell.exec("curl -H 'Accept: application/json' -u "+this.uname+":"+this.password+" "+this.mgmtapiurl+"/v1/o/"+this.orgname+"/developers/webdev@example.com/apps/webserver-app 2>/dev/null | grep consumerKey | awk -F '\"' '{ print $4 }'").output;
    var webserverappsecret = shell.exec("curl -H 'Accept: application/json' -u "+this.uname+":"+this.password+" "+this.mgmtapiurl+"/v1/o/"+this.orgname+"/developers/webdev@example.com/apps/webserver-app 2>/dev/null | grep consumerSecret | awk -F '\"' '{ print $4 }'").output;
    // remove trailing whitespace
    webserverappkey = webserverappkey.replace(/\n$/, "");
    webserverappsecret = webserverappsecret.replace(/\n$/, "");


    shell.cd('..');
    //configure webserver-app bundle
    shell.sed('-i','WEBSERVERAPPKEY', webserverappkey, 'webserver-app/apiproxy/policies/SetConfigurationVariables.xml');
    shell.sed('-i','WEBSERVERAPPSECRET', webserverappsecret, 'webserver-app/apiproxy/policies/SetConfigurationVariables.xml');
    shell.sed('-i','ENVNAME', this.envname, 'webserver-app/apiproxy/policies/SetConfigurationVariables.xml');
    shell.sed('-i','ORGNAME', this.orgname, 'webserver-app/apiproxy/policies/SetConfigurationVariables.xml');

    // configure webserver-app HTML INDEX
    shell.sed('-i','WEBSERVERAPPKEY', webserverappkey, 'webserver-app/apiproxy/policies/HTMLIndex.xml');
    shell.sed('-i','ENVNAME', this.envname, 'webserver-app/apiproxy/policies/HTMLIndex.xml');
    shell.sed('-i','ORGNAME', this.orgname, 'webserver-app/apiproxy/policies/HTMLIndex.xml');
    shell.sed('-i','CALLBACKURL', this.callbackurl, 'webserver-app/apiproxy/policies/HTMLIndex.xml');

    shell.cd('webserver-app');
    //deploy webserver-app bundle
    shell.exec('apigeetool deployproxy -u '+this.uname+' -p '+this.password+' -o '+this.orgname+' -e '+this.envname+ ' -n webserver-app -d .');

  },

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