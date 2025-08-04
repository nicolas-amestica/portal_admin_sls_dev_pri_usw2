"use strict";
exports.id = "_aws-sdk_nested-clients_dist-es_submodules_sts_index_js";
exports.ids = ["_aws-sdk_nested-clients_dist-es_submodules_sts_index_js"];
exports.modules = {

/***/ "../../@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js":
/*!****************************************************************************!*\
  !*** ../../@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadRestXmlErrorCode: () => (/* binding */ loadRestXmlErrorCode),
/* harmony export */   parseXmlBody: () => (/* binding */ parseXmlBody),
/* harmony export */   parseXmlErrorBody: () => (/* binding */ parseXmlErrorBody)
/* harmony export */ });
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/core/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var fast_xml_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! fast-xml-parser */ "../../fast-xml-parser/src/xmlparser/XMLParser.js");
/* harmony import */ var _common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common */ "../../@aws-sdk/core/dist-es/submodules/protocols/common.js");



const parseXmlBody = (streamBody, context) => (0,_common__WEBPACK_IMPORTED_MODULE_2__.collectBodyString)(streamBody, context).then((encoded) => {
    if (encoded.length) {
        const parser = new fast_xml_parser__WEBPACK_IMPORTED_MODULE_1__["default"]({
            attributeNamePrefix: "",
            htmlEntities: true,
            ignoreAttributes: false,
            ignoreDeclaration: true,
            parseTagValue: false,
            trimValues: false,
            tagValueProcessor: (_, val) => (val.trim() === "" && val.includes("\n") ? "" : undefined),
        });
        parser.addEntity("#xD", "\r");
        parser.addEntity("#10", "\n");
        let parsedObj;
        try {
            parsedObj = parser.parse(encoded, true);
        }
        catch (e) {
            if (e && typeof e === "object") {
                Object.defineProperty(e, "$responseBodyText", {
                    value: encoded,
                });
            }
            throw e;
        }
        const textNodeName = "#text";
        const key = Object.keys(parsedObj)[0];
        const parsedObjToReturn = parsedObj[key];
        if (parsedObjToReturn[textNodeName]) {
            parsedObjToReturn[key] = parsedObjToReturn[textNodeName];
            delete parsedObjToReturn[textNodeName];
        }
        return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.getValueFromTextNode)(parsedObjToReturn);
    }
    return {};
});
const parseXmlErrorBody = async (errorBody, context) => {
    const value = await parseXmlBody(errorBody, context);
    if (value.Error) {
        value.Error.message = value.Error.message ?? value.Error.Message;
    }
    return value;
};
const loadRestXmlErrorCode = (output, data) => {
    if (data?.Error?.Code !== undefined) {
        return data.Error.Code;
    }
    if (data?.Code !== undefined) {
        return data.Code;
    }
    if (output.statusCode == 404) {
        return "NotFound";
    }
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STS.js":
/*!*******************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/STS.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STS: () => (/* binding */ STS)
/* harmony export */ });
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _commands_AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./commands/AssumeRoleCommand */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleCommand.js");
/* harmony import */ var _commands_AssumeRoleWithWebIdentityCommand__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./commands/AssumeRoleWithWebIdentityCommand */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleWithWebIdentityCommand.js");
/* harmony import */ var _STSClient__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./STSClient */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STSClient.js");




const commands = {
    AssumeRoleCommand: _commands_AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_1__.AssumeRoleCommand,
    AssumeRoleWithWebIdentityCommand: _commands_AssumeRoleWithWebIdentityCommand__WEBPACK_IMPORTED_MODULE_2__.AssumeRoleWithWebIdentityCommand,
};
class STS extends _STSClient__WEBPACK_IMPORTED_MODULE_3__.STSClient {
}
(0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.createAggregatedClient)(commands, STS);


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STSClient.js":
/*!*************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/STSClient.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STSClient: () => (/* binding */ STSClient),
/* harmony export */   __Client: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_11__.Client)
/* harmony export */ });
/* harmony import */ var _aws_sdk_middleware_host_header__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/middleware-host-header */ "../../@aws-sdk/middleware-host-header/dist-es/index.js");
/* harmony import */ var _aws_sdk_middleware_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @aws-sdk/middleware-logger */ "../../@aws-sdk/middleware-logger/dist-es/index.js");
/* harmony import */ var _aws_sdk_middleware_recursion_detection__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @aws-sdk/middleware-recursion-detection */ "../../@aws-sdk/middleware-recursion-detection/dist-es/index.js");
/* harmony import */ var _aws_sdk_middleware_user_agent__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @aws-sdk/middleware-user-agent */ "../../@aws-sdk/middleware-user-agent/dist-es/index.js");
/* harmony import */ var _smithy_config_resolver__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @smithy/config-resolver */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/index.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/util-identity-and-auth/DefaultIdentityProviderConfig.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemeEndpointRuleSetPlugin.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/middleware-http-signing/getHttpSigningMiddleware.js");
/* harmony import */ var _smithy_middleware_content_length__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @smithy/middleware-content-length */ "../../@smithy/middleware-content-length/dist-es/index.js");
/* harmony import */ var _smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @smithy/middleware-endpoint */ "../../@smithy/middleware-endpoint/dist-es/index.js");
/* harmony import */ var _smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @smithy/middleware-retry */ "../../@smithy/middleware-retry/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./auth/httpAuthSchemeProvider */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthSchemeProvider.js");
/* harmony import */ var _endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./endpoint/EndpointParameters */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/EndpointParameters.js");
/* harmony import */ var _runtimeConfig__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./runtimeConfig */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeConfig.js");
/* harmony import */ var _runtimeExtensions__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./runtimeExtensions */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeExtensions.js");















class STSClient extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_11__.Client {
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
            httpAuthSchemeParametersProvider: _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_12__.defaultSTSHttpAuthSchemeParametersProvider,
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

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthExtensionConfiguration.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthExtensionConfiguration.js ***!
  \***************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthSchemeProvider.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthSchemeProvider.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultSTSHttpAuthSchemeParametersProvider: () => (/* binding */ defaultSTSHttpAuthSchemeParametersProvider),
/* harmony export */   defaultSTSHttpAuthSchemeProvider: () => (/* binding */ defaultSTSHttpAuthSchemeProvider),
/* harmony export */   resolveHttpAuthSchemeConfig: () => (/* binding */ resolveHttpAuthSchemeConfig),
/* harmony export */   resolveStsAuthConfig: () => (/* binding */ resolveStsAuthConfig)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
/* harmony import */ var _smithy_util_middleware__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/util-middleware */ "../../@smithy/util-middleware/dist-es/index.js");
/* harmony import */ var _STSClient__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../STSClient */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STSClient.js");



const defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input) => {
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
            name: "sts",
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
const defaultSTSHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "AssumeRoleWithWebIdentity": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
    }
    return options;
};
const resolveStsAuthConfig = (input) => Object.assign(input, {
    stsClientCtor: _STSClient__WEBPACK_IMPORTED_MODULE_2__.STSClient,
});
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = resolveStsAuthConfig(config);
    const config_1 = (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.resolveAwsSdkSigV4Config)(config_0);
    return Object.assign(config_1, {
        authSchemePreference: (0,_smithy_util_middleware__WEBPACK_IMPORTED_MODULE_1__.normalizeProvider)(config.authSchemePreference ?? []),
    });
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleCommand.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleCommand.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $Command: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.Command),
/* harmony export */   AssumeRoleCommand: () => (/* binding */ AssumeRoleCommand)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-endpoint */ "../../@smithy/middleware-endpoint/dist-es/index.js");
/* harmony import */ var _smithy_middleware_serde__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/middleware-serde */ "../../@smithy/middleware-serde/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../endpoint/EndpointParameters */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/EndpointParameters.js");
/* harmony import */ var _models_models_0__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/models_0 */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/models_0.js");
/* harmony import */ var _protocols_Aws_query__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../protocols/Aws_query */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/protocols/Aws_query.js");







class AssumeRoleCommand extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.Command
    .classBuilder()
    .ep(_endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_3__.commonParams)
    .m(function (Command, cs, config, o) {
    return [
        (0,_smithy_middleware_serde__WEBPACK_IMPORTED_MODULE_1__.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0,_smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_0__.getEndpointPlugin)(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("AWSSecurityTokenServiceV20110615", "AssumeRole", {})
    .n("STSClient", "AssumeRoleCommand")
    .f(void 0, _models_models_0__WEBPACK_IMPORTED_MODULE_4__.AssumeRoleResponseFilterSensitiveLog)
    .ser(_protocols_Aws_query__WEBPACK_IMPORTED_MODULE_5__.se_AssumeRoleCommand)
    .de(_protocols_Aws_query__WEBPACK_IMPORTED_MODULE_5__.de_AssumeRoleCommand)
    .build() {
}


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleWithWebIdentityCommand.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleWithWebIdentityCommand.js ***!
  \*********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $Command: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.Command),
/* harmony export */   AssumeRoleWithWebIdentityCommand: () => (/* binding */ AssumeRoleWithWebIdentityCommand)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-endpoint */ "../../@smithy/middleware-endpoint/dist-es/index.js");
/* harmony import */ var _smithy_middleware_serde__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/middleware-serde */ "../../@smithy/middleware-serde/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../endpoint/EndpointParameters */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/EndpointParameters.js");
/* harmony import */ var _models_models_0__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/models_0 */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/models_0.js");
/* harmony import */ var _protocols_Aws_query__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../protocols/Aws_query */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/protocols/Aws_query.js");







class AssumeRoleWithWebIdentityCommand extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.Command
    .classBuilder()
    .ep(_endpoint_EndpointParameters__WEBPACK_IMPORTED_MODULE_3__.commonParams)
    .m(function (Command, cs, config, o) {
    return [
        (0,_smithy_middleware_serde__WEBPACK_IMPORTED_MODULE_1__.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0,_smithy_middleware_endpoint__WEBPACK_IMPORTED_MODULE_0__.getEndpointPlugin)(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {})
    .n("STSClient", "AssumeRoleWithWebIdentityCommand")
    .f(_models_models_0__WEBPACK_IMPORTED_MODULE_4__.AssumeRoleWithWebIdentityRequestFilterSensitiveLog, _models_models_0__WEBPACK_IMPORTED_MODULE_4__.AssumeRoleWithWebIdentityResponseFilterSensitiveLog)
    .ser(_protocols_Aws_query__WEBPACK_IMPORTED_MODULE_5__.se_AssumeRoleWithWebIdentityCommand)
    .de(_protocols_Aws_query__WEBPACK_IMPORTED_MODULE_5__.de_AssumeRoleWithWebIdentityCommand)
    .build() {
}


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/index.js":
/*!******************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/index.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $Command: () => (/* reexport safe */ _AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_0__.$Command),
/* harmony export */   AssumeRoleCommand: () => (/* reexport safe */ _AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_0__.AssumeRoleCommand),
/* harmony export */   AssumeRoleWithWebIdentityCommand: () => (/* reexport safe */ _AssumeRoleWithWebIdentityCommand__WEBPACK_IMPORTED_MODULE_1__.AssumeRoleWithWebIdentityCommand)
/* harmony export */ });
/* harmony import */ var _AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AssumeRoleCommand */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleCommand.js");
/* harmony import */ var _AssumeRoleWithWebIdentityCommand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./AssumeRoleWithWebIdentityCommand */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleWithWebIdentityCommand.js");




/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/defaultRoleAssumers.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/defaultRoleAssumers.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decorateDefaultCredentialProvider: () => (/* binding */ decorateDefaultCredentialProvider),
/* harmony export */   getDefaultRoleAssumer: () => (/* binding */ getDefaultRoleAssumer),
/* harmony export */   getDefaultRoleAssumerWithWebIdentity: () => (/* binding */ getDefaultRoleAssumerWithWebIdentity)
/* harmony export */ });
/* harmony import */ var _defaultStsRoleAssumers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultStsRoleAssumers */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/defaultStsRoleAssumers.js");
/* harmony import */ var _STSClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./STSClient */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STSClient.js");


const getCustomizableStsClientCtor = (baseCtor, customizations) => {
    if (!customizations)
        return baseCtor;
    else
        return class CustomizableSTSClient extends baseCtor {
            constructor(config) {
                super(config);
                for (const customization of customizations) {
                    this.middlewareStack.use(customization);
                }
            }
        };
};
const getDefaultRoleAssumer = (stsOptions = {}, stsPlugins) => (0,_defaultStsRoleAssumers__WEBPACK_IMPORTED_MODULE_0__.getDefaultRoleAssumer)(stsOptions, getCustomizableStsClientCtor(_STSClient__WEBPACK_IMPORTED_MODULE_1__.STSClient, stsPlugins));
const getDefaultRoleAssumerWithWebIdentity = (stsOptions = {}, stsPlugins) => (0,_defaultStsRoleAssumers__WEBPACK_IMPORTED_MODULE_0__.getDefaultRoleAssumerWithWebIdentity)(stsOptions, getCustomizableStsClientCtor(_STSClient__WEBPACK_IMPORTED_MODULE_1__.STSClient, stsPlugins));
const decorateDefaultCredentialProvider = (provider) => (input) => provider({
    roleAssumer: getDefaultRoleAssumer(input),
    roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(input),
    ...input,
});


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/defaultStsRoleAssumers.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/defaultStsRoleAssumers.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decorateDefaultCredentialProvider: () => (/* binding */ decorateDefaultCredentialProvider),
/* harmony export */   getDefaultRoleAssumer: () => (/* binding */ getDefaultRoleAssumer),
/* harmony export */   getDefaultRoleAssumerWithWebIdentity: () => (/* binding */ getDefaultRoleAssumerWithWebIdentity)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core/client */ "../../@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
/* harmony import */ var _commands_AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./commands/AssumeRoleCommand */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleCommand.js");
/* harmony import */ var _commands_AssumeRoleWithWebIdentityCommand__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./commands/AssumeRoleWithWebIdentityCommand */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/AssumeRoleWithWebIdentityCommand.js");



