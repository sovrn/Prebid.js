// var events = require('src/events');
import CONSTANTS from 'src/constants.json';
import adapter from 'src/AnalyticsAdapter';
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
let highestCpms = {};
let eventCollectionByDivId = {};
let jsonsToSendToHeaderLog = {};
let winExists = false;
const resultCodes = {
  lose: 'L',
  didNotBid: 'D',
  win: 'W',
  loserOverride: 'LO',
  winnerOverride: 'WO',
  timeOut: 'T',
  missingBid: 'M',
};

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
  organizeEventCollectionByDivId();
  Object.keys(eventCollectionByDivId).forEach(function(key) {
    if (!jsonsToSendToHeaderLog[key]) {
      jsonsToSendToHeaderLog[key] = createBasicJsonLog(key);
      eventCollectionByDivId[key].forEach(function(event) {
        addBidsRequestedDataToJson(key, event);
      });
      eventCollectionByDivId[key].forEach(function(event) {
        addBidResponseDataToJson(key, event);
      });
    }
  });
//  console.log(jsonsToSendToHeaderLog);
}

function organizeEventCollectionByDivId() {
  eventStack.events.forEach(function(element) {
    if (element.eventType == CONSTANTS.EVENTS.AUCTION_INIT) {
      getOverallTimeout(element);
    } else if (element.eventType == CONSTANTS.EVENTS.BID_REQUESTED) {
      addBidRequestedEventToCollection(element);
    } else if (element.args) {
      if (element.eventType == CONSTANTS.EVENTS.BID_RESPONSE) {
        setTimeToRespond(element, element.args.adUnitCode);
        setHighestCpm(element);
      }
      addEventToCollection(element.args.adUnitCode, element);
    } else if (element.eventType == CONSTANTS.EVENTS.BID_WON) {
      winExists = true;
      console.log('win exists', winExists);
    }
  });
}

function addBidsRequestedDataToJson(divIdKey, event) {
  if (event && (event.eventType == CONSTANTS.EVENTS.BID_REQUESTED)) {
    let formattedBidderRequestArr = createBidderObjectFromBidRequestEvent(divIdKey, event);
    formattedBidderRequestArr.forEach(function (bidReq) {
      jsonsToSendToHeaderLog[divIdKey].b.push(bidReq);
    });
  };
}

function addBidResponseDataToJson(divIdKey, event) {
  if (event && (event.eventType == CONSTANTS.EVENTS.BID_RESPONSE)) {
    jsonsToSendToHeaderLog[divIdKey].b.forEach(function (bid) {
      console.log(bid);
    })
  };
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
      addEventToCollection(bid.adUnitCode, bidRequestedEvent);
    });
  }
}

function setTimeToRespond(bidResponseEvent, adUnitCode) {
  if (bidResponseEvent && bidResponseEvent.args && bidResponseEvent.args.timeToRespond && adUnitCode) {
    if (!longestResponseTimes[adUnitCode]) {
      longestResponseTimes[adUnitCode] = bidResponseEvent.args.timeToRespond
    } else if (bidResponseEvent.args.timeToRespond > longestResponseTimes[adUnitCode]) {
      longestResponseTimes[adUnitCode] = bidResponseEvent.args.timeToRespond;
    }
  }
}

function setHighestCpm(bidResponseEvent) {
  if (bidResponseEvent && bidResponseEvent.args && bidResponseEvent.args.cpm && bidResponseEvent.args.adUnitCode) {
    let key = bidResponseEvent.args.adUnitCode;
    if (!highestCpms[key]) {
      highestCpms[key] = bidResponseEvent.args.cpm;
    } else if (bidResponseEvent.args.cpm > highestCpms[key]) {
      highestCpms[key] = bidResponseEvent.args.cpm;
    }
  }
}

function addEventToCollection(adUnitCode, event) {
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
b: bidder response array
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

/*
id: bidder id (e.g.: sovrn, pubmatic, rubicon, etc)
p: bidder params
st: start timestamp
br: bid response object
  cpm: cpm
  rc: Result code
    L - lose
    W - win
    D - did not bid
    LO - loser override (prebid win beaten by ad server)
    T - time out
  ec: IGNORE
  et: end timestamp
  tbt: time to respond
  pb: price bucket increments (e.g.: high, medium)
  sm: status message
*/
function createBidderObjectFromBidRequestEvent(key, event) {
  if (!event || !event.args || !event.args.bids) {
    return;
  }
  let bidderObject = [];
  event.args.bids.forEach(function (bid) {
    if (bid.adUnitCode == key) {
      let bidObj = {};
      bidObj.id = bid.bidder;
      bidObj.p = bid.params;
      bidObj.br = {};
      bidObj.br.cpm = 0;
      bidObj.br.rc = resultCodes.didNotBid;
      bidObj.br.ec = 29;
      bidObj.bidId = bid.bidId;
      // Not sure where to get price bucket from
      // bidObj.br.pb = ?
      bidderObject.push(bidObj);
    }
  });
  return bidderObject;
}
// function createBidderObjectFromBidResponseEvent(event) {
//   let bidderResponseObject = {};
//   if(event.args) {
//     bidderResponseObject.id = (event.args.bidderCode) ? event.args.bidderCode : event.args.bidder;
//     // DONT HAVE P WITHOUT BID_REQUEST event. AARRRGGGGHHH
//     bidderResponseObject.st = event.args.requestTimestamp;
//     bidderResponseObject.et = event.args.responseTimestamp;
//     bidderResponseObject.br = {};
//     bidderResponseObject.br.cpm = event.args.cpm;
//     // Either LO or L
//     bidderResponseObject.rc
//   }
//   return bidderResponseObject;
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
