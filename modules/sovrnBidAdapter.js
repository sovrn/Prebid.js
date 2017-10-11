
/**
 *  WIP
 */

import * as utils from 'src/utils';
import { registerBidder } from 'src/adapters/bidderFactory';
import { BANNER } from 'src/mediaTypes';

const BIDDER_CODE = 'sovrn';
const URL = '//ap.lijit.com/rtb/bid';
const USER_PARAMS = ['tagid', 'bidfloor', 'dealid'];
const SOURCE = 'pbjs';
var bidid;

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: [BANNER],

  isBidRequestValid: function(bid) {
    return !!(bid.params.tagid && !isNaN(parseFloat(bid.params.tagid)) && isFinite(bid.params.tagid));
  },

  /**
   * Make a server request from the list of BidRequests.
   *
   * @param {BidRequest[]} bidRequests A non-empty list of bid requests which should be sent to the Server.
   * @return ServerRequest Info describing the request to the server.
   */
  buildRequests: function(bidReqs) {
    const domain = window.location.host;
    const page = window.location.pathname + location.search + location.hash;
    let sovrnImps = [];
    utils._each(bidReqs, function (bid) {
      bidid = bid.bidId;
      const tagId = utils.getBidIdParameter('tagid', bid.params);
      const bidFloor = utils.getBidIdParameter('bidfloor', bid.params);

      // BANNER OBJECT NOT USED.
      // THE WIDTH & HEIGHT ARE OVERRIDDEN BY THE WIDTH AND HEIGHT OF THE TAG.
      var imp =
        {
          id: bid.bidId,
          banner: {
            w: 1,
            h: 1,
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
    const payloadString = JSON.stringify(sovrnBidReq);
    return {
      method: 'POST',
      url: URL,
      data: payloadString,
    };
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
            requestId: bidid,
            bidderCode: spec.code,
            cpm: parseFloat(sovrnBid.price),
            width: parseInt(sovrnBid.w),
            height: parseInt(sovrnBid.h),
            creativeId: sovrnBid.id,
            dealId: sovrnBid.dealid || null,
            currency: 'USD',
            netRevenue: true,
            mediaType: BANNER,
            // ttl: 60,
            // referrer: utils.getTopWindowUrl(),
            // ad: decodeURIComponent(responseAd + responseNurl)
            ad: decodeURIComponent(`${sovrnBid.adm}<img src=${sovrnBid.nurl}>`)
          };
          bidmanager.addBidResponse(bidObj.placementCode, bidResponse);
          sovrnBidResponses.push(bidResponse);
        }
      })
    }
    return sovrnBidResponses;
  }
};

registerBidder(spec);
