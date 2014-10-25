var async         = require('async');
var should        = require('should');
var assert        = require('assert');
var mongoose      = require('mongoose');
var parsers       = require('../../../app/lib/streams/parsers/doc');
var blocks        = require('../../data/blocks');
var validator     = require('../../../app/lib/globalValidator');
var parser        = parsers.parseBlock();
var Block         = mongoose.model('Block', require('../../../app/models/block'));
var Identity      = mongoose.model('Identity', require('../../../app/models/identity'));
var Configuration = mongoose.model('Configuration', require('../../../app/models/configuration'));

var conf = new Configuration({
  sigDelay: 365.25*24*3600, // 1 year
  sigQty: 1,
  powZeroMin: 1,
  powPeriod: 18
});

describe("Block global coherence", function(){

  it('a valid block should not have any error', validate(blocks.VALID_ROOT, function (err, done) {
    should.not.exist(err);
    done();
  }));

  it('a valid (next) block should not have any error', validate(blocks.VALID_NEXT, function (err, done) {
    should.not.exist(err);
    done();
  }));

  it('a block with wrong PreviousHash should fail', validate(blocks.WRONG_PREVIOUS_HASH, function (err, done) {
    should.exist(err);
    err.should.equal('PreviousHash not matching hash of current block');
    done();
  }));

  it('a block with wrong PreviousIssuer should fail', validate(blocks.WRONG_PREVIOUS_ISSUER, function (err, done) {
    should.exist(err);
    err.should.equal('PreviousIssuer not matching issuer of current block');
    done();
  }));

  it('a block with certification of unknown pubkey should fail', validate(blocks.WRONGLY_SIGNED_CERTIFICATION, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong signature for certification');
    done();
  }));

  it('a block with certification from non-member pubkey should fail', validate(blocks.UNKNOWN_CERTIFIER, function (err, done) {
    should.exist(err);
    err.should.equal('Certification from non-member');
    done();
  }));

  it('a block with certification to non-member pubkey should fail', validate(blocks.UNKNOWN_CERTIFIED, function (err, done) {
    should.exist(err);
    err.should.equal('Certification to non-member');
    done();
  }));

  it('a block with already used UserID should fail', validate(blocks.EXISTING_UID, function (err, done) {
    should.exist(err);
    err.should.equal('Identity already used');
    done();
  }));

  it('a block with already used pubkey should fail', validate(blocks.EXISTING_PUBKEY, function (err, done) {
    should.exist(err);
    err.should.equal('Pubkey already used');
    done();
  }));

  it('a block with too early certification replay should fail', validate(blocks.TOO_EARLY_CERTIFICATION_REPLAY, function (err, done) {
    should.exist(err);
    err.should.equal('Too early for this certification');
    done();
  }));

  it('a block with at least one joiner without enough certifications should fail', validate(blocks.NOT_ENOUGH_CERTIFICATIONS_JOINER, function (err, done) {
    should.exist(err);
    err.should.equal('Joiner does not gathers enough certifications');
    done();
  }));

  it('a block with at least one joiner without enough certifications should succeed', validate(blocks.NOT_ENOUGH_CERTIFICATIONS_JOINER_BLOCK_0, function (err, done) {
    should.not.exist(err);
    done();
  }));

  it('a block with at least one joiner outdistanced from WoT should fail', validate(blocks.OUTDISTANCED_JOINER, function (err, done) {
    should.exist(err);
    err.should.equal('Joiner is outdistanced from WoT');
    done();
  }));

  it('a block with positive number while no root exists should fail', validate(blocks.ROOT_BLOCK_REQUIRED, function (err, done) {
    should.exist(err);
    err.should.equal('Root block required first');
    done();
  }));

  it('a block with same number as current should fail', validate(blocks.SAME_BLOCK_NUMBER, function (err, done) {
    should.exist(err);
    err.should.equal('Too late for this block');
    done();
  }));

  it('a block with older number than current should fail', validate(blocks.OLD_BLOCK_NUMBER, function (err, done) {
    should.exist(err);
    err.should.equal('Too late for this block');
    done();
  }));

  it('a block with too far future number than current should fail', validate(blocks.FAR_FUTURE_BLOCK_NUMBER, function (err, done) {
    should.exist(err);
    err.should.equal('Too early for this block');
    done();
  }));

  it('a block with kicked members not written under Excluded field should fail', validate(blocks.KICKED_NOT_EXCLUDED, function (err, done) {
    should.exist(err);
    err.should.equal('All kicked members must be present under Excluded members');
    done();
  }));

  it('a block with kicked members well written under Excluded field should succeed', validate(blocks.KICKED_EXCLUDED, function (err, done) {
    should.not.exist(err);
    done();
  }));

  it('a block with wrong members count should fail', validate(blocks.WRONG_MEMBERS_COUNT, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong members count');
    done();
  }));

  it('a block not starting with a leading zero should fail', validateProofOfWork(blocks.NO_LEADING_ZERO, function (err, done) {
    should.exist(err);
    err.should.equal('Not a proof-of-work');
    done();
  }));

  it('a block requiring 4 leading zeros but providing less should fail', validateProofOfWork(blocks.REQUIRES_4_LEADING_ZEROS, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong proof-of-work level: given 1 zeros, required was 4 zeros');
    done();
  }));

  it('a block requiring 7 leading zeros but providing less should fail', validateProofOfWork(blocks.REQUIRES_7_LEADING_ZEROS, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong proof-of-work level: given 1 zeros, required was 7 zeros');
    done();
  }));

  it('a block requiring 6 leading zeros but providing less should fail', validateProofOfWork(blocks.REQUIRES_6_LEADING_ZEROS, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong proof-of-work level: given 1 zeros, required was 6 zeros');
    done();
  }));

  it('a block requiring 5 leading zeros but providing less should fail', validateProofOfWork(blocks.REQUIRES_5_LEADING_ZEROS, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong proof-of-work level: given 1 zeros, required was 5 zeros');
    done();
  }));

  it('a block requiring 7 leading zeros (again) but providing less should fail', validateProofOfWork(blocks.REQUIRES_7_LEADING_ZEROS_AGAIN, function (err, done) {
    should.exist(err);
    err.should.equal('Wrong proof-of-work level: given 1 zeros, required was 7 zeros');
    done();
  }));

});

