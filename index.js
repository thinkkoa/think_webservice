/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-05-19 09:30:30
 */

const soap = require('soap');
const helper = require('think_lib');
var _WS_CLIENTS = {};

/**
 * 创建webservice client
 *
 * @param {*} url
 * @param {*} [options={}]
 * @returns
 */
const createWS = function (url, options = {}) {
    options = Object.assign({
        endpoint: url,
        description: '',
        wsdl_options: { timeout: 30000 }
    }, options);
    let deferred = helper.getDefer();
    soap.createClient(url, options, function (err, client) {
        if (err) {
            if (err.message && helper.toString(err.message).indexOf('TIMEDOUT') > -1) {
                deferred.reject({ code: 504, message: err.message || 'WEBSERVICE服务实例化失败' });
            } else {
                deferred.reject({ code: 503, message: err.message || 'WEBSERVICE服务实例化失败' });
            }
        }
        deferred.resolve(client);
    });
    return deferred.promise;
};

/**
 *
 *
 * @param {string} url
 * @param {string} methods
 * @param {*} params
 * @param {number} [timeout=10000]
 * @param {*} [options={}]
 * @returns
 */
module.exports = async function (url, methods, params, timeout = 10000, options = {}) {
    const key = `WS_${url}`;
    if (!_WS_CLIENTS[key] || !_WS_CLIENTS[key][methods]) {
        _WS_CLIENTS[key] = await createWS(url, options);
    }

    const defer = helper.getDefer();
    _WS_CLIENTS[key][methods](params, function (err, response) {
        if (err) {
            if (err.message && helper.toString(err.message).indexOf('TIMEDOUT') > -1) {
                defer.reject({ code: 504, message: err.message || 'WEBSERVICE服务调用失败' });
            } else {
                _WS_CLIENTS[key] = null;
                defer.reject({ code: 503, message: err.message || 'WEBSERVICE服务调用失败' });
            }
        }
        defer.resolve(response);
    }, { timeout: timeout });
    return defer.promise;
};