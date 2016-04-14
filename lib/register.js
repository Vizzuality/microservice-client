'use strict';
var debug = require('debug');
var request = require('co-request');
var url = require('url');
var co = require('co');
var slug = require('slug');
var yaml = require('yaml-js');
var fs = require('fs');


var unregisterDone = false;



/**
 * Unregister service of api-gateway
 *
 * @param  {object} opts object with the id, name and uri values
 *
 */
var unregister = function* (opts) {
    if(!unregisterDone){
        debug('Unregistering service ', opts.id);
        try {
            let result = yield request({
                uri: process.env.API_GATEWAY_URI + '/' + opts.id,
                method: 'DELETE'
            });
            if(result.statusCode !== 200) {
                console.error('Error unregistering service');
                process.exit();
            }
            unregisterDone = true;
            debug('Unregister service correct!');
            process.exit();
        } catch(e) {
            console.error('Error unregistering service');
            process.exit();
        }
    }
};

var exitHandler = function (signal) {
    co(function* () {
        yield unregister();
    });
};


var loadRegisterFile = function(opts){
    var registerData = JSON.stringify(require('../microservice/register.json'));
    return JSON.parse(registerData.replace(/#\(service.id\)/g, opts.id))
        .replace(/#\(service.name\)/g, opts.name)
        .replace(/#\(service.uri\)/g, opts.uri);
};
var loadPublicSwagger = function(){
    return yaml.load(fs.readFileSync(__dirname + '/../microservice/public-swagger.yml').toString());
};


/**
 * Register service in api-gateway if SELF_REGISTRY environment variable is equal to 'on'
 * Is required that the API_GATEWAY_URI environment variable is declared.
 * @param  {object} opts object with the id, name and uri values
 * @public
 */
var register = function(opts) {
    if (process.env.SELF_REGISTRY === 'on') {
        if(!process.env.API_GATEWAY_URI){
            console.error('API_GATEWAY_URI not defined');
            throw new Error('API_GATEWAY_URI not defined');
        }
        co(function*() {
            var packageJSON = require('../../package.json');
            let serviceConfig = loadRegisterFile();
            serviceConfig.swagger = loadPublicSwagger();
            debug(serviceConfig);
            try {

                let result = yield request({
                    uri: process.env.API_GATEWAY_URI,
                    method: 'POST',
                    json: true,
                    body: serviceConfig
                });

                if (result.statusCode !== 200) {
                    console.error('Error registering service:');
                    console.error(result);
                    throw new Error('Error registering service:' + result);
                }

                debug('Register service in API Gateway correct!');
                process.on('exit', exitHandler.bind(this, 'exit'));
                process.on('SIGINT', exitHandler.bind(this, 'SIGINT'));
                process.on('SIGTERM', exitHandler.bind(this, 'SIGTERM'));
                // process.on('SIGKILL', exitHandler.bind(this, 'SIGKILL'));
                process.on('uncaughtException', exitHandler.bind(this, 'uncaughtException'));

            } catch (e) {
                console.error('Error registering service');
                console.error(e);
                throw e;
            }
        });
    }
};

module.exports = register;
