"use strict";
exports.id = "_aws-sdk_credential-provider-sso_dist-es_loadSso_js";
exports.ids = ["_aws-sdk_credential-provider-sso_dist-es_loadSso_js"];
exports.modules = {

/***/ "../../@aws-sdk/client-sso/dist-es/SSOClient.js":
/*!******************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/SSOClient.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SSOClient: () => (/* binding */ SSOClient),
/* harmony export */   __Client: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_11__.Client)
/* harmony export */ });
/* harmony import */ var _aws_sdk_middleware_host_header__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/middleware-host-header */ "../../@aws-sdk/middleware-host-header/dist-es/index.js");
/* harmony import */ var _aws_sdk_middleware_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @aws-sdk/middleware-logger */ "../../@aws-sdk/middleware-logger/dist-es/index.js");
/* harmony import */ var _aws_sdk_middleware_recursion_detection__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @aws-sdk/middleware-recursion-detection */ "../../@aws-sdk/middleware-recursion-detection/dist-es/index.js");
/* harmony import */ var _aws_sdk_middleware_user_agent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @aws-sdk/middleware-user-agent */ "../../@aws-sdk/middleware-user-agent/dist-es/index.js");
/* harmony import */ var _smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @smithy/config-resolver */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/index.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/util-identity-and-auth/DefaultIdentityProviderConfig.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemeEndpointRuleSetPlugin.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/middleware-http-signing/getHttpSigningMiddleware.js");
/* harmony import */ var _smithy_middleware_content_length__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @smithy/middleware-content-length */ "../../@smithy/middleware-content-length/dist-es/index.js");
/* harmony import */ var _smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @smithy/middleware-endpoint */ "../../@smithy/middleware-endpoint/dist-es/index.js");
/* harmony import */ var _smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @smithy/middleware-retry */ "../../@smithy/middleware-retry/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./auth/httpAuthSchemeProvider */ "../../@aws-sdk/client-sso/dist-es/auth/httpAuthSchemeProvider.js");
/* harmony import */ var _endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./endpoint/EndpointParameters */ "../../@aws-sdk/client-sso/dist-es/endpoint/EndpointParameters.js");
/* harmony import */ var _runtimeConfig__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./runtimeConfig */ "../../@aws-sdk/client-sso/dist-es/runtimeConfig.js");
/* harmony import */ var _runtimeExtensions__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./runtimeExtensions */ "../../@aws-sdk/client-sso/dist-es/runtimeExtensions.js");















class SSOClient extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_11__.Client {
    config;
    constructor(...[configuration]) {
        const _config_0 = (0,_runtimeConfig__WEBPACK_IMPORTED_MODULE_14__.getRuntimeConfig)(configuration || {});
        super(_config_0);
        this.initConfig = _config_0;
        const _config_1 = (0,_endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_13__.resolveClientEndpointParameters)(_config_0);
        const _config_2 = (0,_aws_sdk_middleware_user_agent__WEBPACK_IMPORTED_MODULE_3__.resolveUserAgentConfig)(_config_1);
        const _config_3 = (0,_smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_10__.resolveRetryConfig)(_config_2);
        const _config_4 = (0,_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__.resolveRegionConfig)(_config_3);
        const _config_5 = (0,_aws_sdk_middleware_host_header__WEBPACK_IMPORTED_MODULE_0__.resolveHostHeaderConfig)(_config_4);
        const _config_6 = (0,_smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_9__.resolveEndpointConfig)(_config_5);
        const _config_7 = (0,_auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_12__.resolveHttpAuthSchemeConfig)(_config_6);
        const _config_8 = (0,_runtimeExtensions__WEBPACK_IMPORTED_MODULE_15__.resolveRuntimeExtensions)(_config_7, configuration?.extensions || []);
        this.config = _config_8;
        this.middlewareStack.use((0,_aws_sdk_middleware_user_agent__WEBPACK_IMPORTED_MODULE_3__.getUserAgentPlugin)(this.config));
        this.middlewareStack.use((0,_smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_10__.getRetryPlugin)(this.config));
        this.middlewareStack.use((0,_smithy_middleware_content_length__WEBPACK_IMPORTED_MODULE_8__.getContentLengthPlugin)(this.config));
        this.middlewareStack.use((0,_aws_sdk_middleware_host_header__WEBPACK_IMPORTED_MODULE_0__.getHostHeaderPlugin)(this.config));
        this.middlewareStack.use((0,_aws_sdk_middleware_logger__WEBPACK_IMPORTED_MODULE_1__.getLoggerPlugin)(this.config));
        this.middlewareStack.use((0,_aws_sdk_middleware_recursion_detection__WEBPACK_IMPORTED_MODULE_2__.getRecursionDetectionPlugin)(this.config));
        this.middlewareStack.use((0,_smithy_core__WEBPACK_IMPORTED_MODULE_6__.getHttpAuthSchemeEndpointRuleSetPlugin)(this.config, {
            httpAuthSchemeParametersProvider: _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_12__.defaultSSOHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new _smithy_core__WEBPACK_IMPORTED_MODULE_5__.DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
            }),
        }));
        this.middlewareStack.use((0,_smithy_core__WEBPACK_IMPORTED_MODULE_7__.getHttpSigningPlugin)(this.config));
    }
    destroy() {
        super.destroy();
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/auth/httpAuthExtensionConfiguration.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/auth/httpAuthExtensionConfiguration.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHttpAuthExtensionConfiguration: () => (/* binding */ getHttpAuthExtensionConfiguration),
/* harmony export */   resolveHttpAuthRuntimeConfig: () => (/* binding */ resolveHttpAuthRuntimeConfig)
/* harmony export */ });
const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
    const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
    let _credentials = runtimeConfig.credentials;
    return {
        setHttpAuthScheme(httpAuthScheme) {
            const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
            if (index === -1) {
                _httpAuthSchemes.push(httpAuthScheme);
            }
            else {
                _httpAuthSchemes.splice(index, 1, httpAuthScheme);
            }
        },
        httpAuthSchemes() {
            return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
            _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
            return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
            _credentials = credentials;
        },
        credentials() {
            return _credentials;
        },
    };
};
const resolveHttpAuthRuntimeConfig = (config) => {
    return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials(),
    };
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/auth/httpAuthSchemeProvider.js":
/*!************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/auth/httpAuthSchemeProvider.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultSSOHttpAuthSchemeParametersProvider: () => (/* binding */ defaultSSOHttpAuthSchemeParametersProvider),
/* harmony export */   defaultSSOHttpAuthSchemeProvider: () => (/* binding */ defaultSSOHttpAuthSchemeProvider),
/* harmony export */   resolveHttpAuthSchemeConfig: () => (/* binding */ resolveHttpAuthSchemeConfig)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
/* harmony import */ var _smithy_util_middleware__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/util-middleware */ "../../@smithy/util-middleware/dist-es/index.js");


const defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input) => {
    return {
        operation: (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_1__.getSmithyContext)(context).operation,
        region: (await (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_1__.normalizeProvider)(config.region)()) ||
            (() => {
                throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
            })(),
    };
};
function createAwsAuthSigv4HttpAuthOption(authParameters) {
    return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
            name: "awsssoportal",
            region: authParameters.region,
        },
        propertiesExtractor: (config, context) => ({
            signingProperties: {
                config,
                context,
            },
        }),
    };
}
function createSmithyApiNoAuthHttpAuthOption(authParameters) {
    return {
        schemeId: "smithy.api#noAuth",
    };
}
const defaultSSOHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "GetRoleCredentials": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "ListAccountRoles": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "ListAccounts": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "Logout": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
    }
    return options;
};
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.resolveAwsSdkSigV4Config)(config);
    return Object.assign(config_0, {
        authSchemePreference: (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_1__.normalizeProvider)(config.authSchemePreference ?? []),
    });
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/commands/GetRoleCredentialsCommand.js":
/*!*******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/commands/GetRoleCredentialsCommand.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $Command: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.Command),
/* harmony export */   GetRoleCredentialsCommand: () => (/* binding */ GetRoleCredentialsCommand)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-endpoint */ "../../@smithy/middleware-endpoint/dist-es/index.js");
/* harmony import */ var _smithy_middleware_serde__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/middleware-serde */ "../../@smithy/middleware-serde/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../endpoint/EndpointParameters */ "../../@aws-sdk/client-sso/dist-es/endpoint/EndpointParameters.js");
/* harmony import */ var _models_models_0__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/models_0 */ "../../@aws-sdk/client-sso/dist-es/models/models_0.js");
/* harmony import */ var _protocols_Aws_restJson1__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../protocols/Aws_restJson1 */ "../../@aws-sdk/client-sso/dist-es/protocols/Aws_restJson1.js");







class GetRoleCredentialsCommand extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.Command
    .classBuilder()
    .ep(_endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_3__.commonParams)
    .m(function (Command, cs, config, o) {
    return [
        (0,_smithy_middleware_serde__WEBPACK_IMPORTED_MODULE_1__.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0,_smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_0__.getEndpointPlugin)(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("SWBPortalService", "GetRoleCredentials", {})
    .n("SSOClient", "GetRoleCredentialsCommand")
    .f(_models_models_0__WEBPACK_IMPORTED_MODULE_4__.GetRoleCredentialsRequestFilterSensitiveLog, _models_models_0__WEBPACK_IMPORTED_MODULE_4__.GetRoleCredentialsResponseFilterSensitiveLog)
    .ser(_protocols_Aws_restJson1__WEBPACK_IMPORTED_MODULE_5__.se_GetRoleCredentialsCommand)
    .de(_protocols_Aws_restJson1__WEBPACK_IMPORTED_MODULE_5__.de_GetRoleCredentialsCommand)
    .build() {
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/endpoint/EndpointParameters.js":
/*!************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/endpoint/EndpointParameters.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   commonParams: () => (/* binding */ commonParams),
/* harmony export */   resolveClientEndpointParameters: () => (/* binding */ resolveClientEndpointParameters)
/* harmony export */ });
const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "awsssoportal",
    });
};
const commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/endpoint/endpointResolver.js":
/*!**********************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/endpoint/endpointResolver.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultEndpointResolver: () => (/* binding */ defaultEndpointResolver)
/* harmony export */ });
/* harmony import */ var _aws_sdk_util_endpoints__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/util-endpoints */ "../../@aws-sdk/util-endpoints/dist-es/index.js");
/* harmony import */ var _smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/util-endpoints */ "../../@smithy/util-endpoints/dist-es/index.js");
/* harmony import */ var _ruleset__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ruleset */ "../../@aws-sdk/client-sso/dist-es/endpoint/ruleset.js");



const cache = new _smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => (0,_smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__.resolveEndpoint)(_ruleset__WEBPACK_IMPORTED_MODULE_2__.ruleSet, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
_smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__.customEndpointFunctions.aws = _aws_sdk_util_endpoints__WEBPACK_IMPORTED_MODULE_0__.awsEndpointFunctions;


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/endpoint/ruleset.js":
/*!*************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/endpoint/ruleset.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ruleSet: () => (/* binding */ ruleSet)
/* harmony export */ });
const u = "required", v = "fn", w = "argv", x = "ref";
const a = true, b = "isSet", c = "booleanEquals", d = "error", e = "endpoint", f = "tree", g = "PartitionResult", h = "getAttr", i = { [u]: false, "type": "String" }, j = { [u]: true, "default": false, "type": "Boolean" }, k = { [x]: "Endpoint" }, l = { [v]: c, [w]: [{ [x]: "UseFIPS" }, true] }, m = { [v]: c, [w]: [{ [x]: "UseDualStack" }, true] }, n = {}, o = { [v]: h, [w]: [{ [x]: g }, "supportsFIPS"] }, p = { [x]: g }, q = { [v]: c, [w]: [true, { [v]: h, [w]: [p, "supportsDualStack"] }] }, r = [l], s = [m], t = [{ [x]: "Region" }];
const _data = { version: "1.0", parameters: { Region: i, UseDualStack: j, UseFIPS: j, Endpoint: i }, rules: [{ conditions: [{ [v]: b, [w]: [k] }], rules: [{ conditions: r, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: s, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: k, properties: n, headers: n }, type: e }], type: f }, { conditions: [{ [v]: b, [w]: t }], rules: [{ conditions: [{ [v]: "aws.partition", [w]: t, assign: g }], rules: [{ conditions: [l, m], rules: [{ conditions: [{ [v]: c, [w]: [a, o] }, q], rules: [{ endpoint: { url: "https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: r, rules: [{ conditions: [{ [v]: c, [w]: [o, a] }], rules: [{ conditions: [{ [v]: "stringEquals", [w]: [{ [v]: h, [w]: [p, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://portal.sso.{Region}.amazonaws.com", properties: n, headers: n }, type: e }, { endpoint: { url: "https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: s, rules: [{ conditions: [q], rules: [{ endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
const ruleSet = _data;


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/models/SSOServiceException.js":
/*!***********************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/models/SSOServiceException.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SSOServiceException: () => (/* binding */ SSOServiceException),
/* harmony export */   __ServiceException: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.ServiceException)
/* harmony export */ });
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");


class SSOServiceException extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SSOServiceException.prototype);
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/models/models_0.js":
/*!************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/models/models_0.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetRoleCredentialsRequestFilterSensitiveLog: () => (/* binding */ GetRoleCredentialsRequestFilterSensitiveLog),
/* harmony export */   GetRoleCredentialsResponseFilterSensitiveLog: () => (/* binding */ GetRoleCredentialsResponseFilterSensitiveLog),
/* harmony export */   InvalidRequestException: () => (/* binding */ InvalidRequestException),
/* harmony export */   ListAccountRolesRequestFilterSensitiveLog: () => (/* binding */ ListAccountRolesRequestFilterSensitiveLog),
/* harmony export */   ListAccountsRequestFilterSensitiveLog: () => (/* binding */ ListAccountsRequestFilterSensitiveLog),
/* harmony export */   LogoutRequestFilterSensitiveLog: () => (/* binding */ LogoutRequestFilterSensitiveLog),
/* harmony export */   ResourceNotFoundException: () => (/* binding */ ResourceNotFoundException),
/* harmony export */   RoleCredentialsFilterSensitiveLog: () => (/* binding */ RoleCredentialsFilterSensitiveLog),
/* harmony export */   TooManyRequestsException: () => (/* binding */ TooManyRequestsException),
/* harmony export */   UnauthorizedException: () => (/* binding */ UnauthorizedException)
/* harmony export */ });
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _SSOServiceException__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./SSOServiceException */ "../../@aws-sdk/client-sso/dist-es/models/SSOServiceException.js");


class InvalidRequestException extends _SSOServiceException__WEBPACK_IMPORTED_MODULE_1__.SSOServiceException {
    name = "InvalidRequestException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidRequestException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidRequestException.prototype);
    }
}
class ResourceNotFoundException extends _SSOServiceException__WEBPACK_IMPORTED_MODULE_1__.SSOServiceException {
    name = "ResourceNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ResourceNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
}
class TooManyRequestsException extends _SSOServiceException__WEBPACK_IMPORTED_MODULE_1__.SSOServiceException {
    name = "TooManyRequestsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TooManyRequestsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TooManyRequestsException.prototype);
    }
}
class UnauthorizedException extends _SSOServiceException__WEBPACK_IMPORTED_MODULE_1__.SSOServiceException {
    name = "UnauthorizedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnauthorizedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnauthorizedException.prototype);
    }
}
const GetRoleCredentialsRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});
const RoleCredentialsFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.secretAccessKey && { secretAccessKey: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
    ...(obj.sessionToken && { sessionToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});
const GetRoleCredentialsResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.roleCredentials && { roleCredentials: RoleCredentialsFilterSensitiveLog(obj.roleCredentials) }),
});
const ListAccountRolesRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});
const ListAccountsRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});
const LogoutRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/protocols/Aws_restJson1.js":
/*!********************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/protocols/Aws_restJson1.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   de_GetRoleCredentialsCommand: () => (/* binding */ de_GetRoleCredentialsCommand),
/* harmony export */   de_ListAccountRolesCommand: () => (/* binding */ de_ListAccountRolesCommand),
/* harmony export */   de_ListAccountsCommand: () => (/* binding */ de_ListAccountsCommand),
/* harmony export */   de_LogoutCommand: () => (/* binding */ de_LogoutCommand),
/* harmony export */   se_GetRoleCredentialsCommand: () => (/* binding */ se_GetRoleCredentialsCommand),
/* harmony export */   se_ListAccountRolesCommand: () => (/* binding */ se_ListAccountRolesCommand),
/* harmony export */   se_ListAccountsCommand: () => (/* binding */ se_ListAccountsCommand),
/* harmony export */   se_LogoutCommand: () => (/* binding */ se_LogoutCommand)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/submodules/protocols/requestBuilder.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _models_models_0__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../models/models_0 */ "../../@aws-sdk/client-sso/dist-es/models/models_0.js");
/* harmony import */ var _models_SSOServiceException__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/SSOServiceException */ "../../@aws-sdk/client-sso/dist-es/models/SSOServiceException.js");





