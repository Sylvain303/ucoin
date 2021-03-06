"use strict";

module.exports = {

  processForURL: function (req, merkle, valueCB, done) {
    // Result
    var json = {
      "depth": merkle.depth,
      "nodesCount": merkle.nodes,
      "leavesCount": merkle.levels[merkle.depth].length,
      "root": merkle.levels[0][0] || ""
    };
    if(req.query.leaves){
      // Leaves
      json.leaves = merkle.leaves();
      done(null, json);
    } else if (req.query.leaf) {
      // Extract of a leaf
      json.leaves = {};
      var hashes = [req.query.leaf];
      // This code is in a loop for historic reasons. Should be set to non-loop style.
      valueCB(hashes, function (err, values) {
        if (err) return done(err);
        hashes.forEach(function (hash){
          json.leaf = {
            "hash": hash,
            "value": values[hash] || ""
          };
        });
        done(null, json);
      });
    } else {
      done(null, json);
    }
  }
};
