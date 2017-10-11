/*
var CONSTANTS = require('src/constants.json');
var utils = require('src/utils.js');
var bidfactory = require('src/bidfactory.js');
var bidmanager = require('src/bidmanager.js');
var adloader = require('src/adloader');
var adaptermanager = require('src/adaptermanager');


var SovrnAdapter = function SovrnAdapter() {
  var sovrnUrl = 'ap.lijit.com/rtb/bid';
  function _callBids(params) {
    var sovrnBids = params.bids || [];
    _requestBids(sovrnBids);
  }
  function _requestBids(bidReqs) {
    var domain = window.location.host;
    var page = window.location.pathname + location.search + location.hash;
    var sovrnImps = [];
    utils._each(bidReqs, function (bid) {
      var tagId = utils.getBidIdParameter('tagid', bid.params);
      var bidFloor = utils.getBidIdParameter('bidfloor', bid.params);
      var adW = 0;
      var adH = 0;
      var bidSizes = Array.isArray(bid.params.sizes) ? bid.params.sizes : bid.sizes;
      var sizeArrayLength = bidSizes.length;
      if (sizeArrayLength === 2 && typeof bidSizes[0] === 'number' && typeof bidSizes[1] === 'number') {
        adW = bidSizes[0];
        adH = bidSizes[1];
      } else {
        adW = bidSizes[0][0];
        adH = bidSizes[0][1];
      }
      var imp =
        {
          id: bid.bidId,
          banner: {
            w: adW,
            h: adH
          },
          tagid: tagId,
          bidfloor: bidFloor
        };
      sovrnImps.push(imp);
    });
    var sovrnBidReq = {
      id: utils.getUniqueIdentifierStr(),
      imp: sovrnImps,
      site: {
        domain: domain,
        page: page
      }
    };
    var scriptUrl = '//' + sovrnUrl + '?callback=window.$$PREBID_GLOBAL$$.sovrnResponse' +
      '&src=' + CONSTANTS.REPO_AND_VERSION +
      '&br=' + encodeURIComponent(JSON.stringify(sovrnBidReq));
    adloader.loadScript(scriptUrl);
  }
  function addBlankBidResponses(impidsWithBidBack) {
    var missing = utils.getBidderRequestAllAdUnits('sovrn');
    if (missing) {
      missing = missing.bids.filter(bid => impidsWithBidBack.indexOf(bid.bidId) < 0);
    } else {
      missing = [];
    }
    missing.forEach(function (bidRequest) {
      var bid = {};
      bid = bidfactory.createBid(2, bidRequest);
      bid.bidderCode = 'sovrn';
      bidmanager.addBidResponse(bidRequest.placementCode, bid);
    });
  }
  $$PREBID_GLOBAL$$.sovrnResponse = function (sovrnResponseObj) {
    var impidsWithBidBack = [];
    if (sovrnResponseObj && sovrnResponseObj.id && sovrnResponseObj.seatbid && sovrnResponseObj.seatbid.length !== 0 &&
      sovrnResponseObj.seatbid[0].bid && sovrnResponseObj.seatbid[0].bid.length !== 0) {
      sovrnResponseObj.seatbid[0].bid.forEach(function (sovrnBid) {
        var responseCPM;
        var placementCode = '';
        var id = sovrnBid.impid;
        var bid = {};
        var bidObj = utils.getBidRequest(id);
        if (bidObj) {
          placementCode = bidObj.placementCode;
          bidObj.status = CONSTANTS.STATUS.GOOD;
          responseCPM = parseFloat(sovrnBid.price);
          if (responseCPM !== 0) {
            sovrnBid.placementCode = placementCode;
            sovrnBid.size = bidObj.sizes;
            var responseAd = sovrnBid.adm;
            var responseNurl = '<img src="' + sovrnBid.nurl + '">';
            bid = bidfactory.createBid(1, bidObj);
            bid.creative_id = sovrnBid.id;
            bid.bidderCode = 'sovrn';
            bid.cpm = responseCPM;
            bid.ad = decodeURIComponent(responseAd + responseNurl);
            bid.width = parseInt(sovrnBid.w);
            bid.height = parseInt(sovrnBid.h);
            if (sovrnBid.dealid) {
              bid.dealId = sovrnBid.dealid;
            }
            bidmanager.addBidResponse(placementCode, bid);
            impidsWithBidBack.push(id);
          }
        }
      });
    }
    addBlankBidResponses(impidsWithBidBack);
  };
  return {
    callBids: _callBids
  };
};
adaptermanager.registerBidAdapter(new SovrnAdapter(), 'sovrn');
module.exports = SovrnAdapter;
*/