const se_GetRoleCredentialsCommand = async (input, context) => {
    const b = (0,_smithy_core__WEBPACK_IMPORTED_MODULE_1__.requestBuilder)(input, context);
    const headers = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({}, _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/federation/credentials");
    const query = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        [_rn]: [, (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)(input[_rN], `roleName`)],
        [_ai]: [, (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)(input[_aI], `accountId`)],
    });
    let body;
    b.m("GET").h(headers).q(query).b(body);
    return b.build();
};
const se_ListAccountRolesCommand = async (input, context) => {
    const b = (0,_smithy_core__WEBPACK_IMPORTED_MODULE_1__.requestBuilder)(input, context);
    const headers = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({}, _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/assignment/roles");
    const query = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        [_nt]: [, input[_nT]],
        [_mr]: [() => input.maxResults !== void 0, () => input[_mR].toString()],
        [_ai]: [, (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)(input[_aI], `accountId`)],
    });
    let body;
    b.m("GET").h(headers).q(query).b(body);
    return b.build();
};
const se_ListAccountsCommand = async (input, context) => {
    const b = (0,_smithy_core__WEBPACK_IMPORTED_MODULE_1__.requestBuilder)(input, context);
    const headers = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({}, _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/assignment/accounts");
    const query = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        [_nt]: [, input[_nT]],
        [_mr]: [() => input.maxResults !== void 0, () => input[_mR].toString()],
    });
    let body;
    b.m("GET").h(headers).q(query).b(body);
    return b.build();
};
const se_LogoutCommand = async (input, context) => {
    const b = (0,_smithy_core__WEBPACK_IMPORTED_MODULE_1__.requestBuilder)(input, context);
    const headers = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({}, _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/logout");
    let body;
    b.m("POST").h(headers).b(body);
    return b.build();
};
const de_GetRoleCredentialsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        $metadata: deserializeMetadata(output),
    });
    const data = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)((0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectObject)(await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseJsonBody)(output.body, context)), "body");
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        roleCredentials: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__._json,
    });
    Object.assign(contents, doc);
    return contents;
};
const de_ListAccountRolesCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        $metadata: deserializeMetadata(output),
    });
    const data = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)((0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectObject)(await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseJsonBody)(output.body, context)), "body");
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        nextToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString,
        roleList: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__._json,
    });
    Object.assign(contents, doc);
    return contents;
};
const de_ListAccountsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        $metadata: deserializeMetadata(output),
    });
    const data = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)((0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectObject)(await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseJsonBody)(output.body, context)), "body");
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        accountList: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__._json,
        nextToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString,
    });
    Object.assign(contents, doc);
    return contents;
};
const de_LogoutCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({
        $metadata: deserializeMetadata(output),
    });
    await (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.collectBody)(output.body, context);
    return contents;
};
const de_CommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseJsonErrorBody)(output.body, context),
    };
    const errorCode = (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.loadRestJsonErrorCode)(output, parsedOutput.body);
    switch (errorCode) {
        case "InvalidRequestException":
        case "com.amazonaws.sso#InvalidRequestException":
            throw await de_InvalidRequestExceptionRes(parsedOutput, context);
        case "ResourceNotFoundException":
        case "com.amazonaws.sso#ResourceNotFoundException":
            throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
        case "TooManyRequestsException":
        case "com.amazonaws.sso#TooManyRequestsException":
            throw await de_TooManyRequestsExceptionRes(parsedOutput, context);
        case "UnauthorizedException":
        case "com.amazonaws.sso#UnauthorizedException":
            throw await de_UnauthorizedExceptionRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
const throwDefaultError = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.withBaseException)(_models_SSOServiceException__WEBPACK_IMPORTED_MODULE_4__.SSOServiceException);
const de_InvalidRequestExceptionRes = async (parsedOutput, context) => {
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({});
    const data = parsedOutput.body;
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        message: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString,
    });
    Object.assign(contents, doc);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.InvalidRequestException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, parsedOutput.body);
};
const de_ResourceNotFoundExceptionRes = async (parsedOutput, context) => {
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({});
    const data = parsedOutput.body;
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        message: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString,
    });
    Object.assign(contents, doc);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.ResourceNotFoundException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, parsedOutput.body);
};
const de_TooManyRequestsExceptionRes = async (parsedOutput, context) => {
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({});
    const data = parsedOutput.body;
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        message: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString,
    });
    Object.assign(contents, doc);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.TooManyRequestsException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, parsedOutput.body);
};
const de_UnauthorizedExceptionRes = async (parsedOutput, context) => {
    const contents = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.map)({});
    const data = parsedOutput.body;
    const doc = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.take)(data, {
        message: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString,
    });
    Object.assign(contents, doc);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.UnauthorizedException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, parsedOutput.body);
};
const deserializeMetadata = (output) => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
});
const collectBodyString = (streamBody, context) => (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.collectBody)(streamBody, context).then((body) => context.utf8Encoder(body));
const _aI = "accountId";
const _aT = "accessToken";
const _ai = "account_id";
const _mR = "maxResults";
const _mr = "max_result";
const _nT = "nextToken";
const _nt = "next_token";
const _rN = "roleName";
const _rn = "role_name";
const _xasbt = "x-amz-sso_bearer_token";


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/runtimeConfig.js":
/*!**********************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/runtimeConfig.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRuntimeConfig: () => (/* binding */ getRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../package.json */ "../../@aws-sdk/client-sso/package.json");
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js");
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/NODE_AUTH_SCHEME_PREFERENCE_OPTIONS.js");
/* harmony import */ var _aws_sdk_util_user_agent_node__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @aws-sdk/util-user-agent-node */ "../../@aws-sdk/util-user-agent-node/dist-es/index.js");
/* harmony import */ var _smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @smithy/config-resolver */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/index.js");
/* harmony import */ var _smithy_hash_node__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @smithy/hash-node */ "../../@smithy/hash-node/dist-es/index.js");
/* harmony import */ var _smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @smithy/middleware-retry */ "../../@smithy/middleware-retry/dist-es/index.js");
/* harmony import */ var _smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @smithy/node-config-provider */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/index.js");
/* harmony import */ var _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @smithy/node-http-handler */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/index.js");
/* harmony import */ var _smithy_util_body_length_node__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @smithy/util-body-length-node */ "../../@smithy/util-body-length-node/dist-es/index.js");
/* harmony import */ var _smithy_util_retry__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @smithy/util-retry */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/index.js");
/* harmony import */ var _runtimeConfig_shared__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./runtimeConfig.shared */ "../../@aws-sdk/client-sso/dist-es/runtimeConfig.shared.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _smithy_util_defaults_mode_node__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @smithy/util-defaults-mode-node */ "../../@smithy/util-defaults-mode-node/dist-es/index.js");














const getRuntimeConfig = (config) => {
    (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_12__.emitWarningIfUnsupportedVersion)(process.version);
    const defaultsMode = (0,_smithy_util_defaults_mode_node__WEBPACK_IMPORTED_MODULE_13__.resolveDefaultsModeConfig)(config);
    const defaultConfigProvider = () => defaultsMode().then(_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_12__.loadConfigsForDefaultMode);
    const clientSharedValues = (0,_runtimeConfig_shared__WEBPACK_IMPORTED_MODULE_11__.getRuntimeConfig)(config);
    (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_1__.emitWarningIfUnsupportedVersion)(process.version);
    const loaderConfig = {
        profile: config?.profile,
        logger: clientSharedValues.logger,
    };
    return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        authSchemePreference: config?.authSchemePreference ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)(_aws_sdk_core__WEBPACK_IMPORTED_MODULE_2__.NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
        bodyLengthChecker: config?.bodyLengthChecker ?? _smithy_util_body_length_node__WEBPACK_IMPORTED_MODULE_9__.calculateBodyLength,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ??
            (0,_aws_sdk_util_user_agent_node__WEBPACK_IMPORTED_MODULE_3__.createDefaultUserAgentProvider)({ serviceId: clientSharedValues.serviceId, clientVersion: _package_json__WEBPACK_IMPORTED_MODULE_0__.version }),
        maxAttempts: config?.maxAttempts ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)(_smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_6__.NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
        region: config?.region ??
            (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)(_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__.NODE_REGION_CONFIG_OPTIONS, { ..._smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__.NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
        requestHandler: _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_8__.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ??
            (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)({
                ..._smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_6__.NODE_RETRY_MODE_CONFIG_OPTIONS,
                default: async () => (await defaultConfigProvider()).retryMode || _smithy_util_retry__WEBPACK_IMPORTED_MODULE_10__.DEFAULT_RETRY_MODE,
            }, config),
        sha256: config?.sha256 ?? _smithy_hash_node__WEBPACK_IMPORTED_MODULE_5__.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_8__.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)(_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)(_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        userAgentAppId: config?.userAgentAppId ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_7__.loadConfig)(_aws_sdk_util_user_agent_node__WEBPACK_IMPORTED_MODULE_3__.NODE_APP_ID_CONFIG_OPTIONS, loaderConfig),
    };
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/runtimeConfig.shared.js":
/*!*****************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/runtimeConfig.shared.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRuntimeConfig: () => (/* binding */ getRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _smithy_url_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @smithy/url-parser */ "../../@smithy/url-parser/dist-es/index.js");
/* harmony import */ var _smithy_util_base64__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @smithy/util-base64 */ "../../@smithy/util-base64/dist-es/index.js");
/* harmony import */ var _smithy_util_utf8__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @smithy/util-utf8 */ "../../@smithy/util-utf8/dist-es/index.js");
/* harmony import */ var _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./auth/httpAuthSchemeProvider */ "../../@aws-sdk/client-sso/dist-es/auth/httpAuthSchemeProvider.js");
/* harmony import */ var _endpoint_endpointResolver__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./endpoint/endpointResolver */ "../../@aws-sdk/client-sso/dist-es/endpoint/endpointResolver.js");








const getRuntimeConfig = (config) => {
    return {
        apiVersion: "2019-06-10",
        base64Decoder: config?.base64Decoder ?? _smithy_util_base64__WEBPACK_IMPORTED_MODULE_4__.fromBase64,
        base64Encoder: config?.base64Encoder ?? _smithy_util_base64__WEBPACK_IMPORTED_MODULE_4__.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? _endpoint_endpointResolver__WEBPACK_IMPORTED_MODULE_7__.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_6__.defaultSSOHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new _smithy_core__WEBPACK_IMPORTED_MODULE_1__.NoAuthSigner(),
            },
        ],
        logger: config?.logger ?? new _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.NoOpLogger(),
        serviceId: config?.serviceId ?? "SSO",
        urlParser: config?.urlParser ?? _smithy_url_parser__WEBPACK_IMPORTED_MODULE_3__.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? _smithy_util_utf8__WEBPACK_IMPORTED_MODULE_5__.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? _smithy_util_utf8__WEBPACK_IMPORTED_MODULE_5__.toUtf8,
    };
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/dist-es/runtimeExtensions.js":
/*!**************************************************************!*\
  !*** ../../@aws-sdk/client-sso/dist-es/runtimeExtensions.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveRuntimeExtensions: () => (/* binding */ resolveRuntimeExtensions)
/* harmony export */ });
/* harmony import */ var _aws_sdk_region_config_resolver__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/region-config-resolver */ "../../@aws-sdk/region-config-resolver/dist-es/index.js");
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _auth_httpAuthExtensionConfiguration__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./auth/httpAuthExtensionConfiguration */ "../../@aws-sdk/client-sso/dist-es/auth/httpAuthExtensionConfiguration.js");




const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = Object.assign((0,_aws_sdk_region_config_resolver__WEBPACK_IMPORTED_MODULE_0__.getAwsRegionExtensionConfiguration)(runtimeConfig), (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.getDefaultExtensionConfiguration)(runtimeConfig), (0,_smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__.getHttpHandlerExtensionConfiguration)(runtimeConfig), (0,_auth_httpAuthExtensionConfiguration__WEBPACK_IMPORTED_MODULE_3__.getHttpAuthExtensionConfiguration)(runtimeConfig));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig, (0,_aws_sdk_region_config_resolver__WEBPACK_IMPORTED_MODULE_0__.resolveAwsRegionExtensionConfiguration)(extensionConfiguration), (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.resolveDefaultRuntimeConfig)(extensionConfiguration), (0,_smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__.resolveHttpHandlerRuntimeConfig)(extensionConfiguration), (0,_auth_httpAuthExtensionConfiguration__WEBPACK_IMPORTED_MODULE_3__.resolveHttpAuthRuntimeConfig)(extensionConfiguration));
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js":
/*!***************************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js ***!
  \***************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONFIG_USE_DUALSTACK_ENDPOINT: () => (/* binding */ CONFIG_USE_DUALSTACK_ENDPOINT),
/* harmony export */   DEFAULT_USE_DUALSTACK_ENDPOINT: () => (/* binding */ DEFAULT_USE_DUALSTACK_ENDPOINT),
/* harmony export */   ENV_USE_DUALSTACK_ENDPOINT: () => (/* binding */ ENV_USE_DUALSTACK_ENDPOINT),
/* harmony export */   NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS: () => (/* binding */ NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS)
/* harmony export */ });
/* harmony import */ var _smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/util-config-provider */ "../../@smithy/util-config-provider/dist-es/index.js");

const ENV_USE_DUALSTACK_ENDPOINT = "AWS_USE_DUALSTACK_ENDPOINT";
const CONFIG_USE_DUALSTACK_ENDPOINT = "use_dualstack_endpoint";
const DEFAULT_USE_DUALSTACK_ENDPOINT = false;
const NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => (0,_smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.booleanSelector)(env, ENV_USE_DUALSTACK_ENDPOINT, _smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.SelectorType.ENV),
    configFileSelector: (profile) => (0,_smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.booleanSelector)(profile, CONFIG_USE_DUALSTACK_ENDPOINT, _smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.SelectorType.CONFIG),
    default: false,
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js":
/*!**********************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js ***!
  \**********************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONFIG_USE_FIPS_ENDPOINT: () => (/* binding */ CONFIG_USE_FIPS_ENDPOINT),
/* harmony export */   DEFAULT_USE_FIPS_ENDPOINT: () => (/* binding */ DEFAULT_USE_FIPS_ENDPOINT),
/* harmony export */   ENV_USE_FIPS_ENDPOINT: () => (/* binding */ ENV_USE_FIPS_ENDPOINT),
/* harmony export */   NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS: () => (/* binding */ NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS)
/* harmony export */ });
/* harmony import */ var _smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/util-config-provider */ "../../@smithy/util-config-provider/dist-es/index.js");

const ENV_USE_FIPS_ENDPOINT = "AWS_USE_FIPS_ENDPOINT";
const CONFIG_USE_FIPS_ENDPOINT = "use_fips_endpoint";
const DEFAULT_USE_FIPS_ENDPOINT = false;
const NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => (0,_smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.booleanSelector)(env, ENV_USE_FIPS_ENDPOINT, _smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.SelectorType.ENV),
    configFileSelector: (profile) => (0,_smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.booleanSelector)(profile, CONFIG_USE_FIPS_ENDPOINT, _smithy_util_config_provider__WEBPACK_IMPORTED_MODULE_0__.SelectorType.CONFIG),
    default: false,
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/index.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/index.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONFIG_USE_DUALSTACK_ENDPOINT: () => (/* reexport safe */ _NodeUseDualstackEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_0__.CONFIG_USE_DUALSTACK_ENDPOINT),
/* harmony export */   CONFIG_USE_FIPS_ENDPOINT: () => (/* reexport safe */ _NodeUseFipsEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_1__.CONFIG_USE_FIPS_ENDPOINT),
/* harmony export */   DEFAULT_USE_DUALSTACK_ENDPOINT: () => (/* reexport safe */ _NodeUseDualstackEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_USE_DUALSTACK_ENDPOINT),
/* harmony export */   DEFAULT_USE_FIPS_ENDPOINT: () => (/* reexport safe */ _NodeUseFipsEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_USE_FIPS_ENDPOINT),
/* harmony export */   ENV_USE_DUALSTACK_ENDPOINT: () => (/* reexport safe */ _NodeUseDualstackEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_0__.ENV_USE_DUALSTACK_ENDPOINT),
/* harmony export */   ENV_USE_FIPS_ENDPOINT: () => (/* reexport safe */ _NodeUseFipsEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_1__.ENV_USE_FIPS_ENDPOINT),
/* harmony export */   NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS: () => (/* reexport safe */ _NodeUseDualstackEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_0__.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS),
/* harmony export */   NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS: () => (/* reexport safe */ _NodeUseFipsEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_1__.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS),
/* harmony export */   resolveCustomEndpointsConfig: () => (/* reexport safe */ _resolveCustomEndpointsConfig__WEBPACK_IMPORTED_MODULE_2__.resolveCustomEndpointsConfig),
/* harmony export */   resolveEndpointsConfig: () => (/* reexport safe */ _resolveEndpointsConfig__WEBPACK_IMPORTED_MODULE_3__.resolveEndpointsConfig)
/* harmony export */ });
/* harmony import */ var _NodeUseDualstackEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./NodeUseDualstackEndpointConfigOptions */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js");
/* harmony import */ var _NodeUseFipsEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./NodeUseFipsEndpointConfigOptions */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js");
/* harmony import */ var _resolveCustomEndpointsConfig__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./resolveCustomEndpointsConfig */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveCustomEndpointsConfig.js");
/* harmony import */ var _resolveEndpointsConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./resolveEndpointsConfig */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveEndpointsConfig.js");






/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveCustomEndpointsConfig.js":
/*!******************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveCustomEndpointsConfig.js ***!
  \******************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveCustomEndpointsConfig: () => (/* binding */ resolveCustomEndpointsConfig)
/* harmony export */ });
/* harmony import */ var _smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/util-middleware */ "../../@smithy/util-middleware/dist-es/index.js");

