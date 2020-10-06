/****************************************************************
 * AnalyticsMP library
 * https://github.com/RomainVialard/AnalyticsMP
 *
 * Make calls to the Google Analytics Measurement Protocol
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/
 *
 * Note: Better to keep "Analytics" in method names
 * as they are available outside of the AnalyticsMP namespace
 * 
 * sendAnalyticsEvent()
 * getAnalyticsClientId()
 * generateAnalyticsTrackingUrl()
 *****************************************************************/


/**
 * Send Analytics event via the UrlFetchApp service
 *
 * @param {AnalyticsMP_.ParameterRef} parameters - parameters for the Measurement Protocol, full list documented here:
 *                                                 https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @param {PropertiesService.Properties} optPropertyStore - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                                          or simply to switch to another property store (Document / Script)
 */
function sendAnalyticsEvent(parameters, optPropertyStore) {
  var options = {
    method: 'post',
    payload: AnalyticsMP_._addRequiredParameters(parameters, optPropertyStore, true)
  };

  // if the ErrorHandler library is loaded, use it (https://github.com/RomainVialard/ErrorHandler)
  if (this['ErrorHandler']) {
    ErrorHandler.urlFetchWithExpBackOff('https://www.google-analytics.com/collect', options);
  }
  else {
    UrlFetchApp.fetch('https://www.google-analytics.com/collect', options);
  }
}

/**
 * Build a tracking url, useful eg: to place a tracking beacon in emails sent
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/email
 *
 * @param {AnalyticsMP_.ParameterRef} [parameters] - parameters for the Measurement Protocol, full list documented here:
 *                                                   https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @param {PropertiesService.Properties} optPropertyStore - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                                          or simply to switch to another property store (Document / Script)
 */
function generateAnalyticsTrackingUrl(parameters, optPropertyStore) {
  var params = AnalyticsMP_._addRequiredParameters(parameters, optPropertyStore);

  var urlParams = [];
  for (var key in params) {
    // noinspection JSUnfilteredForInLoop
    urlParams.push(key + (params[key] === '' ? '' : '=' + encodeURI(params[key])));
  }

  return 'https://www.google-analytics.com/collect?' + urlParams.join('&amp;');
}

/**
 * Generate a unique user ID if none was previously stored in a PropertyService
 * or return the existing stored UUID
 * 
 * The client ID should always be the same for a given user
 * On client side it is usually stored as a cookie
 * Here it makes sense to save it as a User Property
 * This method can also be called from client side
 * to use the same client ID on both server & client (useful for session aggregation)
 *
 * @param {PropertiesService.Properties} optPropertyStore - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                         or simply to switch to another property store (Document / Script)
 * 
 * @return {string} Unique User ID
 */
function getAnalyticsClientId(optPropertyStore) {
  // if client ID is saved in memory, avoid making new call to the property store
  if (AnalyticsMP_.clientId) return AnalyticsMP_.clientId;

  // Get default store if not provided
  optPropertyStore = optPropertyStore || PropertiesService.getUserProperties();

  // try to get client ID from user properties
  AnalyticsMP_.clientId = optPropertyStore.getProperty('clientId');

  if (!AnalyticsMP_.clientId) {
    AnalyticsMP_.clientId = Utilities.getUuid();
    optPropertyStore.setProperty('clientId', AnalyticsMP_.clientId);
  }

  return AnalyticsMP_.clientId;
}


// noinspection JSUnusedGlobalSymbols, ThisExpressionReferencesGlobalObjectJS
this['AnalyticsMP'] = {
  // Add local alias to run the library as normal code
  sendAnalyticsEvent: sendAnalyticsEvent,
  getAnalyticsClientId: getAnalyticsClientId,
  generateAnalyticsTrackingUrl: generateAnalyticsTrackingUrl,
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
 * @param {AnalyticsMP_.ParameterRef} parameters - parameters for the Measurement Protocol, full list documented here:
 *                                                 https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @param {PropertiesService.Properties} optPropertyStore - useful to avoid making too many calls to PropertiesService.getUserProperties()
 *                                                          or simply to switch to another property store (Document / Script)
 *
 * @param {boolean} [sentViaUrlFetch] - set dataSource as UrlFetch or not
 * 
 * @return {AnalyticsMP_.ParameterRef} - The updated parameters object
 */
AnalyticsMP_._addRequiredParameters = function (parameters, optPropertyStore, sentViaUrlFetch) {
  var params = JSON.parse(JSON.stringify(parameters));

  if (!params['tid']) {
    if (!AnalyticsMP_._this['ANALYTICS_TRACKING_ID']) throw new Error(AnalyticsMP_.ERROR.TRACKING_ID_REQUIRED);

    params['tid'] = AnalyticsMP_._this['ANALYTICS_TRACKING_ID'];
  }

  params['cid'] = getAnalyticsClientId(optPropertyStore);

  // The type of hit. Must be one of 'pageview', 'screenview', 'event', 'transaction', 'item', 'social', 'exception', 'timing'.
  // If none is provided, fall back on 'event'
  params['t'] = params['t'] || 'event';

  // if no event label is provided the event might not be visible everywhere - better to provide an empty string
  params['t'] === 'event' && !params['el'] && (params['el'] = '');

  params['v'] = '1';
  params['z'] = Math.floor(Math.random() * 10E7);

  if (sentViaUrlFetch) {
    // ds indicates the data source of the hit. Can be freely provided.
    params['ds'] = params['ds'] || 'urlFetch';

    // aip : Anonymize IP address - make sense as calls are made by Google servers
    params['aip'] = '1';
  }

  return params;
};


//</editor-fold>


/**
 * See all property available here: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * @typedef {{}} AnalyticsMP_.ParameterRef
 *
 * General properties
 * @property {string} v - Protocol Version, set to "1"
 * @property {string} tid - Tracking ID / Web Property ID
 *
 * @property {boolean} [aip] - Anonymize IP
 * @property {string} [ds] - Data Source
 * @property {number} [qt] - Queue Time
 * @property {string} [z] - Cache Buster
 *
 * User
 * @property {string} [cid] - Client ID
 * @property {string} [uid] - User ID
 *
 * Hit
 * @property {'pageview' || 'screenview' || 'event' || 'transaction' || 'item' || 'social' || 'exception' || 'timing'} [t] - Hit type
 * @property {boolean} [ni] - Non-Interaction Hit
 *
 * And a lot more properties (see online Google Analytics documentation for details
 */
