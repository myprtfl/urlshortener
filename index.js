var express = require('express');
var router = express.Router();
var assert = require('assert');
var urlbase = 'https://myprtfl.herokuapp.com/api/urlshortener/v1/';
var validUrl = require('valid-url');

var MongoClient = require('mongodb').MongoClient, db, map, counters, dburi = process.env.MONGOLAB_URI;

MongoClient.connect(dburi, function (err, database) {
  assert.equal(null, err);
  console.log("Connected correctly to server.");
  db=database;
  map=db.collection('map');
  counters=db.collection('counters');
});

function getNextSequence(name, callback) {
  counters.findAndModify(
  { "_id": name },
    [],// [['_id', 'asc']],
    {$inc: {"seq": 1}},
    { new: true}
    , function(err, data) {
      assert.equal(null, err);
      console.log("seq", data);
      callback(data.value.seq);
  });
}

function findIdByUrl(url, callback){
  map.find({url: url}).limit(1).toArray(function(err, docs) {
      assert.equal(null, err);
      if (docs.length==0) {
        callback('');
      }else{
        callback(docs[0]._id);
      }
  });
}

function getUrlById(id, callback){
  map.find({_id: id}).limit(1).toArray(function(err, docs) {
      assert.equal(null, err);
      console.log('getUrlByID',docs);
      if (docs.length==0) {
        callback('');
      }else{
        callback(docs[0].url);
      }
  });
}

function getIdByUrl(url, getIdCallback){
  findIdByUrl(url, findIdCallback);
  
  function findIdCallback(id){
    if (id!='') {
      getIdCallback(id);
    }else{
      getNextSequence("uid", getNextSequenceCalllback);
    }
  }
  
  function getNextSequenceCalllback(seq){
    map.findAndModify(
      { "url": url },
      [],
      {$setOnInsert: {"_id": seq, "url": url}},
      { new: true, upsert : true}
      , function(err, data) {
        assert.equal(null, err);
        console.log("getNextSequenceCalllback", data);
        getIdCallback(data.value._id);
      });
  }
  console.log("getIdByUrl end");
}

router.use('/', express.static(__dirname + '/static/'));

router.get(['/v1/:id', '/:id'], function(request, response) {
  var result = {};
  var id = +request.params.id;
  result.short_url = urlbase + request.params.id;

  function resultHandler(url){
    console.log(request.path, url);
    if(url!=''){
      response.redirect(301, url);
    }else{
      response.status(404).send('404: No Such Short URL');
    }
  }
  getUrlById(id, resultHandler);
});


router.get('/v1/getoriginal/:id', function(request, response) {
  var result = {};
  var id = +request.params.id;

  function resultHandler(url){
    console.log(request.path, url);
    if(url==''){
      result.err = 'No Such Short URL';
    }else{
      result.short_url = urlbase + request.params.id;
      result.original_url = url;
    }
    response.setHeader('Content-Type', 'application/json');
    response.json(result);
  }
  getUrlById(id, resultHandler);
});

router.get('/v1/getshort/:url(*)', function(request, response) {
  var result = {};
  var url = request.params.url;
  if (validUrl.isWebUri(url)){
    result.original_url = url;
    console.log('Looks like an URI');
    getIdByUrl(url, getIdCallback);
  }else{
    result.err = 'Invalid URL';
    response.setHeader('Content-Type', 'application/json');
    response.json(result);

    console.log('Not a URI');
  }

  function getIdCallback(id){
    result.short_url = urlbase+id;
    response.setHeader('Content-Type', 'application/json');
    response.json(result);
    console.log('set', id);
  }
});

module.exports = router;
