"use strict";
exports.id = "_aws-sdk_credential-provider-http_dist-es_index_js";
exports.ids = ["_aws-sdk_credential-provider-http_dist-es_index_js"];
exports.modules = {

/***/ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/checkUrl.js":
/*!****************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/dist-es/fromHttp/checkUrl.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   checkUrl: () => (/* binding */ checkUrl)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");

const LOOPBACK_CIDR_IPv4 = "127.0.0.0/8";
const LOOPBACK_CIDR_IPv6 = "::1/128";
const ECS_CONTAINER_HOST = "169.254.170.2";
const EKS_CONTAINER_HOST_IPv4 = "169.254.170.23";
const EKS_CONTAINER_HOST_IPv6 = "[fd00:ec2::23]";
const checkUrl = (url, logger) => {
    if (url.protocol === "https:") {
        return;
    }
    if (url.hostname === ECS_CONTAINER_HOST ||
        url.hostname === EKS_CONTAINER_HOST_IPv4 ||
        url.hostname === EKS_CONTAINER_HOST_IPv6) {
        return;
    }
    if (url.hostname.includes("[")) {
        if (url.hostname === "[::1]" || url.hostname === "[0000:0000:0000:0000:0000:0000:0000:0001]") {
            return;
        }
    }
    else {
        if (url.hostname === "localhost") {
            return;
        }
        const ipComponents = url.hostname.split(".");
        const inRange = (component) => {
            const num = parseInt(component, 10);
            return 0 <= num && num <= 255;
        };
        if (ipComponents[0] === "127" &&
            inRange(ipComponents[1]) &&
            inRange(ipComponents[2]) &&
            inRange(ipComponents[3]) &&
            ipComponents.length === 4) {
            return;
        }
    }
    throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.CredentialsProviderError(`URL not accepted. It must either be HTTPS or match one of the following:
  - loopback CIDR 127.0.0.0/8 or [::1/128]
  - ECS container host 169.254.170.2
  - EKS container host 169.254.170.23 or [fd00:ec2::23]`, { logger });
};


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/fromHttp.js":
/*!****************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/dist-es/fromHttp/fromHttp.js ***!
  \****************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromHttp: () => (/* binding */ fromHttp)
