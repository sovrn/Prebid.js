import adapter from 'src/AnalyticsAdapter'
import adaptermanager from 'src/adaptermanager'
import CONSTANTS from 'src/constants.json'
import {ajaxBuilder} from 'src/ajax'
import * as utils from 'src/utils'
import {config} from 'src/config'
import find from 'core-js/library/fn/array/find'
import includes from 'core-js/library/fn/array/includes'

const ajax = ajaxBuilder(0)

const {
  EVENTS: {
    AUCTION_END,
    BID_REQUESTED,
    BID_ADJUSTMENT,
    BID_RESPONSE,
    BID_WON
  }
} = CONSTANTS

let pbaUrl = 'https://pba.aws.lijit.com/analytics'
let currentAuctions = {};
const analyticsType = 'endpoint'

let sovrnAnalyticsAdapter = Object.assign(adapter({url: pbaUrl, analyticsType}), {
  track({ eventType, args }) {
    try {
      if (eventType === BID_WON) {
        new BidWinner(this.affiliateId, args).send();
        return
      }
      if (args.auctionId && currentAuctions[args.auctionId] === 'complete') {
        throw new Error('Event Recieved after Auction Close Auction Id ' + args.auctionId)
      }
      if (args.auctionId && currentAuctions[args.auctionId] === undefined) {
        currentAuctions[args.auctionId] = new AuctionData(this.affiliateId, args.auctionId)
      }
      switch (eventType) {
        case BID_REQUESTED:
          currentAuctions[args.auctionId].bidRequested(args)
          break
        case BID_ADJUSTMENT:
          currentAuctions[args.auctionId].originalBid(args)
          break
        case BID_RESPONSE:
          currentAuctions[args.auctionId].adjustedBid(args)
          break
        case AUCTION_END:
          currentAuctions[args.auctionId].send();
          break
      }
    } catch (e) {
      new LogError(e, this.affiliateId, {eventType, args}).send()
    }
  },
})

sovrnAnalyticsAdapter.getAuctions = function () {
  return currentAuctions;
};

sovrnAnalyticsAdapter.originEnableAnalytics = sovrnAnalyticsAdapter.enableAnalytics;

// override enableAnalytics so we can get access to the config passed in from the page
sovrnAnalyticsAdapter.enableAnalytics = function (config) {
  let affiliateId = ''
  if (config && config.options && config.options.affiliateId) {
    affiliateId = config.options.affiliateId;
  } else {
    utils.logError('Need affiliate Id to log auction results. Please contact a Sovrn representative if you do not know your affiliate Id.')
    return
  }
  sovrnAnalyticsAdapter.affiliateId = affiliateId;
  if (config.options.pbaUrl) {
    pbaUrl = config.options.pbaUrl;
  }
  sovrnAnalyticsAdapter.originEnableAnalytics(config) // call the base class function
};

adaptermanager.registerAnalyticsAdapter({
  adapter: sovrnAnalyticsAdapter,
  code: 'sovrn'
});

/** Class Representing a Winning Bid */
class BidWinner {
  /**
   * Creates a new bid winner
   * @param {string} affiliateId - the affiliate id from the analytics config
   * @param {*} event - the args object from the auction event
   */
  constructor(affiliateId, event) {
    this.body = {}
    this.body.prebidVersion = $$PREBID_GLOBAL$$.version
    this.body.affiliateId = affiliateId
    this.body.winningBid = JSON.parse(JSON.stringify(event))
    this.body.url = utils.getTopWindowLocation().href
    this.body.payload = 'winner'
    delete this.body.winningBid.ad
  }

  /**
   * Sends the auction to the the ingest server
   */
  send() {
    this.body.ts = utils.timestamp()
    ajax(
      pbaUrl,
      null,
      JSON.stringify(this.body),
      {
        contentType: 'application/json',
        method: 'POST',
      }
    )
  }
}

