'use strict';

var request = require('co-request');
var url = require('url');
var co = require('co');
var slug = require('slug');
var yaml = require('yaml-js');
var fs = require('fs');
var logger = console.log;
var authenticationToken = null;
var apiGatewayUrl = null;



var loadRegisterFile = function(opts) {
    var registerData = JSON.stringify(require(opts.dirConfig +'/register.json'));
    return JSON.parse(registerData.replace(/#\(service.id\)/g, opts.id)
        .replace(/#\(service.name\)/g, opts.name);
};
var loadPublicSwagger = function(opts) {
    return yaml.load(fs.readFileSync(opts.dirConfig +'/public-swagger.yml').toString());
};


/**
 * Register /info endpoint. This endpoint is called from api-gateway to obtain info of the microservice.
 * The request contain the url of the api-gateway and the authentication token for the microservice.
 * IMPORTANT: In dev environment (NODE_ENV=dev) url is obtained of one environent variables:
 *  url = API_GATEWAY_URL
 *  and token value is generated as simulate value (only for dev)
 * @param  {object} opts object with the id, name and uri values
 * @public
 */
var register = function(opts) {
    return co(function*() {
        logger = opts.logger || {info: console.log, debug: console.log, error: console.error};

        opts.app.use(function*(next){
            if(this.path === '/info'){
                logger.info('Obtaining info to register microservice with token %s and url %s', this.query.token, this.query.url);
                this.assert(this.query.token, 400, 'token param required');
                this.assert(this.query.url, 400, 'url param required');
                authenticationToken = this.query.token;
                apiGatewayUrl = this.query.url;

                let serviceConfig = loadRegisterFile(opts);
                serviceConfig.swagger = loadPublicSwagger(opts);
                this.body = serviceConfig;
                return;
            }
            yield next;
        });
        if(process.env.NODE_ENV === 'dev'){
            authenticationToken = 'simulateToken-' + opts.id;
            apiGatewayUrl = process.env.API_GATEWAY_URL;
        }

    });
};

/**
 * Do request to other microservice. url is the path of the endpoint in the microservice target
 * and add authentication header
 * @param  {object} config object with the configuration request.
 * Doc: https://github.com/request/request/blob/master/README.md
 * @public
 */
var requestToMicroservice = function *(config){
    logger.info('Adding authentication header with token ', authenticationToken);
    config.headers = Object.assign(config.headers || {}, { 'authentication': authenticationToken});
    config.uri = apiGatewayUrl + config.uri ;
    return yield request(config);
};

module.exports = {
    register: register,
    requestToMicroservice: requestToMicroservice
};