/* harmony export */ });
/* harmony import */ var _aws_sdk_core_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @aws-sdk/core/client */ "../../@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
/* harmony import */ var _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/node-http-handler */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/index.js");
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! fs/promises */ "fs/promises");
/* harmony import */ var fs_promises__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(fs_promises__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _checkUrl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./checkUrl */ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/checkUrl.js");
/* harmony import */ var _requestHelpers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./requestHelpers */ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/requestHelpers.js");
/* harmony import */ var _retry_wrapper__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./retry-wrapper */ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/retry-wrapper.js");







const AWS_CONTAINER_CREDENTIALS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
const DEFAULT_LINK_LOCAL_HOST = "http://169.254.170.2";
const AWS_CONTAINER_CREDENTIALS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
const AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE = "AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE";
const AWS_CONTAINER_AUTHORIZATION_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
const fromHttp = (options = {}) => {
    options.logger?.debug("@aws-sdk/credential-provider-http - fromHttp");
    let host;
    const relative = options.awsContainerCredentialsRelativeUri ?? process.env[AWS_CONTAINER_CREDENTIALS_RELATIVE_URI];
    const full = options.awsContainerCredentialsFullUri ?? process.env[AWS_CONTAINER_CREDENTIALS_FULL_URI];
    const token = options.awsContainerAuthorizationToken ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN];
    const tokenFile = options.awsContainerAuthorizationTokenFile ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE];
    const warn = options.logger?.constructor?.name === "NoOpLogger" || !options.logger ? console.warn : options.logger.warn;
    if (relative && full) {
        warn("@aws-sdk/credential-provider-http: " +
            "you have set both awsContainerCredentialsRelativeUri and awsContainerCredentialsFullUri.");
        warn("awsContainerCredentialsFullUri will take precedence.");
    }
    if (token && tokenFile) {
        warn("@aws-sdk/credential-provider-http: " +
            "you have set both awsContainerAuthorizationToken and awsContainerAuthorizationTokenFile.");
        warn("awsContainerAuthorizationToken will take precedence.");
    }
    if (full) {
        host = full;
    }
    else if (relative) {
        host = `${DEFAULT_LINK_LOCAL_HOST}${relative}`;
    }
    else {
        throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_2__.CredentialsProviderError(`No HTTP credential provider host provided.
Set AWS_CONTAINER_CREDENTIALS_FULL_URI or AWS_CONTAINER_CREDENTIALS_RELATIVE_URI.`, { logger: options.logger });
    }
    const url = new URL(host);
    (0,_checkUrl__WEBPACK_IMPORTED_MODULE_4__.checkUrl)(url, options.logger);
    const requestHandler = new _smithy_node_http_handler__WEBPACK_IMPORTED_MODULE_1__.NodeHttpHandler({
        requestTimeout: options.timeout ?? 1000,
        connectionTimeout: options.timeout ?? 1000,
    });
    return (0,_retry_wrapper__WEBPACK_IMPORTED_MODULE_6__.retryWrapper)(async () => {
        const request = (0,_requestHelpers__WEBPACK_IMPORTED_MODULE_5__.createGetRequest)(url);
        if (token) {
            request.headers.Authorization = token;
        }
        else if (tokenFile) {
            request.headers.Authorization = (await fs_promises__WEBPACK_IMPORTED_MODULE_3___default().readFile(tokenFile)).toString();
        }
        try {
            const result = await requestHandler.handle(request);
            return (0,_requestHelpers__WEBPACK_IMPORTED_MODULE_5__.getCredentials)(result.response).then((creds) => (0,_aws_sdk_core_client__WEBPACK_IMPORTED_MODULE_0__.setCredentialFeature)(creds, "CREDENTIALS_HTTP", "z"));
        }
        catch (e) {
            throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_2__.CredentialsProviderError(String(e), { logger: options.logger });
        }
    }, options.maxRetries ?? 3, options.timeout ?? 1000);
};


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/requestHelpers.js":
/*!**********************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/dist-es/fromHttp/requestHelpers.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createGetRequest: () => (/* binding */ createGetRequest),
/* harmony export */   getCredentials: () => (/* binding */ getCredentials)
/* harmony export */ });
/* harmony import */ var _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/property-provider */ "../../@smithy/property-provider/dist-es/index.js");
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @smithy/smithy-client */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/index.js");
/* harmony import */ var _smithy_util_stream__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @smithy/util-stream */ "../../@smithy/util-stream/dist-es/index.js");




function createGetRequest(url) {
    return new _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_1__.HttpRequest({
        protocol: url.protocol,
        hostname: url.hostname,
        port: Number(url.port),
        path: url.pathname,
        query: Array.from(url.searchParams.entries()).reduce((acc, [k, v]) => {
            acc[k] = v;
            return acc;
        }, {}),
        fragment: url.hash,
    });
}
async function getCredentials(response, logger) {
    const stream = (0,_smithy_util_stream__WEBPACK_IMPORTED_MODULE_3__.sdkStreamMixin)(response.body);
    const str = await stream.transformToString();
    if (response.statusCode === 200) {
        const parsed = JSON.parse(str);
        if (typeof parsed.AccessKeyId !== "string" ||
            typeof parsed.SecretAccessKey !== "string" ||
            typeof parsed.Token !== "string" ||
            typeof parsed.Expiration !== "string") {
            throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.CredentialsProviderError("HTTP credential provider response not of the required format, an object matching: " +
                "{ AccessKeyId: string, SecretAccessKey: string, Token: string, Expiration: string(rfc3339) }", { logger });
        }
        return {
            accessKeyId: parsed.AccessKeyId,
            secretAccessKey: parsed.SecretAccessKey,
            sessionToken: parsed.Token,
            expiration: (0,_smithy_smithy_client__WEBPACK_IMPORTED_MODULE_2__.parseRfc3339DateTime)(parsed.Expiration),
        };
    }
    if (response.statusCode >= 400 && response.statusCode < 500) {
        let parsedBody = {};
        try {
            parsedBody = JSON.parse(str);
        }
        catch (e) { }
        throw Object.assign(new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.CredentialsProviderError(`Server responded with status: ${response.statusCode}`, { logger }), {
            Code: parsedBody.Code,
            Message: parsedBody.Message,
        });
    }
    throw new _smithy_property_provider__WEBPACK_IMPORTED_MODULE_0__.CredentialsProviderError(`Server responded with status: ${response.statusCode}`, { logger });
}


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/retry-wrapper.js":
/*!*********************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/dist-es/fromHttp/retry-wrapper.js ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   retryWrapper: () => (/* binding */ retryWrapper)
/* harmony export */ });
const retryWrapper = (toRetry, maxRetries, delayMs) => {
    return async () => {
        for (let i = 0; i < maxRetries; ++i) {
            try {
                return await toRetry();
            }
            catch (e) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
        return await toRetry();
    };
};


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/dist-es/index.js":
/*!****************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/dist-es/index.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fromHttp: () => (/* reexport safe */ _fromHttp_fromHttp__WEBPACK_IMPORTED_MODULE_0__.fromHttp)
/* harmony export */ });
/* harmony import */ var _fromHttp_fromHttp__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./fromHttp/fromHttp */ "../../@aws-sdk/credential-provider-http/dist-es/fromHttp/fromHttp.js");



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/constants.js":
/*!***********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/constants.js ***!
  \***********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NODEJS_TIMEOUT_ERROR_CODES: () => (/* binding */ NODEJS_TIMEOUT_ERROR_CODES)