const ASSUME_ROLE_DEFAULT_REGION = "us-east-1";
const getAccountIdFromAssumedRoleUser = (assumedRoleUser) => {
    if (typeof assumedRoleUser?.Arn === "string") {
        const arnComponents = assumedRoleUser.Arn.split(":");
        if (arnComponents.length > 4 && arnComponents[4] !== "") {
            return arnComponents[4];
        }
    }
    return undefined;
};
const resolveRegion = async (_region, _parentRegion, credentialProviderLogger) => {
    const region = typeof _region === "function" ? await _region() : _region;
    const parentRegion = typeof _parentRegion === "function" ? await _parentRegion() : _parentRegion;
    credentialProviderLogger?.debug?.("@aws-sdk/client-sts::resolveRegion", "accepting first of:", `${region} (provider)`, `${parentRegion} (parent client)`, `${ASSUME_ROLE_DEFAULT_REGION} (STS default)`);
    return region ?? parentRegion ?? ASSUME_ROLE_DEFAULT_REGION;
};
const getDefaultRoleAssumer = (stsOptions, STSClient) => {
    let stsClient;
    let closureSourceCreds;
    return async (sourceCreds, params) => {
        closureSourceCreds = sourceCreds;
        if (!stsClient) {
            const { logger = stsOptions?.parentClientConfig?.logger, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, } = stsOptions;
            const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger);
            const isCompatibleRequestHandler = !isH2(requestHandler);
            stsClient = new STSClient({
                profile: stsOptions?.parentClientConfig?.profile,
                credentialDefaultProvider: () => async () => closureSourceCreds,
                region: resolvedRegion,
                requestHandler: isCompatibleRequestHandler ? requestHandler : undefined,
                logger: logger,
            });
        }
        const { Credentials, AssumedRoleUser } = await stsClient.send(new _commands_AssumeRoleCommand__WEBPACK_IMPORTED_MODULE_1__.AssumeRoleCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
        const credentials = {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            ...(Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope }),
            ...(accountId && { accountId }),
        };
        (0,_aws_sdk_core_client__WEBPACK_IMPORTED_MODULE_0__.setCredentialFeature)(credentials, "CREDENTIALS_STS_ASSUME_ROLE", "i");
        return credentials;
    };
};
const getDefaultRoleAssumerWithWebIdentity = (stsOptions, STSClient) => {
    let stsClient;
    return async (params) => {
        if (!stsClient) {
            const { logger = stsOptions?.parentClientConfig?.logger, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, } = stsOptions;
            const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger);
            const isCompatibleRequestHandler = !isH2(requestHandler);
            stsClient = new STSClient({
                profile: stsOptions?.parentClientConfig?.profile,
                region: resolvedRegion,
                requestHandler: isCompatibleRequestHandler ? requestHandler : undefined,
                logger: logger,
            });
        }
        const { Credentials, AssumedRoleUser } = await stsClient.send(new _commands_AssumeRoleWithWebIdentityCommand__WEBPACK_IMPORTED_MODULE_2__.AssumeRoleWithWebIdentityCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
        const credentials = {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            ...(Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope }),
            ...(accountId && { accountId }),
        };
        if (accountId) {
            (0,_aws_sdk_core_client__WEBPACK_IMPORTED_MODULE_0__.setCredentialFeature)(credentials, "RESOLVED_ACCOUNT_ID", "T");
        }
        (0,_aws_sdk_core_client__WEBPACK_IMPORTED_MODULE_0__.setCredentialFeature)(credentials, "CREDENTIALS_STS_ASSUME_ROLE_WEB_ID", "k");
        return credentials;
    };
};
const decorateDefaultCredentialProvider = (provider) => (input) => provider({
    roleAssumer: getDefaultRoleAssumer(input, input.stsClientCtor),
    roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(input, input.stsClientCtor),
    ...input,
});
const isH2 = (requestHandler) => {
    return requestHandler?.metadata?.handlerProtocol === "h2";
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/EndpointParameters.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/EndpointParameters.js ***!
  \*******************************************************************************************/
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
        useGlobalEndpoint: options.useGlobalEndpoint ?? false,
        defaultSigningName: "sts",
    });
};
const commonParams = {
    UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/endpointResolver.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/endpointResolver.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultEndpointResolver: () => (/* binding */ defaultEndpointResolver)
/* harmony export */ });
/* harmony import */ var _aws_sdk_util_endpoints__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/util-endpoints */ "../../@aws-sdk/util-endpoints/dist-es/index.js");
/* harmony import */ var _smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/util-endpoints */ "../../@smithy/util-endpoints/dist-es/index.js");
/* harmony import */ var _ruleset__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ruleset */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/ruleset.js");



const cache = new _smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS", "UseGlobalEndpoint"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => (0,_smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__.resolveEndpoint)(_ruleset__WEBPACK_IMPORTED_MODULE_2__.ruleSet, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
_smithy_util_endpoints__WEBPACK_IMPORTED_MODULE_1__.customEndpointFunctions.aws = _aws_sdk_util_endpoints__WEBPACK_IMPORTED_MODULE_0__.awsEndpointFunctions;


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/ruleset.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/ruleset.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ruleSet: () => (/* binding */ ruleSet)
/* harmony export */ });
const F = "required", G = "type", H = "fn", I = "argv", J = "ref";
const a = false, b = true, c = "booleanEquals", d = "stringEquals", e = "sigv4", f = "sts", g = "us-east-1", h = "endpoint", i = "https://sts.{Region}.{PartitionResult#dnsSuffix}", j = "tree", k = "error", l = "getAttr", m = { [F]: false, [G]: "String" }, n = { [F]: true, "default": false, [G]: "Boolean" }, o = { [J]: "Endpoint" }, p = { [H]: "isSet", [I]: [{ [J]: "Region" }] }, q = { [J]: "Region" }, r = { [H]: "aws.partition", [I]: [q], "assign": "PartitionResult" }, s = { [J]: "UseFIPS" }, t = { [J]: "UseDualStack" }, u = { "url": "https://sts.amazonaws.com", "properties": { "authSchemes": [{ "name": e, "signingName": f, "signingRegion": g }] }, "headers": {} }, v = {}, w = { "conditions": [{ [H]: d, [I]: [q, "aws-global"] }], [h]: u, [G]: h }, x = { [H]: c, [I]: [s, true] }, y = { [H]: c, [I]: [t, true] }, z = { [H]: l, [I]: [{ [J]: "PartitionResult" }, "supportsFIPS"] }, A = { [J]: "PartitionResult" }, B = { [H]: c, [I]: [true, { [H]: l, [I]: [A, "supportsDualStack"] }] }, C = [{ [H]: "isSet", [I]: [o] }], D = [x], E = [y];
const _data = { version: "1.0", parameters: { Region: m, UseDualStack: n, UseFIPS: n, Endpoint: m, UseGlobalEndpoint: n }, rules: [{ conditions: [{ [H]: c, [I]: [{ [J]: "UseGlobalEndpoint" }, b] }, { [H]: "not", [I]: C }, p, r, { [H]: c, [I]: [s, a] }, { [H]: c, [I]: [t, a] }], rules: [{ conditions: [{ [H]: d, [I]: [q, "ap-northeast-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-south-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-southeast-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-southeast-2"] }], endpoint: u, [G]: h }, w, { conditions: [{ [H]: d, [I]: [q, "ca-central-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-central-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-north-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-2"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-3"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "sa-east-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, g] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-east-2"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-west-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-west-2"] }], endpoint: u, [G]: h }, { endpoint: { url: i, properties: { authSchemes: [{ name: e, signingName: f, signingRegion: "{Region}" }] }, headers: v }, [G]: h }], [G]: j }, { conditions: C, rules: [{ conditions: D, error: "Invalid Configuration: FIPS and custom endpoint are not supported", [G]: k }, { conditions: E, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", [G]: k }, { endpoint: { url: o, properties: v, headers: v }, [G]: h }], [G]: j }, { conditions: [p], rules: [{ conditions: [r], rules: [{ conditions: [x, y], rules: [{ conditions: [{ [H]: c, [I]: [b, z] }, B], rules: [{ endpoint: { url: "https://sts-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", [G]: k }], [G]: j }, { conditions: D, rules: [{ conditions: [{ [H]: c, [I]: [z, b] }], rules: [{ conditions: [{ [H]: d, [I]: [{ [H]: l, [I]: [A, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://sts.{Region}.amazonaws.com", properties: v, headers: v }, [G]: h }, { endpoint: { url: "https://sts-fips.{Region}.{PartitionResult#dnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "FIPS is enabled but this partition does not support FIPS", [G]: k }], [G]: j }, { conditions: E, rules: [{ conditions: [B], rules: [{ endpoint: { url: "https://sts.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "DualStack is enabled but this partition does not support DualStack", [G]: k }], [G]: j }, w, { endpoint: { url: i, properties: v, headers: v }, [G]: h }], [G]: j }], [G]: j }, { error: "Invalid Configuration: Missing Region", [G]: k }] };
const ruleSet = _data;


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/index.js":
/*!*********************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/index.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $Command: () => (/* reexport safe */ _commands__WEBPACK_IMPORTED_MODULE_2__.$Command),
/* harmony export */   AssumeRoleCommand: () => (/* reexport safe */ _commands__WEBPACK_IMPORTED_MODULE_2__.AssumeRoleCommand),
/* harmony export */   AssumeRoleResponseFilterSensitiveLog: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.AssumeRoleResponseFilterSensitiveLog),
/* harmony export */   AssumeRoleWithWebIdentityCommand: () => (/* reexport safe */ _commands__WEBPACK_IMPORTED_MODULE_2__.AssumeRoleWithWebIdentityCommand),
/* harmony export */   AssumeRoleWithWebIdentityRequestFilterSensitiveLog: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.AssumeRoleWithWebIdentityRequestFilterSensitiveLog),
/* harmony export */   AssumeRoleWithWebIdentityResponseFilterSensitiveLog: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.AssumeRoleWithWebIdentityResponseFilterSensitiveLog),
/* harmony export */   CredentialsFilterSensitiveLog: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.CredentialsFilterSensitiveLog),
/* harmony export */   ExpiredTokenException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.ExpiredTokenException),
/* harmony export */   IDPCommunicationErrorException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.IDPCommunicationErrorException),
/* harmony export */   IDPRejectedClaimException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.IDPRejectedClaimException),
/* harmony export */   InvalidIdentityTokenException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.InvalidIdentityTokenException),
/* harmony export */   MalformedPolicyDocumentException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.MalformedPolicyDocumentException),
/* harmony export */   PackedPolicyTooLargeException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.PackedPolicyTooLargeException),
/* harmony export */   RegionDisabledException: () => (/* reexport safe */ _models__WEBPACK_IMPORTED_MODULE_3__.RegionDisabledException),
/* harmony export */   STS: () => (/* reexport safe */ _STS__WEBPACK_IMPORTED_MODULE_1__.STS),
/* harmony export */   STSClient: () => (/* reexport safe */ _STSClient__WEBPACK_IMPORTED_MODULE_0__.STSClient),
/* harmony export */   STSServiceException: () => (/* reexport safe */ _models_STSServiceException__WEBPACK_IMPORTED_MODULE_5__.STSServiceException),
/* harmony export */   __Client: () => (/* reexport safe */ _STSClient__WEBPACK_IMPORTED_MODULE_0__.__Client),
/* harmony export */   decorateDefaultCredentialProvider: () => (/* reexport safe */ _defaultRoleAssumers__WEBPACK_IMPORTED_MODULE_4__.decorateDefaultCredentialProvider),
/* harmony export */   getDefaultRoleAssumer: () => (/* reexport safe */ _defaultRoleAssumers__WEBPACK_IMPORTED_MODULE_4__.getDefaultRoleAssumer),
/* harmony export */   getDefaultRoleAssumerWithWebIdentity: () => (/* reexport safe */ _defaultRoleAssumers__WEBPACK_IMPORTED_MODULE_4__.getDefaultRoleAssumerWithWebIdentity)
/* harmony export */ });
/* harmony import */ var _STSClient__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./STSClient */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STSClient.js");
/* harmony import */ var _STS__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./STS */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/STS.js");
/* harmony import */ var _commands__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./commands */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/commands/index.js");
/* harmony import */ var _models__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./models */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/index.js");
/* harmony import */ var _defaultRoleAssumers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./defaultRoleAssumers */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/defaultRoleAssumers.js");
/* harmony import */ var _models_STSServiceException__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./models/STSServiceException */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/STSServiceException.js");








/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/STSServiceException.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/STSServiceException.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STSServiceException: () => (/* binding */ STSServiceException),
/* harmony export */   __ServiceException: () => (/* reexport safe */ _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.ServiceException)
/* harmony export */ });
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");


class STSServiceException extends _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, STSServiceException.prototype);
    }
}


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/index.js":
/*!****************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/index.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AssumeRoleResponseFilterSensitiveLog: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.AssumeRoleResponseFilterSensitiveLog),
/* harmony export */   AssumeRoleWithWebIdentityRequestFilterSensitiveLog: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.AssumeRoleWithWebIdentityRequestFilterSensitiveLog),
/* harmony export */   AssumeRoleWithWebIdentityResponseFilterSensitiveLog: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.AssumeRoleWithWebIdentityResponseFilterSensitiveLog),
/* harmony export */   CredentialsFilterSensitiveLog: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.CredentialsFilterSensitiveLog),
/* harmony export */   ExpiredTokenException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.ExpiredTokenException),
/* harmony export */   IDPCommunicationErrorException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.IDPCommunicationErrorException),
/* harmony export */   IDPRejectedClaimException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.IDPRejectedClaimException),
/* harmony export */   InvalidIdentityTokenException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.InvalidIdentityTokenException),
/* harmony export */   MalformedPolicyDocumentException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.MalformedPolicyDocumentException),
/* harmony export */   PackedPolicyTooLargeException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.PackedPolicyTooLargeException),
/* harmony export */   RegionDisabledException: () => (/* reexport safe */ _models_0__WEBPACK_IMPORTED_MODULE_0__.RegionDisabledException)
/* harmony export */ });
/* harmony import */ var _models_0__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./models_0 */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/models_0.js");



/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/models_0.js":
/*!*******************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/models_0.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AssumeRoleResponseFilterSensitiveLog: () => (/* binding */ AssumeRoleResponseFilterSensitiveLog),
/* harmony export */   AssumeRoleWithWebIdentityRequestFilterSensitiveLog: () => (/* binding */ AssumeRoleWithWebIdentityRequestFilterSensitiveLog),
/* harmony export */   AssumeRoleWithWebIdentityResponseFilterSensitiveLog: () => (/* binding */ AssumeRoleWithWebIdentityResponseFilterSensitiveLog),
/* harmony export */   CredentialsFilterSensitiveLog: () => (/* binding */ CredentialsFilterSensitiveLog),
/* harmony export */   ExpiredTokenException: () => (/* binding */ ExpiredTokenException),
/* harmony export */   IDPCommunicationErrorException: () => (/* binding */ IDPCommunicationErrorException),
/* harmony export */   IDPRejectedClaimException: () => (/* binding */ IDPRejectedClaimException),
/* harmony export */   InvalidIdentityTokenException: () => (/* binding */ InvalidIdentityTokenException),
/* harmony export */   MalformedPolicyDocumentException: () => (/* binding */ MalformedPolicyDocumentException),
/* harmony export */   PackedPolicyTooLargeException: () => (/* binding */ PackedPolicyTooLargeException),
/* harmony export */   RegionDisabledException: () => (/* binding */ RegionDisabledException)
/* harmony export */ });
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _STSServiceException__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./STSServiceException */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/STSServiceException.js");


const CredentialsFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SecretAccessKey && { SecretAccessKey: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});
const AssumeRoleResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});
class ExpiredTokenException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "ExpiredTokenException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ExpiredTokenException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ExpiredTokenException.prototype);
    }
}
class MalformedPolicyDocumentException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "MalformedPolicyDocumentException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MalformedPolicyDocumentException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
    }
}
class PackedPolicyTooLargeException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "PackedPolicyTooLargeException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "PackedPolicyTooLargeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
    }
}
class RegionDisabledException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "RegionDisabledException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "RegionDisabledException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RegionDisabledException.prototype);
    }
}
class IDPRejectedClaimException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "IDPRejectedClaimException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "IDPRejectedClaimException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
    }
}
class InvalidIdentityTokenException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "InvalidIdentityTokenException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidIdentityTokenException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
    }
}
const AssumeRoleWithWebIdentityRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.WebIdentityToken && { WebIdentityToken: _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_0__.SENSITIVE_STRING }),
});
const AssumeRoleWithWebIdentityResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});
class IDPCommunicationErrorException extends _STSServiceException__WEBPACK_IMPORTED_MODULE_1__.STSServiceException {
    name = "IDPCommunicationErrorException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "IDPCommunicationErrorException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
    }
}


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/protocols/Aws_query.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/protocols/Aws_query.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   de_AssumeRoleCommand: () => (/* binding */ de_AssumeRoleCommand),
/* harmony export */   de_AssumeRoleWithWebIdentityCommand: () => (/* binding */ de_AssumeRoleWithWebIdentityCommand),
/* harmony export */   se_AssumeRoleCommand: () => (/* binding */ se_AssumeRoleCommand),
/* harmony export */   se_AssumeRoleWithWebIdentityCommand: () => (/* binding */ se_AssumeRoleWithWebIdentityCommand)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js");
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _models_models_0__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../models/models_0 */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/models_0.js");
/* harmony import */ var _models_STSServiceException__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../models/STSServiceException */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/models/STSServiceException.js");





const se_AssumeRoleCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_AssumeRoleRequest(input, context),
        [_A]: _AR,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_AssumeRoleWithWebIdentityCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_AssumeRoleWithWebIdentityRequest(input, context),
        [_A]: _ARWWI,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const de_AssumeRoleCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseXmlBody)(output.body, context);
    let contents = {};
    contents = de_AssumeRoleResponse(data.AssumeRoleResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_AssumeRoleWithWebIdentityCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseXmlBody)(output.body, context);
    let contents = {};
    contents = de_AssumeRoleWithWebIdentityResponse(data.AssumeRoleWithWebIdentityResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_CommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await (0,_aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__.parseXmlErrorBody)(output.body, context),
    };
    const errorCode = loadQueryErrorCode(output, parsedOutput.body);
    switch (errorCode) {
        case "ExpiredTokenException":
        case "com.amazonaws.sts#ExpiredTokenException":
            throw await de_ExpiredTokenExceptionRes(parsedOutput, context);
        case "MalformedPolicyDocument":
        case "com.amazonaws.sts#MalformedPolicyDocumentException":
            throw await de_MalformedPolicyDocumentExceptionRes(parsedOutput, context);
        case "PackedPolicyTooLarge":
        case "com.amazonaws.sts#PackedPolicyTooLargeException":
            throw await de_PackedPolicyTooLargeExceptionRes(parsedOutput, context);
        case "RegionDisabledException":
        case "com.amazonaws.sts#RegionDisabledException":
            throw await de_RegionDisabledExceptionRes(parsedOutput, context);
        case "IDPCommunicationError":
        case "com.amazonaws.sts#IDPCommunicationErrorException":
            throw await de_IDPCommunicationErrorExceptionRes(parsedOutput, context);
        case "IDPRejectedClaim":
        case "com.amazonaws.sts#IDPRejectedClaimException":
            throw await de_IDPRejectedClaimExceptionRes(parsedOutput, context);
        case "InvalidIdentityToken":
        case "com.amazonaws.sts#InvalidIdentityTokenException":
            throw await de_InvalidIdentityTokenExceptionRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody: parsedBody.Error,
                errorCode,
            });
    }
};
const de_ExpiredTokenExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_ExpiredTokenException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.ExpiredTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const de_IDPCommunicationErrorExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_IDPCommunicationErrorException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.IDPCommunicationErrorException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const de_IDPRejectedClaimExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_IDPRejectedClaimException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.IDPRejectedClaimException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const de_InvalidIdentityTokenExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_InvalidIdentityTokenException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.InvalidIdentityTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const de_MalformedPolicyDocumentExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_MalformedPolicyDocumentException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.MalformedPolicyDocumentException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const de_PackedPolicyTooLargeExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_PackedPolicyTooLargeException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.PackedPolicyTooLargeException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const de_RegionDisabledExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_RegionDisabledException(body.Error, context);
    const exception = new _models_models_0__WEBPACK_IMPORTED_MODULE_3__.RegionDisabledException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.decorateServiceException)(exception, body);
};
const se_AssumeRoleRequest = (input, context) => {
    const entries = {};
    if (input[_RA] != null) {
        entries[_RA] = input[_RA];
    }
    if (input[_RSN] != null) {
        entries[_RSN] = input[_RSN];
    }
    if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (input[_PA]?.length === 0) {
            entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `PolicyArns.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_P] != null) {
        entries[_P] = input[_P];
    }
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    if (input[_T] != null) {
        const memberEntries = se_tagListType(input[_T], context);
        if (input[_T]?.length === 0) {
            entries.Tags = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `Tags.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_TTK] != null) {
        const memberEntries = se_tagKeyListType(input[_TTK], context);
        if (input[_TTK]?.length === 0) {
            entries.TransitiveTagKeys = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `TransitiveTagKeys.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_EI] != null) {
        entries[_EI] = input[_EI];
    }
    if (input[_SN] != null) {
        entries[_SN] = input[_SN];
    }
    if (input[_TC] != null) {
        entries[_TC] = input[_TC];
    }
    if (input[_SI] != null) {
        entries[_SI] = input[_SI];
    }
    if (input[_PC] != null) {
        const memberEntries = se_ProvidedContextsListType(input[_PC], context);
        if (input[_PC]?.length === 0) {
            entries.ProvidedContexts = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `ProvidedContexts.${key}`;
            entries[loc] = value;
        });
    }
    return entries;
};
const se_AssumeRoleWithWebIdentityRequest = (input, context) => {
    const entries = {};
    if (input[_RA] != null) {
        entries[_RA] = input[_RA];
    }
    if (input[_RSN] != null) {
        entries[_RSN] = input[_RSN];
    }
    if (input[_WIT] != null) {
        entries[_WIT] = input[_WIT];
    }
    if (input[_PI] != null) {
        entries[_PI] = input[_PI];
    }
    if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (input[_PA]?.length === 0) {
            entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `PolicyArns.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_P] != null) {
        entries[_P] = input[_P];
    }
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    return entries;
};
const se_policyDescriptorListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        const memberEntries = se_PolicyDescriptorType(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
            entries[`member.${counter}.${key}`] = value;
        });
        counter++;
    }
    return entries;
};
const se_PolicyDescriptorType = (input, context) => {
    const entries = {};
    if (input[_a] != null) {
        entries[_a] = input[_a];
    }
    return entries;
};
const se_ProvidedContext = (input, context) => {
    const entries = {};
    if (input[_PAr] != null) {
        entries[_PAr] = input[_PAr];
    }
    if (input[_CA] != null) {
        entries[_CA] = input[_CA];
    }
    return entries;
};
const se_ProvidedContextsListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        const memberEntries = se_ProvidedContext(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
            entries[`member.${counter}.${key}`] = value;
        });
        counter++;
    }
    return entries;
};
const se_Tag = (input, context) => {
    const entries = {};
    if (input[_K] != null) {
        entries[_K] = input[_K];
    }
    if (input[_Va] != null) {
        entries[_Va] = input[_Va];
    }
    return entries;
};
const se_tagKeyListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        entries[`member.${counter}`] = entry;
        counter++;
    }
    return entries;
};
const se_tagListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        const memberEntries = se_Tag(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
            entries[`member.${counter}.${key}`] = value;
        });
        counter++;
    }
    return entries;
};
const de_AssumedRoleUser = (output, context) => {
    const contents = {};
    if (output[_ARI] != null) {
        contents[_ARI] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_ARI]);
    }
    if (output[_Ar] != null) {
        contents[_Ar] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_Ar]);
    }
    return contents;
};
const de_AssumeRoleResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
    }
    if (output[_PPS] != null) {
        contents[_PPS] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.strictParseInt32)(output[_PPS]);
    }
    if (output[_SI] != null) {
        contents[_SI] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_SI]);
    }
    return contents;
};
const de_AssumeRoleWithWebIdentityResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    if (output[_SFWIT] != null) {
        contents[_SFWIT] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_SFWIT]);
    }
    if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
    }
    if (output[_PPS] != null) {
        contents[_PPS] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.strictParseInt32)(output[_PPS]);
    }
    if (output[_Pr] != null) {
        contents[_Pr] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_Pr]);
    }
    if (output[_Au] != null) {
        contents[_Au] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_Au]);
    }
    if (output[_SI] != null) {
        contents[_SI] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_SI]);
    }
    return contents;
};
const de_Credentials = (output, context) => {
    const contents = {};
    if (output[_AKI] != null) {
        contents[_AKI] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_AKI]);
    }
    if (output[_SAK] != null) {
        contents[_SAK] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_SAK]);
    }
    if (output[_ST] != null) {
        contents[_ST] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_ST]);
    }
    if (output[_E] != null) {
        contents[_E] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectNonNull)((0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.parseRfc3339DateTimeWithOffset)(output[_E]));
    }
    return contents;
};
const de_ExpiredTokenException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const de_IDPCommunicationErrorException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const de_IDPRejectedClaimException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const de_InvalidIdentityTokenException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const de_MalformedPolicyDocumentException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const de_PackedPolicyTooLargeException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const de_RegionDisabledException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.expectString)(output[_m]);
    }
    return contents;
};
const deserializeMetadata = (output) => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
});
const collectBodyString = (streamBody, context) => (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.collectBody)(streamBody, context).then((body) => context.utf8Encoder(body));
const throwDefaultError = (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.withBaseException)(_models_STSServiceException__WEBPACK_IMPORTED_MODULE_4__.STSServiceException);
const buildHttpRpcRequest = async (context, headers, path, resolvedHostname, body) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const contents = {
        protocol,
        hostname,
        port,
        method: "POST",
        path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
        headers,
    };
    if (resolvedHostname !== undefined) {
        contents.hostname = resolvedHostname;
    }
    if (body !== undefined) {
        contents.body = body;
    }
    return new _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__.HttpRequest(contents);
};
const SHARED_HEADERS = {
    "content-type": "application/x-www-form-urlencoded",
};
const _ = "2011-06-15";
const _A = "Action";
const _AKI = "AccessKeyId";
const _AR = "AssumeRole";
const _ARI = "AssumedRoleId";
const _ARU = "AssumedRoleUser";
const _ARWWI = "AssumeRoleWithWebIdentity";
const _Ar = "Arn";
const _Au = "Audience";
const _C = "Credentials";
const _CA = "ContextAssertion";
const _DS = "DurationSeconds";
const _E = "Expiration";
const _EI = "ExternalId";
const _K = "Key";
const _P = "Policy";
const _PA = "PolicyArns";
const _PAr = "ProviderArn";
const _PC = "ProvidedContexts";
const _PI = "ProviderId";
const _PPS = "PackedPolicySize";
const _Pr = "Provider";
const _RA = "RoleArn";
const _RSN = "RoleSessionName";
const _SAK = "SecretAccessKey";
const _SFWIT = "SubjectFromWebIdentityToken";
const _SI = "SourceIdentity";
const _SN = "SerialNumber";
const _ST = "SessionToken";
const _T = "Tags";
const _TC = "TokenCode";
const _TTK = "TransitiveTagKeys";
const _V = "Version";
const _Va = "Value";
const _WIT = "WebIdentityToken";
const _a = "arn";
const _m = "message";
const buildFormUrlencodedString = (formEntries) => Object.entries(formEntries)
    .map(([key, value]) => (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.extendedEncodeURIComponent)(key) + "=" + (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.extendedEncodeURIComponent)(value))
    .join("&");
const loadQueryErrorCode = (output, data) => {
    if (data.Error?.Code !== undefined) {
        return data.Error.Code;
    }
    if (output.statusCode == 404) {
        return "NotFound";
    }
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeConfig.js":
/*!*****************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeConfig.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRuntimeConfig: () => (/* binding */ getRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../package.json */ "../../@aws-sdk/nested-clients/package.json");
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js");
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/NODE_AUTH_SCHEME_PREFERENCE_OPTIONS.js");
/* harmony import */ var _aws_sdk_util_user_agent_node__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @aws-sdk/util-user-agent-node */ "../../@aws-sdk/util-user-agent-node/dist-es/index.js");
/* harmony import */ var _smithy_config_resolver__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @smithy/config-resolver */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/index.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js");
/* harmony import */ var _smithy_hash_node__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @smithy/hash-node */ "../../@smithy/hash-node/dist-es/index.js");
/* harmony import */ var _smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @smithy/middleware-retry */ "../../@smithy/middleware-retry/dist-es/index.js");
/* harmony import */ var _smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @smithy/node-config-provider */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/index.js");
/* harmony import */ var _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @smithy/node-http-handler */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/index.js");
/* harmony import */ var _smithy_util_body_length_node__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @smithy/util-body-length-node */ "../../@smithy/util-body-length-node/dist-es/index.js");
/* harmony import */ var _smithy_util_retry__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @smithy/util-retry */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/index.js");
/* harmony import */ var _runtimeConfig_shared__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./runtimeConfig.shared */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeConfig.shared.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _smithy_util_defaults_mode_node__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @smithy/util-defaults-mode-node */ "../../@smithy/util-defaults-mode-node/dist-es/index.js");















const getRuntimeConfig = (config) => {
    (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_14__.emitWarningIfUnsupportedVersion)(process.version);
    const defaultsMode = (0,_smithy_util_defaults_mode_node__WEBPACK_IMPORTED_MODULE_15__.resolveDefaultsModeConfig)(config);
    const defaultConfigProvider = () => defaultsMode().then(_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_14__.loadConfigsForDefaultMode);
    const clientSharedValues = (0,_runtimeConfig_shared__WEBPACK_IMPORTED_MODULE_13__.getRuntimeConfig)(config);
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
        authSchemePreference: config?.authSchemePreference ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)(_aws_sdk_core__WEBPACK_IMPORTED_MODULE_3__.NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
        bodyLengthChecker: config?.bodyLengthChecker ?? _smithy_util_body_length_node__WEBPACK_IMPORTED_MODULE_11__.calculateBodyLength,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ??
            (0,_aws_sdk_util_user_agent_node__WEBPACK_IMPORTED_MODULE_4__.createDefaultUserAgentProvider)({ serviceId: clientSharedValues.serviceId, clientVersion: _package_json__WEBPACK_IMPORTED_MODULE_0__.version }),
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4") ||
                    (async (idProps) => await config.credentialDefaultProvider(idProps?.__config || {})()),
                signer: new _aws_sdk_core__WEBPACK_IMPORTED_MODULE_2__.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new _smithy_core__WEBPACK_IMPORTED_MODULE_6__.NoAuthSigner(),
            },
        ],
        maxAttempts: config?.maxAttempts ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)(_smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_8__.NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
        region: config?.region ??
            (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)(_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_5__.NODE_REGION_CONFIG_OPTIONS, { ..._smithy_config_resolver__WEBPACK_IMPORTED_MODULE_5__.NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
        requestHandler: _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_10__.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ??
            (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)({
                ..._smithy_middleware_retry__WEBPACK_IMPORTED_MODULE_8__.NODE_RETRY_MODE_CONFIG_OPTIONS,
                default: async () => (await defaultConfigProvider()).retryMode || _smithy_util_retry__WEBPACK_IMPORTED_MODULE_12__.DEFAULT_RETRY_MODE,
            }, config),
        sha256: config?.sha256 ?? _smithy_hash_node__WEBPACK_IMPORTED_MODULE_7__.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_10__.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)(_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_5__.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)(_smithy_config_resolver__WEBPACK_IMPORTED_MODULE_5__.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        userAgentAppId: config?.userAgentAppId ?? (0,_smithy_node_config_provider__WEBPACK_IMPORTED_MODULE_9__.loadConfig)(_aws_sdk_util_user_agent_node__WEBPACK_IMPORTED_MODULE_4__.NODE_APP_ID_CONFIG_OPTIONS, loaderConfig),
    };
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeConfig.shared.js":
/*!************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeConfig.shared.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRuntimeConfig: () => (/* binding */ getRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core */ "../../@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
/* harmony import */ var _smithy_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/core */ "../../@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _smithy_url_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @smithy/url-parser */ "../../@smithy/url-parser/dist-es/index.js");
/* harmony import */ var _smithy_util_base64__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @smithy/util-base64 */ "../../@smithy/util-base64/dist-es/index.js");
/* harmony import */ var _smithy_util_utf8__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @smithy/util-utf8 */ "../../@smithy/util-utf8/dist-es/index.js");
/* harmony import */ var _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./auth/httpAuthSchemeProvider */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthSchemeProvider.js");
/* harmony import */ var _endpoint_endpointResolver__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./endpoint/endpointResolver */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/endpoint/endpointResolver.js");








