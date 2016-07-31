# register-microservice-client
Library to register/unregister microservice in the api-gateway. This library implement the /info endpoint that the api-gateway uses to obtain info of the registered microservices.
**IMPORTANT** Now only support koajs 1.x framework. Soon, we support expressjs, etc.
## Install
````
npm install --save vizz.microservice-client
````

## Use in microservice
In listen callback of koajs app add the next code:
````
    var promise = require('register-microservice-client').register({
        id: config.get('service.id'),
        name: config.get('service.name'),
        dirConfig: path.join(__dirname, '../microservice'),
        dirPackage: path.join(__dirname, '../../'),
        logger: logger,
        app: app //koa app object,
        callbackUpdate: <function> // this callback is called when the api-gateway call to info endpoint. Is called with the new token and api-gateway url (same object that getInfo() returns)
    });
    p.then(function() {}, function(err) {
        logger.error(err);
        process.exit(1);
    });
````

This code, call to register library with the config of the microservice. All config is required. Is necesary defined 1 environment variables when you are developing in develop environment. This variables are:

*  API_GATEWAY_URL =  Url of the api-gateway. For example: http://192.168.99.100:8000


## API Reference
### register([opts]) => Return Promise Object
Register /info endpoint and in local environment, it make a request to /refresh endpoint in api-gateway to the api-gateway refresh his configuration.
```
// Config the microservice client to listen /info endpoint in this microservice.
    var p = require('vizz.microservice-client').register({
        id: config.get('service.id'),
        name: config.get('service.name'),
        dirConfig: path.join(__dirname, '../microservice'),
        dirPackage: path.join(__dirname, '../../'),
        logger: logger,
        app: app
    });
    p.then(function() {}, function(err) {
        logger.error(err);
        process.exit(1);
    });
```

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>Object</code> |  |
| [opts.id] | <code>String (required)</code> | Id of the service. Is used to replace in register.json |
| [opts.name] | <code>String (required)</code> | Name of the service. Is used to replace in register.json |
| [opts.dirConfig] | <code>String (required)</code> | Folder dir where it is the config of the microservice (public-swagger.yml, swagger.yml and register.json) |
| [opts.dirPackage] | <code>String (required)</code> | Folder dir where it is the package.json file |
| [opts.logger] | <code>Object</code> | Object to show logs. If you don't give, library use console.log |
| [opts.app] | <code>Object (required)</code> | Koa app object. Is used to register /info endpoint |
| [opts.callbackUpdate] | <code>Function</code> | This callback is called when api-gateway call to /info endpoint with the token and api-gateway url params. |


### requestToMicroservice([opts]) => Return result of request.
Method to call to other microservices registered in the same api-gateway. Is a generator function. Add to opts, the token of authentication with the api-gateway. Use [co-request](https://github.com/denys/co-request#readme) library.
Example:
```
let result = yield require('vizz.microservice-client').requestToMicroservice({
            uri: '/geostore/' + hashGeoStore,
            method: 'GET',
            json: true
        });
```
| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>Request config Object</code> |  |

### setDataConnection([opts])
Method to manually config the authentication token and api-gateway url.
Example:
```
let result = yield require('vizz.microservice-client').setDataConnection({
            apiGatewayUrl:'http://192.168.1.10:5000',
            authenticationToken: 'a245614bca9...'
        });
```
| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>Object</code> |  |
| [opts.apiGatewayUrl] | <code>String</code> | Url of api-gateway |
| [opts.authenticationToken] | <code>String</code> | Authentication token |

### getInfo() => Return result of request.
Return api-gateway url and token obtained when api-gateway call to /info endpoint.
Example:
```
let result = yield require('vizz.microservice-client').getInfo();
```
| Result | Type | Description |
| --- | --- | --- |
| [result] | <code>Object</code> |  |
| [result.apiGatewayUrl] | <code>String</code> | Url of api-gateway |
| [result.authenticationToken] | <code>String</code> | Authentication token |

# TODO:
* [ ]  Add support to express framework