/* harmony export */ });
const NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "EPIPE", "ETIMEDOUT"];


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js":
/*!*************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js ***!
  \*************************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/index.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/index.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_REQUEST_TIMEOUT: () => (/* reexport safe */ _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_REQUEST_TIMEOUT),
/* harmony export */   NodeHttp2Handler: () => (/* reexport safe */ _node_http2_handler__WEBPACK_IMPORTED_MODULE_1__.NodeHttp2Handler),
/* harmony export */   NodeHttpHandler: () => (/* reexport safe */ _node_http_handler__WEBPACK_IMPORTED_MODULE_0__.NodeHttpHandler),
/* harmony export */   streamCollector: () => (/* reexport safe */ _stream_collector__WEBPACK_IMPORTED_MODULE_2__.streamCollector)
/* harmony export */ });
/* harmony import */ var _node_http_handler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-http-handler */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
/* harmony import */ var _node_http2_handler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-http2-handler */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js");
/* harmony import */ var _stream_collector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stream-collector */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js");





/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js":
/*!*******************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js ***!
  \*******************************************************************************************************************/
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
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/constants.js");
/* harmony import */ var _get_transformed_headers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./get-transformed-headers */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js");
/* harmony import */ var _set_connection_timeout__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./set-connection-timeout */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js");
/* harmony import */ var _set_socket_keep_alive__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./set-socket-keep-alive */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js");
/* harmony import */ var _set_socket_timeout__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./set-socket-timeout */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js");
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js");
/* harmony import */ var _write_request_body__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./write-request-body */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js");











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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js":
/*!*******************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js ***!
  \*******************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2ConnectionManager: () => (/* binding */ NodeHttp2ConnectionManager)
/* harmony export */ });
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! http2 */ "http2");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(http2__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_http2_connection_pool__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node-http2-connection-pool */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js");


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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js":
/*!****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js ***!
  \****************************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeHttp2Handler: () => (/* binding */ NodeHttp2Handler)
/* harmony export */ });
/* harmony import */ var _smithy_protocol_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/protocol-http */ "../../@smithy/protocol-http/dist-es/index.js");
/* harmony import */ var _smithy_querystring_builder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/querystring-builder */ "../../@smithy/querystring-builder/dist-es/index.js");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! http2 */ "http2");
/* harmony import */ var http2__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(http2__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _get_transformed_headers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./get-transformed-headers */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js");
/* harmony import */ var _node_http2_connection_manager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node-http2-connection-manager */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js");
/* harmony import */ var _write_request_body__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./write-request-body */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js");






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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js":
/*!************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-connection-timeout.js ***!
  \************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setConnectionTimeout: () => (/* binding */ setConnectionTimeout)