const resolveCustomEndpointsConfig = (input) => {
    const { tls, endpoint, urlParser, useDualstackEndpoint } = input;
    return Object.assign(input, {
        tls: tls ?? true,
        endpoint: (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__.normalizeProvider)(typeof endpoint === "string" ? urlParser(endpoint) : endpoint),
        isCustomEndpoint: true,
        useDualstackEndpoint: (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__.normalizeProvider)(useDualstackEndpoint ?? false),
    });
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveEndpointsConfig.js":
/*!************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveEndpointsConfig.js ***!
  \************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveEndpointsConfig: () => (/* binding */ resolveEndpointsConfig)
/* harmony export */ });
/* harmony import */ var _smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/util-middleware */ "../../@smithy/util-middleware/dist-es/index.js");
/* harmony import */ var _utils_getEndpointFromRegion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/getEndpointFromRegion */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/utils/getEndpointFromRegion.js");


const resolveEndpointsConfig = (input) => {
    const useDualstackEndpoint = (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__.normalizeProvider)(input.useDualstackEndpoint ?? false);
    const { endpoint, useFipsEndpoint, urlParser, tls } = input;
    return Object.assign(input, {
        tls: tls ?? true,
        endpoint: endpoint
            ? (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__.normalizeProvider)(typeof endpoint === "string" ? urlParser(endpoint) : endpoint)
            : () => (0,_utils_getEndpointFromRegion__WEBPACK_IMPORTED_MODULE_1__.getEndpointFromRegion)({ ...input, useDualstackEndpoint, useFipsEndpoint }),
        isCustomEndpoint: !!endpoint,
        useDualstackEndpoint,
    });
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/utils/getEndpointFromRegion.js":
/*!*****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/utils/getEndpointFromRegion.js ***!
  \*****************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getEndpointFromRegion: () => (/* binding */ getEndpointFromRegion)
/* harmony export */ });
const getEndpointFromRegion = async (input) => {
    const { tls = true } = input;
    const region = await input.region();
    const dnsHostRegex = new RegExp(/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/);
    if (!dnsHostRegex.test(region)) {
        throw new Error("Invalid region in client config");
    }
    const useDualstackEndpoint = await input.useDualstackEndpoint();
    const useFipsEndpoint = await input.useFipsEndpoint();
    const { hostname } = (await input.regionInfoProvider(region, { useDualstackEndpoint, useFipsEndpoint })) ?? {};
    if (!hostname) {
        throw new Error("Cannot resolve hostname from client config");
    }
    return input.urlParser(`${tls ? "https:" : "http:"}//${hostname}`);
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/index.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/index.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONFIG_USE_DUALSTACK_ENDPOINT: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.CONFIG_USE_DUALSTACK_ENDPOINT),
/* harmony export */   CONFIG_USE_FIPS_ENDPOINT: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.CONFIG_USE_FIPS_ENDPOINT),
/* harmony export */   DEFAULT_USE_DUALSTACK_ENDPOINT: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_USE_DUALSTACK_ENDPOINT),
/* harmony export */   DEFAULT_USE_FIPS_ENDPOINT: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_USE_FIPS_ENDPOINT),
/* harmony export */   ENV_USE_DUALSTACK_ENDPOINT: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.ENV_USE_DUALSTACK_ENDPOINT),
/* harmony export */   ENV_USE_FIPS_ENDPOINT: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.ENV_USE_FIPS_ENDPOINT),
/* harmony export */   NODE_REGION_CONFIG_FILE_OPTIONS: () => (/* reexport safe */ _regionConfig__WEBPACK_IMPORTED_MODULE_1__.NODE_REGION_CONFIG_FILE_OPTIONS),
/* harmony export */   NODE_REGION_CONFIG_OPTIONS: () => (/* reexport safe */ _regionConfig__WEBPACK_IMPORTED_MODULE_1__.NODE_REGION_CONFIG_OPTIONS),
/* harmony export */   NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS),
/* harmony export */   NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS),
/* harmony export */   REGION_ENV_NAME: () => (/* reexport safe */ _regionConfig__WEBPACK_IMPORTED_MODULE_1__.REGION_ENV_NAME),
/* harmony export */   REGION_INI_NAME: () => (/* reexport safe */ _regionConfig__WEBPACK_IMPORTED_MODULE_1__.REGION_INI_NAME),
/* harmony export */   getRegionInfo: () => (/* reexport safe */ _regionInfo__WEBPACK_IMPORTED_MODULE_2__.getRegionInfo),
/* harmony export */   resolveCustomEndpointsConfig: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.resolveCustomEndpointsConfig),
/* harmony export */   resolveEndpointsConfig: () => (/* reexport safe */ _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__.resolveEndpointsConfig),
/* harmony export */   resolveRegionConfig: () => (/* reexport safe */ _regionConfig__WEBPACK_IMPORTED_MODULE_1__.resolveRegionConfig)
/* harmony export */ });
/* harmony import */ var _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./endpointsConfig */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/index.js");
/* harmony import */ var _regionConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./regionConfig */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/index.js");
/* harmony import */ var _regionInfo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./regionInfo */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/index.js");





/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NODE_REGION_CONFIG_FILE_OPTIONS: () => (/* binding */ NODE_REGION_CONFIG_FILE_OPTIONS),
/* harmony export */   NODE_REGION_CONFIG_OPTIONS: () => (/* binding */ NODE_REGION_CONFIG_OPTIONS),
/* harmony export */   REGION_ENV_NAME: () => (/* binding */ REGION_ENV_NAME),
/* harmony export */   REGION_INI_NAME: () => (/* binding */ REGION_INI_NAME)
/* harmony export */ });
const REGION_ENV_NAME = "AWS_REGION";
const REGION_INI_NAME = "region";
const NODE_REGION_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[REGION_ENV_NAME],
    configFileSelector: (profile) => profile[REGION_INI_NAME],
    default: () => {
        throw new Error("Region is missing");
    },
};
const NODE_REGION_CONFIG_FILE_OPTIONS = {
    preferredFile: "credentials",
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRealRegion: () => (/* binding */ getRealRegion)
/* harmony export */ });
/* harmony import */ var _isFipsRegion__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./isFipsRegion */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js");

const getRealRegion = (region) => (0,_isFipsRegion__WEBPACK_IMPORTED_MODULE_0__.isFipsRegion)(region)
    ? ["fips-aws-global", "aws-fips"].includes(region)
        ? "us-east-1"
        : region.replace(/fips-(dkr-|prod-)?|-fips/, "")
    : region;


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/index.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/index.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NODE_REGION_CONFIG_FILE_OPTIONS: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.NODE_REGION_CONFIG_FILE_OPTIONS),
/* harmony export */   NODE_REGION_CONFIG_OPTIONS: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.NODE_REGION_CONFIG_OPTIONS),
/* harmony export */   REGION_ENV_NAME: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.REGION_ENV_NAME),
/* harmony export */   REGION_INI_NAME: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.REGION_INI_NAME),
/* harmony export */   resolveRegionConfig: () => (/* reexport safe */ _resolveRegionConfig__WEBPACK_IMPORTED_MODULE_1__.resolveRegionConfig)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js");
/* harmony import */ var _resolveRegionConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./resolveRegionConfig */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js");




/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js":
/*!***********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js ***!
  \***********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFipsRegion: () => (/* binding */ isFipsRegion)
/* harmony export */ });
const isFipsRegion = (region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js":
/*!******************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js ***!
  \******************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveRegionConfig: () => (/* binding */ resolveRegionConfig)
/* harmony export */ });
/* harmony import */ var _getRealRegion__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getRealRegion */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js");
/* harmony import */ var _isFipsRegion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./isFipsRegion */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js");


const resolveRegionConfig = (input) => {
    const { region, useFipsEndpoint } = input;
    if (!region) {
        throw new Error("Region is missing");
    }
    return Object.assign(input, {
        region: async () => {
            if (typeof region === "string") {
                return (0,_getRealRegion__WEBPACK_IMPORTED_MODULE_0__.getRealRegion)(region);
            }
            const providedRegion = await region();
            return (0,_getRealRegion__WEBPACK_IMPORTED_MODULE_0__.getRealRegion)(providedRegion);
        },
        useFipsEndpoint: async () => {
            const providedRegion = typeof region === "string" ? region : await region();
            if ((0,_isFipsRegion__WEBPACK_IMPORTED_MODULE_1__.isFipsRegion)(providedRegion)) {
                return true;
            }
            return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
        },
    });
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/PartitionHash.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/PartitionHash.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/RegionHash.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/RegionHash.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getHostnameFromVariants.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getHostnameFromVariants.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHostnameFromVariants: () => (/* binding */ getHostnameFromVariants)
/* harmony export */ });
const getHostnameFromVariants = (variants = [], { useFipsEndpoint, useDualstackEndpoint }) => variants.find(({ tags }) => useFipsEndpoint === tags.includes("fips") && useDualstackEndpoint === tags.includes("dualstack"))?.hostname;


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getRegionInfo.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getRegionInfo.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRegionInfo: () => (/* binding */ getRegionInfo)
/* harmony export */ });
/* harmony import */ var _getHostnameFromVariants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getHostnameFromVariants */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getHostnameFromVariants.js");
/* harmony import */ var _getResolvedHostname__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getResolvedHostname */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedHostname.js");
/* harmony import */ var _getResolvedPartition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getResolvedPartition */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedPartition.js");
/* harmony import */ var _getResolvedSigningRegion__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./getResolvedSigningRegion */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedSigningRegion.js");




const getRegionInfo = (region, { useFipsEndpoint = false, useDualstackEndpoint = false, signingService, regionHash, partitionHash, }) => {
    const partition = (0,_getResolvedPartition__WEBPACK_IMPORTED_MODULE_2__.getResolvedPartition)(region, { partitionHash });
    const resolvedRegion = region in regionHash ? region : partitionHash[partition]?.endpoint ?? region;
    const hostnameOptions = { useFipsEndpoint, useDualstackEndpoint };
    const regionHostname = (0,_getHostnameFromVariants__WEBPACK_IMPORTED_MODULE_0__.getHostnameFromVariants)(regionHash[resolvedRegion]?.variants, hostnameOptions);
    const partitionHostname = (0,_getHostnameFromVariants__WEBPACK_IMPORTED_MODULE_0__.getHostnameFromVariants)(partitionHash[partition]?.variants, hostnameOptions);
    const hostname = (0,_getResolvedHostname__WEBPACK_IMPORTED_MODULE_1__.getResolvedHostname)(resolvedRegion, { regionHostname, partitionHostname });
    if (hostname === undefined) {
        throw new Error(`Endpoint resolution failed for: ${{ resolvedRegion, useFipsEndpoint, useDualstackEndpoint }}`);
    }
    const signingRegion = (0,_getResolvedSigningRegion__WEBPACK_IMPORTED_MODULE_3__.getResolvedSigningRegion)(hostname, {
        signingRegion: regionHash[resolvedRegion]?.signingRegion,
        regionRegex: partitionHash[partition].regionRegex,
        useFipsEndpoint,
    });
    return {
        partition,
        signingService,
        hostname,
        ...(signingRegion && { signingRegion }),
        ...(regionHash[resolvedRegion]?.signingService && {
            signingService: regionHash[resolvedRegion].signingService,
        }),
    };
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedHostname.js":
/*!****************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedHostname.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getResolvedHostname: () => (/* binding */ getResolvedHostname)
/* harmony export */ });
const getResolvedHostname = (resolvedRegion, { regionHostname, partitionHostname }) => regionHostname
    ? regionHostname
    : partitionHostname
        ? partitionHostname.replace("{region}", resolvedRegion)
        : undefined;


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedPartition.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedPartition.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getResolvedPartition: () => (/* binding */ getResolvedPartition)
/* harmony export */ });
const getResolvedPartition = (region, { partitionHash }) => Object.keys(partitionHash || {}).find((key) => partitionHash[key].regions.includes(region)) ?? "aws";


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedSigningRegion.js":
/*!*********************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedSigningRegion.js ***!
  \*********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getResolvedSigningRegion: () => (/* binding */ getResolvedSigningRegion)
/* harmony export */ });
const getResolvedSigningRegion = (hostname, { signingRegion, regionRegex, useFipsEndpoint }) => {
    if (signingRegion) {
        return signingRegion;
    }
    else if (useFipsEndpoint) {
        const regionRegexJs = regionRegex.replace("\\\\", "\\").replace(/^\^/g, "\\.").replace(/\$$/g, "\\.");
        const regionRegexmatchArray = hostname.match(regionRegexJs);
        if (regionRegexmatchArray) {
            return regionRegexmatchArray[0].slice(1, -1);
        }
    }
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/index.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/index.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRegionInfo: () => (/* reexport safe */ _getRegionInfo__WEBPACK_IMPORTED_MODULE_2__.getRegionInfo)
/* harmony export */ });
/* harmony import */ var _PartitionHash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./PartitionHash */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/PartitionHash.js");
/* harmony import */ var _RegionHash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./RegionHash */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/RegionHash.js");
/* harmony import */ var _getRegionInfo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getRegionInfo */ "../../@aws-sdk/client-sso/node_modules/@smithy/config-resolver/dist-es/regionInfo/getRegionInfo.js");





/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/configLoader.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/configLoader.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadConfig: () => (/* binding */ loadConfig)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _fromEnv__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./fromEnv */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js");
/* harmony import */ var _fromSharedConfigFiles__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fromSharedConfigFiles */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js");
/* harmony import */ var _fromStatic__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./fromStatic */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js");




const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => {
    const { signingName, logger } = configuration;
    const envOptions = { signingName, logger };
    return (0,_smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.memoize)((0,_smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.chain)((0,_fromEnv__WEBPACK_IMPORTED_MODULE_1__.fromEnv)(environmentVariableSelector, envOptions), (0,_fromSharedConfigFiles__WEBPACK_IMPORTED_MODULE_2__.fromSharedConfigFiles)(configFileSelector, configuration), (0,_fromStatic__WEBPACK_IMPORTED_MODULE_3__.fromStatic)(defaultValue)));
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromEnv: () => (/* binding */ fromEnv)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _getSelectorName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getSelectorName */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js");


const fromEnv = (envVarSelector, options) => async () => {
    try {
        const config = envVarSelector(process.env, options);
        if (config === undefined) {
            throw new Error();
        }
        return config;
    }
    catch (e) {
        throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.CredentialsProviderError(e.message || `Not found in ENV: ${(0,_getSelectorName__WEBPACK_IMPORTED_MODULE_1__.getSelectorName)(envVarSelector.toString())}`, { logger: options?.logger });
    }
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromSharedConfigFiles: () => (/* binding */ fromSharedConfigFiles)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _smithy_shared_ini_file_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/shared-ini-file-loader */ "../../@smithy/shared-ini-file-loader/dist-es/index.js");
/* harmony import */ var _getSelectorName__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getSelectorName */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js");



const fromSharedConfigFiles = (configSelector, { preferredFile = "config", ...init } = {}) => async () => {
    const profile = (0,_smithy_shared_ini_file_loader__WEBPACK_IMPORTED_MODULE_1__.getProfileName)(init);
    const { configFile, credentialsFile } = await (0,_smithy_shared_ini_file_loader__WEBPACK_IMPORTED_MODULE_1__.loadSharedConfigFiles)(init);
    const profileFromCredentials = credentialsFile[profile] || {};
    const profileFromConfig = configFile[profile] || {};
    const mergedProfile = preferredFile === "config"
        ? { ...profileFromCredentials, ...profileFromConfig }
        : { ...profileFromConfig, ...profileFromCredentials };
    try {
        const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
        const configValue = configSelector(mergedProfile, cfgFile);
        if (configValue === undefined) {
            throw new Error();
        }
        return configValue;
    }
    catch (e) {
        throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.CredentialsProviderError(e.message || `Not found in config files w/ profile [${profile}]: ${(0,_getSelectorName__WEBPACK_IMPORTED_MODULE_2__.getSelectorName)(configSelector.toString())}`, { logger: init.logger });
    }
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js":
/*!*************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromStatic: () => (/* binding */ fromStatic)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");

const isFunction = (func) => typeof func === "function";
const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : (0,_smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.fromStatic)(defaultValue);


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getSelectorName: () => (/* binding */ getSelectorName)
/* harmony export */ });
function getSelectorName(functionString) {
    try {
        const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
        constants.delete("CONFIG");
        constants.delete("CONFIG_PREFIX_SEPARATOR");
        constants.delete("ENV");
        return [...constants].join(", ");
    }
    catch (e) {
        return functionString;
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/index.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/index.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadConfig: () => (/* reexport safe */ _configLoader__WEBPACK_IMPORTED_MODULE_0__.loadConfig)
/* harmony export */ });
/* harmony import */ var _configLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./configLoader */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-config-provider/dist-es/configLoader.js");



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/constants.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/constants.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NODEJS_TIMEOUT_ERROR_CODES: () => (/* binding */ NODEJS_TIMEOUT_ERROR_CODES)
/* harmony export */ });
const NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "EPIPE", "ETIMEDOUT"];


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js":
/*!***********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js ***!
  \***********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getTransformedHeaders: () => (/* binding */ getTransformedHeaders)
/* harmony export */ });
const getTransformedHeaders = (headers) => {
    const transformedHeaders = {};
    for (const name of Object.keys(headers)) {
        const headerValues = headers[name];
        transformedHeaders[name] = Array.isArray(headerValues) ? headerValues.join(",") : headerValues;
    }
    return transformedHeaders;
};



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/index.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/index.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_REQUEST_TIMEOUT: () => (/* reexport safe */ _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_REQUEST_TIMEOUT),
/* harmony export */   NodeHttp2Handler: () => (/* reexport safe */ _node_http2_handler__WEBPACK_IMPORTED_MODULE_1__.NodeHttp2Handler),
/* harmony export */   NodeHttpHandler: () => (/* reexport safe */ _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.NodeHttpHandler),
/* harmony export */   streamCollector: () => (/* reexport safe */ _stream_collector__WEBPACK_IMPORTED_MODULE_2__.streamCollector)
/* harmony export */ });
/* harmony import */ var _node_http_handler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-http-handler */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
/* harmony import */ var _node_http2_handler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-http2-handler */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js");
/* harmony import */ var _stream_collector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stream-collector */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js");