const getRuntimeConfig = (config) => {
    return {
        apiVersion: "2011-06-15",
        base64Decoder: config?.base64Decoder ?? _smithy_util_base64__WEBPACK_IMPORTED_MODULE_4__.fromBase64,
        base64Encoder: config?.base64Encoder ?? _smithy_util_base64__WEBPACK_IMPORTED_MODULE_4__.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? _endpoint_endpointResolver__WEBPACK_IMPORTED_MODULE_7__.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? _auth_httpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_6__.defaultSTSHttpAuthSchemeProvider,
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
        serviceId: config?.serviceId ?? "STS",
        urlParser: config?.urlParser ?? _smithy_url_parser__WEBPACK_IMPORTED_MODULE_3__.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? _smithy_util_utf8__WEBPACK_IMPORTED_MODULE_5__.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? _smithy_util_utf8__WEBPACK_IMPORTED_MODULE_5__.toUtf8,
    };
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeExtensions.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/dist-es/submodules/sts/runtimeExtensions.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveRuntimeExtensions: () => (/* binding */ resolveRuntimeExtensions)
/* harmony export */ });
/* harmony import */ var _aws_sdk_region_config_resolver__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/region-config-resolver */ "../../@aws-sdk/region-config-resolver/dist-es/index.js");
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _auth_httpAuthExtensionConfiguration__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./auth/httpAuthExtensionConfiguration */ "../../@aws-sdk/nested-clients/dist-es/submodules/sts/auth/httpAuthExtensionConfiguration.js");




const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = Object.assign((0,_aws_sdk_region_config_resolver__WEBPACK_IMPORTED_MODULE_0__.getAwsRegionExtensionConfiguration)(runtimeConfig), (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.getDefaultExtensionConfiguration)(runtimeConfig), (0,_smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__.getHttpHandlerExtensionConfiguration)(runtimeConfig), (0,_auth_httpAuthExtensionConfiguration__WEBPACK_IMPORTED_MODULE_3__.getHttpAuthExtensionConfiguration)(runtimeConfig));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig, (0,_aws_sdk_region_config_resolver__WEBPACK_IMPORTED_MODULE_0__.resolveAwsRegionExtensionConfiguration)(extensionConfiguration), (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.resolveDefaultRuntimeConfig)(extensionConfiguration), (0,_smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__.resolveHttpHandlerRuntimeConfig)(extensionConfiguration), (0,_auth_httpAuthExtensionConfiguration__WEBPACK_IMPORTED_MODULE_3__.resolveHttpAuthRuntimeConfig)(extensionConfiguration));
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js":
/*!*******************************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js ***!
  \*******************************************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js":
/*!**************************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js ***!
  \**************************************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/index.js":
/*!***********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/index.js ***!
  \***********************************************************************************************************/
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
/* harmony import */ var _NodeUseDualstackEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./NodeUseDualstackEndpointConfigOptions */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js");
/* harmony import */ var _NodeUseFipsEndpointConfigOptions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./NodeUseFipsEndpointConfigOptions */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js");
/* harmony import */ var _resolveCustomEndpointsConfig__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./resolveCustomEndpointsConfig */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveCustomEndpointsConfig.js");
/* harmony import */ var _resolveEndpointsConfig__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./resolveEndpointsConfig */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveEndpointsConfig.js");






/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveCustomEndpointsConfig.js":
/*!**********************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveCustomEndpointsConfig.js ***!
  \**********************************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveEndpointsConfig.js":
/*!****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/resolveEndpointsConfig.js ***!
  \****************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveEndpointsConfig: () => (/* binding */ resolveEndpointsConfig)
/* harmony export */ });
/* harmony import */ var _smithy_util_middleware__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/util-middleware */ "../../@smithy/util-middleware/dist-es/index.js");
/* harmony import */ var _utils_getEndpointFromRegion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/getEndpointFromRegion */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/utils/getEndpointFromRegion.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/utils/getEndpointFromRegion.js":
/*!*********************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/utils/getEndpointFromRegion.js ***!
  \*********************************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/index.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/index.js ***!
  \*******************************************************************************************/
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
/* harmony import */ var _endpointsConfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./endpointsConfig */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/index.js");
/* harmony import */ var _regionConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./regionConfig */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/index.js");
/* harmony import */ var _regionInfo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./regionInfo */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/index.js");





/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js ***!
  \*********************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js":
/*!****************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRealRegion: () => (/* binding */ getRealRegion)
/* harmony export */ });
/* harmony import */ var _isFipsRegion__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./isFipsRegion */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js");

const getRealRegion = (region) => (0,_isFipsRegion__WEBPACK_IMPORTED_MODULE_0__.isFipsRegion)(region)
    ? ["fips-aws-global", "aws-fips"].includes(region)
        ? "us-east-1"
        : region.replace(/fips-(dkr-|prod-)?|-fips/, "")
    : region;


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/index.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/index.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NODE_REGION_CONFIG_FILE_OPTIONS: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.NODE_REGION_CONFIG_FILE_OPTIONS),
/* harmony export */   NODE_REGION_CONFIG_OPTIONS: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.NODE_REGION_CONFIG_OPTIONS),
/* harmony export */   REGION_ENV_NAME: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.REGION_ENV_NAME),
/* harmony export */   REGION_INI_NAME: () => (/* reexport safe */ _config__WEBPACK_IMPORTED_MODULE_0__.REGION_INI_NAME),
/* harmony export */   resolveRegionConfig: () => (/* reexport safe */ _resolveRegionConfig__WEBPACK_IMPORTED_MODULE_1__.resolveRegionConfig)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js");
/* harmony import */ var _resolveRegionConfig__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./resolveRegionConfig */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js");




/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js":
/*!***************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js ***!
  \***************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFipsRegion: () => (/* binding */ isFipsRegion)
/* harmony export */ });
const isFipsRegion = (region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js":
/*!**********************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js ***!
  \**********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveRegionConfig: () => (/* binding */ resolveRegionConfig)
/* harmony export */ });
/* harmony import */ var _getRealRegion__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getRealRegion */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js");
/* harmony import */ var _isFipsRegion__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./isFipsRegion */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/PartitionHash.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/PartitionHash.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/RegionHash.js":
/*!***********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/RegionHash.js ***!
  \***********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getHostnameFromVariants.js":
/*!************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getHostnameFromVariants.js ***!
  \************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHostnameFromVariants: () => (/* binding */ getHostnameFromVariants)
/* harmony export */ });
const getHostnameFromVariants = (variants = [], { useFipsEndpoint, useDualstackEndpoint }) => variants.find(({ tags }) => useFipsEndpoint === tags.includes("fips") && useDualstackEndpoint === tags.includes("dualstack"))?.hostname;


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getRegionInfo.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getRegionInfo.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRegionInfo: () => (/* binding */ getRegionInfo)
/* harmony export */ });
/* harmony import */ var _getHostnameFromVariants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getHostnameFromVariants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getHostnameFromVariants.js");
/* harmony import */ var _getResolvedHostname__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getResolvedHostname */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedHostname.js");
/* harmony import */ var _getResolvedPartition__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getResolvedPartition */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedPartition.js");
/* harmony import */ var _getResolvedSigningRegion__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./getResolvedSigningRegion */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedSigningRegion.js");




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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedHostname.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedHostname.js ***!
  \********************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedPartition.js":
/*!*********************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedPartition.js ***!
  \*********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getResolvedPartition: () => (/* binding */ getResolvedPartition)
/* harmony export */ });
const getResolvedPartition = (region, { partitionHash }) => Object.keys(partitionHash || {}).find((key) => partitionHash[key].regions.includes(region)) ?? "aws";


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedSigningRegion.js":
/*!*************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getResolvedSigningRegion.js ***!
  \*************************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/index.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/index.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRegionInfo: () => (/* reexport safe */ _getRegionInfo__WEBPACK_IMPORTED_MODULE_2__.getRegionInfo)
/* harmony export */ });
/* harmony import */ var _PartitionHash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./PartitionHash */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/PartitionHash.js");
/* harmony import */ var _RegionHash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./RegionHash */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/RegionHash.js");
/* harmony import */ var _getRegionInfo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getRegionInfo */ "../../@aws-sdk/nested-clients/node_modules/@smithy/config-resolver/dist-es/regionInfo/getRegionInfo.js");





/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/configLoader.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/configLoader.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadConfig: () => (/* binding */ loadConfig)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _fromEnv__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./fromEnv */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js");
/* harmony import */ var _fromSharedConfigFiles__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fromSharedConfigFiles */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js");
/* harmony import */ var _fromStatic__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./fromStatic */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js");




const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => {
    const { signingName, logger } = configuration;
    const envOptions = { signingName, logger };
    return (0,_smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.memoize)((0,_smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.chain)((0,_fromEnv__WEBPACK_IMPORTED_MODULE_1__.fromEnv)(environmentVariableSelector, envOptions), (0,_fromSharedConfigFiles__WEBPACK_IMPORTED_MODULE_2__.fromSharedConfigFiles)(configFileSelector, configuration), (0,_fromStatic__WEBPACK_IMPORTED_MODULE_3__.fromStatic)(defaultValue)));
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromEnv: () => (/* binding */ fromEnv)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _getSelectorName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getSelectorName */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js":
/*!****************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromSharedConfigFiles: () => (/* binding */ fromSharedConfigFiles)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _smithy_shared_ini_file_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/shared-ini-file-loader */ "../../@smithy/shared-ini-file-loader/dist-es/index.js");
/* harmony import */ var _getSelectorName__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getSelectorName */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js");



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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromStatic: () => (/* binding */ fromStatic)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");

const isFunction = (func) => typeof func === "function";
const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : (0,_smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.fromStatic)(defaultValue);


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js ***!
  \**********************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/index.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/index.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   loadConfig: () => (/* reexport safe */ _configLoader__WEBPACK_IMPORTED_MODULE_0__.loadConfig)
/* harmony export */ });
/* harmony import */ var _configLoader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./configLoader */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-config-provider/dist-es/configLoader.js");



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/constants.js":
/*!*************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/constants.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NODEJS_TIMEOUT_ERROR_CODES: () => (/* binding */ NODEJS_TIMEOUT_ERROR_CODES)
/* harmony export */ });
const NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "EPIPE", "ETIMEDOUT"];


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js":
/*!***************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js ***!
  \***************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/index.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/index.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_REQUEST_TIMEOUT: () => (/* reexport safe */ _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_REQUEST_TIMEOUT),
/* harmony export */   NodeHttp2Handler: () => (/* reexport safe */ _node_http2_handler__WEBPACK_IMPORTED_MODULE_1__.NodeHttp2Handler),
/* harmony export */   NodeHttpHandler: () => (/* reexport safe */ _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.NodeHttpHandler),
/* harmony export */   streamCollector: () => (/* reexport safe */ _stream_collector__WEBPACK_IMPORTED_MODULE_2__.streamCollector)
/* harmony export */ });
/* harmony import */ var _node_http_handler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-http-handler */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
/* harmony import */ var _node_http2_handler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-http2-handler */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js");
/* harmony import */ var _stream_collector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stream-collector */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js");





/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js ***!
  \*********************************************************************************************************/
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
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/constants.js");
/* harmony import */ var _get_transformed_headers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./get-transformed-headers */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js");
/* harmony import */ var _set_connection_timeout__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./set-connection-timeout */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js");
/* harmony import */ var _set_socket_keep_alive__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./set-socket-keep-alive */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js");
/* harmony import */ var _set_socket_timeout__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./set-socket-timeout */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js");
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js");
/* harmony import */ var _write_request_body__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./write-request-body */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js");











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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js":
/*!*********************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js ***!
  \*********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2ConnectionManager: () => (/* binding */ NodeHttp2ConnectionManager)
/* harmony export */ });
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! http2 */ "http2");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(http2__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_http2_connection_pool__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-http2-connection-pool */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js":
/*!******************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js ***!
  \******************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2Handler: () => (/* binding */ NodeHttp2Handler)
/* harmony export */ });
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_querystring_builder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/querystring-builder */ "../../@smithy/querystring-builder/dist-es/index.js");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! http2 */ "http2");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(http2__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _get_transformed_headers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./get-transformed-headers */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js");
/* harmony import */ var _node_http2_connection_manager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node-http2-connection-manager */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js");
/* harmony import */ var _write_request_body__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./write-request-body */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js");






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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setConnectionTimeout: () => (/* binding */ setConnectionTimeout)
/* harmony export */ });
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js");

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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js":
/*!*************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js ***!
  \*************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setSocketKeepAlive: () => (/* binding */ setSocketKeepAlive)
/* harmony export */ });
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js");

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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setSocketTimeout: () => (/* binding */ setSocketTimeout)
/* harmony export */ });
/* harmony import */ var _node_http_handler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-http-handler */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js":
/*!******************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js ***!
  \******************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   streamCollector: () => (/* binding */ streamCollector)
/* harmony export */ });
/* harmony import */ var _collector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./collector */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js");

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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js ***!
  \**********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   writeRequestBody: () => (/* binding */ writeRequestBody)
/* harmony export */ });
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! stream */ "stream");
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(stream__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/nested-clients/node_modules/@smithy/node-http-handler/dist-es/timing.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js ***!
  \**********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/client.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/client.js ***!
  \******************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectBody: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.collectBody)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/collect-stream-body.js");



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/command.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/command.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Command: () => (/* binding */ Command)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_stack__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-stack */ "../../@smithy/middleware-stack/dist-es/index.js");
/* harmony import */ var _smithy_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/index.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/constants.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/constants.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SENSITIVE_STRING: () => (/* binding */ SENSITIVE_STRING)
/* harmony export */ });
const SENSITIVE_STRING = "***SensitiveInformation***";


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js ***!
  \************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js ***!
  \*********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   throwDefaultError: () => (/* binding */ throwDefaultError),