/* harmony export */ });
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js");

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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js":
/*!***********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-socket-keep-alive.js ***!
  \***********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setSocketKeepAlive: () => (/* binding */ setSocketKeepAlive)
/* harmony export */ });
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js");

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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/set-socket-timeout.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setSocketTimeout: () => (/* binding */ setSocketTimeout)
/* harmony export */ });
/* harmony import */ var _node_http_handler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node-http-handler */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js");


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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js":
/*!****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js ***!
  \****************************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js":
/*!************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js ***!
  \************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   streamCollector: () => (/* binding */ streamCollector)
/* harmony export */ });
/* harmony import */ var _collector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./collector */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js");

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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js ***!
  \********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   writeRequestBody: () => (/* binding */ writeRequestBody)
/* harmony export */ });
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! stream */ "stream");
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(stream__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _timing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./timing */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/node-http-handler/dist-es/timing.js");


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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js ***!
  \********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/client.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/client.js ***!
  \****************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectBody: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.collectBody)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/collect-stream-body.js");



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/command.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/command.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Command: () => (/* binding */ Command)
/* harmony export */ });
/* harmony import */ var _smithy_middleware_stack__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/middleware-stack */ "../../@smithy/middleware-stack/dist-es/index.js");
/* harmony import */ var _smithy_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @smithy/types */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/index.js");


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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/constants.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/constants.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SENSITIVE_STRING: () => (/* binding */ SENSITIVE_STRING)
/* harmony export */ });
const SENSITIVE_STRING = "***SensitiveInformation***";


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js":
/*!**********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js ***!
  \**********************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js":
/*!*******************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js ***!
  \*******************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   throwDefaultError: () => (/* binding */ throwDefaultError),
/* harmony export */   withBaseException: () => (/* binding */ withBaseException)
/* harmony export */ });
/* harmony import */ var _exceptions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./exceptions */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/exceptions.js");

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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js":
/*!***********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js ***!
  \***********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js":
/*!*****************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js ***!
  \*****************************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/exceptions.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/exceptions.js ***!
  \********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js":
/*!***************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js ***!
  \***************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extendedEncodeURIComponent: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.extendedEncodeURIComponent)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/extended-encode-uri-component.js");



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _smithy_types__WEBPACK_IMPORTED_MODULE_0__.AlgorithmId),
/* harmony export */   getChecksumConfiguration: () => (/* binding */ getChecksumConfiguration),
/* harmony export */   resolveChecksumRuntimeConfig: () => (/* binding */ resolveChecksumRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _smithy_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/types */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/index.js");


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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js":
/*!**************************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js ***!
  \**************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* binding */ getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* binding */ getDefaultExtensionConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* binding */ resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js");
/* harmony import */ var _retry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./retry */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js");


const getDefaultExtensionConfiguration = (runtimeConfig) => {
    return Object.assign((0,_checksum__WEBPACK_IMPORTED_MODULE_0__.getChecksumConfiguration)(runtimeConfig), (0,_retry__WEBPACK_IMPORTED_MODULE_1__.getRetryConfiguration)(runtimeConfig));
};
const getDefaultClientConfiguration = getDefaultExtensionConfiguration;
const resolveDefaultRuntimeConfig = (config) => {
    return Object.assign((0,_checksum__WEBPACK_IMPORTED_MODULE_0__.resolveChecksumRuntimeConfig)(config), (0,_retry__WEBPACK_IMPORTED_MODULE_1__.resolveRetryRuntimeConfig)(config));
};


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/index.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/index.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultClientConfiguration),
/* harmony export */   getDefaultExtensionConfiguration: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultExtensionConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultExtensionConfiguration */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js");



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js ***!
  \**************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js":
/*!**********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js ***!
  \**********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getArrayIfSingleItem: () => (/* binding */ getArrayIfSingleItem)