/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_REQUEST_TIMEOUT: () => (/* binding */ DEFAULT_REQUEST_TIMEOUT),
/* harmony export */   NodeHttpHandler: () => (/* binding */ NodeHttpHandler)
/* harmony export */ });
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_querystring_builder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/querystring-builder */ "../../@smithy/querystring-builder/dist-es/index.js");
/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! http */ "http");
/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(http__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var https__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! https */ "https");
/* harmony import */ var https__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(https__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/constants.js");
/* harmony import */ var _get_transformed_headers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./get-transformed-headers */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js");
/* harmony import */ var _set_connection_timeout__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./set-connection-timeout */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js");
/* harmony import */ var _set_socket_keep_alive__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./set-socket-keep-alive */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js");
/* harmony import */ var _set_socket_timeout__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./set-socket-timeout */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js");
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js");
/* harmony import */ var _write_request_body__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./write-request-body */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js");











const DEFAULT_REQUEST_TIMEOUT = 0;
class NodeHttpHandler {
    static create(instanceOrOptions) {
        if (typeof instanceOrOptions?.handle === "function") {
            return instanceOrOptions;
        }
        return new NodeHttpHandler(instanceOrOptions);
    }
    static checkSocketUsage(agent, socketWarningTimestamp, logger = console) {
        const { sockets, requests, maxSockets } = agent;
        if (typeof maxSockets !== "number" || maxSockets === Infinity) {
            return socketWarningTimestamp;
        }
        const interval = 15000;
        if (Date.now() - interval < socketWarningTimestamp) {
            return socketWarningTimestamp;
        }
        if (sockets && requests) {
            for (const origin in sockets) {
                const socketsInUse = sockets[origin]?.length ?? 0;
                const requestsEnqueued = requests[origin]?.length ?? 0;
                if (socketsInUse >= maxSockets && requestsEnqueued >= 2 * maxSockets) {
                    logger?.warn?.(`@smithy/node-http-handler:WARN - socket usage at capacity=${socketsInUse} and ${requestsEnqueued} additional requests are enqueued.
See https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-configuring-maxsockets.html
or increase socketAcquisitionWarningTimeout=(millis) in the NodeHttpHandler config.`);
                    return Date.now();
                }
            }
        }
        return socketWarningTimestamp;
    }
    constructor(options) {
        this.socketWarningTimestamp = 0;
        this.metadata = { handlerProtocol: "http/1.1" };
        this.configProvider = new Promise((resolve, reject) => {
            if (typeof options === "function") {
                options()
                    .then((_options) => {
                    resolve(this.resolveDefaultConfig(_options));
                })
                    .catch(reject);
            }
            else {
                resolve(this.resolveDefaultConfig(options));
            }
        });
    }
    resolveDefaultConfig(options) {
        const { requestTimeout, connectionTimeout, socketTimeout, socketAcquisitionWarningTimeout, httpAgent, httpsAgent } = options || {};
        const keepAlive = true;
        const maxSockets = 50;
        return {
            connectionTimeout,
            requestTimeout: requestTimeout ?? socketTimeout,
            socketAcquisitionWarningTimeout,
            httpAgent: (() => {
                if (httpAgent instanceof http__WEBPACK_IMPORTED_MODULE_2__.Agent || typeof httpAgent?.destroy === "function") {
                    return httpAgent;
                }
                return new http__WEBPACK_IMPORTED_MODULE_2__.Agent({ keepAlive, maxSockets, ...httpAgent });
            })(),
            httpsAgent: (() => {
                if (httpsAgent instanceof https__WEBPACK_IMPORTED_MODULE_3__.Agent || typeof httpsAgent?.destroy === "function") {
                    return httpsAgent;
                }
                return new https__WEBPACK_IMPORTED_MODULE_3__.Agent({ keepAlive, maxSockets, ...httpsAgent });
            })(),
            logger: console,
        };
    }
    destroy() {
        this.config?.httpAgent?.destroy();
        this.config?.httpsAgent?.destroy();
    }
    async handle(request, { abortSignal, requestTimeout } = {}) {
        if (!this.config) {
            this.config = await this.configProvider;
        }
        return new Promise((_resolve, _reject) => {
            let writeRequestBodyPromise = undefined;
            const timeouts = [];
            const resolve = async (arg) => {
                await writeRequestBodyPromise;
                timeouts.forEach(_timing__WEBPACK_IMPORTED_MODULE_9__.timing.clearTimeout);
                _resolve(arg);
            };
            const reject = async (arg) => {
                await writeRequestBodyPromise;
                timeouts.forEach(_timing__WEBPACK_IMPORTED_MODULE_9__.timing.clearTimeout);
                _reject(arg);
            };
            if (!this.config) {
                throw new Error("Node HTTP request handler config is not resolved");
            }
            if (abortSignal?.aborted) {
                const abortError = new Error("Request aborted");
                abortError.name = "AbortError";
                reject(abortError);
                return;
            }
            const isSSL = request.protocol === "https:";
            const agent = isSSL ? this.config.httpsAgent : this.config.httpAgent;
            timeouts.push(_timing__WEBPACK_IMPORTED_MODULE_9__.timing.setTimeout(() => {
                this.socketWarningTimestamp = NodeHttpHandler.checkSocketUsage(agent, this.socketWarningTimestamp, this.config.logger);
            }, this.config.socketAcquisitionWarningTimeout ??
                (this.config.requestTimeout ?? 2000) + (this.config.connectionTimeout ?? 1000)));
            const queryString = (0,_smithy_querystring_builder__WEBPACK_IMPORTED_MODULE_1__.buildQueryString)(request.query || {});
            let auth = undefined;
            if (request.username != null || request.password != null) {
                const username = request.username ?? "";
                const password = request.password ?? "";
                auth = `${username}:${password}`;
            }
            let path = request.path;
            if (queryString) {
                path += `?${queryString}`;
            }
            if (request.fragment) {
                path += `#${request.fragment}`;
            }
            let hostname = request.hostname ?? "";
            if (hostname[0] === "[" && hostname.endsWith("]")) {
                hostname = request.hostname.slice(1, -1);
            }
            else {
                hostname = request.hostname;
            }
            const nodeHttpsOptions = {
                headers: request.headers,
                host: hostname,
                method: request.method,
                path,
                port: request.port,
                agent,
                auth,
            };
            const requestFunc = isSSL ? https__WEBPACK_IMPORTED_MODULE_3__.request : http__WEBPACK_IMPORTED_MODULE_2__.request;
            const req = requestFunc(nodeHttpsOptions, (res) => {
                const httpResponse = new _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__.HttpResponse({
                    statusCode: res.statusCode || -1,
                    reason: res.statusMessage,
                    headers: (0,_get_transformed_headers__WEBPACK_IMPORTED_MODULE_5__.getTransformedHeaders)(res.headers),
                    body: res,
                });
                resolve({ response: httpResponse });
            });
            req.on("error", (err) => {
                if (_constants__WEBPACK_IMPORTED_MODULE_4__.NODEJS_TIMEOUT_ERROR_CODES.includes(err.code)) {
                    reject(Object.assign(err, { name: "TimeoutError" }));
                }
                else {
                    reject(err);
                }
            });
            if (abortSignal) {
                const onAbort = () => {
                    req.destroy();
                    const abortError = new Error("Request aborted");
                    abortError.name = "AbortError";
                    reject(abortError);
                };
                if (typeof abortSignal.addEventListener === "function") {
                    const signal = abortSignal;
                    signal.addEventListener("abort", onAbort, { once: true });
                    req.once("close", () => signal.removeEventListener("abort", onAbort));
                }
                else {
                    abortSignal.onabort = onAbort;
                }
            }
            const effectiveRequestTimeout = requestTimeout ?? this.config.requestTimeout;
            timeouts.push((0,_set_connection_timeout__WEBPACK_IMPORTED_MODULE_6__.setConnectionTimeout)(req, reject, this.config.connectionTimeout));
            timeouts.push((0,_set_socket_timeout__WEBPACK_IMPORTED_MODULE_8__.setSocketTimeout)(req, reject, effectiveRequestTimeout));
            const httpAgent = nodeHttpsOptions.agent;
            if (typeof httpAgent === "object" && "keepAlive" in httpAgent) {
                timeouts.push((0,_set_socket_keep_alive__WEBPACK_IMPORTED_MODULE_7__.setSocketKeepAlive)(req, {
                    keepAlive: httpAgent.keepAlive,
                    keepAliveMsecs: httpAgent.keepAliveMsecs,
                }));
            }
            writeRequestBodyPromise = (0,_write_request_body__WEBPACK_IMPORTED_MODULE_10__.writeRequestBody)(req, request, effectiveRequestTimeout).catch((e) => {
                timeouts.forEach(_timing__WEBPACK_IMPORTED_MODULE_9__.timing.clearTimeout);
                return _reject(e);
            });
        });
    }
    updateHttpClientConfig(key, value) {
        this.config = undefined;
        this.configProvider = this.configProvider.then((config) => {
            return {
                ...config,
                [key]: value,
            };
        });
    }
    httpHandlerConfigs() {
        return this.config ?? {};
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2ConnectionManager: () => (/* binding */ NodeHttp2ConnectionManager)
/* harmony export */ });
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! http2 */ "http2");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(http2__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_http2_connection_pool__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-http2-connection-pool */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js");


class NodeHttp2ConnectionManager {
    constructor(config) {
        this.sessionCache = new Map();
        this.config = config;
        if (this.config.maxConcurrency && this.config.maxConcurrency <= 0) {
            throw new RangeError("maxConcurrency must be greater than zero.");
        }
    }
    lease(requestContext, connectionConfiguration) {
        const url = this.getUrlString(requestContext);
        const existingPool = this.sessionCache.get(url);
        if (existingPool) {
            const existingSession = existingPool.poll();
            if (existingSession && !this.config.disableConcurrency) {
                return existingSession;
            }
        }
        const session = http2__WEBPACK_IMPORTED_MODULE_0___default().connect(url);
        if (this.config.maxConcurrency) {
            session.settings({ maxConcurrentStreams: this.config.maxConcurrency }, (err) => {
                if (err) {
                    throw new Error("Fail to set maxConcurrentStreams to " +
                        this.config.maxConcurrency +
                        "when creating new session for " +
                        requestContext.destination.toString());
                }
            });
        }
        session.unref();
        const destroySessionCb = () => {
            session.destroy();
            this.deleteSession(url, session);
        };
        session.on("goaway", destroySessionCb);
        session.on("error", destroySessionCb);
        session.on("frameError", destroySessionCb);
        session.on("close", () => this.deleteSession(url, session));
        if (connectionConfiguration.requestTimeout) {
            session.setTimeout(connectionConfiguration.requestTimeout, destroySessionCb);
        }
        const connectionPool = this.sessionCache.get(url) || new _node_http2_connection_pool__WEBPACK_IMPORTED_MODULE_1__.NodeHttp2ConnectionPool();
        connectionPool.offerLast(session);
        this.sessionCache.set(url, connectionPool);
        return session;
    }
    deleteSession(authority, session) {
        const existingConnectionPool = this.sessionCache.get(authority);
        if (!existingConnectionPool) {
            return;
        }
        if (!existingConnectionPool.contains(session)) {
            return;
        }
        existingConnectionPool.remove(session);
        this.sessionCache.set(authority, existingConnectionPool);
    }
    release(requestContext, session) {
        const cacheKey = this.getUrlString(requestContext);
        this.sessionCache.get(cacheKey)?.offerLast(session);
    }
    destroy() {
        for (const [key, connectionPool] of this.sessionCache) {
            for (const session of connectionPool) {
                if (!session.destroyed) {
                    session.destroy();
                }
                connectionPool.remove(session);
            }
            this.sessionCache.delete(key);
        }
    }
    setMaxConcurrentStreams(maxConcurrentStreams) {
        if (maxConcurrentStreams && maxConcurrentStreams <= 0) {
            throw new RangeError("maxConcurrentStreams must be greater than zero.");
        }
        this.config.maxConcurrency = maxConcurrentStreams;
    }
    setDisableConcurrentStreams(disableConcurrentStreams) {
        this.config.disableConcurrency = disableConcurrentStreams;
    }
    getUrlString(request) {
        return request.destination.toString();
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2ConnectionPool: () => (/* binding */ NodeHttp2ConnectionPool)
/* harmony export */ });
class NodeHttp2ConnectionPool {
    constructor(sessions) {
        this.sessions = [];
        this.sessions = sessions ?? [];
    }
    poll() {
        if (this.sessions.length > 0) {
            return this.sessions.shift();
        }
    }
    offerLast(session) {
        this.sessions.push(session);
    }
    contains(session) {
        return this.sessions.includes(session);
    }
    remove(session) {
        this.sessions = this.sessions.filter((s) => s !== session);
    }
    [Symbol.iterator]() {
        return this.sessions[Symbol.iterator]();
    }
    destroy(connection) {
        for (const session of this.sessions) {
            if (session === connection) {
                if (!session.destroyed) {
                    session.destroy();
                }
            }
        }
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2Handler: () => (/* binding */ NodeHttp2Handler)
/* harmony export */ });
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_querystring_builder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/querystring-builder */ "../../@smithy/querystring-builder/dist-es/index.js");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! http2 */ "http2");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(http2__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _get_transformed_headers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./get-transformed-headers */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js");
/* harmony import */ var _node_http2_connection_manager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node-http2-connection-manager */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js");
/* harmony import */ var _write_request_body__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./write-request-body */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js");






class NodeHttp2Handler {
    static create(instanceOrOptions) {
        if (typeof instanceOrOptions?.handle === "function") {
            return instanceOrOptions;
        }
        return new NodeHttp2Handler(instanceOrOptions);
    }
    constructor(options) {
        this.metadata = { handlerProtocol: "h2" };
        this.connectionManager = new _node_http2_connection_manager__WEBPACK_IMPORTED_MODULE_4__.NodeHttp2ConnectionManager({});
        this.configProvider = new Promise((resolve, reject) => {
            if (typeof options === "function") {
                options()
                    .then((opts) => {
                    resolve(opts || {});
                })
                    .catch(reject);
            }
            else {
                resolve(options || {});
            }
        });
    }
    destroy() {
        this.connectionManager.destroy();
    }
    async handle(request, { abortSignal, requestTimeout } = {}) {
        if (!this.config) {
            this.config = await this.configProvider;
            this.connectionManager.setDisableConcurrentStreams(this.config.disableConcurrentStreams || false);
            if (this.config.maxConcurrentStreams) {
                this.connectionManager.setMaxConcurrentStreams(this.config.maxConcurrentStreams);
            }
        }
        const { requestTimeout: configRequestTimeout, disableConcurrentStreams } = this.config;
        const effectiveRequestTimeout = requestTimeout ?? configRequestTimeout;
        return new Promise((_resolve, _reject) => {
            let fulfilled = false;
            let writeRequestBodyPromise = undefined;
            const resolve = async (arg) => {
                await writeRequestBodyPromise;
                _resolve(arg);
            };
            const reject = async (arg) => {
                await writeRequestBodyPromise;
                _reject(arg);
            };
            if (abortSignal?.aborted) {
                fulfilled = true;
                const abortError = new Error("Request aborted");
                abortError.name = "AbortError";
                reject(abortError);
                return;
            }
            const { hostname, method, port, protocol, query } = request;
            let auth = "";
            if (request.username != null || request.password != null) {
                const username = request.username ?? "";
                const password = request.password ?? "";
                auth = `${username}:${password}@`;
            }
            const authority = `${protocol}//${auth}${hostname}${port ? `:${port}` : ""}`;
            const requestContext = { destination: new URL(authority) };
            const session = this.connectionManager.lease(requestContext, {
                requestTimeout: this.config?.sessionTimeout,
                disableConcurrentStreams: disableConcurrentStreams || false,
            });
            const rejectWithDestroy = (err) => {
                if (disableConcurrentStreams) {
                    this.destroySession(session);
                }
                fulfilled = true;
                reject(err);
            };
            const queryString = (0,_smithy_querystring_builder__WEBPACK_IMPORTED_MODULE_1__.buildQueryString)(query || {});
            let path = request.path;
            if (queryString) {
                path += `?${queryString}`;
            }
            if (request.fragment) {
                path += `#${request.fragment}`;
            }
            const req = session.request({
                ...request.headers,
                [http2__WEBPACK_IMPORTED_MODULE_2__.constants.HTTP2_HEADER_PATH]: path,
                [http2__WEBPACK_IMPORTED_MODULE_2__.constants.HTTP2_HEADER_METHOD]: method,
            });
            session.ref();
            req.on("response", (headers) => {
                const httpResponse = new _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__.HttpResponse({
                    statusCode: headers[":status"] || -1,
                    headers: (0,_get_transformed_headers__WEBPACK_IMPORTED_MODULE_3__.getTransformedHeaders)(headers),
                    body: req,
                });
                fulfilled = true;
                resolve({ response: httpResponse });
                if (disableConcurrentStreams) {
                    session.close();
                    this.connectionManager.deleteSession(authority, session);
                }
            });
            if (effectiveRequestTimeout) {
                req.setTimeout(effectiveRequestTimeout, () => {
                    req.close();
                    const timeoutError = new Error(`Stream timed out because of no activity for ${effectiveRequestTimeout} ms`);
                    timeoutError.name = "TimeoutError";
                    rejectWithDestroy(timeoutError);
                });
            }
            if (abortSignal) {
                const onAbort = () => {
                    req.close();
                    const abortError = new Error("Request aborted");
                    abortError.name = "AbortError";
                    rejectWithDestroy(abortError);
                };
                if (typeof abortSignal.addEventListener === "function") {
                    const signal = abortSignal;
                    signal.addEventListener("abort", onAbort, { once: true });
                    req.once("close", () => signal.removeEventListener("abort", onAbort));
                }
                else {
                    abortSignal.onabort = onAbort;
                }
            }
            req.on("frameError", (type, code, id) => {
                rejectWithDestroy(new Error(`Frame type id ${type} in stream id ${id} has failed with code ${code}.`));
            });
            req.on("error", rejectWithDestroy);
            req.on("aborted", () => {
                rejectWithDestroy(new Error(`HTTP/2 stream is abnormally aborted in mid-communication with result code ${req.rstCode}.`));
            });
            req.on("close", () => {
                session.unref();
                if (disableConcurrentStreams) {
                    session.destroy();
                }
                if (!fulfilled) {
                    rejectWithDestroy(new Error("Unexpected error: http2 request did not get a response"));
                }
            });
            writeRequestBodyPromise = (0,_write_request_body__WEBPACK_IMPORTED_MODULE_5__.writeRequestBody)(req, request, effectiveRequestTimeout);
        });
    }
    updateHttpClientConfig(key, value) {
        this.config = undefined;
        this.configProvider = this.configProvider.then((config) => {
            return {
                ...config,
                [key]: value,
            };
        });
    }
    httpHandlerConfigs() {
        return this.config ?? {};
    }
    destroySession(session) {
        if (!session.destroyed) {
            session.destroy();
        }
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setConnectionTimeout: () => (/* binding */ setConnectionTimeout)
/* harmony export */ });
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js");

const DEFER_EVENT_LISTENER_TIME = 1000;
const setConnectionTimeout = (request, reject, timeoutInMs = 0) => {
    if (!timeoutInMs) {
        return -1;
    }
    const registerTimeout = (offset) => {
        const timeoutId = _timing__WEBPACK_IMPORTED_MODULE_0__.timing.setTimeout(() => {
            request.destroy();
            reject(Object.assign(new Error(`Socket timed out without establishing a connection within ${timeoutInMs} ms`), {
                name: "TimeoutError",
            }));
        }, timeoutInMs - offset);
        const doWithSocket = (socket) => {
            if (socket?.connecting) {
                socket.on("connect", () => {
                    _timing__WEBPACK_IMPORTED_MODULE_0__.timing.clearTimeout(timeoutId);
                });
            }
            else {
                _timing__WEBPACK_IMPORTED_MODULE_0__.timing.clearTimeout(timeoutId);
            }
        };
        if (request.socket) {
            doWithSocket(request.socket);
        }
        else {
            request.on("socket", doWithSocket);
        }
    };
    if (timeoutInMs < 2000) {
        registerTimeout(0);
        return 0;
    }
    return _timing__WEBPACK_IMPORTED_MODULE_0__.timing.setTimeout(registerTimeout.bind(null, DEFER_EVENT_LISTENER_TIME), DEFER_EVENT_LISTENER_TIME);
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js ***!
  \*********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setSocketKeepAlive: () => (/* binding */ setSocketKeepAlive)
/* harmony export */ });
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js");

