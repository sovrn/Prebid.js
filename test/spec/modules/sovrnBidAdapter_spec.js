// import {expect} from 'chai';
// import Adapter from 'modules/sovrnBidAdapter';
// import bidmanager from 'src/bidmanager';
// import adloader from 'src/adloader';
// var utils = require('src/utils');
//
// describe('sovrn adapter tests', function () {
//   let adapter;
//   const bidderRequest = {
//     bidderCode: 'sovrn',
//     bids: [
//       {
//         bidId: 'bidId1',
//         bidder: 'sovrn',
//         params: {
//           tagid: '315045',
//           bidfloor: 1.25
//         },
//         sizes: [[320, 50]],
//         placementCode: 'div-gpt-ad-12345-1'
//       },
//       {
//         bidId: 'bidId2',
//         bidder: 'sovrn',
//         params: {
//           tagid: '315046'
//         },
//         sizes: [[320, 50]],
//         placementCode: 'div-gpt-ad-12345-2'
//       },
//       {
//         bidId: 'bidId3',
//         bidder: 'sovrn',
//         params: {
//           tagid: '315047'
//         },
//         sizes: [[320, 50]],
//         placementCode: 'div-gpt-ad-12345-2'
//       },
//     ]
//   };
//
//   beforeEach(() => adapter = new Adapter());
//
//   describe('requestBids', function () {
//     let stubLoadScript;
//
//     beforeEach(() => {
//       stubLoadScript = sinon.stub(adloader, 'loadScript');
//     });
//
//     afterEach(() => {
//       stubLoadScript.restore();
//     });
//
//     it('exists and is a function', () => {
//       expect(adapter.callBids).to.exist.and.to.be.a('function');
//     });
//
//     it('loads the request script', function () {
//       adapter.callBids(bidderRequest);
//
//       let sovrnScript = decodeURIComponent(stubLoadScript.getCall(0).args[0]);
//       let firstExpectedImpObj = '{"id":"bidId1","banner":{"w":320,"h":50},"tagid":"315045","bidfloor":1.25}';
//       let secondExpectedImpObj = '{"id":"bidId2","banner":{"w":320,"h":50},"tagid":"315046","bidfloor":""}';
//
//       expect(sovrnScript).to.contain(firstExpectedImpObj);
//       expect(sovrnScript).to.contain(secondExpectedImpObj);
//     });
//   });
//
//   describe('sovrnResponse', function () {
//     let stubAddBidResponse;
//     let getRequestStub;
//     let getRequestsStub;
//
//     beforeEach(() => {
//       stubAddBidResponse = sinon.stub(bidmanager, 'addBidResponse');
//
//       getRequestStub = sinon.stub(utils, 'getBidRequest');
//       getRequestStub.withArgs(bidderRequest.bids[0].bidId).returns(bidderRequest.bids[0]);
//       getRequestStub.withArgs(bidderRequest.bids[1].bidId).returns(bidderRequest.bids[1]);
//       getRequestStub.withArgs(bidderRequest.bids[2].bidId).returns(bidderRequest.bids[2]);
//
//       getRequestsStub = sinon.stub(utils, 'getBidderRequestAllAdUnits');
//       getRequestsStub.returns(bidderRequest);
//     });
//
//     afterEach(() => {
//       stubAddBidResponse.restore();
//       getRequestStub.restore();
//       getRequestsStub.restore();
//     });
//
//     it('should exist and be a function', function () {
//       expect($$PREBID_GLOBAL$$.sovrnResponse).to.exist.and.to.be.a('function');
//     });
//
//     it('should add empty bid responses if no bids returned', function () {
//       let response = {
//         'id': '54321',
//         'seatbid': []
//       };
//
//       $$PREBID_GLOBAL$$.sovrnResponse(response);
//
//       let bidPlacementCode1 = stubAddBidResponse.getCall(0).args[0];
//       let bidObject1 = stubAddBidResponse.getCall(0).args[1];
//       let bidPlacementCode2 = stubAddBidResponse.getCall(1).args[0];
//       let bidObject2 = stubAddBidResponse.getCall(1).args[1];
//       let bidPlacementCode3 = stubAddBidResponse.getCall(2).args[0];
//       let bidObject3 = stubAddBidResponse.getCall(2).args[1];
//
//       expect(bidPlacementCode1).to.equal('div-gpt-ad-12345-1');
//       expect(bidObject1.getStatusCode()).to.equal(2);
//       expect(bidObject1.bidderCode).to.equal('sovrn');
//
//       expect(bidPlacementCode2).to.equal('div-gpt-ad-12345-2');
//       expect(bidObject2.getStatusCode()).to.equal(2);
//       expect(bidObject2.bidderCode).to.equal('sovrn');
//
//       expect(bidPlacementCode3).to.equal('div-gpt-ad-12345-2');
//       expect(bidObject3.getStatusCode()).to.equal(2);
//       expect(bidObject3.bidderCode).to.equal('sovrn');
//
//       stubAddBidResponse.calledThrice;
//     });
//
//     it('should add a bid response for bids returned and empty bid responses for the rest', function () {
//       let response = {
//         'id': '54321111',
//         'seatbid': [ {
//           'bid': [ {
//             'id': '1111111',
//             'impid': 'bidId2',
//             'price': 0.09,
//             'nurl': 'http://url',
//             'adm': 'ad-code',
//             'h': 250,
//             'w': 300,
//             'dealid': 'ADEAL123',
//             'ext': { }
//           } ]
//         } ]
//       };
//
//       $$PREBID_GLOBAL$$.sovrnResponse(response);
//
//       let bidPlacementCode1 = stubAddBidResponse.getCall(0).args[0];
//       let bidObject1 = stubAddBidResponse.getCall(0).args[1];
//       let bidPlacementCode2 = stubAddBidResponse.getCall(1).args[0];
//       let bidObject2 = stubAddBidResponse.getCall(1).args[1];
//       let bidPlacementCode3 = stubAddBidResponse.getCall(2).args[0];
//       let bidObject3 = stubAddBidResponse.getCall(2).args[1];
//
//       expect(bidPlacementCode1).to.equal('div-gpt-ad-12345-2');
//       expect(bidObject1.getStatusCode()).to.equal(1);
//       expect(bidObject1.bidderCode).to.equal('sovrn');
//       expect(bidObject1.creative_id).to.equal('1111111');
//       expect(bidObject1.cpm).to.equal(0.09);
//       expect(bidObject1.height).to.equal(250);
//       expect(bidObject1.width).to.equal(300);
//       expect(bidObject1.ad).to.equal('ad-code<img src="http://url">');
//       expect(bidObject1.adId).to.equal('bidId2');
//       expect(bidObject1.dealId).to.equal('ADEAL123');
//
//       expect(bidPlacementCode2).to.equal('div-gpt-ad-12345-1');
//       expect(bidObject2.getStatusCode()).to.equal(2);
//       expect(bidObject2.bidderCode).to.equal('sovrn');
//
//       expect(bidPlacementCode3).to.equal('div-gpt-ad-12345-2');
//       expect(bidObject3.getStatusCode()).to.equal(2);
//       expect(bidObject3.bidderCode).to.equal('sovrn');
//
//       stubAddBidResponse.calledThrice;
//     });
//   });
// });