/** Class representing an Auction */
class AuctionData {
  /**
   * Create a new auction data collector
   * @param {string} affiliateId - the affiliate id from the analytics config
   * @param {string} auctionId - the auction id from the auction event
   */
  constructor(affiliateId, auctionId) {
    this.auction = {}
    this.auction.prebidVersion = $$PREBID_GLOBAL$$.version
    this.auction.affiliateId = affiliateId
    this.auction.auctionId = auctionId
    this.auction.payload = 'auction'
    this.auction.timeouts = {
      buffer: config.getConfig('timeoutBuffer'),
      bidder: config.getConfig('bidderTimeout'),
    }
    this.auction.priceGranularity = config.getConfig('priceGranularity')
    this.auction.url = utils.getTopWindowLocation().href
    this.auction.requests = []
    this.auction.unsynced = []
    this.dropBidFields = ['auctionId', 'ad', 'requestId', 'bidderCode']
  }

  /**
   * Record a bid request event
   * @param {*} event - the args object from the auction event
   */
  bidRequested(event) {
    const eventCopy = JSON.parse(JSON.stringify(event))
    delete eventCopy.doneCbCallCount
    delete eventCopy.auctionId
    this.auction.requests.push(eventCopy)
  }

  /**
   * Finds the bid from the auction that the event is associated with
   * @param {*} event - the args object from the auction event
   * @return {*} - the bid
   */
  findBid(event) {
    const bidder = find(this.auction.requests, r => (r.bidderCode === event.bidderCode))
    if (!bidder) {
      this.auction.unsynced.push(JSON.parse(JSON.stringify(event)))
    }
    let bid = find(bidder.bids, b => (b.bidId === event.requestId))

    if (!bid) {
      event.unmatched = true
      bidder.bids.push(JSON.parse(JSON.stringify(event)))
    }
    return bid
  }

  /**
   * Records the original bid before any adjustments have been made
   * @param {*} event - the args object from the auction event
   * NOTE: the bid adjustment occurs before the bid response
   * the bid adjustment seems to be the bid ready to be adjusted
   */
  originalBid(event) {
    let bid = this.findBid(event)
    if (bid) {
      Object.assign(bid, JSON.parse(JSON.stringify(event)))
      this.dropBidFields.forEach((f) => delete bid[f])
    }
  }

  /**
   * Replaces original values with adjusted values and records the original values for changed values
   * in bid.originalValues
   * @param {*} event - the args object from the auction event
   */
  adjustedBid(event) {
    let bid = this.findBid(event)
    if (bid) {
      bid.originalValues = Object.keys(event).reduce((o, k) => {
        if (JSON.stringify(bid[k]) !== JSON.stringify(event[k]) && !includes(this.dropBidFields, k)) {
          o[k] = bid[k]
          bid[k] = event[k]
        }
        return o
      }, {})
    }
  }

  /**
   * Sends the auction to the the ingest server
   */
  send() {
    let maxbid = {cpm: 0}
    this.auction.requests.forEach(request => {
      request.bids.forEach(bid => {
        if (bid.cpm > maxbid.cpm) {
          maxbid = bid
        }
      })
    })
    maxbid.isAuctionWinner = true
    this.auction.ts = utils.timestamp()
    ajax(
      pbaUrl,
      () => { currentAuctions[this.auction.auctionId] = 'complete' },
      JSON.stringify(this.auction),
      {
        contentType: 'application/json',
        method: 'POST',
      }
    )
  }
}
class LogError {
  constructor(e, affiliateId, data) {
    this.error = {}
    this.error.ts = utils.timestamp()
    this.error.payload = 'error'
    this.error.message = e.message
    this.error.data = data
    this.error.stack = e.stack
    this.error.prebidVersion = $$PREBID_GLOBAL$$.version
    this.error.affiliateId = affiliateId
    this.error.url = utils.getTopWindowLocation().href
    this.error.auctionData = currentAuctions
    this.error.userAgent = navigator.userAgent
  }
  send() {
    this.error.ts = utils.timestamp()
    ajax(
      pbaUrl,
      null,
      JSON.stringify(this.error),
      {
        contentType: 'application/json',
        method: 'POST',
      }
    )
  }
}

export default sovrnAnalyticsAdapter;