const DEFER_EVENT_LISTENER_TIME = 3000;
const setSocketKeepAlive = (request, { keepAlive, keepAliveMsecs }, deferTimeMs = DEFER_EVENT_LISTENER_TIME) => {
    if (keepAlive !== true) {
        return -1;
    }
    const registerListener = () => {
        if (request.socket) {
            request.socket.setKeepAlive(keepAlive, keepAliveMsecs || 0);
        }
        else {
            request.on("socket", (socket) => {
                socket.setKeepAlive(keepAlive, keepAliveMsecs || 0);
            });
        }
    };
    if (deferTimeMs === 0) {
        registerListener();
        return 0;
    }
    return _timing__WEBPACK_IMPORTED_MODULE_0__.timing.setTimeout(registerListener, deferTimeMs);
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setSocketTimeout: () => (/* binding */ setSocketTimeout)
/* harmony export */ });
/* harmony import */ var _node_http_handler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-http-handler */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js");


const DEFER_EVENT_LISTENER_TIME = 3000;
const setSocketTimeout = (request, reject, timeoutInMs = _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_REQUEST_TIMEOUT) => {
    const registerTimeout = (offset) => {
        const timeout = timeoutInMs - offset;
        const onTimeout = () => {
            request.destroy();
            reject(Object.assign(new Error(`Connection timed out after ${timeoutInMs} ms`), { name: "TimeoutError" }));
        };
        if (request.socket) {
            request.socket.setTimeout(timeout, onTimeout);
            request.on("close", () => request.socket?.removeListener("timeout", onTimeout));
        }
        else {
            request.setTimeout(timeout, onTimeout);
        }
    };
    if (0 < timeoutInMs && timeoutInMs < 6000) {
        registerTimeout(0);
        return 0;
    }
    return _timing__WEBPACK_IMPORTED_MODULE_1__.timing.setTimeout(registerTimeout.bind(null, timeoutInMs === 0 ? 0 : DEFER_EVENT_LISTENER_TIME), DEFER_EVENT_LISTENER_TIME);
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Collector: () => (/* binding */ Collector)
/* harmony export */ });
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! stream */ "stream");
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(stream__WEBPACK_IMPORTED_MODULE_0__);

class Collector extends stream__WEBPACK_IMPORTED_MODULE_0__.Writable {
    constructor() {
        super(...arguments);
        this.bufferedBytes = [];
    }
    _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   streamCollector: () => (/* binding */ streamCollector)
/* harmony export */ });
/* harmony import */ var _collector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./collector */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js");

const streamCollector = (stream) => {
    if (isReadableStreamInstance(stream)) {
        return collectReadableStream(stream);
    }
    return new Promise((resolve, reject) => {
        const collector = new _collector__WEBPACK_IMPORTED_MODULE_0__.Collector();
        stream.pipe(collector);
        stream.on("error", (err) => {
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function () {
            const bytes = new Uint8Array(Buffer.concat(this.bufferedBytes));
            resolve(bytes);
        });
    });
};
const isReadableStreamInstance = (stream) => typeof ReadableStream === "function" && stream instanceof ReadableStream;
async function collectReadableStream(stream) {
    const chunks = [];
    const reader = stream.getReader();
    let isDone = false;
    let length = 0;
    while (!isDone) {
        const { done, value } = await reader.read();
        if (value) {
            chunks.push(value);
            length += value.length;
        }
        isDone = done;
    }
    const collected = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        collected.set(chunk, offset);
        offset += chunk.length;
    }
    return collected;
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   timing: () => (/* binding */ timing)
/* harmony export */ });
const timing = {
    setTimeout: (cb, ms) => setTimeout(cb, ms),
    clearTimeout: (timeoutId) => clearTimeout(timeoutId),
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   writeRequestBody: () => (/* binding */ writeRequestBody)
/* harmony export */ });
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! stream */ "stream");
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(stream__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/client-sso/node_modules/@smithy/node-http-handler/dist-es/timing.js");


const MIN_WAIT_TIME = 6000;
async function writeRequestBody(httpRequest, request, maxContinueTimeoutMs = MIN_WAIT_TIME) {
    const headers = request.headers ?? {};
    const expect = headers["Expect"] || headers["expect"];
    let timeoutId = -1;
    let sendBody = true;
    if (expect === "100-continue") {
        sendBody = await Promise.race([
            new Promise((resolve) => {
                timeoutId = Number(_timing__WEBPACK_IMPORTED_MODULE_1__.timing.setTimeout(() => resolve(true), Math.max(MIN_WAIT_TIME, maxContinueTimeoutMs)));
            }),
            new Promise((resolve) => {
                httpRequest.on("continue", () => {
                    _timing__WEBPACK_IMPORTED_MODULE_1__.timing.clearTimeout(timeoutId);
                    resolve(true);
                });
                httpRequest.on("response", () => {
                    _timing__WEBPACK_IMPORTED_MODULE_1__.timing.clearTimeout(timeoutId);
                    resolve(false);
                });
                httpRequest.on("error", () => {
                    _timing__WEBPACK_IMPORTED_MODULE_1__.timing.clearTimeout(timeoutId);
                    resolve(false);
                });
            }),
        ]);
    }
    if (sendBody) {
        writeBody(httpRequest, request.body);
    }
}
function writeBody(httpRequest, body) {
    if (body instanceof stream__WEBPACK_IMPORTED_MODULE_0__.Readable) {
        body.pipe(httpRequest);
        return;
    }
    if (body) {
        if (Buffer.isBuffer(body) || typeof body === "string") {
            httpRequest.end(body);
            return;
        }
        const uint8 = body;
        if (typeof uint8 === "object" &&
            uint8.buffer &&
            typeof uint8.byteOffset === "number" &&
            typeof uint8.byteLength === "number") {
            httpRequest.end(Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength));
            return;
        }
        httpRequest.end(Buffer.from(body));
        return;
    }
    httpRequest.end();
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NoOpLogger: () => (/* binding */ NoOpLogger)
/* harmony export */ });
class NoOpLogger {
    trace() { }
    debug() { }
    info() { }
    warn() { }
    error() { }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/client.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/client.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Client: () => (/* binding */ Client)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_stack__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-stack */ "../../@smithy/middleware-stack/dist-es/index.js");

class Client {
    constructor(config) {
        this.config = config;
        this.middlewareStack = (0,_smithy_middleware_stack__WEBPACK_IMPORTED_MODULE_0__.constructStack)();
    }
    send(command, optionsOrCb, cb) {
        const options = typeof optionsOrCb !== "function" ? optionsOrCb : undefined;
        const callback = typeof optionsOrCb === "function" ? optionsOrCb : cb;
        const useHandlerCache = options === undefined && this.config.cacheMiddleware === true;
        let handler;
        if (useHandlerCache) {
            if (!this.handlers) {
                this.handlers = new WeakMap();
            }
            const handlers = this.handlers;
            if (handlers.has(command.constructor)) {
                handler = handlers.get(command.constructor);
            }
            else {
                handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
                handlers.set(command.constructor, handler);
            }
        }
        else {
            delete this.handlers;
            handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
        }
        if (callback) {
            handler(command)
                .then((result) => callback(null, result.output), (err) => callback(err))
                .catch(() => { });
        }
        else {
            return handler(command).then((result) => result.output);
        }
    }
    destroy() {
        this.config?.requestHandler?.destroy?.();
        delete this.handlers;
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectBody: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.collectBody)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/collect-stream-body.js");



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/command.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/command.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Command: () => (/* binding */ Command)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_stack__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-stack */ "../../@smithy/middleware-stack/dist-es/index.js");
/* harmony import */ var _smithy_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/types */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/index.js");


class Command {
    constructor() {
        this.middlewareStack = (0,_smithy_middleware_stack__WEBPACK_IMPORTED_MODULE_0__.constructStack)();
    }
    static classBuilder() {
        return new ClassBuilder();
    }
    resolveMiddlewareWithContext(clientStack, configuration, options, { middlewareFn, clientName, commandName, inputFilterSensitiveLog, outputFilterSensitiveLog, smithyContext, additionalContext, CommandCtor, }) {
        for (const mw of middlewareFn.bind(this)(CommandCtor, clientStack, configuration, options)) {
            this.middlewareStack.use(mw);
        }
        const stack = clientStack.concat(this.middlewareStack);
        const { logger } = configuration;
        const handlerExecutionContext = {
            logger,
            clientName,
            commandName,
            inputFilterSensitiveLog,
            outputFilterSensitiveLog,
            [_smithy_types__WEBPACK_IMPORTED_MODULE_1__.SMITHY_CONTEXT_KEY]: {
                commandInstance: this,
                ...smithyContext,
            },
            ...additionalContext,
        };
        const { requestHandler } = configuration;
        return stack.resolve((request) => requestHandler.handle(request.request, options || {}), handlerExecutionContext);
    }
}
class ClassBuilder {
    constructor() {
        this._init = () => { };
        this._ep = {};
        this._middlewareFn = () => [];
        this._commandName = "";
        this._clientName = "";
        this._additionalContext = {};
        this._smithyContext = {};
        this._inputFilterSensitiveLog = (_) => _;
        this._outputFilterSensitiveLog = (_) => _;
        this._serializer = null;
        this._deserializer = null;
    }
    init(cb) {
        this._init = cb;
    }
    ep(endpointParameterInstructions) {
        this._ep = endpointParameterInstructions;
        return this;
    }
    m(middlewareSupplier) {
        this._middlewareFn = middlewareSupplier;
        return this;
    }
    s(service, operation, smithyContext = {}) {
        this._smithyContext = {
            service,
            operation,
            ...smithyContext,
        };
        return this;
    }
    c(additionalContext = {}) {
        this._additionalContext = additionalContext;
        return this;
    }
    n(clientName, commandName) {
        this._clientName = clientName;
        this._commandName = commandName;
        return this;
    }
    f(inputFilter = (_) => _, outputFilter = (_) => _) {
        this._inputFilterSensitiveLog = inputFilter;
        this._outputFilterSensitiveLog = outputFilter;
        return this;
    }
    ser(serializer) {
        this._serializer = serializer;
        return this;
    }
    de(deserializer) {
        this._deserializer = deserializer;
        return this;
    }
    sc(operation) {
        this._operationSchema = operation;
        this._smithyContext.operationSchema = operation;
        return this;
    }
    build() {
        const closure = this;
        let CommandRef;
        return (CommandRef = class extends Command {
            static getEndpointParameterInstructions() {
                return closure._ep;
            }
            constructor(...[input]) {
                super();
                this.serialize = closure._serializer;
                this.deserialize = closure._deserializer;
                this.input = input ?? {};
                closure._init(this);
                this.schema = closure._operationSchema;
            }
            resolveMiddleware(stack, configuration, options) {
                return this.resolveMiddlewareWithContext(stack, configuration, options, {
                    CommandCtor: CommandRef,
                    middlewareFn: closure._middlewareFn,
                    clientName: closure._clientName,
                    commandName: closure._commandName,
                    inputFilterSensitiveLog: closure._inputFilterSensitiveLog,
                    outputFilterSensitiveLog: closure._outputFilterSensitiveLog,
                    smithyContext: closure._smithyContext,
                    additionalContext: closure._additionalContext,
                });
            }
        });
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/constants.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/constants.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SENSITIVE_STRING: () => (/* binding */ SENSITIVE_STRING)
/* harmony export */ });
const SENSITIVE_STRING = "***SensitiveInformation***";


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createAggregatedClient: () => (/* binding */ createAggregatedClient)
/* harmony export */ });
const createAggregatedClient = (commands, Client) => {
    for (const command of Object.keys(commands)) {
        const CommandCtor = commands[command];
        const methodImpl = async function (args, optionsOrCb, cb) {
            const command = new CommandCtor(args);
            if (typeof optionsOrCb === "function") {
                this.send(command, optionsOrCb);
            }
            else if (typeof cb === "function") {
                if (typeof optionsOrCb !== "object")
                    throw new Error(`Expected http options but got ${typeof optionsOrCb}`);
                this.send(command, optionsOrCb || {}, cb);
            }
            else {
                return this.send(command, optionsOrCb);
            }
        };
        const methodName = (command[0].toLowerCase() + command.slice(1)).replace(/Command$/, "");
        Client.prototype[methodName] = methodImpl;
    }
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   throwDefaultError: () => (/* binding */ throwDefaultError),
/* harmony export */   withBaseException: () => (/* binding */ withBaseException)
/* harmony export */ });
/* harmony import */ var _exceptions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./exceptions */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/exceptions.js");

const throwDefaultError = ({ output, parsedBody, exceptionCtor, errorCode }) => {
    const $metadata = deserializeMetadata(output);
    const statusCode = $metadata.httpStatusCode ? $metadata.httpStatusCode + "" : undefined;
    const response = new exceptionCtor({
        name: parsedBody?.code || parsedBody?.Code || errorCode || statusCode || "UnknownError",
        $fault: "client",
        $metadata,
    });
    throw (0,_exceptions__WEBPACK_IMPORTED_MODULE_0__.decorateServiceException)(response, parsedBody);
};
const withBaseException = (ExceptionCtor) => {
    return ({ output, parsedBody, errorCode }) => {
        throwDefaultError({ output, parsedBody, exceptionCtor: ExceptionCtor, errorCode });
    };
};
const deserializeMetadata = (output) => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
});


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadConfigsForDefaultMode: () => (/* binding */ loadConfigsForDefaultMode)
/* harmony export */ });
const loadConfigsForDefaultMode = (mode) => {
    switch (mode) {
        case "standard":
            return {
                retryMode: "standard",
                connectionTimeout: 3100,
            };
        case "in-region":
            return {
                retryMode: "standard",
                connectionTimeout: 1100,
            };
        case "cross-region":
            return {
                retryMode: "standard",
                connectionTimeout: 3100,
            };
        case "mobile":
            return {
                retryMode: "standard",
                connectionTimeout: 30000,
            };
        default:
            return {};
    }
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js":
/*!***************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js ***!
  \***************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   emitWarningIfUnsupportedVersion: () => (/* binding */ emitWarningIfUnsupportedVersion)
