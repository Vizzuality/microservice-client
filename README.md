# register-microservice-client
Library to register/unregister microservice in the api-gateway

## Install
````
npm install --save https://github.com/Vizzuality/register-microservice-client
````

## Use in microservice
In listen callback of express/koajs app add the next code:
````
    var promise = require('register-microservice-client')({
        id: config.get('service.id'),
        name: config.get('service.name'),
        dirConfig: path.join(__dirname, '../microservice'),
        dirPackage: path.join(__dirname, '../../'),
        logger: logger,
        app: app //koa app object
    });
    p.then(function() {}, function(err) {
        logger.error(err);
        process.exit(1);
    });
````

This code, call to register library with the config of the microservice. All config is required. Is necesary defined 1 environment variables when you are developing in develop environment. This variables are:

*  API_GATEWAY_URL =  Url of the api-gateway. For example: http://192.168.99.100:8000

The token is generated from id of the microservice in dev environment
