// var events = require('src/events');
import CONSTANTS from 'src/constants.json';
import adapter from 'src/AnalyticsAdapter';
// const utils = require('src/utils');
import adaptermanager from 'src/adaptermanager';

/****
 * Sovrn Analytics
 * Contact: sovrnoss@sovrn.com
 *
 * For testing:
 *
 pbjs.enableAnalytics({
  provider: 'sovrn',
  options: {
    scriptId: 123,
  }
 });
 */

let defaultUrl = document.location.protocol + '//ap.lijit.com/headerlog';
const analyticsType = 'endpoint';
let eventStack = {scriptId: '', events: []};

let sovrnAnalytics = Object.assign(adapter(
  {
    defaultUrl,
    analyticsType
  }),
{
  // Override AnalyticsAdapter functions by supplying custom methods
  track({eventType, args}) {
    sendEvent(eventType, args);
  }
});

function buildEventStack(scriptId) {
  eventStack.scriptId = scriptId;
}

function pushEvent(event) {
  eventStack.events.push(event);
}

function sendEvent(eventType, data) {
  let event = {
    eventType: eventType,
    args: data,
  };
  pushEvent(event);
  if (eventType == CONSTANTS.EVENTS.AUCTION_END) {
    sendLogs();
  }
}

function sendLogs() {
  // TODO: maybe combine the following two function
  // both could loop through event stack
  let timeOut = getTimeOutFromEventStack();
  let eventCollectionByDivId = createEventCollectionByDivId();
  Object.keys(eventCollectionByDivId).forEach(function(key) {
    console.log(key, eventCollectionByDivId[key]);
    eventCollectionByDivId[key].forEach(function (event) {
      if (event.eventType == CONSTANTS.BID_RESPONSE) {

      }
    });
  });
}

function getTimeOutFromEventStack() {
  eventStack.events.forEach(function(element) {
    if (element.eventType == CONSTANTS.AUCTION_INIT) {
      if (element.args && element.args.timeout) {
        return element.args.timeout;
      }
    }
  });
}

//
// function getTimeToRespond(bidResponseEvent) {
//   if (bidResponseEvent && bidResponseEvent.args && bidResponseEvent.args.time)
// }

function createEventCollectionByDivId() {
  let eventCollectionByDivId = {};
  console.log(eventStack);
  eventStack.events.forEach(function(element) {
    if (element.args && element.args.adUnitCode) {
      if (!eventCollectionByDivId[element.args.adUnitCode]) {
        eventCollectionByDivId[element.args.adUnitCode] = [];
      }
      eventCollectionByDivId[element.args.adUnitCode].push(element);
    } else {
      // The bid_requested event can contain multiple div_ids
      // It contains all bids requested for a partner
      if (element.eventType == CONSTANTS.EVENTS.BID_REQUESTED &&
      element.args && element.args.bids && element.args.bids.length) {
        element.args.bids.forEach(function(bid) {
          if (bid.adUnitCode) {
            if (!eventCollectionByDivId[bid.adUnitCode]) {
              eventCollectionByDivId[bid.adUnitCode] = [];
            }
            eventCollectionByDivId[bid.adUnitCode].push(element);
          }
        })
      }
    }
  });
  return eventCollectionByDivId
}

// function createBasicJsonLog(adUnitCode) {
//   return {
//     did: adUnitCode,
//     tid: '',
//     fp: 0,
//     sfp: 0,
//     h: 0,
//     w: 0,
//     trid: '',
//     pid: '',
//     t: 0,
//     b: [],
//     sid: eventStack.scriptId,
//   };
// }

sovrnAnalytics.adapterEnableAnalytics = sovrnAnalytics.enableAnalytics;

sovrnAnalytics.enableAnalytics = function (config) {
  let scriptId = '';
  if (config && config.options && config.options.scriptId) {
    scriptId = config.options.scriptId;
  }
  buildEventStack(scriptId);
  sovrnAnalytics.adapterEnableAnalytics(config);
};

adaptermanager.registerAnalyticsAdapter({
  adapter: sovrnAnalytics,
  code: 'sovrn'
});
