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

  buildRequests: function(bidRequests) {

  },

  interpretResponse: function(sovrnResponse) {
      let impidsWithBidBack = [];
      if (sovrnResponse && sovrnResponse.id && sovrnResponse.seatbid && sovrnResponse.seatbid.length !== 0 &&
        sovrnResponse.seatbid[0].bid && sovrnResponse.seatbid[0].bid.length !== 0) {
        sovrnResponse.seatbid[0].bid.forEach(function(sovrnBid) {
            let responseCPM;
            let placementCode = '';

            let id = sovrnBid.impid;
            let bid = {};
            let bidObj = utils.getBidRequest(id);
            if (bidObj) {

              // not sure if this is necessary
              placementCode = bidObj.placementCode;

              // This doesn't seem necessary
              bidObj.status = CONSTANTS.STATUS.GOOD;

              responseCPM = parseFloat(sovrnBid.price);
              if (responseCPM !== 0) {
                sovrnBid.placementCode = placementCode;
                sovrnBid.size = bidObj.sizes;
                let responseAd = sovrnBid.adm;

                // just switched to inline JS
                let responseNurl = `<img src=${sovrnBid.nurl}>`;

                // should be bidFactory.createBid(bidObj.status, bidObj);
                // the spec adapter utilizes a fxn called 'newBid'
                bid = bidFactory.createBid(1, bidObj);
                bid.creative_id = sovrnBid.id;

                // I don't think we actually need this at all
                // since it is passed into spec.code
                // bid.bidderCode = 'sovrn';
                // bid.bidderCode = BIDDER_CODE;

                bid.cpm = responseCPM;
                bid.ad = decodeURIComponent(responseAd + responseNurl);
                bid.width = parseInt(sovrnBid.w);
                bid.height = parseInt(sovrnBid.h);
                if (sovrnBid.dealid) {
                  bid.dealId = sovrnBid.dealid;
                }

                // This seems necessary based on appnexusAst
                bid.mediaType = 'banner';

                // This does not seem to be in appnexusAst
                bidmanager.addBidResponse(placementCode, bid);

                impidsWithBidBack.push(id);
              }
            }
          }
      }
      return impidsWithBidBack;
    },
};

registerBidder(spec);