// WIP

import { expect } from 'chai';
import { spec } from 'modules/sovrnBidAdapter';
import { newBidder } from 'src/adapters/bidderFactory';
import { REPO_AND_VERSION } from 'src/constants';
import bidmanager from 'src/bidmanager';
import adloader from 'src/adloader';
var utils = require('src/utils');

const ENDPOINT = `//ap.lijit.com/rtb/bid?src=${REPO_AND_VERSION}`;

describe('sovrnBidAdapter', function() {
  const adapter = newBidder(spec);

  describe('isBidRequestValid', () => {
    let bid = {
      'bidder': 'sovrn',
      'params': {
        'tagid': '403370'
      },
      'adUnitCode': 'adunit-code',
      'sizes': [
        [300, 250]
      ],
      'bidId': '30b31c1838de1e',
      'bidderRequestId': '22edbae2733bf6',
      'auctionId': '1d1a030790a475',
    };

    it('should return true when required params found', () => {
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when tagid not passed correctly', () => {
      bid.params.tagid = 'ABCD';

      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should returen false when require params are not passed', () => {
      let bid = Object.assign({}, bid);
      bid.params = {};
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });
  });

  describe('buildRequests', () => {
    let bidRequests = [{
      'bidder': 'sovrn',
      'params': {
        'tagid': '403370'
      },
      'adUnitCode': 'adunit-code',
      'sizes': [
        [300, 250]
      ],
      'bidId': '30b31c1838de1e',
      'bidderRequestId': '22edbae2733bf6',
      'auctionId': '1d1a030790a475',
    }];

    it('sends bid request to our endpoint via POST', () => {
      const request = spec.buildRequests(bidRequests);
      expect(request.url).to.equal(ENDPOINT);
      expect(request.method).to.equal('POST');
    });
  });

  describe('interpretResponse', () => {
    let response = {
      'id': '37386aade21a71',
      'seatbid': [{
        'bid': [{
          'id': 'a_403370_332fdb9b064040ddbec05891bd13ab28',
          'impid': '263c448586f5a1',
          'price': 0.45882675,
          'nurl': 'http://vap3ewr1.lijit.com/rtb/impression?bannerid=41635&campaignid=1802&rtb_tid=7e516d8a-a496-45a9-8d39-7ac5abf539bf&rpid=27&seatid=1178&zoneid=403370&cb=16051915&tid=a_403370_332fdb9b064040ddbec05891bd13ab28',
          'adm': '<!-- Creative -->',
          'h': 90,
          'w': 728
        }]
      }]
    };

    it('should get the correct bid response', () => {
      let expectedResponse = [{
        'requestId': '263c448586f5a1',
        'bidderCode': 'sovrn',
        'cpm': 0.45882675,
        'creative_id': 'a_403370_332fdb9b064040ddbec05891bd13ab28',
        'dealId': null,
        'currency': 'USD',
        'netRevenue': true,
        'width': 728,
        'height': 90,
        'ad': decodeURIComponent('<!-- Creative -->' +
          '<img src=' +
            'http://vap3ewr1.lijit.com/rtb/impression?bannerid=41635&campaignid=1802&rtb_tid=7e516d8a-a496-45a9-8d39-7ac5abf539bf&rpid=27&seatid=1178&zoneid=403370&cb=16051915&tid=a_403370_332fdb9b064040ddbec05891bd13ab28' + '>'),
        'mediaType': 'banner'
      }];

      let result = spec.interpretResponse(response);
      console.log(result[0]);
      console.log(expectedResponse[0]);
      expect(Object.keys(result[0])).to.deep.equal(Object.keys(expectedResponse[0]));
    });

    it('handles empty bid response', () => {
      let response = {
        'id': '37386aade21a71',
        'seatbid': []
      };
      let result = spec.interpretResponse(response);
      expect(result.length).to.equal(0);
    });
  });
});
