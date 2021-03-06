var express = require('express');
var router = express.Router();
var masterPassword = 'AslNakhar';


/*
 * GET Complete Search.
 */
router.get('/search/:sAreaCode/:bCategoryId/:bId/:onlyDiscount/:onlyVerified/:distance?/:lat?/:lon?', function(req, res) {
    var db = req.db;
    res.set({'Access-Control-Allow-Origin': '*'});
    console.log("store search");
    
    
    var query = {};
    var sAreaCode = req.params.sAreaCode;
    var bCategoryId = req.params.bCategoryId;
    var bId = req.params.bId;
    var onlyDiscount = req.params.onlyDiscount;
    var onlyVerified = req.params.onlyVerified;
    
    
    var distance = req.params.distance;
    var lat = req.params.lat;
    var lon = req.params.lon;
    console.log("sAreaCode="+sAreaCode + ", bCategoryId=" + bCategoryId + ", bId=" + bId + ", onlyDiscount=" + onlyDiscount + ", onlyVerified=" + onlyVerified + ", distance=" + distance + ", lat=" + lat + ", lon=" + lon);
    
	// check categoryId
	if (bCategoryId != 'all') {
    	var field = 'bCategoryId';
		var operator = {};
		operator['$eq'] = bCategoryId;
    	query[field] = operator;
    }
    
    // check brandId
	if (bId != 'all') {
    	var field = 'bId';
	    var operator = {};
    	operator['$eq'] = bId;
    	query[field] = operator;
    }
    
	// check discounts
    if (onlyDiscount == 'true') {
    	var field = 'dPrecentage';
    	var operator = {};
    	operator['$gte'] = 0;
    	query[field] = operator;
    }
    
	// check verified
    if (onlyVerified == 'true') {
    	var field = 'sVerified';
		var operator = {};
    	operator['$eq'] = 'YES';
    	query[field] = operator;
    }
    
    // if 'distance', 'lat' and 'lon' are available use them otherwise set the search to city 
    var filterByDist = true;
    if ((lat == 'null') || (lon == 'null') || (distance == 'null')) {
    	var field = 'sAreaCode';
		var operator = {};
		operator['$eq'] = sAreaCode;
		query[field] = operator;
		filterByDist = false;
    }
     
    db.collection('stores').find(query).toArray(function (err, items) {
			if (err == null){
			var results = [];
			items.forEach(function(store) {
    			var d = calDistance(lat,lon,store.sLat,store.sLong,"K");
    			var distNum = d.toFixed(2);
    		    store.distance=distNum.toString();	
    			if (filterByDist == true){
					if (d < distance){
    		    		results.push(store);
    				}
    			}
    			else {
    				results.push(store);
    			}
    		});	
			// sort based on distance
			results.sort(function(a,b) {return (a.distance > b.distance) ? 1 : ((b.distance > a.distance) ? -1 : 0);} ); 
			res.json(results);
		}
		else {
			res.send({ "successful":false,"errCode": err});
		}
	
	});
    
});


/*
 * GET storelist.
 */
router.get('/storelist', function(req, res) {
    var db = req.db;
    db.collection('stores').find().toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});


/*
 * GET storelist by Id.
 */