/* harmony export */ });
let warningEmitted = false;
const emitWarningIfUnsupportedVersion = (version) => {
    if (version && !warningEmitted && parseInt(version.substring(1, version.indexOf("."))) < 16) {
        warningEmitted = true;
    }
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/exceptions.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/exceptions.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ServiceException: () => (/* binding */ ServiceException),
/* harmony export */   decorateServiceException: () => (/* binding */ decorateServiceException)
/* harmony export */ });
class ServiceException extends Error {
    constructor(options) {
        super(options.message);
        Object.setPrototypeOf(this, Object.getPrototypeOf(this).constructor.prototype);
        this.name = options.name;
        this.$fault = options.$fault;
        this.$metadata = options.$metadata;
    }
    static isInstance(value) {
        if (!value)
            return false;
        const candidate = value;
        return (ServiceException.prototype.isPrototypeOf(candidate) ||
            (Boolean(candidate.$fault) &&
                Boolean(candidate.$metadata) &&
                (candidate.$fault === "client" || candidate.$fault === "server")));
    }
    static [Symbol.hasInstance](instance) {
        if (!instance)
            return false;
        const candidate = instance;
        if (this === ServiceException) {
            return ServiceException.isInstance(instance);
        }
        if (ServiceException.isInstance(instance)) {
            if (candidate.name && this.name) {
                return this.prototype.isPrototypeOf(instance) || candidate.name === this.name;
            }
            return this.prototype.isPrototypeOf(instance);
        }
        return false;
    }
}
const decorateServiceException = (exception, additions = {}) => {
    Object.entries(additions)
        .filter(([, v]) => v !== undefined)
        .forEach(([k, v]) => {
        if (exception[k] == undefined || exception[k] === "") {
            exception[k] = v;
        }
    });
    const message = exception.message || exception.Message || "UnknownError";
    exception.message = message;
    delete exception.Message;
    return exception;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js":
/*!*************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js ***!
  \*************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extendedEncodeURIComponent: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.extendedEncodeURIComponent)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/extended-encode-uri-component.js");



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _smithy_types__WEBPACK_IMPORTED_MODULE_0__.AlgorithmId),
/* harmony export */   getChecksumConfiguration: () => (/* binding */ getChecksumConfiguration),
/* harmony export */   resolveChecksumRuntimeConfig: () => (/* binding */ resolveChecksumRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _smithy_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/types */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/index.js");


const getChecksumConfiguration = (runtimeConfig) => {
    const checksumAlgorithms = [];
    for (const id in _smithy_types__WEBPACK_IMPORTED_MODULE_0__.AlgorithmId) {
        const algorithmId = _smithy_types__WEBPACK_IMPORTED_MODULE_0__.AlgorithmId[id];
        if (runtimeConfig[algorithmId] === undefined) {
            continue;
        }
        checksumAlgorithms.push({
            algorithmId: () => algorithmId,
            checksumConstructor: () => runtimeConfig[algorithmId],
        });
    }
    return {
        addChecksumAlgorithm(algo) {
            checksumAlgorithms.push(algo);
        },
        checksumAlgorithms() {
            return checksumAlgorithms;
        },
    };
};
const resolveChecksumRuntimeConfig = (clientConfig) => {
    const runtimeConfig = {};
    clientConfig.checksumAlgorithms().forEach((checksumAlgorithm) => {
        runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
    });
    return runtimeConfig;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js":
/*!************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js ***!
  \************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* binding */ getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* binding */ getDefaultExtensionConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* binding */ resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js");
/* harmony import */ var _retry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./retry */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js");


const getDefaultExtensionConfiguration = (runtimeConfig) => {
    return Object.assign((0,_checksum__WEBPACK_IMPORTED_MODULE_0__.getChecksumConfiguration)(runtimeConfig), (0,_retry__WEBPACK_IMPORTED_MODULE_1__.getRetryConfiguration)(runtimeConfig));
};
const getDefaultClientConfiguration = getDefaultExtensionConfiguration;
const resolveDefaultRuntimeConfig = (config) => {
    return Object.assign((0,_checksum__WEBPACK_IMPORTED_MODULE_0__.resolveChecksumRuntimeConfig)(config), (0,_retry__WEBPACK_IMPORTED_MODULE_1__.resolveRetryRuntimeConfig)(config));
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/index.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/index.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultExtensionConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultExtensionConfiguration */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js");



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRetryConfiguration: () => (/* binding */ getRetryConfiguration),
/* harmony export */   resolveRetryRuntimeConfig: () => (/* binding */ resolveRetryRuntimeConfig)
/* harmony export */ });
const getRetryConfiguration = (runtimeConfig) => {
    return {
        setRetryStrategy(retryStrategy) {
            runtimeConfig.retryStrategy = retryStrategy;
        },
        retryStrategy() {
            return runtimeConfig.retryStrategy;
        },
    };
};
const resolveRetryRuntimeConfig = (retryStrategyConfiguration) => {
    const runtimeConfig = {};
    runtimeConfig.retryStrategy = retryStrategyConfiguration.retryStrategy();
    return runtimeConfig;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getArrayIfSingleItem: () => (/* binding */ getArrayIfSingleItem)
/* harmony export */ });
const getArrayIfSingleItem = (mayBeArray) => Array.isArray(mayBeArray) ? mayBeArray : [mayBeArray];


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getValueFromTextNode: () => (/* binding */ getValueFromTextNode)
/* harmony export */ });
const getValueFromTextNode = (obj) => {
    const textNodeName = "#text";
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key][textNodeName] !== undefined) {
            obj[key] = obj[key][textNodeName];
        }
        else if (typeof obj[key] === "object" && obj[key] !== null) {
            obj[key] = getValueFromTextNode(obj[key]);
        }
    }
    return obj;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js":
/*!*************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/index.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Client: () => (/* reexport safe */ _client__WEBPACK_IMPORTED_MODULE_0__.Client),
/* harmony export */   Command: () => (/* reexport safe */ _command__WEBPACK_IMPORTED_MODULE_2__.Command),
/* harmony export */   LazyJsonString: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.LazyJsonString),
/* harmony export */   NoOpLogger: () => (/* reexport safe */ _NoOpLogger__WEBPACK_IMPORTED_MODULE_14__.NoOpLogger),
/* harmony export */   NumericValue: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.NumericValue),
/* harmony export */   SENSITIVE_STRING: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_3__.SENSITIVE_STRING),
/* harmony export */   ServiceException: () => (/* reexport safe */ _exceptions__WEBPACK_IMPORTED_MODULE_8__.ServiceException),
/* harmony export */   _json: () => (/* reexport safe */ _serde_json__WEBPACK_IMPORTED_MODULE_18__._json),
/* harmony export */   collectBody: () => (/* reexport safe */ _collect_stream_body__WEBPACK_IMPORTED_MODULE_1__.collectBody),
/* harmony export */   convertMap: () => (/* reexport safe */ _object_mapping__WEBPACK_IMPORTED_MODULE_15__.convertMap),
/* harmony export */   copyDocumentWithTransform: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.copyDocumentWithTransform),
/* harmony export */   createAggregatedClient: () => (/* reexport safe */ _create_aggregated_client__WEBPACK_IMPORTED_MODULE_4__.createAggregatedClient),
/* harmony export */   dateToUtcString: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.dateToUtcString),
/* harmony export */   decorateServiceException: () => (/* reexport safe */ _exceptions__WEBPACK_IMPORTED_MODULE_8__.decorateServiceException),
/* harmony export */   emitWarningIfUnsupportedVersion: () => (/* reexport safe */ _emitWarningIfUnsupportedVersion__WEBPACK_IMPORTED_MODULE_7__.emitWarningIfUnsupportedVersion),
/* harmony export */   expectBoolean: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectBoolean),
/* harmony export */   expectByte: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectByte),
/* harmony export */   expectFloat32: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectFloat32),
/* harmony export */   expectInt: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectInt),
/* harmony export */   expectInt32: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectInt32),
/* harmony export */   expectLong: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectLong),
/* harmony export */   expectNonNull: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectNonNull),
/* harmony export */   expectNumber: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectNumber),
/* harmony export */   expectObject: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectObject),
/* harmony export */   expectShort: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectShort),
/* harmony export */   expectString: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectString),
/* harmony export */   expectUnion: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.expectUnion),
/* harmony export */   extendedEncodeURIComponent: () => (/* reexport safe */ _extended_encode_uri_component__WEBPACK_IMPORTED_MODULE_9__.extendedEncodeURIComponent),
/* harmony export */   getArrayIfSingleItem: () => (/* reexport safe */ _get_array_if_single_item__WEBPACK_IMPORTED_MODULE_11__.getArrayIfSingleItem),
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _extensions__WEBPACK_IMPORTED_MODULE_10__.getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* reexport safe */ _extensions__WEBPACK_IMPORTED_MODULE_10__.getDefaultExtensionConfiguration),
/* harmony export */   getValueFromTextNode: () => (/* reexport safe */ _get_value_from_text_node__WEBPACK_IMPORTED_MODULE_12__.getValueFromTextNode),
/* harmony export */   handleFloat: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.handleFloat),
/* harmony export */   isSerializableHeaderValue: () => (/* reexport safe */ _is_serializable_header_value__WEBPACK_IMPORTED_MODULE_13__.isSerializableHeaderValue),
/* harmony export */   limitedParseDouble: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.limitedParseDouble),
/* harmony export */   limitedParseFloat: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.limitedParseFloat),
/* harmony export */   limitedParseFloat32: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.limitedParseFloat32),
/* harmony export */   loadConfigsForDefaultMode: () => (/* reexport safe */ _defaults_mode__WEBPACK_IMPORTED_MODULE_6__.loadConfigsForDefaultMode),
/* harmony export */   logger: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.logger),
/* harmony export */   map: () => (/* reexport safe */ _object_mapping__WEBPACK_IMPORTED_MODULE_15__.map),
/* harmony export */   nv: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.nv),
/* harmony export */   parseBoolean: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.parseBoolean),
/* harmony export */   parseEpochTimestamp: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.parseEpochTimestamp),
/* harmony export */   parseRfc3339DateTime: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.parseRfc3339DateTime),
/* harmony export */   parseRfc3339DateTimeWithOffset: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.parseRfc3339DateTimeWithOffset),
/* harmony export */   parseRfc7231DateTime: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.parseRfc7231DateTime),
/* harmony export */   quoteHeader: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.quoteHeader),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _extensions__WEBPACK_IMPORTED_MODULE_10__.resolveDefaultRuntimeConfig),
/* harmony export */   resolvedPath: () => (/* reexport safe */ _resolve_path__WEBPACK_IMPORTED_MODULE_16__.resolvedPath),
/* harmony export */   serializeDateTime: () => (/* reexport safe */ _ser_utils__WEBPACK_IMPORTED_MODULE_17__.serializeDateTime),
/* harmony export */   serializeFloat: () => (/* reexport safe */ _ser_utils__WEBPACK_IMPORTED_MODULE_17__.serializeFloat),
/* harmony export */   splitEvery: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.splitEvery),
/* harmony export */   splitHeader: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.splitHeader),
/* harmony export */   strictParseByte: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseByte),
/* harmony export */   strictParseDouble: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseDouble),
/* harmony export */   strictParseFloat: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseFloat),
/* harmony export */   strictParseFloat32: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseFloat32),
/* harmony export */   strictParseInt: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseInt),
/* harmony export */   strictParseInt32: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseInt32),
/* harmony export */   strictParseLong: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseLong),
/* harmony export */   strictParseShort: () => (/* reexport safe */ _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__.strictParseShort),
/* harmony export */   take: () => (/* reexport safe */ _object_mapping__WEBPACK_IMPORTED_MODULE_15__.take),
/* harmony export */   throwDefaultError: () => (/* reexport safe */ _default_error_handler__WEBPACK_IMPORTED_MODULE_5__.throwDefaultError),
/* harmony export */   withBaseException: () => (/* reexport safe */ _default_error_handler__WEBPACK_IMPORTED_MODULE_5__.withBaseException)
/* harmony export */ });
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/client.js");
/* harmony import */ var _collect_stream_body__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./collect-stream-body */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js");
/* harmony import */ var _command__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./command */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/command.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/constants.js");
/* harmony import */ var _create_aggregated_client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./create-aggregated-client */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js");
/* harmony import */ var _default_error_handler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./default-error-handler */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js");
/* harmony import */ var _defaults_mode__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./defaults-mode */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js");
/* harmony import */ var _emitWarningIfUnsupportedVersion__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./emitWarningIfUnsupportedVersion */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js");
/* harmony import */ var _exceptions__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./exceptions */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/exceptions.js");
/* harmony import */ var _extended_encode_uri_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./extended-encode-uri-component */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js");
/* harmony import */ var _extensions__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./extensions */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/extensions/index.js");
/* harmony import */ var _get_array_if_single_item__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./get-array-if-single-item */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js");
/* harmony import */ var _get_value_from_text_node__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./get-value-from-text-node */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js");
/* harmony import */ var _is_serializable_header_value__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./is-serializable-header-value */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js");
/* harmony import */ var _NoOpLogger__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./NoOpLogger */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js");
/* harmony import */ var _object_mapping__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./object-mapping */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/object-mapping.js");
/* harmony import */ var _resolve_path__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./resolve-path */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/resolve-path.js");
/* harmony import */ var _ser_utils__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./ser-utils */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/ser-utils.js");
/* harmony import */ var _serde_json__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./serde-json */ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/serde-json.js");
/* harmony import */ var _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @smithy/core/serde */ "../../@smithy/core/dist-es/submodules/serde/index.js");






















/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isSerializableHeaderValue: () => (/* binding */ isSerializableHeaderValue)
/* harmony export */ });
const isSerializableHeaderValue = (value) => {
    return value != null;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/object-mapping.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/object-mapping.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   convertMap: () => (/* binding */ convertMap),
/* harmony export */   map: () => (/* binding */ map),
/* harmony export */   take: () => (/* binding */ take)
/* harmony export */ });
function map(arg0, arg1, arg2) {
    let target;
    let filter;
    let instructions;
    if (typeof arg1 === "undefined" && typeof arg2 === "undefined") {
        target = {};
        instructions = arg0;
    }
    else {
        target = arg0;
        if (typeof arg1 === "function") {
            filter = arg1;
            instructions = arg2;
            return mapWithFilter(target, filter, instructions);
        }
        else {
            instructions = arg1;
        }
    }
    for (const key of Object.keys(instructions)) {
        if (!Array.isArray(instructions[key])) {
            target[key] = instructions[key];
            continue;
        }
        applyInstruction(target, null, instructions, key);
    }
    return target;
}
const convertMap = (target) => {
    const output = {};
    for (const [k, v] of Object.entries(target || {})) {
        output[k] = [, v];
    }
    return output;
};
const take = (source, instructions) => {
    const out = {};
    for (const key in instructions) {
        applyInstruction(out, source, instructions, key);
    }
    return out;
};
const mapWithFilter = (target, filter, instructions) => {
    return map(target, Object.entries(instructions).reduce((_instructions, [key, value]) => {
        if (Array.isArray(value)) {
            _instructions[key] = value;
        }
        else {
            if (typeof value === "function") {
                _instructions[key] = [filter, value()];
            }
            else {
                _instructions[key] = [filter, value];
            }
        }
        return _instructions;
    }, {}));
};
const applyInstruction = (target, source, instructions, targetKey) => {
    if (source !== null) {
        let instruction = instructions[targetKey];
        if (typeof instruction === "function") {
            instruction = [, instruction];
        }
        const [filter = nonNullish, valueFn = pass, sourceKey = targetKey] = instruction;
        if ((typeof filter === "function" && filter(source[sourceKey])) || (typeof filter !== "function" && !!filter)) {
            target[targetKey] = valueFn(source[sourceKey]);
        }
        return;
    }
    let [filter, value] = instructions[targetKey];
    if (typeof value === "function") {
        let _value;
        const defaultFilterPassed = filter === undefined && (_value = value()) != null;
        const customFilterPassed = (typeof filter === "function" && !!filter(void 0)) || (typeof filter !== "function" && !!filter);
        if (defaultFilterPassed) {
            target[targetKey] = _value;
        }
        else if (customFilterPassed) {
            target[targetKey] = value();
        }
    }
    else {
        const defaultFilterPassed = filter === undefined && value != null;
        const customFilterPassed = (typeof filter === "function" && !!filter(value)) || (typeof filter !== "function" && !!filter);
        if (defaultFilterPassed || customFilterPassed) {
            target[targetKey] = value;
        }
    }
};
const nonNullish = (_) => _ != null;
const pass = (_) => _;


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/resolve-path.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/resolve-path.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolvedPath: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.resolvedPath)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/resolve-path.js");



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/ser-utils.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/ser-utils.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   serializeDateTime: () => (/* binding */ serializeDateTime),
/* harmony export */   serializeFloat: () => (/* binding */ serializeFloat)
/* harmony export */ });
const serializeFloat = (value) => {
    if (value !== value) {
        return "NaN";
    }
    switch (value) {
        case Infinity:
            return "Infinity";
        case -Infinity:
            return "-Infinity";
        default:
            return value;
    }
};
const serializeDateTime = (date) => date.toISOString().replace(".000Z", "Z");


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/serde-json.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/smithy-client/dist-es/serde-json.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _json: () => (/* binding */ _json)
/* harmony export */ });
const _json = (obj) => {
    if (obj == null) {
        return {};
    }
    if (Array.isArray(obj)) {
        return obj.filter((_) => _ != null).map(_json);
    }
    if (typeof obj === "object") {
        const target = {};
        for (const key of Object.keys(obj)) {
            if (obj[key] == null) {
                continue;
            }
            target[key] = _json(obj[key]);
        }
        return target;
    }
    return obj;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/abort.js":
/*!*****************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/abort.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HttpApiKeyAuthLocation: () => (/* binding */ HttpApiKeyAuthLocation)
/* harmony export */ });
var HttpApiKeyAuthLocation;
(function (HttpApiKeyAuthLocation) {
    HttpApiKeyAuthLocation["HEADER"] = "header";
    HttpApiKeyAuthLocation["QUERY"] = "query";
})(HttpApiKeyAuthLocation || (HttpApiKeyAuthLocation = {}));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpSigner.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpSigner.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/auth.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/auth.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HttpAuthLocation: () => (/* binding */ HttpAuthLocation)
/* harmony export */ });
var HttpAuthLocation;
(function (HttpAuthLocation) {
    HttpAuthLocation["HEADER"] = "header";
    HttpAuthLocation["QUERY"] = "query";
})(HttpAuthLocation || (HttpAuthLocation = {}));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/index.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/index.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HttpApiKeyAuthLocation: () => (/* reexport safe */ _HttpApiKeyAuth__WEBPACK_IMPORTED_MODULE_1__.HttpApiKeyAuthLocation),
/* harmony export */   HttpAuthLocation: () => (/* reexport safe */ _auth__WEBPACK_IMPORTED_MODULE_0__.HttpAuthLocation)
/* harmony export */ });
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auth */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/auth.js");
/* harmony import */ var _HttpApiKeyAuth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./HttpApiKeyAuth */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js");
/* harmony import */ var _HttpAuthScheme__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HttpAuthScheme */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js");
/* harmony import */ var _HttpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HttpAuthSchemeProvider */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js");
/* harmony import */ var _HttpSigner__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./HttpSigner */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/HttpSigner.js");
/* harmony import */ var _IdentityProviderConfig__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./IdentityProviderConfig */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js");








