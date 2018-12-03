# AnalyticsMP

This is a library for **Google Apps Script** projects. It provides methods to send data to Google Analytics from server side via the [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/v1/) (hence the name 'AnalyticsMP').

On client side, a [client ID](https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#clientId) is stored in the browsers cookies, "_so subsequent visits to the same site can be associated with the same user_". Here a server-side client ID is automatically generated and saved among the [User Properties](https://developers.google.com/apps-script/guides/properties) of your project. If you want to use Google Analytics both on server side and client side (from the HTML Service), it is advised to retrieve the client ID generated on server side (via the method getAnalyticsClientId() of this library) and reuse it on the client side so that all calls are performed with the same client ID for a given user. 

For more information read this blog post: 

[Google Apps Script: Tracking add-on usage with Google Analytics](https://cloud.google.com/blog/products/application-development/google-apps-script-tracking-add-on).


# Methods


## sendAnalyticsEvent(parameters, optPropertyStore)

Use this method to send events (default) or pageviews to Google Analytics. The list of all possible parameters is available here:

[https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters)


### Example

```JS

// The tracking ID / web property ID can be set as a global variable named ANALYTICS_TRACKING_ID or can be added in each call via the 'tid' parameter.

  var ANALYTICS_TRACKING_ID = 'UA-17845631-4';

  AnalyticsMP.sendAnalyticsEvent({

    'ec': 'Add-on installed',

    'ea': Session.getActiveUserLocale()

  });

```


### Parameters


<table>
  <tr>
   <td>Name
   </td>
   <td>Type
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>parameters
   </td>
   <td>Object
   </td>
   <td>Parameters for the Measurement Protocol, full list documented <a href="https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters">here</a>
   </td>
  </tr>
  <tr>
   <td>optPropertyStore
   </td>
   <td><a href="https://developers.google.com/apps-script/reference/properties/properties">Properties</a>
   </td>
   <td>Optional - useful to avoid making too many calls to PropertiesService.getUserProperties() or simply to switch to another property store (Document / Script)
   </td>
  </tr>
</table>



## getAnalyticsClientId(optPropertyStore)

Generate a unique user ID if none was previously stored in a PropertyService or return the existing stored UUID.

On server side, the client ID should always be the same for a given user. On client side it is usually stored as a cookie (and thus is usually browser / device related instead of user related).

Here it makes sense to save it as a User Property. This method can also be called from client side to use the same client ID on both server & client (useful for [session aggregation](https://support.google.com/analytics/answer/2731565?hl=en)).


### Parameters


<table>
  <tr>
   <td>Name
   </td>
   <td>Type
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>optPropertyStore
   </td>
   <td><a href="https://developers.google.com/apps-script/reference/properties/properties">Properties</a>
   </td>
   <td>Optional - useful to avoid making too many calls to PropertiesService.getUserProperties() or simply to switch to another property store (Document / Script)
   </td>
  </tr>
</table>



## generateAnalyticsTrackingUrl(parameters, optPropertyStore)

Build a tracking url, useful eg: to place a tracking beacon in emails sent:

https://developers.google.com/analytics/devguides/collection/protocol/v1/email


### Parameters


<table>
  <tr>
   <td>Name
   </td>
   <td>Type
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>parameters
   </td>
   <td>Object
   </td>
   <td>Parameters for the Measurement Protocol, full list documented <a href="https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters">here</a>
   </td>
  </tr>
  <tr>
   <td>optPropertyStore
   </td>
   <td><a href="https://developers.google.com/apps-script/reference/properties/properties">Properties</a>
   </td>
   <td>Optional - useful to avoid making too many calls to PropertiesService.getUserProperties() or simply to switch to another property store (Document / Script)
   </td>
  </tr>
</table>



# Setup

You can copy the code of this library in your own Google Apps Script project or reuse it as a [standard library](https://developers.google.com/apps-script/guides/libraries). In both cases, methods are called using the AnalyticsMP class / namespace, meaning you will use them exactly in the same way.

To install it as a library, use the following script ID and select the latest version:

`1Bw6UvY6EUalhtNbuwF6TyemIUHCxPZg-HoSHlUfbVbwYqvY9ZKu0mNMO`

To copy the code in your project, simply copy-past the content of this file in a new script file in your project:

[https://github.com/RomainVialard/AnalyticsMP/blob/master/src/AnalyticsMP.js](https://github.com/RomainVialard/AnalyticsMP/blob/master/src/AnalyticsMP.js)

It is recommended - but not mandatory - to also include in your project the [ErrorHandler](https://github.com/RomainVialard/ErrorHandler) library. If installed, it will automatically be used by AnalyticsMP methods to perform an Exponential backoff logic whenever it is needed.


# Warning

This library contains 3 methods directly available as functions and callable without using the AnalyticsMP class / namespace:



*   sendAnalyticsEvent()
*   getAnalyticsClientId()
*   generateAnalyticsTrackingUrl()

For this reason, if you copy the code in your project, make sure you don't have any other function with the exact same name.