router.get('/storelist/:id', function(req, res) {
	console.log('/storelist/:id');
    var db = req.db;
    console.log(req.params.id);
    db.collection('stores').find({bId:req.params.id}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});


router.get('/storelist/:id/sandbox', function(req, res) {
	console.log('/storelist/:id/sandbox?');
    var db = req.db;
    console.log(req.params.id);
    db.collection('new_stores').find({bId:req.params.id}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});



/*
* GET storelist by Area Code.
*/


router.get('/storelist/city/:areacode', function(req, res) {
    var db = req.db;
    console.log(req.params.areacode);
    
    reportSession(db,req.params.areacode);	
     	
    db.collection('stores').find({sAreaCode:req.params.areacode}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});


router.get('/storelist/city/:areacode/:id', function(req, res) {
    var db = req.db;
    console.log(req.params.areacode);
    console.log(req.params.id);
    db.collection('stores').find({sAreaCode:req.params.areacode, bId:req.params.id}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});

router.get('/storelist/discounts/all/:env?', function(req, res) {
    console.log("/storelist/discounts");
    var db = req.db;
    var env = req.params.env;
    var col = 'stores';
	if (env === 'sandbox'){
		col = 'new_discounts';    	
    }
    db.collection(col).find({dPrecentage:{ $gte: 0 }}).toArray(function (err, items) {
        console.log(items);
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});

router.get('/storelist/discounts/city/:areacode', function(req, res) {
    var db = req.db;
    console.log(req.params.areacode);
    console.log(req.params.id);
    db.collection('stores').find({sAreaCode:req.params.areacode, dPrecentage:{ $gte:0 }}).toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});


router.get('/storelist/discounts/:lat/:lon/:km', function(req, res) {
    var db = req.db;
    var items = [];
    var maxResults = 100;
    var counter = 0;
    db.collection('stores').find({dPrecentage:{$gte:0}}).toArray(function (err, stores) {
			stores.forEach(function(store) {
    			// console.log("lat"+req.params.lat);
    			// console.log("lon"+req.params.lon);
    			// if (counter < maxResults) {
    				var dist = calDistance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    				if (dist < req.params.km){
    			    	var distNum = dist.toFixed(2);
    			    	store.distance=distNum.toString();
      			  		items.push(store);
      			  		counter = counter + 1;
      			  	//	console.log(dist);
      			  	}
    			// }
    		});
    		res.set({'Access-Control-Allow-Origin': '*'});
    		res.json(items);
    	});
});


router.get('/backup', function(req, res) {
    console.log('/backup');
    var db = req.db;
    db.collection('stores').find().toArray(function (err, items) {
    	db.collection('stores_backup_2').remove({}, function(err, result) {
        	if (err == null) {
        		db.collection('stores_backup_2').insert(items, function(err, result){
        			if (err === null) {
        				console.log('backup is completed');
        		}
        		res.set({'Access-Control-Allow-Origin': '*'});
        		res.send((err === null) ? { msg: '' } : { msg: err });
    			})
        	}
    	});  
    });		
});
    

router.post('/replace', function(req, res) {
    console.log('/replace');
    var db = req.db;
    
    // Find CategoryId
    var field = req.body.field;
    var oldValue = req.body.oldValue;
    var newValue = req.body.newValue;
    
    console.log('field:'+field);
    console.log('oldValue:'+oldValue);
    console.log('newValue:'+newValue);
  	
	db.collection('stores').find().toArray(function (err, stores) {
		stores.forEach(function(store) {
			if (store[field.toString()] === oldValue.toString()) {
				console.log('original');
				console.log(store);
    			store[field.toString()] = newValue.toString();
    			console.log('after');
				console.log(store);
    		}   	
    	});
		db.collection('stores').remove({}, function(err, result) {
        	if (err == null) {
        		db.collection('stores').insert(stores, function(err, result){
        			if (err === null) {
        				console.log('replace is completed');
        		}
        		res.set({'Access-Control-Allow-Origin': '*'});
        		res.send((err === null) ? { msg: '' } : { msg: err });
    			})
        	}
    	});
	});
});    
       

// http://localhost:5000/stores/storelist/3/32.637817/51.658522/10
// http://localhost:5000/stores/storelist/all/32.637817/51.658522/10

router.get('/storelist/:bId/:lat/:lon/:km', function(req, res) {
    var db = req.db;
    var items = [];
    var bId = req.params.bId;
	console.log(bId);
	var maxResults = 100;
    var counter = 0;
   
    
    if (isNumeric(bId)){
        console.log("storeID available");
    	db.collection('stores').find({bId:req.params.bId}).toArray(function (err, stores) {
			stores.forEach(function(store) {
				if (counter < maxResults) {
    				var dist = calDistance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    				if (dist < req.params.km){
    					counter = counter + 1;
    			    	var distNum = dist.toFixed(2);
    			     	store.distance=distNum.toString();
    					items.push(store);
    				}
    			}
    		});
    		res.set({'Access-Control-Allow-Origin': '*'});
    		res.json(items);
    	});
    }
    else {
    	db.collection('stores').find().toArray(function (err, stores) {
			stores.forEach(function(store) {
    			if (counter < maxResults) {
    				// console.log("lat"+req.params.lat);
    				// console.log("lon"+req.params.lon);
    				// console.log("counter="+String(counter));
    				var dist = calDistance(req.params.lat,req.params.lon,store.sLat,store.sLong,"K");
    				if (dist < req.params.km){
    					counter = counter + 1;
    			    	var distNum = dist.toFixed(2);
    			    	store.distance=distNum.toString();
      			  		items.push(store);
      			  	//	console.log(dist);
    				
      			  	}
    			}
    		});
    		res.set({'Access-Control-Allow-Origin': '*'});
    		res.json(items);
    	});
    }
});



function reportSession(db,areacode) {

    var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {dd='0'+dd} 
	if(mm<10) {mm='0'+mm} 
	today = mm+'/'+dd+'/'+yyyy;
    
    console.log(today);
    console.log(db);
    console.log(areacode);
    db.collection('analytics_city_sessions').findOne({city:areacode,date:today},function (err,doc) {
    
    	console.log('doc'+doc);
    	if (doc == null) {
    		var record = {'date': today,'city': areacode,'sessions':1 }	
        	console.log('record'+record);	
    		db.collection('analytics_city_sessions').insert(record, function(err, result){
        			if (err === null) {
        				console.log('analytics updated');
        			}
        	});
        }
        else {
        	var record = {'date': today,'city': areacode,'sessions':doc['sessions']+1}
        	db.collection('analytics_city_sessions').remove({city:areacode,date:today}, function(err, doc) {
        	if (err == null) {
        		db.collection('analytics_city_sessions').insert(record, function(err, result){
        			if (err === null) {
        				console.log('analytics updated');
        			}
        		});
        	}
        	
        });
       }
    });  			
}


function calDistance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var radlon1 = Math.PI * lon1/180
	var radlon2 = Math.PI * lon2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}       

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


/*
 * POST to adduser.
 */
router.post('/addstore/:env?', function(req, res) {
    console.log('/addstore');
    var db = req.db;
    
    var env = req.params.env;
    var pwd = req.body.masterPassword;
    var col = 'stores';
	if (env === 'sandbox'){
		col = 'new_stores';    	
    }
	else {
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
			return;
		}
	}
  	
    
    // Find CategoryId
    var _bId = req.body.bId;
    console.log('_bId:'+_bId);
  	
	db.collection('brands').findOne({bId:_bId.toString()},function (err,doc) {
    if (doc){
        var _cId = doc.bCategoryId;
        var _bName = doc.bName;
        console.log('_cId:'+_cId);
        console.log('_bName:'+_bName);
        db.collection('categories').findOne({cId:_cId.toString()},function (err,doc) {
        if (doc){
            var _cName=doc.cName;
        	console.log('_cName:'+_cName);
        	var newStore = {
        		'bId': req.body.bId,
        		'sId':req.body.sId,
        		'sName':req.body.sName,
        		'bName':_bName,
        		'bCategory':_cName,
        		'bDistributor':req.body.bDistributor,
        		'sCity':req.body.sCity,
        		'sAddress':req.body.sAddress,
        		'sHours':req.body.sHours,
        		'sAreaCode':req.body.sAreaCode,
        		'sTel1':req.body.sTel1,
        		'sTel2':req.body.sTel2,
        		'sLat':req.body.sLat,
        		'sLong':req.body.sLong,
        		'sVerified':req.body.sVerified
    		}
        	
        	db.collection(col).insert(newStore, function(err, result){
        	if (err === null) {
        		console.log('new store doc added');
        	}
        	res.set({'Access-Control-Allow-Origin': '*'});
        	res.send(
            	(err === null) ? { msg: '' } : { msg: err }
        		);
    		});	
        }
        else {
        	console.log('err'+err);
        	}
        });
    } 
    else {
        console.log('err'+err);
    	}
	});
});


router.post('/adddiscount/:env?', function(req, res) {
    console.log('/adddiscount');
    var db = req.db;
    
    var env = req.params.env;
    var pwd = req.body.masterPassword;
    
    console.log('pwd'+pwd);
  	if (env === 'dashboard') {
  		if (pwd !== masterPassword){
			res.send([{ "result": "err:Invalid Password" }]);
			return false;
		}
	}
	
    // Find CategoryId
    var _bId = req.body.bId;
    var _sId = req.body.sId;
    var _startDate = req.body.startDate;
    var _endDate = req.body.endDate;
    var _startDateFa = req.body.startDateFa;
    var _endDateFa = req.body.endDateFa;
    var _precentage = req.body.precentage;
    var _note = req.body.note;
    
    
    console.log('_bId:'+_bId);
    console.log('_sId:'+_sId);
  	console.log('_startDate:'+_startDate);
  	console.log('_endDate:'+_endDate);
  	console.log('_startDateFa:'+_startDateFa);
  	console.log('_endDate:'+_endDateFa);
  	console.log('_precentage:'+_precentage);
  	console.log('_note:'+_note);
  	
  	if (!_note) {
  		_note=' ';
  	}
  	
	db.collection('stores').findOne({bId:_bId.toString(),sId:_sId.toString()},function (err,doc) {
    if (doc){
    	var newStore = {
        		'bId': doc.bId,
        		'sId':doc.sId,
        		'sName':doc.sName,
        		'bName':doc.bName,
        		'bCategory':doc.bCategory,
        		'bDistributor':doc.bDistributor,
        		'sCity':doc.sCity,
        		'sAddress':doc.sAddress,
        		'sHours':doc.sHours,
        		'sAreaCode':doc.sAreaCode,
        		'sTel1':doc.sTel1,
        		'sTel2':doc.sTel2,
        		'sLat':doc.sLat,
        		'sLong':doc.sLong,
        		'sVerified':doc.sVerified,
        		'dStartDate': _startDate,
        		'dEndDate': _endDate,
        		'dStartDateFa': _startDateFa,
        		'dEndDateFa': _endDateFa,
        		'dPrecentage': parseInt(_precentage),
        		'dNote': _note
    	}
    	
    	db.collection('stores').remove({bId:_bId,sId:_sId}, function(err, result) {
        	if (err == null) {
        		db.collection('stores').insert(newStore, function(err, result){
        			if (err === null) {
        				console.log('new store discount doc added');
        		}
        		res.set({'Access-Control-Allow-Origin': '*'});
        		res.send(
            		(err === null) ? [{ "result": "success"}] : [{ "err": err}]
        			);
    			});
        	}
    	});
    }
    else {
    	res.set({'Access-Control-Allow-Origin': '*'});
        		res.send([{ "err": err}]);
    	};
    });
});


router.post('/discounts/add/sandbox', function(req, res) {
    console.log('/discounts/add/sandbox');
    var db = req.db;
    
  	db.collection('stores').findOne({bId:req.body.bId,sId:req.body.sId},function (err,doc) {
    if (doc){
    	req.body.bName = doc.bName;
    	req.body.sName = doc.sName;
    	req.body.dPrecentage = parseInt(req.body.dPrecentage);
    	if (!req.body.dNote) {
  			req.body.dNote=' ';
  		}
    	db.collection('new_discounts').remove({bId:req.body.bId,sId:req.body.sId}, function(err, result) {
        	if (err == null) {
        		db.collection('new_discounts').insert(req.body, function(err, result){
        			if (err === null) {
        				console.log('new store discount added to sandbox');
        			}
        			res.set({'Access-Control-Allow-Origin': '*'});
        			res.send(
            			(err === null) ? [{ "result": "success"}] : [{ "result": "err"}]
        			);
    			});
        	}
    	});
	}
	else {
		res.send([{"result":"err: Brand or Store Not Found"}]);
	}
	});
});


router.post('/discounts/delete/sandbox', function(req, res) {
    console.log('/discounts/delete/sandbox');
    var db = req.db;
    
    var _bId = req.body.bId;
    var _sId = req.body.sId;
  	
  	db.collection('new_discounts').remove({bId:_bId,sId:_sId}, function(err, result) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.send((err === null) ? { "result": "success"} : { "err": err});
    });
});



router.post('/deletediscount/:env?', function(req, res) {
    console.log('/deletediscount');
    var db = req.db;
    
    var env = req.params.env;
    var pwd = req.body.masterPassword;
    
    console.log(env);
    console.log(pwd);
  	if (env === 'dashboard') {
  		if (pwd !== masterPassword){
		res.send([{ "result": "err:Invalid Password" }]);
		return false;
		}
	}
    
    // Find CategoryId
    var _bId = req.body.bId;
    var _sId = req.body.sId;
    var _sDiscount = 0;
    
    console.log('_bId:'+_bId);
    console.log('_sId:'+_sId);
  	console.log('_sDiscount:'+_sDiscount);
  	
  	
	db.collection('stores').findOne({bId:_bId.toString(),sId:_sId.toString()},function (err,doc) {
    console.log('_bCategory'+doc.bCategory);
    
    if (doc){
    	var newStore = {
        		'bId': doc.bId,
        		'sId':doc.sId,
        		'sName':doc.sName,
        		'bName':doc.bName,
        		'bCategory':doc.bCategory,
        		'bDistributor':doc.bDistributor,
        		'sCity':doc.sCity,
        		'sAddress':doc.sAddress,
        		'sHours':doc.sHours,
        		'sAreaCode':doc.sAreaCode,
        		'sTel1':doc.sTel1,
        		'sTel2':doc.sTel2,
        		'sLat':doc.sLat,
        		'sLong':doc.sLong,
        		'sDiscount':Number(_sDiscount),
        		'sVerified':doc.sVerified
    	}
    	db.collection('stores').remove({bId:_bId,sId:_sId}, function(err, result) {
        	if (err == null) {
        		db.collection('stores').insert(newStore, function(err, result){
        			if (err === null) {
        				console.log('new store record with no discount added');
        		}
        		res.set({'Access-Control-Allow-Origin': '*'});
        		res.send(
            		(err === null) ? { "result": "success"} : { "err": err}
        			);
    			});
        	}
    	});
    	}
    });
});


/*
 * DELETE to deleteuser.
 */
router.delete('/delete/:env/:id/:pwd?', function(req, res) {
    var db = req.db;
    var env = req.params.env;
    var pwd = req.params.pwd;
    var col = 'stores';
	
	if (env === 'sandbox'){
		col = 'new_stores';    	
    }
	else {
		if (pwd !== masterPassword) {
			res.send({ msg: 'Invalid Password' });
			return;
		}
	}
   
    var storeToDelete = req.params.id;
    db.collection(col).removeById(storeToDelete, function(err, result) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.send((result === 1) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