/* harmony export */   withBaseException: () => (/* binding */ withBaseException)
/* harmony export */ });
/* harmony import */ var _exceptions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./exceptions */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/exceptions.js");

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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js":
/*!*************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js ***!
  \*************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js":
/*!*******************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js ***!
  \*******************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/exceptions.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/exceptions.js ***!
  \**********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extendedEncodeURIComponent: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.extendedEncodeURIComponent)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/extended-encode-uri-component.js");



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _smithy_types__WEBPACK_IMPORTED_MODULE_0__.AlgorithmId),
/* harmony export */   getChecksumConfiguration: () => (/* binding */ getChecksumConfiguration),
/* harmony export */   resolveChecksumRuntimeConfig: () => (/* binding */ resolveChecksumRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _smithy_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/index.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js":
/*!****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js ***!
  \****************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* binding */ getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* binding */ getDefaultExtensionConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* binding */ resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js");
/* harmony import */ var _retry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./retry */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js");


const getDefaultExtensionConfiguration = (runtimeConfig) => {
    return Object.assign((0,_checksum__WEBPACK_IMPORTED_MODULE_0__.getChecksumConfiguration)(runtimeConfig), (0,_retry__WEBPACK_IMPORTED_MODULE_1__.getRetryConfiguration)(runtimeConfig));
};
const getDefaultClientConfiguration = getDefaultExtensionConfiguration;
const resolveDefaultRuntimeConfig = (config) => {
    return Object.assign((0,_checksum__WEBPACK_IMPORTED_MODULE_0__.resolveChecksumRuntimeConfig)(config), (0,_retry__WEBPACK_IMPORTED_MODULE_1__.resolveRetryRuntimeConfig)(config));
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/index.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/index.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultExtensionConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultExtensionConfiguration */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js");



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js ***!
  \****************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getArrayIfSingleItem: () => (/* binding */ getArrayIfSingleItem)
/* harmony export */ });
const getArrayIfSingleItem = (mayBeArray) => Array.isArray(mayBeArray) ? mayBeArray : [mayBeArray];


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js ***!
  \************************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/index.js ***!
  \*****************************************************************************************/
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
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/client.js");
/* harmony import */ var _collect_stream_body__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./collect-stream-body */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js");
/* harmony import */ var _command__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./command */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/command.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/constants.js");
/* harmony import */ var _create_aggregated_client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./create-aggregated-client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js");
/* harmony import */ var _default_error_handler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./default-error-handler */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js");
/* harmony import */ var _defaults_mode__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./defaults-mode */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js");
/* harmony import */ var _emitWarningIfUnsupportedVersion__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./emitWarningIfUnsupportedVersion */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js");
/* harmony import */ var _exceptions__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./exceptions */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/exceptions.js");
/* harmony import */ var _extended_encode_uri_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./extended-encode-uri-component */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js");
/* harmony import */ var _extensions__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./extensions */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/extensions/index.js");
/* harmony import */ var _get_array_if_single_item__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./get-array-if-single-item */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js");
/* harmony import */ var _get_value_from_text_node__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./get-value-from-text-node */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js");
/* harmony import */ var _is_serializable_header_value__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./is-serializable-header-value */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js");
/* harmony import */ var _NoOpLogger__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./NoOpLogger */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js");
/* harmony import */ var _object_mapping__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./object-mapping */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/object-mapping.js");
/* harmony import */ var _resolve_path__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./resolve-path */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/resolve-path.js");
/* harmony import */ var _ser_utils__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./ser-utils */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/ser-utils.js");
/* harmony import */ var _serde_json__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./serde-json */ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/serde-json.js");
/* harmony import */ var _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @smithy/core/serde */ "../../@smithy/core/dist-es/submodules/serde/index.js");






















/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js":
/*!****************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js ***!
  \****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isSerializableHeaderValue: () => (/* binding */ isSerializableHeaderValue)
/* harmony export */ });
const isSerializableHeaderValue = (value) => {
    return value != null;
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/object-mapping.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/object-mapping.js ***!
  \**************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/resolve-path.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/resolve-path.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolvedPath: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.resolvedPath)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/resolve-path.js");



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/ser-utils.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/ser-utils.js ***!
  \*********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/serde-json.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/smithy-client/dist-es/serde-json.js ***!
  \**********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/abort.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/abort.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js ***!
  \***********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpSigner.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpSigner.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/auth.js":
/*!*************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/auth.js ***!
  \*************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/index.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/index.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HttpApiKeyAuthLocation: () => (/* reexport safe */ _HttpApiKeyAuth__WEBPACK_IMPORTED_MODULE_1__.HttpApiKeyAuthLocation),
/* harmony export */   HttpAuthLocation: () => (/* reexport safe */ _auth__WEBPACK_IMPORTED_MODULE_0__.HttpAuthLocation)
/* harmony export */ });
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auth */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/auth.js");
/* harmony import */ var _HttpApiKeyAuth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./HttpApiKeyAuth */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js");
/* harmony import */ var _HttpAuthScheme__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HttpAuthScheme */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js");
/* harmony import */ var _HttpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HttpAuthSchemeProvider */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js");
/* harmony import */ var _HttpSigner__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./HttpSigner */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/HttpSigner.js");
/* harmony import */ var _IdentityProviderConfig__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./IdentityProviderConfig */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js");








/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js ***!
  \*********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/checksum.js":
/*!************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/checksum.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/client.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/client.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/command.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/command.js ***!
  \***********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/config.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/config.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/index.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/index.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/config.js");
/* harmony import */ var _manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./manager */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/manager.js");
/* harmony import */ var _pool__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pool */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/pool.js");





/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/manager.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/manager.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/pool.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/pool.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/crypto.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/crypto.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/encode.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/encode.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoint.js":
/*!************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoint.js ***!
  \************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/index.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/index.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _EndpointRuleObject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EndpointRuleObject */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js");
/* harmony import */ var _ErrorRuleObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorRuleObject */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js");
/* harmony import */ var _RuleSetObject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RuleSetObject */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js");
/* harmony import */ var _shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shared */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/shared.js");
/* harmony import */ var _TreeRuleObject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./TreeRuleObject */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js");







/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/shared.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/shared.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/eventStream.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/eventStream.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/checksum.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/checksum.js ***!
  \***********************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* binding */ getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* binding */ resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/checksum.js");

const getDefaultClientConfiguration = (runtimeConfig) => {
    return (0,_checksum__WEBPACK_IMPORTED_MODULE_0__.getChecksumConfiguration)(runtimeConfig);
};
const resolveDefaultRuntimeConfig = (config) => {
    return (0,_checksum__WEBPACK_IMPORTED_MODULE_0__.resolveChecksumRuntimeConfig)(config);
};


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/index.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/index.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _checksum__WEBPACK_IMPORTED_MODULE_2__.AlgorithmId),
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultClientConfiguration */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js");
/* harmony import */ var _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./defaultExtensionConfiguration */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js");
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/checksum.js");





/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/feature-ids.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/feature-ids.js ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/http.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/http.js ***!
  \********************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/identity.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/identity.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/index.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/index.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _apiKeyIdentity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./apiKeyIdentity */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js");
/* harmony import */ var _awsCredentialIdentity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./awsCredentialIdentity */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js");
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./identity */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/identity.js");
/* harmony import */ var _tokenIdentity__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tokenIdentity */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js");






/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/index.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/index.js ***!
  \*********************************************************************************/
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
/* harmony import */ var _abort__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abort */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/abort.js");
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./auth */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/auth/index.js");
/* harmony import */ var _blob_blob_payload_input_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./blob/blob-payload-input-types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js");
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/checksum.js");
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./client */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/client.js");
/* harmony import */ var _command__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./command */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/command.js");
/* harmony import */ var _connection__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./connection */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/connection/index.js");
/* harmony import */ var _crypto__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./crypto */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/crypto.js");
/* harmony import */ var _encode__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./encode */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/encode.js");
/* harmony import */ var _endpoint__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./endpoint */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoint.js");
/* harmony import */ var _endpoints__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./endpoints */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/endpoints/index.js");
/* harmony import */ var _eventStream__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./eventStream */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/eventStream.js");
/* harmony import */ var _extensions__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./extensions */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/extensions/index.js");
/* harmony import */ var _feature_ids__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./feature-ids */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/feature-ids.js");
/* harmony import */ var _http__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./http */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/http.js");
/* harmony import */ var _http_httpHandlerInitialization__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./http/httpHandlerInitialization */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js");
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./identity */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/identity/index.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./logger */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/logger.js");
/* harmony import */ var _middleware__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./middleware */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/middleware.js");
/* harmony import */ var _pagination__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./pagination */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/pagination.js");
/* harmony import */ var _profile__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./profile */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/profile.js");
/* harmony import */ var _response__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./response */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/response.js");
/* harmony import */ var _retry__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./retry */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/retry.js");
/* harmony import */ var _schema_schema__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./schema/schema */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/schema/schema.js");
/* harmony import */ var _schema_sentinels__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./schema/sentinels */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/schema/sentinels.js");
/* harmony import */ var _serde__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./serde */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/serde.js");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./shapes */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/shapes.js");
/* harmony import */ var _signature__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./signature */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/signature.js");
/* harmony import */ var _stream__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./stream */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/stream.js");
/* harmony import */ var _streaming_payload_streaming_blob_common_types__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-common-types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js");
/* harmony import */ var _streaming_payload_streaming_blob_payload_input_types__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-payload-input-types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js");
/* harmony import */ var _streaming_payload_streaming_blob_payload_output_types__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-payload-output-types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js");
/* harmony import */ var _transfer__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./transfer */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transfer.js");
/* harmony import */ var _transform_client_payload_blob_type_narrow__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./transform/client-payload-blob-type-narrow */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js");
/* harmony import */ var _transform_mutable__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./transform/mutable */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/mutable.js");
/* harmony import */ var _transform_no_undefined__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./transform/no-undefined */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/no-undefined.js");
/* harmony import */ var _transform_type_transform__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! ./transform/type-transform */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/type-transform.js");
/* harmony import */ var _uri__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ./uri */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/uri.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ./util */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/util.js");
/* harmony import */ var _waiter__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! ./waiter */ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/waiter.js");










































/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/logger.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/logger.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/middleware.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/middleware.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SMITHY_CONTEXT_KEY: () => (/* binding */ SMITHY_CONTEXT_KEY)
/* harmony export */ });
const SMITHY_CONTEXT_KEY = "__smithy_context";


/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/pagination.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/pagination.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/profile.js":
/*!***********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/profile.js ***!
  \***********************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/response.js":
/*!************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/response.js ***!
  \************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/retry.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/retry.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/schema/schema.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/schema/schema.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/schema/sentinels.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/schema/sentinels.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/serde.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/serde.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/shapes.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/shapes.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/signature.js":
/*!*************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/signature.js ***!
  \*************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/stream.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/stream.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js":
/*!*************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js ***!
  \*************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js":
/*!********************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js ***!
  \********************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js":
/*!*********************************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js ***!
  \*********************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transfer.js":
/*!************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transfer.js ***!
  \************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js":
/*!*********************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js ***!
  \*********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/mutable.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/mutable.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/no-undefined.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/no-undefined.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/type-transform.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/transform/type-transform.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/uri.js":
/*!*******************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/uri.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/util.js":
/*!********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/util.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/waiter.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/types/dist-es/waiter.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AdaptiveRetryStrategy: () => (/* binding */ AdaptiveRetryStrategy)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/config.js");
/* harmony import */ var _DefaultRateLimiter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DefaultRateLimiter */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js");
/* harmony import */ var _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./StandardRetryStrategy */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js");



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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/ConfiguredRetryStrategy.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/ConfiguredRetryStrategy.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConfiguredRetryStrategy: () => (/* binding */ ConfiguredRetryStrategy)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js");
/* harmony import */ var _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./StandardRetryStrategy */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js");


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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js ***!
  \***************************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StandardRetryStrategy: () => (/* binding */ StandardRetryStrategy)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/config.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js");
/* harmony import */ var _defaultRetryBackoffStrategy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./defaultRetryBackoffStrategy */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js");
/* harmony import */ var _defaultRetryToken__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./defaultRetryToken */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js");




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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/config.js":
/*!***************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/config.js ***!
  \***************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js ***!
  \******************************************************************************************/
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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultRetryBackoffStrategy: () => (/* binding */ getDefaultRetryBackoffStrategy)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js");

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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js":
/*!**************************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js ***!
  \**************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDefaultRetryToken: () => (/* binding */ createDefaultRetryToken)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js");

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

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/index.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/index.js ***!
  \**************************************************************************************/
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
/* harmony import */ var _AdaptiveRetryStrategy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./AdaptiveRetryStrategy */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js");
/* harmony import */ var _ConfiguredRetryStrategy__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ConfiguredRetryStrategy */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/ConfiguredRetryStrategy.js");
/* harmony import */ var _DefaultRateLimiter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DefaultRateLimiter */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js");
/* harmony import */ var _StandardRetryStrategy__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./StandardRetryStrategy */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/config.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/constants.js");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./types */ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/types.js");









/***/ }),

