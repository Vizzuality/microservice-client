'use strict';

var request = require('co-request');
var url = require('url');
var co = require('co');
var slug = require('slug');
var yaml = require('yaml-js');
var fs = require('fs');


var unregisterDone = false;
var logger = console.log;
/**
 * Unregister service of api-gateway
 *
 * @param  {object} opts object with the id, name and uri values
 *
 */
var unregister = function*(opts) {
    if (!unregisterDone) {
        logger.info('Unregistering service ', opts.id);
        try {
            let result = yield request({
                uri: process.env.API_GATEWAY_URI + '/gateway/service/' + opts.id,
                method: 'DELETE'
            });
            if (result.statusCode !== 200) {
                console.error('Error unregistering service');
                process.exit();
            }
            unregisterDone = true;
            logger.info('Unregister service correct!');
            process.exit();
        } catch (e) {
            console.error('Error unregistering service');
            process.exit();
        }
    }
};

var exitHandler = function(signal) {
    logger.debug('Signal ', signal);
    co(function*() {
        yield unregister();
    }).then(function(){}, function(err){
        logger.error(err);
        process.exit();
    });
};


var loadRegisterFile = function(opts) {
    var registerData = JSON.stringify(require(opts.dirConfig +'/register.json'));
    return JSON.parse(registerData.replace(/#\(service.id\)/g, opts.id)
        .replace(/#\(service.name\)/g, opts.name)
        .replace(/#\(service.uri\)/g, opts.uri));
};
var loadPublicSwagger = function(opts) {
    return yaml.load(fs.readFileSync(opts.dirConfig +'/public-swagger.yml').toString());
};


/**
 * Register service in api-gateway if SELF_REGISTRY environment variable is equal to 'on'
 * Is required that the API_GATEWAY_URI environment variable is declared.
 * @param  {object} opts object with the id, name and uri values
 * @public
 */
var register = function(opts) {
    return co(function*() {
        logger = opts.logger || {info: console.log, debug: console.log, error: console.error};
        if (process.env.SELF_REGISTRY === 'on') {
            if (!process.env.API_GATEWAY_URI) {
                console.error('API_GATEWAY_URI not defined');
                throw new Error('API_GATEWAY_URI not defined');
            }

            logger.info('Obtaining info to register microservice');

            var packageJSON = require(opts.dirPackage + '/package.json');
            let serviceConfig = loadRegisterFile(opts);
            serviceConfig.swagger = loadPublicSwagger(opts);
            logger.debug(serviceConfig);
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

                logger.info('Register service in API Gateway correct!');
                process.on('exit', exitHandler.bind(this, 'exit'));
                process.on('SIGINT', exitHandler.bind(this, 'SIGINT'));
                process.on('SIGTERM', exitHandler.bind(this, 'SIGTERM'));
                // process.on('SIGKILL', exitHandler.bind(this, 'SIGKILL'));
                process.on('uncaughtException', exitHandler.bind(this, 'uncaughtException'));

            } catch (e) {
                logger.error('Error registering service');
                throw e;
            }

        }
    });
};

module.exports = register;
