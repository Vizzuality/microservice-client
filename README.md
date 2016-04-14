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
        uri: config.get('service.uri'),
        dirConfig: path.join(__dirname, '../microservice'),
        dirPackage: path.join(__dirname, '../../'),
        logger: logger
    });
    p.then(function() {}, function(err) {
        logger.error(err);
        process.exit(1);
    });
````

This code, call to register library with the config of the microservice. All config is required.