/***/ "../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/types.js":
/*!**************************************************************************************!*\
  !*** ../../@aws-sdk/nested-clients/node_modules/@smithy/util-retry/dist-es/types.js ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/nested-clients/package.json":
/*!**************************************************!*\
  !*** ../../@aws-sdk/nested-clients/package.json ***!
  \**************************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"name":"@aws-sdk/nested-clients","version":"3.858.0","description":"Nested clients for AWS SDK packages.","main":"./dist-cjs/index.js","module":"./dist-es/index.js","types":"./dist-types/index.d.ts","scripts":{"build":"yarn lint && concurrently \'yarn:build:cjs\' \'yarn:build:es\' \'yarn:build:types\'","build:cjs":"node ../../scripts/compilation/inline nested-clients","build:es":"tsc -p tsconfig.es.json","build:include:deps":"lerna run --scope $npm_package_name --include-dependencies build","build:types":"tsc -p tsconfig.types.json","build:types:downlevel":"downlevel-dts dist-types dist-types/ts3.4","clean":"rimraf ./dist-* && rimraf *.tsbuildinfo","lint":"node ../../scripts/validation/submodules-linter.js --pkg nested-clients","test":"yarn g:vitest run","test:watch":"yarn g:vitest watch"},"engines":{"node":">=18.0.0"},"author":{"name":"AWS SDK for JavaScript Team","url":"https://aws.amazon.com/javascript/"},"license":"Apache-2.0","dependencies":{"@aws-crypto/sha256-browser":"5.2.0","@aws-crypto/sha256-js":"5.2.0","@aws-sdk/core":"3.858.0","@aws-sdk/middleware-host-header":"3.840.0","@aws-sdk/middleware-logger":"3.840.0","@aws-sdk/middleware-recursion-detection":"3.840.0","@aws-sdk/middleware-user-agent":"3.858.0","@aws-sdk/region-config-resolver":"3.840.0","@aws-sdk/types":"3.840.0","@aws-sdk/util-endpoints":"3.848.0","@aws-sdk/util-user-agent-browser":"3.840.0","@aws-sdk/util-user-agent-node":"3.858.0","@smithy/config-resolver":"^4.1.4","@smithy/core":"^3.7.2","@smithy/fetch-http-handler":"^5.1.0","@smithy/hash-node":"^4.0.4","@smithy/invalid-dependency":"^4.0.4","@smithy/middleware-content-length":"^4.0.4","@smithy/middleware-endpoint":"^4.1.17","@smithy/middleware-retry":"^4.1.18","@smithy/middleware-serde":"^4.0.8","@smithy/middleware-stack":"^4.0.4","@smithy/node-config-provider":"^4.1.3","@smithy/node-http-handler":"^4.1.0","@smithy/protocol-http":"^5.1.2","@smithy/smithy-client":"^4.4.9","@smithy/types":"^4.3.1","@smithy/url-parser":"^4.0.4","@smithy/util-base64":"^4.0.0","@smithy/util-body-length-browser":"^4.0.0","@smithy/util-body-length-node":"^4.0.0","@smithy/util-defaults-mode-browser":"^4.0.25","@smithy/util-defaults-mode-node":"^4.0.25","@smithy/util-endpoints":"^3.0.6","@smithy/util-middleware":"^4.0.4","@smithy/util-retry":"^4.0.6","@smithy/util-utf8":"^4.0.0","tslib":"^2.6.2"},"devDependencies":{"concurrently":"7.0.0","downlevel-dts":"0.10.1","rimraf":"3.0.2","typescript":"~5.8.3"},"typesVersions":{"<4.0":{"dist-types/*":["dist-types/ts3.4/*"]}},"files":["./sso-oidc.d.ts","./sso-oidc.js","./sts.d.ts","./sts.js","dist-*/**"],"browser":{"./dist-es/submodules/sso-oidc/runtimeConfig":"./dist-es/submodules/sso-oidc/runtimeConfig.browser","./dist-es/submodules/sts/runtimeConfig":"./dist-es/submodules/sts/runtimeConfig.browser"},"react-native":{},"homepage":"https://github.com/aws/aws-sdk-js-v3/tree/main/packages/nested-clients","repository":{"type":"git","url":"https://github.com/aws/aws-sdk-js-v3.git","directory":"packages/nested-clients"},"exports":{"./sso-oidc":{"types":"./dist-types/submodules/sso-oidc/index.d.ts","module":"./dist-es/submodules/sso-oidc/index.js","node":"./dist-cjs/submodules/sso-oidc/index.js","import":"./dist-es/submodules/sso-oidc/index.js","require":"./dist-cjs/submodules/sso-oidc/index.js"},"./sts":{"types":"./dist-types/submodules/sts/index.d.ts","module":"./dist-es/submodules/sts/index.js","node":"./dist-cjs/submodules/sts/index.js","import":"./dist-es/submodules/sts/index.js","require":"./dist-cjs/submodules/sts/index.js"}}}');

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


/***/ }),

/***/ "../../fast-xml-parser/src/ignoreAttributes.js":
/*!*****************************************************!*\
  !*** ../../fast-xml-parser/src/ignoreAttributes.js ***!
  \*****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ getIgnoreAttributesFn)
/* harmony export */ });
function getIgnoreAttributesFn(ignoreAttributes) {
    if (typeof ignoreAttributes === 'function') {
        return ignoreAttributes
    }
    if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
            for (const pattern of ignoreAttributes) {
                if (typeof pattern === 'string' && attrName === pattern) {
                    return true
                }
                if (pattern instanceof RegExp && pattern.test(attrName)) {
                    return true
                }
            }
        }
    }
    return () => false
}

/***/ }),

/***/ "../../fast-xml-parser/src/util.js":
/*!*****************************************!*\
  !*** ../../fast-xml-parser/src/util.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getAllMatches: () => (/* binding */ getAllMatches),
/* harmony export */   getValue: () => (/* binding */ getValue),
/* harmony export */   isEmptyObject: () => (/* binding */ isEmptyObject),
/* harmony export */   isExist: () => (/* binding */ isExist),
/* harmony export */   isName: () => (/* binding */ isName),
/* harmony export */   merge: () => (/* binding */ merge),
/* harmony export */   nameRegexp: () => (/* binding */ nameRegexp)
/* harmony export */ });


const nameStartChar = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*';
const regexName = new RegExp('^' + nameRegexp + '$');

function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}

const isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === 'undefined');
}

function isExist(v) {
  return typeof v !== 'undefined';
}

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Copy all the properties of a into b.
 * @param {*} target
 * @param {*} a
 */
function merge(target, a, arrayMode) {
  if (a) {
    const keys = Object.keys(a); // will return an array of own properties
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      if (arrayMode === 'strict') {
        target[keys[i]] = [ a[keys[i]] ];
      } else {
        target[keys[i]] = a[keys[i]];
      }
    }
  }
}
/* exports.merge =function (b,a){
  return Object.assign(b,a);
} */

function getValue(v) {
  if (exports.isExist(v)) {
    return v;
  } else {
    return '';
  }
}

// const fakeCall = function(a) {return a;};
// const fakeCallNoReturn = function() {};

/***/ }),

/***/ "../../fast-xml-parser/src/validator.js":
/*!**********************************************!*\
  !*** ../../fast-xml-parser/src/validator.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   validate: () => (/* binding */ validate)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util.js */ "../../fast-xml-parser/src/util.js");




const defaultOptions = {
  allowBooleanAttributes: false, //A tag can have attributes without any value
  unpairedTags: []
};

//const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions, options);

  //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
  //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
  //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE
  const tags = [];
  let tagFound = false;

  //indicates that the root tag has been closed (aka. depth 0 has been reached)
  let reachedRoot = false;

  if (xmlData[0] === '\ufeff') {
    // check for byte order mark (BOM)
    xmlData = xmlData.substr(1);
  }
  
  for (let i = 0; i < xmlData.length; i++) {

    if (xmlData[i] === '<' && xmlData[i+1] === '?') {
      i+=2;
      i = readPI(xmlData,i);
      if (i.err) return i;
    }else if (xmlData[i] === '<') {
      //starting of tag
      //read until you reach to '>' avoiding any '>' in attribute value
      let tagStartPos = i;
      i++;
      
      if (xmlData[i] === '!') {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        }
        //read tagname
        let tagName = '';
        for (; i < xmlData.length &&
          xmlData[i] !== '>' &&
          xmlData[i] !== ' ' &&
          xmlData[i] !== '\t' &&
          xmlData[i] !== '\n' &&
          xmlData[i] !== '\r'; i++
        ) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          //continue;
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '"+tagName+"' is an invalid name.";
          }
          return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
        }

        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject('InvalidAttr', "Attributes for '"+tagName+"' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;

        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
            //continue; //text may presents after self closing tag
          } else {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject('InvalidTag',
                "Expected closing tag '"+otg.tagName+"' (opened in line "+openPos.line+", col "+openPos.col+") instead of closing tag '"+tagName+"'.",
                getLineNumberForPosition(xmlData, tagStartPos));
            }

            //when there are no more tags, we reached the root level.
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }

          //if the root level has been reached before ...
          if (reachedRoot === true) {
            return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
          } else if(options.unpairedTags.indexOf(tagName) !== -1){
            //don't push into stack
          } else {
            tags.push({tagName, tagStartPos});
          }
          tagFound = true;
        }

        //skip tag text value
        //It may include comments and CDATA value
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i+1] === '?') {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else{
              break;
            }
          } else if (xmlData[i] === '&') {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          }else{
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject('InvalidXml', "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if ( isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject('InvalidChar', "char '"+xmlData[i]+"' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }

  if (!tagFound) {
    return getErrorObject('InvalidXml', 'Start tag expected.', 1);
  }else if (tags.length == 1) {
      return getErrorObject('InvalidTag', "Unclosed tag '"+tags[0].tagName+"'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  }else if (tags.length > 0) {
      return getErrorObject('InvalidXml', "Invalid '"+
          JSON.stringify(tags.map(t => t.tagName), null, 4).replace(/\r?\n/g, '')+
          "' found.", {line: 1, col: 1});
  }

  return true;
};

function isWhiteSpace(char){
  return char === ' ' || char === '\t' || char === '\n'  || char === '\r';
}
/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === 'xml') {
        return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}

function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  } else if (
    xmlData.length > i + 8 &&
    xmlData[i + 1] === 'D' &&
    xmlData[i + 2] === 'O' &&
    xmlData[i + 3] === 'C' &&
    xmlData[i + 4] === 'T' &&
    xmlData[i + 5] === 'Y' &&
    xmlData[i + 6] === 'P' &&
    xmlData[i + 7] === 'E'
  ) {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (
    xmlData.length > i + 9 &&
    xmlData[i + 1] === '[' &&
    xmlData[i + 2] === 'C' &&
    xmlData[i + 3] === 'D' &&
    xmlData[i + 4] === 'A' &&
    xmlData[i + 5] === 'T' &&
    xmlData[i + 6] === 'A' &&
    xmlData[i + 7] === '['
  ) {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  }

  return i;
}

const doubleQuote = '"';
const singleQuote = "'";

/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */
function readAttributeStr(xmlData, i) {
  let attrStr = '';
  let startChar = '';
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
        //if vaue is enclosed with double quote then single quotes are allowed inside the value and vice versa
      } else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
      if (startChar === '') {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== '') {
    return false;
  }

  return {
    value: attrStr,
    index: i,
    tagClosed: tagClosed
  };
}

/**
 * Select all the attributes whether valid or invalid.
 */
const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  const matches = (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.getAllMatches)(attrStr, validAttrStrRegxp);
  const attrNames = {};

  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' has no space in starting.", getPositionFromMatch(matches[i]))
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return getErrorObject('InvalidAttr', "boolean attribute '"+matches[i][2]+"' is not allowed.", getPositionFromMatch(matches[i]));
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is repeated.", getPositionFromMatch(matches[i]));
    }
  }

  return true;
}

function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === 'x') {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ';')
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}

function validateAmpersand(xmlData, i) {
  // https://www.w3.org/TR/xml/#dt-charref
  i++;
  if (xmlData[i] === ';')
    return -1;
  if (xmlData[i] === '#') {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ';')
      break;
    return -1;
  }
  return i;
}

function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code: code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col,
    },
  };
}

function validateAttrName(attrName) {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.isName)(attrName);
}

// const startsWithXML = /^xml/i;

function validateTagName(tagname) {
  return (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.isName)(tagname) /* && !tagname.match(startsWithXML) */;
}

//this function returns the line number for the character at the given index
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,

    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}

//this function returns the position of the first character of match within attrStr
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}


/***/ }),

/***/ "../../fast-xml-parser/src/xmlparser/DocTypeReader.js":
/*!************************************************************!*\
  !*** ../../fast-xml-parser/src/xmlparser/DocTypeReader.js ***!
  \************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ readDocType)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util.js */ "../../fast-xml-parser/src/util.js");


//TODO: handle comments
function readDocType(xmlData, i){
    
    const entities = {};
    if( xmlData[i + 3] === 'O' &&
         xmlData[i + 4] === 'C' &&
         xmlData[i + 5] === 'T' &&
         xmlData[i + 6] === 'Y' &&
         xmlData[i + 7] === 'P' &&
         xmlData[i + 8] === 'E')
    {    
        i = i+9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let exp = "";
        for(;i<xmlData.length;i++){
            if (xmlData[i] === '<' && !comment) { //Determine the tag type
                if( hasBody && hasSeq(xmlData, "!ENTITY",i)){
                    i += 7; 
                    let entityName, val;
                    [entityName, val,i] = readEntityExp(xmlData,i+1);
                    if(val.indexOf("&") === -1) //Parameter entities are not supported
                        entities[ entityName ] = {
                            regx : RegExp( `&${entityName};`,"g"),
                            val: val
                        };
                }
                else if( hasBody && hasSeq(xmlData, "!ELEMENT",i))  {
                    i += 8;//Not supported
                    const {index} = readElementExp(xmlData,i+1);
                    i = index;
                }else if( hasBody && hasSeq(xmlData, "!ATTLIST",i)){
                    i += 8;//Not supported
                    // const {index} = readAttlistExp(xmlData,i+1);
                    // i = index;
                }else if( hasBody && hasSeq(xmlData, "!NOTATION",i)) {
                    i += 9;//Not supported
                    const {index} = readNotationExp(xmlData,i+1);
                    i = index;
                }else if( hasSeq(xmlData, "!--",i) ) comment = true;
                else throw new Error(`Invalid DOCTYPE`);

                angleBracketsCount++;
                exp = "";
            } else if (xmlData[i] === '>') { //Read tag content
                if(comment){
                    if( xmlData[i - 1] === "-" && xmlData[i - 2] === "-"){
                        comment = false;
                        angleBracketsCount--;
                    }
                }else{
                    angleBracketsCount--;
                }
                if (angleBracketsCount === 0) {
                  break;
                }
            }else if( xmlData[i] === '['){
                hasBody = true;
            }else{
                exp += xmlData[i];
            }
        }
        if(angleBracketsCount !== 0){
            throw new Error(`Unclosed DOCTYPE`);
        }
    }else{
        throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return {entities, i};
}

const skipWhitespace = (data, index) => {
    while (index < data.length && /\s/.test(data[index])) {
        index++;
    }
    return index;
};

function readEntityExp(xmlData, i) {    
    //External entities are not supported
    //    <!ENTITY ext SYSTEM "http://normal-website.com" >

    //Parameter entities are not supported
    //    <!ENTITY entityname "&anotherElement;">

    //Internal entities are supported
    //    <!ENTITY entityname "replacement text">

    // Skip leading whitespace after <!ENTITY
    i = skipWhitespace(xmlData, i);

    // Read entity name
    let entityName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
        entityName += xmlData[i];
        i++;
    }
    validateEntityName(entityName);

    // Skip whitespace after entity name
    i = skipWhitespace(xmlData, i);

    // Check for unsupported constructs (external entities or parameter entities)
    if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
        throw new Error("External entities are not supported");
    }else if (xmlData[i] === "%") {
        throw new Error("Parameter entities are not supported");
    }

    // Read entity value (internal entity)
    let entityValue = "";
    [i, entityValue] = readIdentifierVal(xmlData, i, "entity");
    i--;
    return [entityName, entityValue, i ];
}

function readNotationExp(xmlData, i) {
    // Skip leading whitespace after <!NOTATION
    i = skipWhitespace(xmlData, i);

    // Read notation name
    let notationName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        notationName += xmlData[i];
        i++;
    }
    validateEntityName(notationName);

    // Skip whitespace after notation name
    i = skipWhitespace(xmlData, i);

    // Check identifier type (SYSTEM or PUBLIC)
    const identifierType = xmlData.substring(i, i + 6).toUpperCase();
    if (identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
        throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
    }
    i += identifierType.length;

    // Skip whitespace after identifier type
    i = skipWhitespace(xmlData, i);

    // Read public identifier (if PUBLIC)
    let publicIdentifier = null;
    let systemIdentifier = null;

    if (identifierType === "PUBLIC") {
        [i, publicIdentifier ] = readIdentifierVal(xmlData, i, "publicIdentifier");

        // Skip whitespace after public identifier
        i = skipWhitespace(xmlData, i);

        // Optionally read system identifier
        if (xmlData[i] === '"' || xmlData[i] === "'") {
            [i, systemIdentifier ] = readIdentifierVal(xmlData, i,"systemIdentifier");
        }
    } else if (identifierType === "SYSTEM") {
        // Read system identifier (mandatory for SYSTEM)
        [i, systemIdentifier ] = readIdentifierVal(xmlData, i, "systemIdentifier");

        if (!systemIdentifier) {
            throw new Error("Missing mandatory system identifier for SYSTEM notation");
        }
    }
    
    return {notationName, publicIdentifier, systemIdentifier, index: --i};
}