/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/checksum.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/checksum.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/client.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/client.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/command.js":
/*!*******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/command.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/config.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/config.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/index.js":
/*!****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/index.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/config.js");
/* harmony import */ var _manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./manager */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/manager.js");
/* harmony import */ var _pool__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pool */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/pool.js");





/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/manager.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/manager.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/pool.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/pool.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/crypto.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/crypto.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/encode.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/encode.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoint.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoint.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EndpointURLScheme: () => (/* binding */ EndpointURLScheme)
/* harmony export */ });
var EndpointURLScheme;
(function (EndpointURLScheme) {
    EndpointURLScheme["HTTP"] = "http";
    EndpointURLScheme["HTTPS"] = "https";
})(EndpointURLScheme || (EndpointURLScheme = {}));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js":
/*!*************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/index.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/index.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _EndpointRuleObject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EndpointRuleObject */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js");
/* harmony import */ var _ErrorRuleObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorRuleObject */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js");
/* harmony import */ var _RuleSetObject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RuleSetObject */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js");
/* harmony import */ var _shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shared */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/shared.js");
/* harmony import */ var _TreeRuleObject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./TreeRuleObject */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js");







/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/shared.js":
/*!****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/shared.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/eventStream.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/eventStream.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/checksum.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/checksum.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* binding */ AlgorithmId),
/* harmony export */   getChecksumConfiguration: () => (/* binding */ getChecksumConfiguration),
/* harmony export */   resolveChecksumRuntimeConfig: () => (/* binding */ resolveChecksumRuntimeConfig)
/* harmony export */ });
var AlgorithmId;
(function (AlgorithmId) {
    AlgorithmId["MD5"] = "md5";
    AlgorithmId["CRC32"] = "crc32";
    AlgorithmId["CRC32C"] = "crc32c";
    AlgorithmId["SHA1"] = "sha1";
    AlgorithmId["SHA256"] = "sha256";
})(AlgorithmId || (AlgorithmId = {}));
const getChecksumConfiguration = (runtimeConfig) => {
    const checksumAlgorithms = [];
    if (runtimeConfig.sha256 !== undefined) {
        checksumAlgorithms.push({
            algorithmId: () => AlgorithmId.SHA256,
            checksumConstructor: () => runtimeConfig.sha256,
        });
    }
    if (runtimeConfig.md5 != undefined) {
        checksumAlgorithms.push({
            algorithmId: () => AlgorithmId.MD5,
            checksumConstructor: () => runtimeConfig.md5,
        });
    }
    return {
        addChecksumAlgorithm(algo) {
            checksumAlgorithms.push(algo);
        },
        checksumAlgorithms() {
            return checksumAlgorithms;
        },
    };
};
const resolveChecksumRuntimeConfig = (clientConfig) => {
    const runtimeConfig = {};
    clientConfig.checksumAlgorithms().forEach((checksumAlgorithm) => {
        runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
    });
    return runtimeConfig;
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js":
/*!*************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js ***!
  \*************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* binding */ getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* binding */ resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/checksum.js");

const getDefaultClientConfiguration = (runtimeConfig) => {
    return (0,_checksum__WEBPACK_IMPORTED_MODULE_0__.getChecksumConfiguration)(runtimeConfig);
};
const resolveDefaultRuntimeConfig = (config) => {
    return (0,_checksum__WEBPACK_IMPORTED_MODULE_0__.resolveChecksumRuntimeConfig)(config);
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js":
/*!****************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/index.js":
/*!****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/index.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _checksum__WEBPACK_IMPORTED_MODULE_2__.AlgorithmId),
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultClientConfiguration */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js");
/* harmony import */ var _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./defaultExtensionConfiguration */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js");
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/checksum.js");





/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/feature-ids.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/feature-ids.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/http.js":
/*!****************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/http.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FieldPosition: () => (/* binding */ FieldPosition)
/* harmony export */ });
var FieldPosition;
(function (FieldPosition) {
    FieldPosition[FieldPosition["HEADER"] = 0] = "HEADER";
    FieldPosition[FieldPosition["TRAILER"] = 1] = "TRAILER";
})(FieldPosition || (FieldPosition = {}));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/identity.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/identity.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/index.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/index.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _apiKeyIdentity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./apiKeyIdentity */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js");
/* harmony import */ var _awsCredentialIdentity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./awsCredentialIdentity */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js");
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./identity */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/identity.js");
/* harmony import */ var _tokenIdentity__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tokenIdentity */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js");






/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/index.js":
/*!*****************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/index.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _extensions__WEBPACK_IMPORTED_MODULE_12__.AlgorithmId),
/* harmony export */   EndpointURLScheme: () => (/* reexport safe */ _endpoint__WEBPACK_IMPORTED_MODULE_9__.EndpointURLScheme),
/* harmony export */   FieldPosition: () => (/* reexport safe */ _http__WEBPACK_IMPORTED_MODULE_14__.FieldPosition),
/* harmony export */   HttpApiKeyAuthLocation: () => (/* reexport safe */ _auth__WEBPACK_IMPORTED_MODULE_1__.HttpApiKeyAuthLocation),
/* harmony export */   HttpAuthLocation: () => (/* reexport safe */ _auth__WEBPACK_IMPORTED_MODULE_1__.HttpAuthLocation),
/* harmony export */   IniSectionType: () => (/* reexport safe */ _profile__WEBPACK_IMPORTED_MODULE_20__.IniSectionType),
/* harmony export */   RequestHandlerProtocol: () => (/* reexport safe */ _transfer__WEBPACK_IMPORTED_MODULE_32__.RequestHandlerProtocol),
/* harmony export */   SMITHY_CONTEXT_KEY: () => (/* reexport safe */ _middleware__WEBPACK_IMPORTED_MODULE_18__.SMITHY_CONTEXT_KEY),
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _extensions__WEBPACK_IMPORTED_MODULE_12__.getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _extensions__WEBPACK_IMPORTED_MODULE_12__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _abort__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abort */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/abort.js");
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./auth */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/auth/index.js");
/* harmony import */ var _blob_blob_payload_input_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./blob/blob-payload-input-types */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js");
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/checksum.js");
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./client */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/client.js");
/* harmony import */ var _command__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./command */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/command.js");
/* harmony import */ var _connection__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./connection */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/connection/index.js");
/* harmony import */ var _crypto__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./crypto */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/crypto.js");
/* harmony import */ var _encode__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./encode */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/encode.js");
/* harmony import */ var _endpoint__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./endpoint */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoint.js");
/* harmony import */ var _endpoints__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./endpoints */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/endpoints/index.js");
/* harmony import */ var _eventStream__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./eventStream */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/eventStream.js");
/* harmony import */ var _extensions__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./extensions */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/extensions/index.js");
/* harmony import */ var _feature_ids__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./feature-ids */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/feature-ids.js");
/* harmony import */ var _http__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./http */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/http.js");
/* harmony import */ var _http_httpHandlerInitialization__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./http/httpHandlerInitialization */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js");
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./identity */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/identity/index.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./logger */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/logger.js");
/* harmony import */ var _middleware__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./middleware */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/middleware.js");
/* harmony import */ var _pagination__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./pagination */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/pagination.js");
/* harmony import */ var _profile__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./profile */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/profile.js");
/* harmony import */ var _response__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./response */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/response.js");
/* harmony import */ var _retry__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./retry */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/retry.js");
/* harmony import */ var _schema_schema__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./schema/schema */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/schema/schema.js");
/* harmony import */ var _schema_sentinels__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./schema/sentinels */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/schema/sentinels.js");
/* harmony import */ var _serde__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./serde */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/serde.js");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./shapes */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/shapes.js");
/* harmony import */ var _signature__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./signature */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/signature.js");
/* harmony import */ var _stream__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./stream */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/stream.js");
/* harmony import */ var _streaming_payload_streaming_blob_common_types__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-common-types */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js");
/* harmony import */ var _streaming_payload_streaming_blob_payload_input_types__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-payload-input-types */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js");
/* harmony import */ var _streaming_payload_streaming_blob_payload_output_types__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-payload-output-types */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js");
/* harmony import */ var _transfer__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./transfer */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transfer.js");
/* harmony import */ var _transform_client_payload_blob_type_narrow__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./transform/client-payload-blob-type-narrow */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js");
/* harmony import */ var _transform_mutable__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./transform/mutable */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/mutable.js");
/* harmony import */ var _transform_no_undefined__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./transform/no-undefined */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/no-undefined.js");
/* harmony import */ var _transform_type_transform__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! ./transform/type-transform */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/type-transform.js");
/* harmony import */ var _uri__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ./uri */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/uri.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ./util */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/util.js");
/* harmony import */ var _waiter__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! ./waiter */ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/waiter.js");










































/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/logger.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/logger.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/middleware.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/middleware.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SMITHY_CONTEXT_KEY: () => (/* binding */ SMITHY_CONTEXT_KEY)
/* harmony export */ });
const SMITHY_CONTEXT_KEY = "__smithy_context";


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/pagination.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/pagination.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/profile.js":
/*!*******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/profile.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IniSectionType: () => (/* binding */ IniSectionType)
/* harmony export */ });
var IniSectionType;
(function (IniSectionType) {
    IniSectionType["PROFILE"] = "profile";
    IniSectionType["SSO_SESSION"] = "sso-session";
    IniSectionType["SERVICES"] = "services";
})(IniSectionType || (IniSectionType = {}));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/response.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/response.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/retry.js":
/*!*****************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/retry.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/schema/schema.js":
/*!*************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/schema/schema.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/schema/sentinels.js":
/*!****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/schema/sentinels.js ***!
  \****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/serde.js":
/*!*****************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/serde.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/shapes.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/shapes.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/signature.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/signature.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/stream.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/stream.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js":
/*!*********************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js ***!
  \*********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js":
/*!****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js ***!
  \****************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js":
/*!*****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js ***!
  \*****************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transfer.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transfer.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RequestHandlerProtocol: () => (/* binding */ RequestHandlerProtocol)
/* harmony export */ });
var RequestHandlerProtocol;
(function (RequestHandlerProtocol) {
    RequestHandlerProtocol["HTTP_0_9"] = "http/0.9";
    RequestHandlerProtocol["HTTP_1_0"] = "http/1.0";
    RequestHandlerProtocol["TDS_8_0"] = "tds/8.0";
})(RequestHandlerProtocol || (RequestHandlerProtocol = {}));


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/mutable.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/mutable.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/no-undefined.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/no-undefined.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/type-transform.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/transform/type-transform.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/uri.js":
/*!***************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/uri.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/util.js":
/*!****************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/util.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/waiter.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/types/dist-es/waiter.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AdaptiveRetryStrategy: () => (/* binding */ AdaptiveRetryStrategy)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/config.js");
/* harmony import */ var _DefaultRateLimiter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DefaultRateLimiter */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js");
/* harmony import */ var _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./StandardRetryStrategy */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js");



class AdaptiveRetryStrategy {
    constructor(maxAttemptsProvider, options) {
        this.maxAttemptsProvider = maxAttemptsProvider;
        this.mode = _config__WEBPACK_IMPORTED_MODULE_0__.RETRY_MODES.ADAPTIVE;
        const { rateLimiter } = options ?? {};
        this.rateLimiter = rateLimiter ?? new _DefaultRateLimiter__WEBPACK_IMPORTED_MODULE_1__.DefaultRateLimiter();
        this.standardRetryStrategy = new _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_2__.StandardRetryStrategy(maxAttemptsProvider);
    }
    async acquireInitialRetryToken(retryTokenScope) {
        await this.rateLimiter.getSendToken();
        return this.standardRetryStrategy.acquireInitialRetryToken(retryTokenScope);
    }
    async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
        this.rateLimiter.updateClientSendingRate(errorInfo);
        return this.standardRetryStrategy.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
    }
    recordSuccess(token) {
        this.rateLimiter.updateClientSendingRate({});
        this.standardRetryStrategy.recordSuccess(token);
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/ConfiguredRetryStrategy.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/ConfiguredRetryStrategy.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfiguredRetryStrategy: () => (/* binding */ ConfiguredRetryStrategy)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js");
/* harmony import */ var _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StandardRetryStrategy */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js");


class ConfiguredRetryStrategy extends _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_1__.StandardRetryStrategy {
    constructor(maxAttempts, computeNextBackoffDelay = _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_RETRY_DELAY_BASE) {
        super(typeof maxAttempts === "function" ? maxAttempts : async () => maxAttempts);
        if (typeof computeNextBackoffDelay === "number") {
            this.computeNextBackoffDelay = () => computeNextBackoffDelay;
        }
        else {
            this.computeNextBackoffDelay = computeNextBackoffDelay;
        }
    }
    async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
        const token = await super.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
        token.getRetryDelay = () => this.computeNextBackoffDelay(token.getRetryCount());
        return token;
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultRateLimiter: () => (/* binding */ DefaultRateLimiter)
/* harmony export */ });
/* harmony import */ var _smithy_service_error_classification__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/service-error-classification */ "../../@smithy/service-error-classification/dist-es/index.js");

class DefaultRateLimiter {
    constructor(options) {
        this.currentCapacity = 0;
        this.enabled = false;
        this.lastMaxRate = 0;
        this.measuredTxRate = 0;
        this.requestCount = 0;
        this.lastTimestamp = 0;
        this.timeWindow = 0;
        this.beta = options?.beta ?? 0.7;
        this.minCapacity = options?.minCapacity ?? 1;
        this.minFillRate = options?.minFillRate ?? 0.5;
        this.scaleConstant = options?.scaleConstant ?? 0.4;
        this.smooth = options?.smooth ?? 0.8;
        const currentTimeInSeconds = this.getCurrentTimeInSeconds();
        this.lastThrottleTime = currentTimeInSeconds;
        this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
        this.fillRate = this.minFillRate;
        this.maxCapacity = this.minCapacity;
    }
    getCurrentTimeInSeconds() {
        return Date.now() / 1000;
    }
    async getSendToken() {
        return this.acquireTokenBucket(1);
    }
    async acquireTokenBucket(amount) {
        if (!this.enabled) {
            return;
        }
        this.refillTokenBucket();
        if (amount > this.currentCapacity) {
            const delay = ((amount - this.currentCapacity) / this.fillRate) * 1000;
            await new Promise((resolve) => DefaultRateLimiter.setTimeoutFn(resolve, delay));
        }
        this.currentCapacity = this.currentCapacity - amount;
    }
    refillTokenBucket() {
        const timestamp = this.getCurrentTimeInSeconds();
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            return;
        }
        const fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
        this.currentCapacity = Math.min(this.maxCapacity, this.currentCapacity + fillAmount);
        this.lastTimestamp = timestamp;
    }
    updateClientSendingRate(response) {
        let calculatedRate;
        this.updateMeasuredRate();
        if ((0,_smithy_service_error_classification__WEBPACK_IMPORTED_MODULE_0__.isThrottlingError)(response)) {
            const rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
            this.lastMaxRate = rateToUse;
            this.calculateTimeWindow();
            this.lastThrottleTime = this.getCurrentTimeInSeconds();
            calculatedRate = this.cubicThrottle(rateToUse);
            this.enableTokenBucket();
        }
        else {
            this.calculateTimeWindow();
            calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
        }
        const newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
        this.updateTokenBucketRate(newRate);
    }
    calculateTimeWindow() {
        this.timeWindow = this.getPrecise(Math.pow((this.lastMaxRate * (1 - this.beta)) / this.scaleConstant, 1 / 3));
    }
    cubicThrottle(rateToUse) {
        return this.getPrecise(rateToUse * this.beta);
    }
    cubicSuccess(timestamp) {
        return this.getPrecise(this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate);
    }
    enableTokenBucket() {
        this.enabled = true;
    }
    updateTokenBucketRate(newRate) {
        this.refillTokenBucket();
        this.fillRate = Math.max(newRate, this.minFillRate);
        this.maxCapacity = Math.max(newRate, this.minCapacity);
        this.currentCapacity = Math.min(this.currentCapacity, this.maxCapacity);
    }
    updateMeasuredRate() {
        const t = this.getCurrentTimeInSeconds();
        const timeBucket = Math.floor(t * 2) / 2;
        this.requestCount++;
        if (timeBucket > this.lastTxRateBucket) {
            const currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
            this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
            this.requestCount = 0;
            this.lastTxRateBucket = timeBucket;
        }
    }
    getPrecise(num) {
        return parseFloat(num.toFixed(8));
    }
}
DefaultRateLimiter.setTimeoutFn = setTimeout;


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StandardRetryStrategy: () => (/* binding */ StandardRetryStrategy)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/config.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js");
/* harmony import */ var _defaultRetryBackoffStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./defaultRetryBackoffStrategy */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js");
/* harmony import */ var _defaultRetryToken__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./defaultRetryToken */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js");