/**
 *  WIP
 */

import { Renderer } from 'src/Renderer';
import * as utils from 'src/utils';
import { registerBidder } from 'src/adapters/bidderFactory';

const BIDDER_CODE = 'sovrn';
const URL = '//ap.lijit.com/rtb/bid';
const SUPPORTED_AD_TYPES = ['banner'];
const USER_PARAMS = ['tagid', 'bidfloor', 'dealid'];
const SOURCE = 'pbjs';

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: SUPPORTED_AD_TYPES,

  isBidRequestValid: function(bid) {
    return !!(bid.params.tagid && !isNaN(parseFloat(bid.params.tagid)) && isFinite(bid.params.tagid));
  },

  /**
   * Make a server request from the list of BidRequests.
   *
   * @param {BidRequest[]} bidRequests A non-empty list of bid requests which should be sent to the Server.
   * @return ServerRequest Info describing the request to the server.
   */
  buildRequests: function(bidRequests) {
    return {
      method: 'POST'
      url: URL,
      data: sovrnBidReq
    }
  },

  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param {*} sovrnResponse A successful response from Sovrn.
   * @return {Bid[]} An array of bids which were nested inside the server.
  */
  // const bidResponse = {
  //     requestId: bidRequest.bidId, // bidObj.placementCode
  //     bidderCode: spec.code,       // BIDDER_CODE
  //     cpm: CPM,                    // parseFloat(sovrnBid.price);
  //     width: WIDTH,                // parseInt(sovrnBid.w);
  //     height: HEIGHT,              // parseInt(sovrnBid.h);
  //     creativeId: CREATIVE_ID,     // sovrnBid.id;
  //     dealId: DEAL_ID,             // sovrnBid.dealid
  //     currency: CURRENCY,          // "USD"
  //     netRevenue: true,            // true
  //     ttl: TIME_TO_LIVE,           // 60?
  //     referrer: REFERER,           //
  //     ad: CREATIVE_BODY            // decodeURIComponent(responseAd + responseNurl)
  // };
  interpretResponse: function(sovrnResponse) {
    // Array to push the sovrn bids to
    let sovrnBidResponses = [];

    // Not sure which of these are still necessary
    // since it is only passed successful responses
    if (sovrnResponse && sovrnResponse.id && sovrnResponse.seatbid && sovrnResponse.seatbid.length !== 0 &&
      sovrnResponse.seatbid[0].bid && sovrnResponse.seatbid[0].bid.length !== 0) {
      sovrnResponse.seatbid[0].bid.forEach(sovrnBid => {

        let bidObj = utils.getBidRequest(sovrnBid.impid);

        if (bidObj && sovrnBid.price && sovrnBid.price !== 0) {

          const bidResponse = {
            requestId: bidObj.placementCode,
            bidderCode: spec.code,
            cpm: parseFloat(sovrnBid.price),
            width: parseInt(sovrnBid.w),
            height: parseInt(sovrnBid.h),
            creativeId: sovrnBid.id,
            dealId: sovrnBid.dealid || null,
            currency: "USD",
            netRevenue: true,
            // ttl: 60,
            // referrer: utils.getTopWindowUrl(),
            // ad: decodeURIComponent(responseAd + responseNurl)
            ad: decodeURIComponent(`${sovrnBid.adm}<img src=${sovrnBid.nurl}>`)
          }
          sovrnBidResponses.push(bidResponse);
        }
      })
    }
    return sovrnBidResponses;
  }
};

registerBidder(spec);