function validate (raw, callback) {
  var block;
  return function (done) {
    async.waterfall([
      function (next){
        parser.asyncWrite(raw, next);
      },
      function (obj, next){
        block = new Block(obj);
        validator(conf, new BlockCheckerDao(block)).validate(block, next);
      },
      function (next){
        validator(conf, new BlockCheckerDao(block)).checkSignatures(block, next);
      },
    ], function (err) {
      callback(err, done);
    });
  };
}

function validateProofOfWork (raw, callback) {
  var block;
  return function (done) {
    async.waterfall([
      function (next){
        parser.asyncWrite(raw, next);
      },
      function (obj, next){
        block = new Block(obj);
        validator(conf, new BlockCheckerDao(block)).checkProofOfWork(block, next);
      },
    ], function (err) {
      callback(err, done);
    });
  };
}

/**
* Mock dao for testing
*/
function BlockCheckerDao (block) {
  
  this.existsUserID = function (uid, done) {
    if (uid == 'EXISTING') {
      done(null, true);
    } else {
      done(null, false);
    }
  }
  
  this.existsPubkey = function (pubkey, done) {
    if (pubkey == 'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH') {
      done(null, true);
    } else {
      done(null, false);
    }
  }
  
  this.getIdentityByPubkey = function (pubkey, done) {
    // No existing identity
    done(null, null);
  }
  
  this.isMember = function (pubkey, done) {
    // No existing member
    if (block.number == 0)
      done(null, false);
    else {
      var members = [
        'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd',
        'G2CBgZBPLe6FSFUgpx2Jf1Aqsgta6iib3vmDRA1yLiqU',
      ];
      done(null, ~members.indexOf(pubkey));
    }
  }

  this.getPreviousLinkFor = function (from, to, done) {
    if (from == 'G2CBgZBPLe6FSFUgpx2Jf1Aqsgta6iib3vmDRA1yLiqU'
      && to == 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC') {
      done(null, {
        timestamp: '1380218401' // Exactly 1 second remaining
      });
    } else {
      done(null, null);
    }
  }

  this.getValidLinksTo = function (to, done) {
    done(null, []);
  }

  this.getMembers = function (done) {
    if (block.number == 0)
      done(null, []);
    else {
      done(null, [
        { pubkey: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd' },
        { pubkey: 'G2CBgZBPLe6FSFUgpx2Jf1Aqsgta6iib3vmDRA1yLiqU' },
      ]);
    }
  }

  this.getPreviousLinkFromTo = function (from, to, done) {
    done(null, []);
  }

  this.getValidLinksFrom = function (member, done) {
    done(null, []);
  }

  this.getCurrent = function (done) {
    if (block.number == 3)      
      done(null, { number: 2, hash: '15978746968DB6BE3CDAF243E372FEB35F7B0924', issuer: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', membersCount: 3 });
    else if (block.number == 4) 
      done(null, { number: 3, hash: '4AE9FA0A8299A828A886C0EB30C930C7CF302A72', issuer: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', membersCount: 3 });
    else if (block.number == 1) 
      done(null, null);
    else if (block.number == 51)
      done(null, { number: 50, hash: 'E5B4669FF9B5576EE649BB3CD84AC530DED1F34B', issuer: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', membersCount: 3 });
    else if (block.number == 50)
      done(null, { number: 50, hash: 'E5B4669FF9B5576EE649BB3CD84AC530DED1F34B', issuer: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', membersCount: 3 });
    else if (block.number == 49)
      done(null, { number: 50, hash: 'E5B4669FF9B5576EE649BB3CD84AC530DED1F34B', issuer: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', membersCount: 3 });
    else if (block.number == 52)
      done(null, { number: 50, hash: 'E5B4669FF9B5576EE649BB3CD84AC530DED1F34B', issuer: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd', membersCount: 3 });
    else
      done(null, null);
  }

  this.getToBeKicked = function (blockNumber, done) {
    if (block.number != 4)
      done(null, []);
    else {
      done(null, [
        { pubkey: 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd' },
        { pubkey: 'G2CBgZBPLe6FSFUgpx2Jf1Aqsgta6iib3vmDRA1yLiqU' },
      ]);
    }
  },

  this.lastBlockOfIssuer = function (issuer, done) {
    if (block.number == 60 && issuer == 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd') {
      done(null, {
        number: 5, // 60 - 5 = 55 waited, % 18 = 3,0555555
        hash: '0000008A955B2196FB8560DCDA7A70B19DDB3433' // 6 + 1 - 3 = 4 required zeros
      });
    } else if (block.number == 61 && issuer == 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd') {
      done(null, {
        number: 60, // 61 - 60 = 0 waited, % 18 = 0
        hash: '0000008A955B2196FB8560DCDA7A70B19DDB3433' // 6 + 1 - 0 = 7 required zeros
      });
    } else if (block.number == 62 && issuer == 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd') {
      done(null, {
        number: 44, // 62 - 44 = 18 waited, % 18 = 0
        hash: '0000008A955B2196FB8560DCDA7A70B19DDB3433' // 6 + 1 - 1 = 6 required zeros
      });
    } else if (block.number == 64 && issuer == 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd') {
      done(null, {
        number: 47, // 64 - 47 = 17 waited, % 18 = 17
        hash: '0000008A955B2196FB8560DCDA7A70B19DDB3433' // 6 + 1 - 0 = 7 required zeros
      });
    } else if (block.number == 63 && issuer == 'HgTTJLAQ5sqfknMq7yLPZbehtuLSsKj9CxWN7k8QvYJd') {
      done(null, {
        number: 26, // 62 - 26 = 36 waited, % 18 = 0
        hash: '0000008A955B2196FB8560DCDA7A70B19DDB3433' // 6 + 1 - 2 = 5 required zeros
      });
    } else {
      done(null, null);
    }
  }

}