/* harmony export */ });
const getArrayIfSingleItem = (mayBeArray) => Array.isArray(mayBeArray) ? mayBeArray : [mayBeArray];


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js":
/*!**********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js ***!
  \**********************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/index.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/index.js ***!
  \***************************************************************************************************/
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
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./client */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/client.js");
/* harmony import */ var _collect_stream_body__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./collect-stream-body */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/collect-stream-body.js");
/* harmony import */ var _command__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./command */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/command.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/constants.js");
/* harmony import */ var _create_aggregated_client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./create-aggregated-client */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/create-aggregated-client.js");
/* harmony import */ var _default_error_handler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./default-error-handler */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/default-error-handler.js");
/* harmony import */ var _defaults_mode__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./defaults-mode */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js");
/* harmony import */ var _emitWarningIfUnsupportedVersion__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./emitWarningIfUnsupportedVersion */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js");
/* harmony import */ var _exceptions__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./exceptions */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/exceptions.js");
/* harmony import */ var _extended_encode_uri_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./extended-encode-uri-component */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extended-encode-uri-component.js");
/* harmony import */ var _extensions__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./extensions */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/extensions/index.js");
/* harmony import */ var _get_array_if_single_item__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./get-array-if-single-item */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/get-array-if-single-item.js");
/* harmony import */ var _get_value_from_text_node__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./get-value-from-text-node */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/get-value-from-text-node.js");
/* harmony import */ var _is_serializable_header_value__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./is-serializable-header-value */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js");
/* harmony import */ var _NoOpLogger__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./NoOpLogger */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js");
/* harmony import */ var _object_mapping__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./object-mapping */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/object-mapping.js");
/* harmony import */ var _resolve_path__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./resolve-path */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/resolve-path.js");
/* harmony import */ var _ser_utils__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./ser-utils */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/ser-utils.js");
/* harmony import */ var _serde_json__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./serde-json */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/serde-json.js");
/* harmony import */ var _smithy_core_serde__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @smithy/core/serde */ "../../@smithy/core/dist-es/submodules/serde/index.js");






















/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js":
/*!**************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/is-serializable-header-value.js ***!
  \**************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isSerializableHeaderValue: () => (/* binding */ isSerializableHeaderValue)
/* harmony export */ });
const isSerializableHeaderValue = (value) => {
    return value != null;
};


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/object-mapping.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/object-mapping.js ***!
  \************************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/resolve-path.js":
/*!**********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/resolve-path.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolvedPath: () => (/* reexport safe */ _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__.resolvedPath)
/* harmony export */ });
/* harmony import */ var _smithy_core_protocols__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @smithy/core/protocols */ "../../@smithy/core/dist-es/submodules/protocols/resolve-path.js");



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/ser-utils.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/ser-utils.js ***!
  \*******************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/serde-json.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/smithy-client/dist-es/serde-json.js ***!
  \********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/abort.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/abort.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js ***!
  \*********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js ***!
  \*********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpSigner.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpSigner.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js":
/*!*****************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js ***!
  \*****************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/auth.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/auth.js ***!
  \***********************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/index.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/index.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HttpApiKeyAuthLocation: () => (/* reexport safe */ _HttpApiKeyAuth__WEBPACK_IMPORTED_MODULE_1__.HttpApiKeyAuthLocation),
/* harmony export */   HttpAuthLocation: () => (/* reexport safe */ _auth__WEBPACK_IMPORTED_MODULE_0__.HttpAuthLocation)
/* harmony export */ });
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./auth */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/auth.js");
/* harmony import */ var _HttpApiKeyAuth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./HttpApiKeyAuth */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpApiKeyAuth.js");
/* harmony import */ var _HttpAuthScheme__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./HttpAuthScheme */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpAuthScheme.js");
/* harmony import */ var _HttpAuthSchemeProvider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HttpAuthSchemeProvider */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpAuthSchemeProvider.js");
/* harmony import */ var _HttpSigner__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./HttpSigner */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/HttpSigner.js");
/* harmony import */ var _IdentityProviderConfig__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./IdentityProviderConfig */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/IdentityProviderConfig.js");








/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js":
/*!*******************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js ***!
  \*******************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/checksum.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/checksum.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/client.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/client.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/command.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/command.js ***!
  \*********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/config.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/config.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/index.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/index.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/config.js");
/* harmony import */ var _manager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./manager */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/manager.js");
/* harmony import */ var _pool__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pool */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/pool.js");





