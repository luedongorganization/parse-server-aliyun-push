"use strict";

const Parse = require('parse/node').Parse;
const providerMap = {
    android: require('./GCM'),
    ios: require('./APNS')
};

function AzurePushAdapter(pushConfig) {
    pushConfig = pushConfig || {};
    var nhClient = pushConfig.NHClient || nhClientFactory(nhConfig.get(pushConfig));

    var api = {
        getValidPushTypes: function () {
            return ['ios', 'android'];
        },
        send: function (data, installations) {
            var deviceMap = classifyInstallations(installations, api.getValidPushTypes());
            var sendPromises = [];
            for (var pushType in deviceMap) {
                var devices = deviceMap[pushType];
                if (!devices.length)
                    continue;
                var sender = providerMap[pushType];
                if (!sender) {
                    console.log('Can not find sender for push type %s, %j', pushType, data);
                    continue;
                }
                var headers = sender.generateHeaders(data);
                var payload = sender.generatePayload(data);
                console.log('Sending notification "' + payload + '" to ' + devices.length + ' ' + pushType + ' devices');

                sendPromises.push(Parse.Promise.when(
                    chunk(devices).map(function chunkOfDevices() {
                        return nhClient.bulkSend(chunkOfDevices, headers, payload);
                    })
                ));
            }
            return Parse.Promise.when(sendPromises);
        }
    };
    return api;
}

module.exports = AzurePushAdapter;