class StandardRetryStrategy {
    constructor(maxAttempts) {
        this.maxAttempts = maxAttempts;
        this.mode = _config__WEBPACK_IMPORTED_MODULE_0__.RETRY_MODES.STANDARD;
        this.capacity = _constants__WEBPACK_IMPORTED_MODULE_1__.INITIAL_RETRY_TOKENS;
        this.retryBackoffStrategy = (0,_defaultRetryBackoffStrategy__WEBPACK_IMPORTED_MODULE_2__.getDefaultRetryBackoffStrategy)();
        this.maxAttemptsProvider = typeof maxAttempts === "function" ? maxAttempts : async () => maxAttempts;
    }
    async acquireInitialRetryToken(retryTokenScope) {
        return (0,_defaultRetryToken__WEBPACK_IMPORTED_MODULE_3__.createDefaultRetryToken)({
            retryDelay: _constants__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_RETRY_DELAY_BASE,
            retryCount: 0,
        });
    }
    async refreshRetryTokenForRetry(token, errorInfo) {
        const maxAttempts = await this.getMaxAttempts();
        if (this.shouldRetry(token, errorInfo, maxAttempts)) {
            const errorType = errorInfo.errorType;
            this.retryBackoffStrategy.setDelayBase(errorType === "THROTTLING" ? _constants__WEBPACK_IMPORTED_MODULE_1__.THROTTLING_RETRY_DELAY_BASE : _constants__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_RETRY_DELAY_BASE);
            const delayFromErrorType = this.retryBackoffStrategy.computeNextBackoffDelay(token.getRetryCount());
            const retryDelay = errorInfo.retryAfterHint
                ? Math.max(errorInfo.retryAfterHint.getTime() - Date.now() || 0, delayFromErrorType)
                : delayFromErrorType;
            const capacityCost = this.getCapacityCost(errorType);
            this.capacity -= capacityCost;
            return (0,_defaultRetryToken__WEBPACK_IMPORTED_MODULE_3__.createDefaultRetryToken)({
                retryDelay,
                retryCount: token.getRetryCount() + 1,
                retryCost: capacityCost,
            });
        }
        throw new Error("No retry token available");
    }
    recordSuccess(token) {
        this.capacity = Math.max(_constants__WEBPACK_IMPORTED_MODULE_1__.INITIAL_RETRY_TOKENS, this.capacity + (token.getRetryCost() ?? _constants__WEBPACK_IMPORTED_MODULE_1__.NO_RETRY_INCREMENT));
    }
    getCapacity() {
        return this.capacity;
    }
    async getMaxAttempts() {
        try {
            return await this.maxAttemptsProvider();
        }
        catch (error) {
            console.warn(`Max attempts provider could not resolve. Using default of ${_config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_MAX_ATTEMPTS}`);
            return _config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_MAX_ATTEMPTS;
        }
    }
    shouldRetry(tokenToRenew, errorInfo, maxAttempts) {
        const attempts = tokenToRenew.getRetryCount() + 1;
        return (attempts < maxAttempts &&
            this.capacity >= this.getCapacityCost(errorInfo.errorType) &&
            this.isRetryableError(errorInfo.errorType));
    }
    getCapacityCost(errorType) {
        return errorType === "TRANSIENT" ? _constants__WEBPACK_IMPORTED_MODULE_1__.TIMEOUT_RETRY_COST : _constants__WEBPACK_IMPORTED_MODULE_1__.RETRY_COST;
    }
    isRetryableError(errorType) {
        return errorType === "THROTTLING" || errorType === "TRANSIENT";
    }
}


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/config.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/config.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_MAX_ATTEMPTS: () => (/* binding */ DEFAULT_MAX_ATTEMPTS),
/* harmony export */   DEFAULT_RETRY_MODE: () => (/* binding */ DEFAULT_RETRY_MODE),
/* harmony export */   RETRY_MODES: () => (/* binding */ RETRY_MODES)
/* harmony export */ });
var RETRY_MODES;
(function (RETRY_MODES) {
    RETRY_MODES["STANDARD"] = "standard";
    RETRY_MODES["ADAPTIVE"] = "adaptive";
})(RETRY_MODES || (RETRY_MODES = {}));
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_MODE = RETRY_MODES.STANDARD;


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_RETRY_DELAY_BASE: () => (/* binding */ DEFAULT_RETRY_DELAY_BASE),
/* harmony export */   INITIAL_RETRY_TOKENS: () => (/* binding */ INITIAL_RETRY_TOKENS),
/* harmony export */   INVOCATION_ID_HEADER: () => (/* binding */ INVOCATION_ID_HEADER),
/* harmony export */   MAXIMUM_RETRY_DELAY: () => (/* binding */ MAXIMUM_RETRY_DELAY),
/* harmony export */   NO_RETRY_INCREMENT: () => (/* binding */ NO_RETRY_INCREMENT),
/* harmony export */   REQUEST_HEADER: () => (/* binding */ REQUEST_HEADER),
/* harmony export */   RETRY_COST: () => (/* binding */ RETRY_COST),
/* harmony export */   THROTTLING_RETRY_DELAY_BASE: () => (/* binding */ THROTTLING_RETRY_DELAY_BASE),
/* harmony export */   TIMEOUT_RETRY_COST: () => (/* binding */ TIMEOUT_RETRY_COST)
/* harmony export */ });
const DEFAULT_RETRY_DELAY_BASE = 100;
const MAXIMUM_RETRY_DELAY = 20 * 1000;
const THROTTLING_RETRY_DELAY_BASE = 500;
const INITIAL_RETRY_TOKENS = 500;
const RETRY_COST = 5;
const TIMEOUT_RETRY_COST = 10;
const NO_RETRY_INCREMENT = 1;
const INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
const REQUEST_HEADER = "amz-sdk-request";


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultRetryBackoffStrategy: () => (/* binding */ getDefaultRetryBackoffStrategy)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js");

const getDefaultRetryBackoffStrategy = () => {
    let delayBase = _constants__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_RETRY_DELAY_BASE;
    const computeNextBackoffDelay = (attempts) => {
        return Math.floor(Math.min(_constants__WEBPACK_IMPORTED_MODULE_0__.MAXIMUM_RETRY_DELAY, Math.random() * 2 ** attempts * delayBase));
    };
    const setDelayBase = (delay) => {
        delayBase = delay;
    };
    return {
        computeNextBackoffDelay,
        setDelayBase,
    };
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDefaultRetryToken: () => (/* binding */ createDefaultRetryToken)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js");

const createDefaultRetryToken = ({ retryDelay, retryCount, retryCost, }) => {
    const getRetryCount = () => retryCount;
    const getRetryDelay = () => Math.min(_constants__WEBPACK_IMPORTED_MODULE_0__.MAXIMUM_RETRY_DELAY, retryDelay);
    const getRetryCost = () => retryCost;
    return {
        getRetryCount,
        getRetryDelay,
        getRetryCost,
    };
};


/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/index.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/index.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AdaptiveRetryStrategy: () => (/* reexport safe */ _AdaptiveRetryStrategy__WEBPACK_IMPORTED_MODULE_0__.AdaptiveRetryStrategy),
/* harmony export */   ConfiguredRetryStrategy: () => (/* reexport safe */ _ConfiguredRetryStrategy__WEBPACK_IMPORTED_MODULE_1__.ConfiguredRetryStrategy),
/* harmony export */   DEFAULT_MAX_ATTEMPTS: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_4__.DEFAULT_MAX_ATTEMPTS),
/* harmony export */   DEFAULT_RETRY_DELAY_BASE: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.DEFAULT_RETRY_DELAY_BASE),
/* harmony export */   DEFAULT_RETRY_MODE: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_4__.DEFAULT_RETRY_MODE),
/* harmony export */   DefaultRateLimiter: () => (/* reexport safe */ _DefaultRateLimiter__WEBPACK_IMPORTED_MODULE_2__.DefaultRateLimiter),
/* harmony export */   INITIAL_RETRY_TOKENS: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.INITIAL_RETRY_TOKENS),
/* harmony export */   INVOCATION_ID_HEADER: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.INVOCATION_ID_HEADER),
/* harmony export */   MAXIMUM_RETRY_DELAY: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.MAXIMUM_RETRY_DELAY),
/* harmony export */   NO_RETRY_INCREMENT: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.NO_RETRY_INCREMENT),
/* harmony export */   REQUEST_HEADER: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.REQUEST_HEADER),
/* harmony export */   RETRY_COST: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.RETRY_COST),
/* harmony export */   RETRY_MODES: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_4__.RETRY_MODES),
/* harmony export */   StandardRetryStrategy: () => (/* reexport safe */ _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_3__.StandardRetryStrategy),
/* harmony export */   THROTTLING_RETRY_DELAY_BASE: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.THROTTLING_RETRY_DELAY_BASE),
/* harmony export */   TIMEOUT_RETRY_COST: () => (/* reexport safe */ _constants__WEBPACK_IMPORTED_MODULE_5__.TIMEOUT_RETRY_COST)
/* harmony export */ });
/* harmony import */ var _AdaptiveRetryStrategy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AdaptiveRetryStrategy */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js");
/* harmony import */ var _ConfiguredRetryStrategy__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ConfiguredRetryStrategy */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/ConfiguredRetryStrategy.js");
/* harmony import */ var _DefaultRateLimiter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DefaultRateLimiter */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js");
/* harmony import */ var _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./StandardRetryStrategy */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/config.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/constants.js");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./types */ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/types.js");









/***/ }),

/***/ "../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/types.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/client-sso/node_modules/@smithy/util-retry/dist-es/types.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/client-sso/package.json":
/*!**********************************************!*\
  !*** ../../@aws-sdk/client-sso/package.json ***!
  \**********************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"name":"@aws-sdk/client-sso","description":"AWS SDK for JavaScript Sso Client for Node.js, Browser and React Native","version":"3.858.0","scripts":{"build":"concurrently \'yarn:build:cjs\' \'yarn:build:es\' \'yarn:build:types\'","build:cjs":"node ../../scripts/compilation/inline client-sso","build:es":"tsc -p tsconfig.es.json","build:include:deps":"lerna run --scope $npm_package_name --include-dependencies build","build:types":"tsc -p tsconfig.types.json","build:types:downlevel":"downlevel-dts dist-types dist-types/ts3.4","clean":"rimraf ./dist-* && rimraf *.tsbuildinfo","extract:docs":"api-extractor run --local","generate:client":"node ../../scripts/generate-clients/single-service --solo sso"},"main":"./dist-cjs/index.js","types":"./dist-types/index.d.ts","module":"./dist-es/index.js","sideEffects":false,"dependencies":{"@aws-crypto/sha256-browser":"5.2.0","@aws-crypto/sha256-js":"5.2.0","@aws-sdk/core":"3.858.0","@aws-sdk/middleware-host-header":"3.840.0","@aws-sdk/middleware-logger":"3.840.0","@aws-sdk/middleware-recursion-detection":"3.840.0","@aws-sdk/middleware-user-agent":"3.858.0","@aws-sdk/region-config-resolver":"3.840.0","@aws-sdk/types":"3.840.0","@aws-sdk/util-endpoints":"3.848.0","@aws-sdk/util-user-agent-browser":"3.840.0","@aws-sdk/util-user-agent-node":"3.858.0","@smithy/config-resolver":"^4.1.4","@smithy/core":"^3.7.2","@smithy/fetch-http-handler":"^5.1.0","@smithy/hash-node":"^4.0.4","@smithy/invalid-dependency":"^4.0.4","@smithy/middleware-content-length":"^4.0.4","@smithy/middleware-endpoint":"^4.1.17","@smithy/middleware-retry":"^4.1.18","@smithy/middleware-serde":"^4.0.8","@smithy/middleware-stack":"^4.0.4","@smithy/node-config-provider":"^4.1.3","@smithy/node-http-handler":"^4.1.0","@smithy/protocol-http":"^5.1.2","@smithy/smithy-client":"^4.4.9","@smithy/types":"^4.3.1","@smithy/url-parser":"^4.0.4","@smithy/util-base64":"^4.0.0","@smithy/util-body-length-browser":"^4.0.0","@smithy/util-body-length-node":"^4.0.0","@smithy/util-defaults-mode-browser":"^4.0.25","@smithy/util-defaults-mode-node":"^4.0.25","@smithy/util-endpoints":"^3.0.6","@smithy/util-middleware":"^4.0.4","@smithy/util-retry":"^4.0.6","@smithy/util-utf8":"^4.0.0","tslib":"^2.6.2"},"devDependencies":{"@tsconfig/node18":"18.2.4","@types/node":"^18.19.69","concurrently":"7.0.0","downlevel-dts":"0.10.1","rimraf":"3.0.2","typescript":"~5.8.3"},"engines":{"node":">=18.0.0"},"typesVersions":{"<4.0":{"dist-types/*":["dist-types/ts3.4/*"]}},"files":["dist-*/**"],"author":{"name":"AWS SDK for JavaScript Team","url":"https://aws.amazon.com/javascript/"},"license":"Apache-2.0","browser":{"./dist-es/runtimeConfig":"./dist-es/runtimeConfig.browser"},"react-native":{"./dist-es/runtimeConfig":"./dist-es/runtimeConfig.native"},"homepage":"https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-sso","repository":{"type":"git","url":"https://github.com/aws/aws-sdk-js-v3.git","directory":"clients/client-sso"}}');

/***/ }),

/***/ "../../@aws-sdk/credential-provider-sso/dist-es/loadSso.js":
/*!*****************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-sso/dist-es/loadSso.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GetRoleCredentialsCommand: () => (/* reexport safe */ _aws_sdk_client_sso__WEBPACK_IMPORTED_MODULE_0__.GetRoleCredentialsCommand),
/* harmony export */   SSOClient: () => (/* reexport safe */ _aws_sdk_client_sso__WEBPACK_IMPORTED_MODULE_1__.SSOClient)
/* harmony export */ });
/* harmony import */ var _aws_sdk_client_sso__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/client-sso */ "../../@aws-sdk/client-sso/dist-es/commands/GetRoleCredentialsCommand.js");
/* harmony import */ var _aws_sdk_client_sso__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @aws-sdk/client-sso */ "../../@aws-sdk/client-sso/dist-es/SSOClient.js");




/***/ }),

/***/ "../../@smithy/core/dist-es/submodules/protocols/requestBuilder.js":
/*!*************************************************************************!*\
  !*** ../../@smithy/core/dist-es/submodules/protocols/requestBuilder.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RequestBuilder: () => (/* binding */ RequestBuilder),
/* harmony export */   requestBuilder: () => (/* binding */ requestBuilder)
/* harmony export */ });
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _resolve_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./resolve-path */ "../../@smithy/core/dist-es/submodules/protocols/resolve-path.js");


function requestBuilder(input, context) {
    return new RequestBuilder(input, context);
}
class RequestBuilder {
    constructor(input, context) {
        this.input = input;
        this.context = context;
        this.query = {};
        this.method = "";
        this.headers = {};
        this.path = "";
        this.body = null;
        this.hostname = "";
        this.resolvePathStack = [];
    }
    async build() {
        const { hostname, protocol = "https", port, path: basePath } = await this.context.endpoint();
        this.path = basePath;
        for (const resolvePath of this.resolvePathStack) {
            resolvePath(this.path);
        }
        return new _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__.HttpRequest({
            protocol,
            hostname: this.hostname || hostname,
            port,
            method: this.method,
            path: this.path,
            query: this.query,
            body: this.body,
            headers: this.headers,
        });
    }
    hn(hostname) {
        this.hostname = hostname;
        return this;
    }
    bp(uriLabel) {
        this.resolvePathStack.push((basePath) => {
            this.path = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + uriLabel;
        });
        return this;
    }
    p(memberName, labelValueProvider, uriLabel, isGreedyLabel) {
        this.resolvePathStack.push((path) => {
            this.path = (0,_resolve_path__WEBPACK_IMPORTED_MODULE_1__.resolvedPath)(path, this.input, memberName, labelValueProvider, uriLabel, isGreedyLabel);
        });
        return this;
    }
    h(headers) {
        this.headers = headers;
        return this;
    }
    q(query) {
        this.query = query;
        return this;
    }
    b(body) {
        this.body = body;
        return this;
    }
    m(method) {
        this.method = method;
        return this;
    }
}


/***/ }),

/***/ "../../@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js":
/*!***********************************************************************************!*\
  !*** ../../@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NoAuthSigner: () => (/* binding */ NoAuthSigner)
/* harmony export */ });
class NoAuthSigner {
    async sign(httpRequest, identity, signingProperties) {
        return httpRequest;
    }
}


/***/ })

};
;
//# sourceMappingURL=_aws-sdk_credential-provider-sso_dist-es_loadSso_js.js.map