function readIdentifierVal(xmlData, i, type) {
    let identifierVal = "";
    const startChar = xmlData[i];
    if (startChar !== '"' && startChar !== "'") {
        throw new Error(`Expected quoted string, found "${startChar}"`);
    }
    i++;

    while (i < xmlData.length && xmlData[i] !== startChar) {
        identifierVal += xmlData[i];
        i++;
    }

    if (xmlData[i] !== startChar) {
        throw new Error(`Unterminated ${type} value`);
    }
    i++;
    return [i, identifierVal];
}

function readElementExp(xmlData, i) {
    // <!ELEMENT br EMPTY>
    // <!ELEMENT div ANY>
    // <!ELEMENT title (#PCDATA)>
    // <!ELEMENT book (title, author+)>
    // <!ELEMENT name (content-model)>
    
    // Skip leading whitespace after <!ELEMENT
    i = skipWhitespace(xmlData, i);

    // Read element name
    let elementName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        elementName += xmlData[i];
        i++;
    }

    // Validate element name
    if (!validateEntityName(elementName)) {
        throw new Error(`Invalid element name: "${elementName}"`);
    }

    // Skip whitespace after element name
    i = skipWhitespace(xmlData, i);
    let contentModel = "";
    // Expect '(' to start content model
    if(xmlData[i] === "E" && hasSeq(xmlData, "MPTY",i)) i+=4;
    else if(xmlData[i] === "A" && hasSeq(xmlData, "NY",i)) i+=2;
    else if (xmlData[i] === "(") {
        i++; // Move past '('

        // Read content model
        while (i < xmlData.length && xmlData[i] !== ")") {
            contentModel += xmlData[i];
            i++;
        }
        if (xmlData[i] !== ")") {
            throw new Error("Unterminated content model");
        }

    }else{
        throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
    }
    
    return {
        elementName,
        contentModel: contentModel.trim(),
        index: i
    };
}

function readAttlistExp(xmlData, i) {
    // Skip leading whitespace after <!ATTLIST
    i = skipWhitespace(xmlData, i);

    // Read element name
    let elementName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        elementName += xmlData[i];
        i++;
    }

    // Validate element name
    validateEntityName(elementName)

    // Skip whitespace after element name
    i = skipWhitespace(xmlData, i);

    // Read attribute name
    let attributeName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        attributeName += xmlData[i];
        i++;
    }

    // Validate attribute name
    if (!validateEntityName(attributeName)) {
        throw new Error(`Invalid attribute name: "${attributeName}"`);
    }

    // Skip whitespace after attribute name
    i = skipWhitespace(xmlData, i);

    // Read attribute type
    let attributeType = "";
    if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
        attributeType = "NOTATION";
        i += 8; // Move past "NOTATION"

        // Skip whitespace after "NOTATION"
        i = skipWhitespace(xmlData, i);

        // Expect '(' to start the list of notations
        if (xmlData[i] !== "(") {
            throw new Error(`Expected '(', found "${xmlData[i]}"`);
        }
        i++; // Move past '('

        // Read the list of allowed notations
        let allowedNotations = [];
        while (i < xmlData.length && xmlData[i] !== ")") {
            let notation = "";
            while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
                notation += xmlData[i];
                i++;
            }

            // Validate notation name
            notation = notation.trim();
            if (!validateEntityName(notation)) {
                throw new Error(`Invalid notation name: "${notation}"`);
            }

            allowedNotations.push(notation);

            // Skip '|' separator or exit loop
            if (xmlData[i] === "|") {
                i++; // Move past '|'
                i = skipWhitespace(xmlData, i); // Skip optional whitespace after '|'
            }
        }

        if (xmlData[i] !== ")") {
            throw new Error("Unterminated list of notations");
        }
        i++; // Move past ')'

        // Store the allowed notations as part of the attribute type
        attributeType += " (" + allowedNotations.join("|") + ")";
    } else {
        // Handle simple types (e.g., CDATA, ID, IDREF, etc.)
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            attributeType += xmlData[i];
            i++;
        }

        // Validate simple attribute type
        const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
        if (!validTypes.includes(attributeType.toUpperCase())) {
            throw new Error(`Invalid attribute type: "${attributeType}"`);
        }
    }

    // Skip whitespace after attribute type
    i = skipWhitespace(xmlData, i);

    // Read default value
    let defaultValue = "";
    if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
        defaultValue = "#REQUIRED";
        i += 8;
    } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
        defaultValue = "#IMPLIED";
        i += 7;
    } else {
        [i, defaultValue] = readIdentifierVal(xmlData, i, "ATTLIST");
    }

    return {
        elementName,
        attributeName,
        attributeType,
        defaultValue,
        index: i
    }
}

function hasSeq(data, seq,i){
    for(let j=0;j<seq.length;j++){
        if(seq[j]!==data[i+j+1]) return false;
    }
    return true;
}

function validateEntityName(name){
    if ((0,_util_js__WEBPACK_IMPORTED_MODULE_0__.isName)(name))
	return name;
    else
        throw new Error(`Invalid entity name ${name}`);
}


/***/ }),

/***/ "../../fast-xml-parser/src/xmlparser/OptionsBuilder.js":
/*!*************************************************************!*\
  !*** ../../fast-xml-parser/src/xmlparser/OptionsBuilder.js ***!
  \*************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildOptions: () => (/* binding */ buildOptions),
/* harmony export */   defaultOptions: () => (/* binding */ defaultOptions)
/* harmony export */ });

const defaultOptions = {
    preserveOrder: false,
    attributeNamePrefix: '@_',
    attributesGroupName: false,
    textNodeName: '#text',
    ignoreAttributes: true,
    removeNSPrefix: false, // remove NS from tag name or attribute name if true
    allowBooleanAttributes: false, //a tag can have attributes without any value
    //ignoreRootElement : false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true, //Trim string values of tag and attributes
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true
    },
    tagValueProcessor: function(tagName, val) {
      return val;
    },
    attributeValueProcessor: function(attrName, val) {
      return val;
    },
    stopNodes: [], //nested tags will not be parsed even for errors
    alwaysCreateTextNode: false,
    isArray: () => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function(tagName, jPath, attrs){
      return tagName
    },
    // skipEmptyListItem: false
    captureMetaData: false,
};
   
const buildOptions = function(options) {
    return Object.assign({}, defaultOptions, options);
};


/***/ }),

/***/ "../../fast-xml-parser/src/xmlparser/OrderedObjParser.js":
/*!***************************************************************!*\
  !*** ../../fast-xml-parser/src/xmlparser/OrderedObjParser.js ***!
  \***************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ OrderedObjParser)
/* harmony export */ });
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../util.js */ "../../fast-xml-parser/src/util.js");
/* harmony import */ var _xmlNode_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./xmlNode.js */ "../../fast-xml-parser/src/xmlparser/xmlNode.js");
/* harmony import */ var _DocTypeReader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DocTypeReader.js */ "../../fast-xml-parser/src/xmlparser/DocTypeReader.js");
/* harmony import */ var strnum__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! strnum */ "../../strnum/strnum.js");
/* harmony import */ var _ignoreAttributes_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../ignoreAttributes.js */ "../../fast-xml-parser/src/ignoreAttributes.js");

///@ts-check







// const regx =
//   '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
//   .replace(/NAME/g, util.nameRegexp);

//const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

class OrderedObjParser{
  constructor(options){
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos" : { regex: /&(apos|#39|#x27);/g, val : "'"},
      "gt" : { regex: /&(gt|#62|#x3E);/g, val : ">"},
      "lt" : { regex: /&(lt|#60|#x3C);/g, val : "<"},
      "quot" : { regex: /&(quot|#34|#x22);/g, val : "\""},
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val : "&"};
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent" : { regex: /&(cent|#162);/g, val: "¢" },
      "pound" : { regex: /&(pound|#163);/g, val: "£" },
      "yen" : { regex: /&(yen|#165);/g, val: "¥" },
      "euro" : { regex: /&(euro|#8364);/g, val: "€" },
      "copyright" : { regex: /&(copy|#169);/g, val: "©" },
      "reg" : { regex: /&(reg|#174);/g, val: "®" },
      "inr" : { regex: /&(inr|#8377);/g, val: "₹" },
      "num_dec": { regex: /&#([0-9]{1,7});/g, val : (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val : (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) },
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = (0,_ignoreAttributes_js__WEBPACK_IMPORTED_MODULE_4__["default"])(this.options.ignoreAttributes)
  }

}

function addExternalEntities(externalEntities){
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
       regex: new RegExp("&"+ent+";","g"),
       val : externalEntities[ent]
    }
  }
}

/**
 * @param {string} val
 * @param {string} tagName
 * @param {string} jPath
 * @param {boolean} dontTrim
 * @param {boolean} hasAttributes
 * @param {boolean} isLeafNode
 * @param {boolean} escapeEntities
 */
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if(val.length > 0){
      if(!escapeEntities) val = this.replaceEntitiesValue(val);
      
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if(newval === null || newval === undefined){
        //don't parse
        return val;
      }else if(typeof newval !== typeof val || newval !== val){
        //overwrite
        return newval;
      }else if(this.options.trimValues){
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      }else{
        const trimmedVal = val.trim();
        if(trimmedVal === val){
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        }else{
          return val;
        }
      }
    }
  }
}

function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(':');
    const prefix = tagname.charAt(0) === '/' ? '/' : '';
    if (tags[0] === 'xmlns') {
      return '';
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}

//TODO: change regex to capture NS
//const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");
const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])([\\s\\S]*?)\\3)?', 'gm');

function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === 'string') {
    // attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    const matches = (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.getAllMatches)(attrStr, attrsRegx);
    const len = matches.length; //don't make it inline
    const attrs = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if(aName === "__proto__") aName  = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if(newVal === null || newVal === undefined){
            //don't parse
            attrs[aName] = oldVal;
          }else if(typeof newVal !== typeof oldVal || newVal !== oldVal){
            //overwrite
            attrs[aName] = newVal;
          }else{
            //parse
            attrs[aName] = parseValue(
              oldVal,
              this.options.parseAttributeValue,
              this.options.numberParseOptions
            );
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs
  }
}

const parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n"); //TODO: remove this line
  const xmlObj = new _xmlNode_js__WEBPACK_IMPORTED_MODULE_1__["default"]('!xml');
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for(let i=0; i< xmlData.length; i++){//for each char in XML data
    const ch = xmlData[i];
    if(ch === '<'){
      // const nextIndex = i+1;
      // const _2ndChar = xmlData[nextIndex];
      if( xmlData[i+1] === '/') {//Closing Tag
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.")
        let tagName = xmlData.substring(i+2,closeIndex).trim();

        if(this.options.removeNSPrefix){
          const colonIndex = tagName.indexOf(":");
          if(colonIndex !== -1){
            tagName = tagName.substr(colonIndex+1);
          }
        }

        if(this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }

        if(currentNode){
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }

        //check if last tag of nested tag was unpaired tag
        const lastTagName = jPath.substring(jPath.lastIndexOf(".")+1);
        if(tagName && this.options.unpairedTags.indexOf(tagName) !== -1 ){
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0
        if(lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1 ){
          propIndex = jPath.lastIndexOf('.', jPath.lastIndexOf('.')-1)
          this.tagsNodeStack.pop();
        }else{
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);

        currentNode = this.tagsNodeStack.pop();//avoid recursion, set the parent tag scope
        textData = "";
        i = closeIndex;
      } else if( xmlData[i+1] === '?') {

        let tagData = readTagExp(xmlData,i, false, "?>");
        if(!tagData) throw new Error("Pi Tag is not closed.");

        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if( (this.options.ignoreDeclaration && tagData.tagName === "?xml") || this.options.ignorePiTags){

        }else{
  
          const childNode = new _xmlNode_js__WEBPACK_IMPORTED_MODULE_1__["default"](tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          
          if(tagData.tagName !== tagData.tagExp && tagData.attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }


        i = tagData.closeIndex + 1;
      } else if(xmlData.substr(i + 1, 3) === '!--') {
        const endIndex = findClosingIndex(xmlData, "-->", i+4, "Comment is not closed.")
        if(this.options.commentPropName){
          const comment = xmlData.substring(i + 4, endIndex - 2);

          textData = this.saveTextToParentTag(textData, currentNode, jPath);

          currentNode.add(this.options.commentPropName, [ { [this.options.textNodeName] : comment } ]);
        }
        i = endIndex;
      } else if( xmlData.substr(i + 1, 2) === '!D') {
        const result = (0,_DocTypeReader_js__WEBPACK_IMPORTED_MODULE_2__["default"])(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      }else if(xmlData.substr(i + 1, 2) === '![') {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9,closeIndex);

        textData = this.saveTextToParentTag(textData, currentNode, jPath);

        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if(val == undefined) val = "";

        //cdata should be set even if it is 0 length string
        if(this.options.cdataPropName){
          currentNode.add(this.options.cdataPropName, [ { [this.options.textNodeName] : tagExp } ]);
        }else{
          currentNode.add(this.options.textNodeName, val);
        }
        
        i = closeIndex + 2;
      }else {//Opening tag
        let result = readTagExp(xmlData,i, this.options.removeNSPrefix);
        let tagName= result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;

        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        
        //save text as child node
        if (currentNode && textData) {
          if(currentNode.tagname !== '!xml'){
            //when nested tag is found
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }

        //check if last tag was unpaired tag
        const lastTag = currentNode;
        if(lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1 ){
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if(tagName !== xmlObj.tagname){
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          //self-closing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else{
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          }
          //unpaired tag
          else if(this.options.unpairedTags.indexOf(tagName) !== -1){
            
            i = result.closeIndex;
          }
          //normal tag
          else{
            //read until closing tag is found
            const result = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if(!result) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result.i;
            tagContent = result.tagContent;
          }

          const childNode = new _xmlNode_js__WEBPACK_IMPORTED_MODULE_1__["default"](tagName);

          if(tagName !== tagExp && attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if(tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          
          this.addChild(currentNode, childNode, jPath, startIndex);
        }else{
  //selfClosing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else{
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            
            if(this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }

            const childNode = new _xmlNode_js__WEBPACK_IMPORTED_MODULE_1__["default"](tagName);
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          }
    //opening tag
          else{
            const childNode = new _xmlNode_js__WEBPACK_IMPORTED_MODULE_1__["default"]( tagName);
            this.tagsNodeStack.push(currentNode);
            
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    }else{
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
}

function addChild(currentNode, childNode, jPath, startIndex){
  // unset startIndex if not requested
  if (!this.options.captureMetaData) startIndex = undefined;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"])
  if(result === false){
  } else if(typeof result === "string"){
    childNode.tagname = result
    currentNode.addChild(childNode, startIndex);
  }else{
    currentNode.addChild(childNode, startIndex);
  }
}

const replaceEntitiesValue = function(val){

  if(this.options.processEntities){
    for(let entityName in this.docTypeEntities){
      const entity = this.docTypeEntities[entityName];
      val = val.replace( entity.regx, entity.val);
    }
    for(let entityName in this.lastEntities){
      const entity = this.lastEntities[entityName];
      val = val.replace( entity.regex, entity.val);
    }
    if(this.options.htmlEntities){
      for(let entityName in this.htmlEntities){
        const entity = this.htmlEntities[entityName];
        val = val.replace( entity.regex, entity.val);
      }
    }
    val = val.replace( this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
}
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) { //store previously collected data as textNode
    if(isLeafNode === undefined) isLeafNode = currentNode.child.length === 0
    
    textData = this.parseTextData(textData,
      currentNode.tagname,
      jPath,
      false,
      currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
      isLeafNode);

    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}

//TODO: use jPath to simplify the logic
/**
 * 
 * @param {string[]} stopNodes 
 * @param {string} jPath
 * @param {string} currentTagName 
 */
function isItStopNode(stopNodes, jPath, currentTagName){
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if( allNodesExp === stopNodeExp || jPath === stopNodeExp  ) return true;
  }
  return false;
}

/**
 * Returns the tag Expression and where it is ending handling single-double quotes situation
 * @param {string} xmlData 
 * @param {number} i starting index
 * @returns 
 */
function tagExpWithClosingIndex(xmlData, i, closingChar = ">"){
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
        if (ch === attrBoundary) attrBoundary = "";//reset
    } else if (ch === '"' || ch === "'") {
        attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if(closingChar[1]){
        if(xmlData[index + 1] === closingChar[1]){
          return {
            data: tagExp,
            index: index
          }
        }
      }else{
        return {
          data: tagExp,
          index: index
        }
      }
    } else if (ch === '\t') {
      ch = " "
    }
    tagExp += ch;
  }
}

function findClosingIndex(xmlData, str, i, errMsg){
  const closingIndex = xmlData.indexOf(str, i);
  if(closingIndex === -1){
    throw new Error(errMsg)
  }else{
    return closingIndex + str.length - 1;
  }
}

function readTagExp(xmlData,i, removeNSPrefix, closingChar = ">"){
  const result = tagExpWithClosingIndex(xmlData, i+1, closingChar);
  if(!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if(separatorIndex !== -1){//separate tag name and attributes expression
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }

  const rawTagName = tagName;
  if(removeNSPrefix){
    const colonIndex = tagName.indexOf(":");
    if(colonIndex !== -1){
      tagName = tagName.substr(colonIndex+1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }

  return {
    tagName: tagName,
    tagExp: tagExp,
    closeIndex: closeIndex,
    attrExpPresent: attrExpPresent,
    rawTagName: rawTagName,
  }
}
/**
 * find paired tag for a stop node
 * @param {string} xmlData 
 * @param {string} tagName 
 * @param {number} i 
 */
function readStopNodeData(xmlData, tagName, i){
  const startIndex = i;
  // Starting at 1 since we already have an open tag
  let openTagCount = 1;

  for (; i < xmlData.length; i++) {
    if( xmlData[i] === "<"){ 
      if (xmlData[i+1] === "/") {//close tag
          const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i+2,closeIndex).trim();
          if(closeTagName === tagName){
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i : closeIndex
              }
            }
          }
          i=closeIndex;
        } else if(xmlData[i+1] === '?') { 
          const closeIndex = findClosingIndex(xmlData, "?>", i+1, "StopNode is not closed.")
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 3) === '!--') { 
          const closeIndex = findClosingIndex(xmlData, "-->", i+3, "StopNode is not closed.")
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 2) === '![') { 
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i=closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, '>')

          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length-1] !== "/") {
              openTagCount++;
            }
            i=tagData.closeIndex;
          }
        }
      }
  }//end for loop
}

function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === 'string') {
    //console.log(options)
    const newval = val.trim();
    if(newval === 'true' ) return true;
    else if(newval === 'false' ) return false;
    else return (0,strnum__WEBPACK_IMPORTED_MODULE_3__["default"])(val, options);
  } else {
    if ((0,_util_js__WEBPACK_IMPORTED_MODULE_0__.isExist)(val)) {
      return val;
    } else {
      return '';
    }
  }
}


/***/ }),

/***/ "../../fast-xml-parser/src/xmlparser/XMLParser.js":
/*!********************************************************!*\
  !*** ../../fast-xml-parser/src/xmlparser/XMLParser.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ XMLParser)
/* harmony export */ });
/* harmony import */ var _OptionsBuilder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./OptionsBuilder.js */ "../../fast-xml-parser/src/xmlparser/OptionsBuilder.js");
/* harmony import */ var _OrderedObjParser_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./OrderedObjParser.js */ "../../fast-xml-parser/src/xmlparser/OrderedObjParser.js");
/* harmony import */ var _node2json_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node2json.js */ "../../fast-xml-parser/src/xmlparser/node2json.js");
/* harmony import */ var _validator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../validator.js */ "../../fast-xml-parser/src/validator.js");
/* harmony import */ var _xmlNode_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./xmlNode.js */ "../../fast-xml-parser/src/xmlparser/xmlNode.js");






