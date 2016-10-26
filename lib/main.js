'use strict';

var request = require('co-request');
var url = require('url');
var co = require('co');
var yaml = require('yaml-js');
var fs = require('fs');
var logger =  {info: console.log, debug: console.log, error: console.error, warn: console.warn};
var authenticationToken = process.env.GATEWAY_TOKEN;
var apiGatewayUrl = process.env.NODE_ENV !== 'dev' ? process.env.GATEWAY_URL : process.env.API_GATEWAY_URL;



var loadRegisterFile = function(opts) {
    var registerData = JSON.stringify(require(opts.dirConfig +'/register.json'));
    return JSON.parse(registerData.replace(/#\(service.id\)/g, opts.id)
        .replace(/#\(service.name\)/g, opts.name));
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
    if(opts.logger){
        logger = opts.logger;
    }
    logger.info('Registering microservice');
    opts.app.use(function*(next){
        if(this.path === '/info'){
            logger.info('Obtaining info to register microservice');

            let serviceConfig = loadRegisterFile(opts);
            serviceConfig.swagger = loadPublicSwagger(opts);
            this.body = serviceConfig;
            return;
        } else if(this.path === '/ping'){
            this.body = 'pong';
            return;
        }
        yield next;
    });

};

var autoDiscovery= function *(){

    apiGatewayUrl = process.env.API_GATEWAY_URL;
    logger.info('Doing request to refresh registered microservices in api-gateway');
    yield request({
        uri: apiGatewayUrl + '/gateway/service/refresh',
        method: 'GET',
        json: true
    });
}

/**
 * Do request to other microservice. url is the path of the endpoint in the microservice target
 * and add authentication header.
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

/**
 * Return api-gateway url and authenticationToken.
 * @public
 */
var getInfo = function (){
    return {
        apiGatewayUrl: apiGatewayUrl,
        authenticationToken: authenticationToken
    }
};

/**
 * Config api-gateway url and authentication token. {authenticationToken: <token>, apiGatewayUrl: <url>}
 * @public
 */
var setDataConnection = function(opts){
    authenticationToken =opts.authenticationToken;
    apiGatewayUrl = opts.apiGatewayUrl;
}

module.exports = {
    register: register,
    autoDiscovery: autoDiscovery,
    requestToMicroservice: requestToMicroservice,
    getInfo: getInfo,
    setDataConnection: setDataConnection
};
