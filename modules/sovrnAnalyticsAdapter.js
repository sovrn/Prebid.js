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
let timeout = 0;
let longestResponseTimes = {};
let eventCollectionByDivId = {};

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
  organizeEventCollectionInfo();
  Object.keys(eventCollectionByDivId).forEach(function(key) {
    console.log(key, eventCollectionByDivId[key]);
    let jsonToSendToHeaderLog = createBasicJsonLog(key);
    console.log(jsonToSendToHeaderLog);
    // eventCollectionByDivId[key].forEach(function (event) {
    //   if (event.eventType == CONSTANTS.BID_RESPONSE) {
    //
    //   }
    // });
  });
}

function organizeEventCollectionInfo() {
  eventStack.events.forEach(function(element) {
    if (element.eventType == CONSTANTS.EVENTS.AUCTION_INIT) {
      getOverallTimeout(element);
    } else if (element.eventType == CONSTANTS.EVENTS.BID_REQUESTED) {
      addBidRequestedEventToCollection(element);
    } else if (element.args) {
      if (element.eventType == CONSTANTS.EVENTS.BID_RESPONSE) {
        setTimeToRespond(element, element.args.adUnitCode);
      }
      addEventToCollection(element, element.args.adUnitCode);
    }
  });
}

function getOverallTimeout(auctionInitEvent) {
  if (auctionInitEvent.args && auctionInitEvent.args.timeout) {
    timeout = auctionInitEvent.args.timeout;
  }
}

function addBidRequestedEventToCollection(bidRequestedEvent) {
  if (bidRequestedEvent.args && bidRequestedEvent.args.bids &&
    bidRequestedEvent.args.bids.length) {
    bidRequestedEvent.args.bids.forEach(function(bid) {
      addEventToCollection(bidRequestedEvent, bid.adUnitCode);
    });
  }
}

function setTimeToRespond(bidResponseEvent, adUnitCode) {
  if (bidResponseEvent.args.timeToRespond && adUnitCode) {
    if (!longestResponseTimes[adUnitCode]) {
      longestResponseTimes[adUnitCode] = bidResponseEvent.args.timeToRespond
    } else if (bidResponseEvent.args.timeToRespond > longestResponseTimes[adUnitCode]) {
      longestResponseTimes[adUnitCode] = bidResponseEvent.args.timeToRespond;
    }
  }
}

function addEventToCollection(event, adUnitCode) {
  if (adUnitCode) {
    if (!eventCollectionByDivId[adUnitCode]) {
      eventCollectionByDivId[adUnitCode] = [];
    }
    eventCollectionByDivId[adUnitCode].push(event);
  }
}

/*
did: ad unit code
tid: tag ID from Sovrn winning bid response, empty if Sovrn did not win auction
fp: floor price from Sovrn request params, zero if not sent as param
h: height - The height from the winning bid response.
w: width - The width from the winning bid response.
trid: one of the Transaction IDs from sovrn bid response if provided (regardless of winner)
pid: IGNORE
t: elapsed Time for auction (across all bidders)
b: bidder information
sid: the Sovrn configuration ID
*/
function createBasicJsonLog(adUnitCode) {
  return {
    did: adUnitCode,
    tid: '',
    fp: 0,
    sfp: 0,
    h: 0,
    w: 0,
    trid: '',
    pid: '',
    t: (longestResponseTimes[adUnitCode] && longestResponseTimes[adUnitCode] < timeout) ? longestResponseTimes[adUnitCode] : timeout,
    b: [],
    sid: eventStack.scriptId,
  };
}

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