/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/manager.js":
/*!********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/manager.js ***!
  \********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/pool.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/pool.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/crypto.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/crypto.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/encode.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/encode.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoint.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoint.js ***!
  \**********************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js":
/*!******************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js ***!
  \******************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js":
/*!***************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js ***!
  \***************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js":
/*!*************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js ***!
  \*************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/index.js":
/*!*****************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/index.js ***!
  \*****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _EndpointRuleObject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EndpointRuleObject */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/EndpointRuleObject.js");
/* harmony import */ var _ErrorRuleObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ErrorRuleObject */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/ErrorRuleObject.js");
/* harmony import */ var _RuleSetObject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RuleSetObject */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/RuleSetObject.js");
/* harmony import */ var _shared__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./shared */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/shared.js");
/* harmony import */ var _TreeRuleObject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./TreeRuleObject */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/TreeRuleObject.js");







/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/shared.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/shared.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/eventStream.js":
/*!*************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/eventStream.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/checksum.js":
/*!*********************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/checksum.js ***!
  \*********************************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js":
/*!***************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js ***!
  \***************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultClientConfiguration: () => (/* binding */ getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* binding */ resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/checksum.js");

const getDefaultClientConfiguration = (runtimeConfig) => {
    return (0,_checksum__WEBPACK_IMPORTED_MODULE_0__.getChecksumConfiguration)(runtimeConfig);
};
const resolveDefaultRuntimeConfig = (config) => {
    return (0,_checksum__WEBPACK_IMPORTED_MODULE_0__.resolveChecksumRuntimeConfig)(config);
};


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js":
/*!******************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js ***!
  \******************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/index.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/index.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlgorithmId: () => (/* reexport safe */ _checksum__WEBPACK_IMPORTED_MODULE_2__.AlgorithmId),
/* harmony export */   getDefaultClientConfiguration: () => (/* reexport safe */ _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__.getDefaultClientConfiguration),
/* harmony export */   resolveDefaultRuntimeConfig: () => (/* reexport safe */ _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__.resolveDefaultRuntimeConfig)
/* harmony export */ });
/* harmony import */ var _defaultClientConfiguration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./defaultClientConfiguration */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/defaultClientConfiguration.js");
/* harmony import */ var _defaultExtensionConfiguration__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./defaultExtensionConfiguration */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/defaultExtensionConfiguration.js");
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/checksum.js");





/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/feature-ids.js":
/*!*************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/feature-ids.js ***!
  \*************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/http.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/http.js ***!
  \******************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js":
/*!*************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js ***!
  \*************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js":
/*!********************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js ***!
  \********************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/identity.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/identity.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/index.js":
/*!****************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/index.js ***!
  \****************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _apiKeyIdentity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./apiKeyIdentity */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/apiKeyIdentity.js");
/* harmony import */ var _awsCredentialIdentity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./awsCredentialIdentity */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/awsCredentialIdentity.js");
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./identity */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/identity.js");
/* harmony import */ var _tokenIdentity__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tokenIdentity */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js");