class XMLParser{
    
    constructor(options){
        this.externalEntities = {};
        this.options = (0,_OptionsBuilder_js__WEBPACK_IMPORTED_MODULE_0__.buildOptions)(options);
        
    }
    /**
     * Parse XML dats to JS object 
     * @param {string|Buffer} xmlData 
     * @param {boolean|Object} validationOption 
     */
    parse(xmlData,validationOption){
        if(typeof xmlData === "string"){
        }else if( xmlData.toString){
            xmlData = xmlData.toString();
        }else{
            throw new Error("XML data is accepted in String or Bytes[] form.")
        }
        if( validationOption){
            if(validationOption === true) validationOption = {}; //validate with default options
            
            const result = (0,_validator_js__WEBPACK_IMPORTED_MODULE_3__.validate)(xmlData, validationOption);
            if (result !== true) {
              throw Error( `${result.err.msg}:${result.err.line}:${result.err.col}` )
            }
          }
        const orderedObjParser = new _OrderedObjParser_js__WEBPACK_IMPORTED_MODULE_1__["default"](this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if(this.options.preserveOrder || orderedResult === undefined) return orderedResult;
        else return (0,_node2json_js__WEBPACK_IMPORTED_MODULE_2__["default"])(orderedResult, this.options);
    }

    /**
     * Add Entity which is not by default supported by this library
     * @param {string} key 
     * @param {string} value 
     */
    addEntity(key, value){
        if(value.indexOf("&") !== -1){
            throw new Error("Entity value can't have '&'")
        }else if(key.indexOf("&") !== -1 || key.indexOf(";") !== -1){
            throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'")
        }else if(value === "&"){
            throw new Error("An entity with value '&' is not permitted");
        }else{
            this.externalEntities[key] = value;
        }
    }

    /**
     * Returns a Symbol that can be used to access the metadata
     * property on a node.
     * 
     * If Symbol is not available in the environment, an ordinary property is used
     * and the name of the property is here returned.
     * 
     * The XMLMetaData property is only present when `captureMetaData`
     * is true in the options.
     */
    static getMetaDataSymbol() {
        return _xmlNode_js__WEBPACK_IMPORTED_MODULE_4__["default"].getMetaDataSymbol();
    }
}


/***/ }),

/***/ "../../fast-xml-parser/src/xmlparser/node2json.js":
/*!********************************************************!*\
  !*** ../../fast-xml-parser/src/xmlparser/node2json.js ***!
  \********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ prettify)
/* harmony export */ });
/* harmony import */ var _xmlNode_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./xmlNode.js */ "../../fast-xml-parser/src/xmlparser/xmlNode.js");




const METADATA_SYMBOL = _xmlNode_js__WEBPACK_IMPORTED_MODULE_0__["default"].getMetaDataSymbol();

/**
 * 
 * @param {array} node 
 * @param {any} options 
 * @returns 
 */
function prettify(node, options){
  return compress( node, options);
}

/**
 * 
 * @param {array} arr 
 * @param {object} options 
 * @param {string} jPath 
 * @returns object
 */
function compress(arr, options, jPath){
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if(jPath === undefined) newJpath = property;
    else newJpath = jPath + "." + property;

    if(property === options.textNodeName){
      if(text === undefined) text = tagObj[property];
      else text += "" + tagObj[property];
    }else if(property === undefined){
      continue;
    }else if(tagObj[property]){
      
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL] !== undefined) {
        val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL]; // copy over metadata
      }

      if(tagObj[":@"]){
        assignAttributes( val, tagObj[":@"], newJpath, options);
      }else if(Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode){
        val = val[options.textNodeName];
      }else if(Object.keys(val).length === 0){
        if(options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }

      if(compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if(!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [ compressedObj[property] ];
        }
        compressedObj[property].push(val);
      }else{
        //TODO: if a node is not an array, then check if it should be an array
        //also determine if it is a leaf node
        if (options.isArray(property, newJpath, isLeaf )) {
          compressedObj[property] = [val];
        }else{
          compressedObj[property] = val;
        }
      }
    }
    
  }
  // if(text && text.length > 0) compressedObj[options.textNodeName] = text;
  if(typeof text === "string"){
    if(text.length > 0) compressedObj[options.textNodeName] = text;
  }else if(text !== undefined) compressedObj[options.textNodeName] = text;
  return compressedObj;
}

function propName(obj){
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if(key !== ":@") return key;
  }
}

function assignAttributes(obj, attrMap, jpath, options){
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [ attrMap[atrrName] ];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}

function isLeafTag(obj, options){
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  
  if (propCount === 0) {
    return true;
  }

  if (
    propCount === 1 &&
    (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)
  ) {
    return true;
  }

  return false;
}


/***/ }),

/***/ "../../fast-xml-parser/src/xmlparser/xmlNode.js":
/*!******************************************************!*\
  !*** ../../fast-xml-parser/src/xmlparser/xmlNode.js ***!
  \******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ XmlNode)
/* harmony export */ });


let METADATA_SYMBOL;

if (typeof Symbol !== "function") {
  METADATA_SYMBOL = "@@xmlMetadata";
} else {
  METADATA_SYMBOL = Symbol("XML Node Metadata");
}

class XmlNode{
  constructor(tagname) {
    this.tagname = tagname;
    this.child = []; //nested tags, text, cdata, comments in order
    this[":@"] = {}; //attributes map
  }
  add(key,val){
    // this.child.push( {name : key, val: val, isCdata: isCdata });
    if(key === "__proto__") key = "#__proto__";
    this.child.push( {[key]: val });
  }
  addChild(node, startIndex) {
    if(node.tagname === "__proto__") node.tagname = "#__proto__";
    if(node[":@"] && Object.keys(node[":@"]).length > 0){
      this.child.push( { [node.tagname]: node.child, [":@"]: node[":@"] });
    }else{
      this.child.push( { [node.tagname]: node.child });
    }
    // if requested, add the startIndex
    if (startIndex !== undefined) {
      // Note: for now we just overwrite the metadata. If we had more complex metadata,
      // we might need to do an object append here:  metadata = { ...metadata, startIndex }
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
}


/***/ }),

/***/ "../../strnum/strnum.js":
/*!******************************!*\
  !*** ../../strnum/strnum.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ toNumber)
/* harmony export */ });
const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
// const octRegex = /^0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;

 
const consider = {
    hex :  true,
    // oct: false,
    leadingZeros: true,
    decimalPoint: "\.",
    eNotation: true,
    //skipLike: /regex/
};

function toNumber(str, options = {}){
    options = Object.assign({}, consider, options );
    if(!str || typeof str !== "string" ) return str;
    
    let trimmedStr  = str.trim();
    
    if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
    else if(str==="0") return 0;
    else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
    // }else if (options.oct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
    }else if (trimmedStr.search(/.+[eE].+/)!== -1) { //eNotation
        return resolveEnotation(str,trimmedStr,options);
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
    }else{
        //separate negative sign, leading zeros, and rest number
        const match = numRegex.exec(trimmedStr);
        // +00.123 => [ , '+', '00', '.123', ..
        if(match){
            const sign = match[1] || "";
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
            const decimalAdjacentToLeadingZeros = sign ? // 0., -00., 000.
                str[leadingZeros.length+1] === "." 
                : str[leadingZeros.length] === ".";

            //trim ending zeros for floating number
            if(!options.leadingZeros //leading zeros are not allowed
                && (leadingZeros.length > 1 
                    || (leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros))){
                // 00, 00.3, +03.24, 03, 03.24
                return str;
            }
            else{//no leading zeros or leading zeros are allowed
                const num = Number(trimmedStr);
                const parsedStr = String(num);

                if( num === 0) return num;
                if(parsedStr.search(/[eE]/) !== -1){ //given number is long and parsed to eNotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(trimmedStr.indexOf(".") !== -1){ //floating number
                    if(parsedStr === "0") return num; //0.0
                    else if(parsedStr === numTrimmedByZeros) return num; //0.456. 0.79000
                    else if( parsedStr === `${sign}${numTrimmedByZeros}`) return num;
                    else return str;
                }
                
                let n = leadingZeros? numTrimmedByZeros : trimmedStr;
                if(leadingZeros){
                    // -009 => -9
                    return (n === parsedStr) || (sign+n === parsedStr) ? num : str
                }else  {
                    // +9
                    return (n === parsedStr) || (n === sign+parsedStr) ? num : str
                }
            }
        }else{ //non-numeric string
            return str;
        }
    }
}

const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str,trimmedStr,options){
    if(!options.eNotation) return str;
    const notation = trimmedStr.match(eNotationRegx); 
    if(notation){
        let sign = notation[1] || "";
        const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
        const leadingZeros = notation[2];
        const eAdjacentToLeadingZeros = sign ? // 0E.
            str[leadingZeros.length+1] === eChar 
            : str[leadingZeros.length] === eChar;

        if(leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
        else if(leadingZeros.length === 1 
            && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)){
                return Number(trimmedStr);
        }else if(options.leadingZeros && !eAdjacentToLeadingZeros){ //accept with leading zeros
            //remove leading 0s
            trimmedStr = (notation[1] || "") + notation[3];
            return Number(trimmedStr);
        }else return str;
    }else{
        return str;
    }
}

/**
 * 
 * @param {string} numStr without leading zeros
 * @returns 
 */
function trimZeros(numStr){
    if(numStr && numStr.indexOf(".") !== -1){//float
        numStr = numStr.replace(/0+$/, ""); //remove ending zeros
        if(numStr === ".")  numStr = "0";
        else if(numStr[0] === ".")  numStr = "0"+numStr;
        else if(numStr[numStr.length-1] === ".")  numStr = numStr.substring(0,numStr.length-1);
        return numStr;
    }
    return numStr;
}

function parse_int(numStr, base){
    //polyfill
    if(parseInt) return parseInt(numStr, base);
    else if(Number.parseInt) return Number.parseInt(numStr, base);
    else if(window && window.parseInt) return window.parseInt(numStr, base);
    else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported")
}

/***/ })

};
;
//# sourceMappingURL=_aws-sdk_nested-clients_dist-es_submodules_sts_index_js.js.map