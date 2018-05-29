/****************************************************************
 * AnalyticsMP library
 * https://github.com/RomainVialard/AnalyticsMP
 *
 * Make calls to the Google Analytics Measurement Protocol
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/
 *
 * Note: Better to keep "Analytics" in method names
 * as they are available outside of the AnalyticsMP namespace
 * sendAnalyticsEvent()
 * getAnalyticsClientId()
 *****************************************************************/

/**
 * Make calls to Analytics with the UrlFetchApp service
 *
 * @param {{}} [parameters] - parameters for the Measurement Protocol, full list documented here:
 *                            https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @param {Properties} optUserProperties - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                         or simply to switch to another property store (Document / Script)
 */
function sendAnalyticsEvent(parameters, optPropertyStore) {
	parameters = AnalyticsMP_._addRequiredParameters(parameters, optPropertyStore, true);
	
	var options = {
		method: 'post',
		payload: parameters
	};
	
	// if the ErrorHandler library is loaded, use it
	// https://github.com/RomainVialard/ErrorHandler
	if (this['ErrorHandler']) {
		ErrorHandler.urlFetchWithExpBackOff('https://www.google-analytics.com/collect', options);
	}
	else {
		UrlFetchApp.fetch('https://www.google-analytics.com/collect', options);
	}
};

/**
 * Build a tracking url, useful eg: to place a tracking beacon in emails sent
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/email
 *
 * @param {{}} [parameters] - parameters for the Measurement Protocol, full list documented here:
 *                            https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @param {Properties} optUserProperties - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                         or simply to switch to another property store (Document / Script)
 */
function generateAnalyticsTrackingUrl(parameters, optPropertyStore) {
	parameters = AnalyticsMP_._addRequiredParameters(parameters, optPropertyStore);
	
	var urlParams = [];
	for (var i in parameters) {
		if (!parameters[i]) urlParams.push(i);
		else urlParams.push(i + '=' + encodeURI(parameters[i]));
	}
	return 'https://www.google-analytics.com/collect?' + urlParams.join('&amp;');
}

/**
 * The client ID should always be the same for a given user
 * On client side it is usually stored as a cookie
 * Here it makes sense to save it as a User Property
 * This method can also be called from client side
 * to use the same client ID on both server & client (useful for session aggregation)
 *
 * @param {Properties} optUserProperties - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                         or simply to switch to another property store (Document / Script)
 */
function getAnalyticsClientId(optPropertyStore) {
	// if client ID is saved in memory, avoid making new call to the property store
	if (AnalyticsMP_.clientId) return AnalyticsMP_.clientId;
	
	if (!optPropertyStore) optPropertyStore = PropertiesService.getUserProperties();
	// try to get client ID from user properties
	AnalyticsMP_.clientId = optPropertyStore.getProperty('clientId');
	if (!AnalyticsMP_.clientId) {
		AnalyticsMP_.clientId = Utilities.getUuid();
		userProperties.setProperty('clientId', AnalyticsMP_.clientId);
	}
	return AnalyticsMP_.clientId;
}

// noinspection JSUnusedGlobalSymbols, ThisExpressionReferencesGlobalObjectJS
this['AnalyticsMP'] = {
	// Add local alias to run the library as normal code
	sendAnalyticsEvent: sendAnalyticsEvent,
	getAnalyticsClientId: getAnalyticsClientId,
	generateAnalyticsTrackingImg: generateAnalyticsTrackingImg,
};

//<editor-fold desc="# Private methods">

var AnalyticsMP_ = {};


// noinspection ThisExpressionReferencesGlobalObjectJS
/**
 * Get GAS global object: top-level this
 */
AnalyticsMP_._this = this;

AnalyticsMP_.ERROR = {
	TRACKING_ID_REQUIRED: 'A valid Google Analytics tracking ID is required'
};

/**
 * Add to the parameters object all mandatory keys / values
 *
 * @param {{}} [parameters] - parameters for the Measurement Protocol, full list documented here:
 *                            https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @param {Properties} optUserProperties - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                         or simply to switch to another property store (Document / Script)
 *
 * @return {{}} - The updated parameters object
 */
AnalyticsMP_._addRequiredParameters = function (parameters, optPropertyStore, sentViaUrlFetch) {
	if (!parameters['tid']) {
		if (AnalyticsMP_._this['ANALYTICS_TRACKING_ID']) parameters['tid'] = AnalyticsMP_._this['ANALYTICS_TRACKING_ID'];
		else throw new Error(AnalyticsMP_.ERROR.TRACKING_ID_REQUIRED);
	}
	
	parameters['cid'] = getAnalyticsClientId(optPropertyStore);
	
	// The type of hit. Must be one of 'pageview', 'screenview', 'event', 'transaction', 'item', 'social', 'exception', 'timing'.
	// If none is provided, fall back on 'event'
	if (!parameters['t']) parameters['t'] = 'event';
	
	// if no event label is provided the event might not be visible everywhere - better to provide an empty string
	if (parameters['t'] == 'event' && !parameters['el']) parameters['el'] = '';
	
	parameters['v'] = '1';
	parameters['z'] = Math.floor(Math.random() * 10E7);
	
	if (sentViaUrlFetch) {
		// ds indicates the data source of the hit. Can be freely provided.
		if (!parameters['ds']) parameters['ds'] = 'urlFetch';
		
		// aip : Anonymize IP address - make sense as calls are made by Google servers
		parameters['aip'] = '1';
	}
	
	return parameters;
}