/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/tokenIdentity.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/index.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/index.js ***!
  \*******************************************************************************************/
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
/* harmony import */ var _abort__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abort */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/abort.js");
/* harmony import */ var _auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./auth */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/auth/index.js");
/* harmony import */ var _blob_blob_payload_input_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./blob/blob-payload-input-types */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/blob/blob-payload-input-types.js");
/* harmony import */ var _checksum__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./checksum */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/checksum.js");
/* harmony import */ var _client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./client */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/client.js");
/* harmony import */ var _command__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./command */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/command.js");
/* harmony import */ var _connection__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./connection */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/connection/index.js");
/* harmony import */ var _crypto__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./crypto */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/crypto.js");
/* harmony import */ var _encode__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./encode */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/encode.js");
/* harmony import */ var _endpoint__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./endpoint */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoint.js");
/* harmony import */ var _endpoints__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./endpoints */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/endpoints/index.js");
/* harmony import */ var _eventStream__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./eventStream */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/eventStream.js");
/* harmony import */ var _extensions__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./extensions */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/extensions/index.js");
/* harmony import */ var _feature_ids__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./feature-ids */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/feature-ids.js");
/* harmony import */ var _http__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./http */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/http.js");
/* harmony import */ var _http_httpHandlerInitialization__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./http/httpHandlerInitialization */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/http/httpHandlerInitialization.js");
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./identity */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/identity/index.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./logger */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/logger.js");
/* harmony import */ var _middleware__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./middleware */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/middleware.js");
/* harmony import */ var _pagination__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./pagination */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/pagination.js");
/* harmony import */ var _profile__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./profile */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/profile.js");
/* harmony import */ var _response__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./response */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/response.js");
/* harmony import */ var _retry__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./retry */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/retry.js");
/* harmony import */ var _schema_schema__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./schema/schema */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/schema/schema.js");
/* harmony import */ var _schema_sentinels__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./schema/sentinels */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/schema/sentinels.js");
/* harmony import */ var _serde__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./serde */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/serde.js");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./shapes */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/shapes.js");
/* harmony import */ var _signature__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./signature */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/signature.js");
/* harmony import */ var _stream__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./stream */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/stream.js");
/* harmony import */ var _streaming_payload_streaming_blob_common_types__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-common-types */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js");
/* harmony import */ var _streaming_payload_streaming_blob_payload_input_types__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-payload-input-types */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js");
/* harmony import */ var _streaming_payload_streaming_blob_payload_output_types__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./streaming-payload/streaming-blob-payload-output-types */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js");
/* harmony import */ var _transfer__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./transfer */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transfer.js");
/* harmony import */ var _transform_client_payload_blob_type_narrow__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./transform/client-payload-blob-type-narrow */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js");
/* harmony import */ var _transform_mutable__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./transform/mutable */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/mutable.js");
/* harmony import */ var _transform_no_undefined__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./transform/no-undefined */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/no-undefined.js");
/* harmony import */ var _transform_type_transform__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! ./transform/type-transform */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/type-transform.js");
/* harmony import */ var _uri__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ./uri */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/uri.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ./util */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/util.js");
/* harmony import */ var _waiter__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! ./waiter */ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/waiter.js");










































/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/logger.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/logger.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/middleware.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/middleware.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SMITHY_CONTEXT_KEY: () => (/* binding */ SMITHY_CONTEXT_KEY)
/* harmony export */ });
const SMITHY_CONTEXT_KEY = "__smithy_context";


/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/pagination.js":
/*!************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/pagination.js ***!
  \************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/profile.js":
/*!*********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/profile.js ***!
  \*********************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/response.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/response.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/retry.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/retry.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/schema/schema.js":
/*!***************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/schema/schema.js ***!
  \***************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/schema/sentinels.js":
/*!******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/schema/sentinels.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/serde.js":
/*!*******************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/serde.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/shapes.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/shapes.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/signature.js":
/*!***********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/signature.js ***!
  \***********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/stream.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/stream.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js":
/*!***********************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-common-types.js ***!
  \***********************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js":
/*!******************************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-input-types.js ***!
  \******************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js":
/*!*******************************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/streaming-payload/streaming-blob-payload-output-types.js ***!
  \*******************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transfer.js":
/*!**********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transfer.js ***!
  \**********************************************************************************************/
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

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js":
/*!*******************************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/client-payload-blob-type-narrow.js ***!
  \*******************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/mutable.js":
/*!*******************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/mutable.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/no-undefined.js":
/*!************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/no-undefined.js ***!
  \************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/type-transform.js":
/*!**************************************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/transform/type-transform.js ***!
  \**************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/uri.js":
/*!*****************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/uri.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/util.js":
/*!******************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/util.js ***!
  \******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ }),

/***/ "../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/waiter.js":
/*!********************************************************************************************!*\
  !*** ../../@aws-sdk/credential-provider-http/node_modules/@smithy/types/dist-es/waiter.js ***!
  \********************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);



/***/ })

};
;
//# sourceMappingURL=_aws-sdk_credential-provider-http_dist-es_index_js.js.map