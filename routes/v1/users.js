var express = require('express');
var router = express.Router();
var apnsComm = require('./apnsComm');

/*
 * Business Users
 */
 router.get('/business/userlist', function(req, res) {
    var db = req.db;
    db.collection('business_users').find().toArray(function (err, items) {
        res.set({'Access-Control-Allow-Origin': '*'});
        res.json(items);
    });
});

router.post('/business/sendemail', function(req, res) {
    console.log('test');
    console.log('/business/sendemail');
    var postmark = require("postmark");
	
	var to = req.body.to;
	var email = req.body.email;
    var subject = req.body.subject;
    var emailBody = req.body.emailBody;
	
	// Retrieve Password
	res.set({'Access-Control-Allow-Origin': '*'});	
    
    var client = new postmark.Client("0aba8682-68fb-4720-abbc-ae22d778b02b");
    		
    	client.sendEmail({
    			"From": "contactus@aslbekhar.com",
				"To": to,
				"Subject": subject, 
    			"TextBody": emailBody,
		} , function(error, success) {
    		if(error) {
        			console.error("Unable to send via postmark: " + error.message);
        			console.log("Unable to send via postmark: " + error.message);
        			res.send(JSON.stringify({ "err": error.message}));
        			return;
    	}
    	else {
    		console.log("Password was sent!");
			res.send(JSON.stringify({ "result": "success"}));
            return;
            }
    	});  
    });

router.get('/business/forgetpassword/:email', function(req, res) {
    
    console.log('/business/forgetPassword');
    var postmark = require("postmark");
	var db = req.db;
	var email = req.params.email;
	console.log('email:'+email.toString());
	
	// Retrieve Password
	var password = null;
    res.set({'Access-Control-Allow-Origin': '*'});	
    db.collection('business_users').findOne({buEmail:email.toString()},function (err,doc) {
	    if (err != null) {
    		console.log('Error: user not found');
    		res.send(JSON.stringify({ "err": "invalid_email"}));
        	return;
        }
        else if (doc != null) {
        	password = doc.buPassword;
        	console.log('Password='+password);
        
        	if (password != null) {
    	
    			var client = new postmark.Client("0aba8682-68fb-4720-abbc-ae22d778b02b");
    			var eHeader = " سلام " + doc.buStoreName.toString() +"\n";
				var eBody1="رمز عبور شما برای مدیریت فروشگاه شما در موبایل اپلیکیشن و وبسایت اصل بخر مطابق زیر است:"+"\n";
				var eBody2="شناسه:"+ doc.buEmail.toString()+"\n";
				var eBody3="رمز عبور:"+ doc.buPassword.toString()+"\n";
				var eFooter = "برای اطلاعات بیشتر یا هرگونه سوال و پیشنهاد لطفا با پست الکترونیکی  support@aslbekhar.com تماس بگیرید."+"\n"+"با تشکر"+"\n"+"مدیریت اصل بخر ";
    		
    			client.sendEmail({
    				"From": "passwordrecovery@aslbekhar.com",
    				"To": email.toString(),
    				"Subject": "Aslbekhar.com Password Recovery", 
    				"TextBody": eHeader+"\n"+eBody1+"\n"+eBody2+"\n"+eBody3+"\n"+eFooter,
				} , function(error, success) {
    				if(error) {
        				console.error("Unable to send via postmark: " + error.message);
        				console.log("Unable to send via postmark: " + error.message);
        				res.send(JSON.stringify({ "err": error.message}));
        				return;
    				}
    				else {
    					console.log("Password was sent!");
    					res.send(JSON.stringify({ "result": "success"}));
            			return;
            		}
    			});  
        	}        	
        	else {
        		console.log("Password not found!");
        		res.send(JSON.stringify({ "err": "password_notfound"}));
        		return;
        	}
        }
    else {
    	
    	console.log("User not found!");
    	res.send(JSON.stringify({ "err": "invalid_email"}));
   		return;
    	}
    });
    	
});


router.get('/business/validateemail/:email', function(req, res) {
    var db = req.db;
    var email = req.params.email;
    res.set({'Access-Control-Allow-Origin': '*'});
	
    console.log('/business/validateemail/:email');
    console.log('email:'+email.toString());
    db.collection('business_users').find({buEmail:email.toString()}).toArray(function (err, items) {
        
        if (err == null) {
        	if (items.length==0){
        		res.send(JSON.stringify({ "duplicate": "false"}));
        	}
        	else {
        		res.send(JSON.stringify({ "duplicate": "true"}));
        	}
        }
        else {
        		res.send(JSON.stringify({ "err": err}));
        }
    });
});


router.post('/business/login', function(req, res) {
    var db = req.db;
    var email = req.body.email;
    var password = req.body.password;
	res.set({'Access-Control-Allow-Origin': '*'});
	
    
    //res.send('succesful');
    console.log('/business/login');
    db.collection('business_users').find({buEmail:email.toString()}).toArray(function (err, doc) {
        console.log(doc);
        if (doc.length==0){
        	var array = [{ "err": "err_invalid_email"}];
            res.json(array);       
        }
        else {
            console.log('doc.buPassword='+doc[0].buPassword+' password='+password);
        	if (doc[0].buPassword==password){	   
        		console.log('doc.buStoreId='+doc[0].buStoreId);
            	db.collection('stores').findOne({sId:doc[0].buStoreId}, function (sErr, sDoc) {
            		if (sErr!=null){
            			var array = [{ "err": "err_store_unavailable"}];
    					res.json(array);
            		}
            		else {
            		    var profile = {
        							  'buId': doc[0].buId,
        							  'buEmail':doc[0].buEmail,
        							  'buPassword':doc[0].buPassword,
        							  'buCityName':doc[0].buCityName,
        							  'buCityNameFa':doc[0].buCityNameFa,
        						      'buBrandId':doc[0].buBrandId,
        							  'buBrandName':doc[0].buBrandName,
        							  'buBrandCategory':doc[0].buBrandCategory,
        							  'buStoreId':doc[0].buStoreId,
        							  'buStoreName':doc[0].buStoreName,
        							  'buStoreAddress':doc[0].buStoreAddress,
        							  'buStoreHours':doc[0].buStoreHours,
        							  'buDistributor':doc[0].buDistributor,
        							  'buStoreLat':doc[0].buStoreLat,
        							  'buStoreLon':doc[0].buStoreLon,
        							  'buAreaCode':doc[0].buAreaCode,
        							  'buTel':doc[0].buTel,
        							  'buBrandLogoName':doc[0].buBrandLogoName};
        					
        					if (sDoc.dPrecentage > 0) {
        					    profile ['dStartDate']= sDoc.dStartDate;
        						profile ['dEndDate']= sDoc.dEndDate;
        						profile ['dStartDateFa']= sDoc.dStartDateFa;
        						profile ['dEndDateFa']= sDoc.dEndDateFa;
        						profile ['dPrecentage']= sDoc.dPrecentage;
        						profile ['dNote']= sDoc.dNote;
        					}
        					else {
								profile ['dStartDate']= null;
        						profile ['dEndDate']= null;
        						profile ['dStartDateFa']= null;
        						profile ['dEndDateFa']= null;
        						profile ['dPrecentage']= 0;
        						profile ['dNote']= null;
        					}
        					console.log('profile');		  
        					console.log(profile);
            				res.json([profile]);	
            		}
            	});
            }       
        	else {
        		var array = [{ "err": "err_invalid_password"}];
    			res.json(array);       
        	}
    	}
    });
});


router.get('/business/deleteuser/:email/:sid', function(req, res) {
    console.log('/business/deleteuser');
	res.set({'Access-Control-Allow-Origin': '*'});
	var db = req.db;
	var error=null;
    var email = req.params.email;
    var sId = req.params.sid;
    console.log(email);
    console.log(sId);
	db.collection('business_users').remove({buEmail:email}, function(err, result) {
    	if (err == null) {
    		console.log('User account deleted');
    		db.collection('stores').remove({sId:sId}, function(err, result) {
    			console.log('Store account deleted');
    			if (err == null) {
  					res.send(JSON.stringify({ "result": "success"}));      		
  				}
        		else {
 					res.send(JSON.stringify({ "err": "invalid_store"}));       		
 				}
        	});
        }
        else {
			res.send(JSON.stringify({ "err": "invalid_user"}));    	
		}
    });       
});
    		
router.post('/business/updateuser', function(req, res) {
    console.log('/business/updateuser');
	var error=null;
    var db = req.db;
	res.set({'Access-Control-Allow-Origin': '*'});
	    
	db.collection('business_users').remove({buId:req.body.buId}, function(err, result) {
        	if (err == null) {
        		console.log('old user info deleted');
        		var newUser = {
        			'buId': req.body.buId,
        			'buEmail':req.body.buEmail,
        			'buPassword':req.body.buPassword,
        			'buCityName':req.body.buCityName,
        			'buCityNameFa':req.body.buCityNameFa,
        			'buBrandId':req.body.buBrandId,
        			'buBrandName':req.body.buBrandName,
        			'buBrandCategory':req.body.buBrandCategory,
        			'buStoreName':req.body.buStoreName,
        			'buStoreAddress':req.body.buStoreAddress,
        			'buStoreHours':req.body.buStoreHours,
        			'buDistributor':req.body.buDistributor,
        			'buStoreLat':req.body.buStoreLat,
        			'buStoreLon':req.body.buStoreLon,
        			'buAreaCode':req.body.buAreaCode,
        			'buTel':req.body.buTel,
        			'buStoreId':req.body.buStoreId,
        			'buBrandLogoName':req.body.buBrandLogoName
    			}
    			
    			db.collection('business_users').insert(newUser, function(err, result){
        		if (err === null) {
        			console.log('updated user info added');
        		}
        		else {
        			error = err;
        		}	
        	});
    	}
    	else {
    		error = err;
    	}});
    	
    	if (error != null){
    		var array = [{ "result": "failed"}];
    		res.json(array);
    	}
    	else {
    		var array = [{ "result": "success"}];
        	res.json(array); 
        }
    });

 
router.post('/business/adduser', function(req, res) {
    console.log('/business/adduser');
    var db = req.db;
    var buId = 0;
    var sId = 0;
    var error=null;
	res.set({'Access-Control-Allow-Origin': '*'});
	
    
    // 1) Find Stats
    db.collection('stats').findOne({},function (err,doc) {
        
        if (err!=null)
        	error = err;
        	 
        if (doc){
            sId=(parseInt(doc.numStores)+1).toString();
            buId=(parseInt(doc.numBusinessUsers)+1).toString();
            
        	console.log('add user: sId'+sId + ' business user id'+buId);
        	
        	// 2) Add new user	
        	var newUser = {
        		'buId': buId,
        		'buEmail':req.body.buEmail,
        		'buPassword':req.body.buPassword,
        		'buCityName':req.body.buCityName,
        		'buCityNameFa':req.body.buCityNameFa,
        		'buBrandId':req.body.buBrandId,
        		'buBrandName':req.body.buBrandName,
        		'buBrandCategory':req.body.buBrandCategory,
        		'buStoreName':req.body.buStoreName,
        		'buStoreAddress':req.body.buStoreAddress,
        		'buStoreHours':req.body.buStoreHours,
        		'buDistributor':req.body.buDistributor,
        		'buStoreLat':req.body.buStoreLat,
        		'buStoreLon':req.body.buStoreLon,
        		'buAreaCode':req.body.buAreaCode,
        		'buTel':req.body.buTel,
        		'buStoreId':sId,
        		'buBrandLogoName':req.body.buBrandLogoName
    		}
    
    		db.collection('business_users').insert(newUser, function(err, result){
        		if (err === null) {
        			console.log('new user doc added');
        		   
        		    // 3) Add store
        			var newStore = {
        				'bId': req.body.buBrandId,
        				'sId':sId,
        				'sName':req.body.buStoreName,
        				'bName':req.body.buBrandName,
        			    'bCategory':req.body.buBrandCategory,
        			    'bDistributor':req.body.buDistributor,
        			    'sCity':req.body.buCityNameFa,
        			    'sAddress':req.body.buStoreAddress,
        			    'sHours':req.body.buStoreHours,
        			    'sAreaCode':req.body.buAreaCode,
        			    'sTel1':req.body.buTel,
        			    'sTel2':'',
        			    'sLat':req.body.buStoreLat,
        			    'sLong':req.body.buStoreLon,
        			    'sVerified':'No',
        			    'bLogo':req.body.buBrandLogoName
    				}
        	
        			db.collection('stores').insert(newStore, function(err, result){
        			if (err === null) {
        				console.log('new store doc added');
        				
        				// 4) Update Stats
        				doc.numBusinessUsers=buId;
        				doc.numStores=sId;
        				db.collection('stats').update({},doc, function (err,result){
        					if (err === null) {
        						console.log('stats updated');
        					}
        					else {
        						error = err;
        					}
        				});
        			}
        			else {
        				error=err;
        			}
        		
    			});	
        	}
        	else {
        		error = err;
        	}
        });
      }
    });	
    
    if (error != null){
    	var array = [{ "result": "failed"}];
    	res.json(array);
    }
    else {
    	var array = [{ "result": "success"}];
        res.json(array); 
    }
});

router.post('/business/ad/displays', function(req, res) {
    console.log('post: /business/ad/displays');
	var error=null;
    var db = req.db;
    console.log(db);
	res.set({'Access-Control-Allow-Origin': '*'});
	
	var date = (new Date()).toISOString()
	
	var rec = {
        'name': req.body.name,
        'screen':req.body.screen,
        'type':req.body.type,
        'device':req.body.device,
        'lat':req.body.lat,
        'long':req.body.long,
        'date':date	
    }
	
	console.log(rec);
	
	db.collection('ad_displays').insert(rec, function(err, result) {
    	if (err === null) {
    			console.log(req.body + ' added.' );
    			var array = [{ "result": "success"}];
        		res.json(array);
    		}
       		else {
        		console.log('Error: '+ err.name + ': ' + err.message);
    			error = err;
    			var array = [{ "result": "failed","err":error.message}];
    			res.json(array);
        }	  
	});
});


router.post('/interests', function(req, res) {
    console.log('post: /users/interests');
	var error=null;
    var db = req.db;
    console.log(db);
	res.set({'Access-Control-Allow-Origin': '*'});
	
	var recArrayStr = req.body.interests;
	var recArray = eval('(' + recArrayStr + ')');
	var recNo = recArray.length;
	var counter = 0;
	 
	recArray.forEach(function(rec) {
    	db.collection('users_interests').insert(rec, function(err, result) {
    		if (err === null) {
        			console.log('Rec '+String(counter) + ' added.' );
        		}
        		else {
        			console.log('Error: rec'+String(counter) + ' ' + err.name + ': ' + err.message);
        			error = err;
        		}	
    		
    		counter = counter + 1;
    		if (counter === recNo){
    			if (error != null){
    				var array = [{ "result": "failed","err":error.message}];
    				res.json(array);
    			}
    			else {
    				var array = [{ "result": "success"}];
        			res.json(array); 
        		}
    		}
    	}
	  )  
	});
});


router.post('/analytics', function(req, res) {
    console.log('post: /users/analytics');
	var error=null;
    var db = req.db;
    console.log(db);
	res.set({'Access-Control-Allow-Origin': '*'});
	
	var recArrayStr = req.body.analytics;
	var recArray = eval('(' + recArrayStr + ')');
	var recNo = recArray.length;
	var counter = 0;
	 
	recArray.forEach(function(rec) {
    	db.collection('users_analytics').insert(rec, function(err, result) {
    		if (err === null) {
        			console.log('Rec '+String(counter) + ' added.' );
        		}
        		else {
        			console.log('Error: rec'+String(counter) + ' ' + err.name + ': ' + err.message);
        			error = err;
        		}	
    		
    		counter = counter + 1;
    		if (counter === recNo){
    			if (error != null){
    				var array = [{ "result": "failed","err":error.message}];
    				res.json(array);
    			}
    			else {
    				var array = [{ "result": "success"}];
        			res.json(array); 
        		}
    		}
    	}
	  )  
	});
});





router.post('/register', function(req, res) {
    console.log('post: /users/register');
	var error=null;
    var db = req.db;
    var deviceToken = req.body.device;
    var city = req.body.city;
    res.set({'Access-Control-Allow-Origin': '*'});
	 
	db.collection('user_device').remove({device:deviceToken}, function(err, result) {
        	if (err == null) {
        		console.log('old device info deleted');
        	
        		var newUser = {
        			'device': deviceToken,
        			'city':city	
        		}
    			
    			db.collection('user_device').insert(newUser, function(err, result){
        		if (err === null) {
        			console.log('new device info added');
        		}
        		else {
        			error = err;
        		}	
        	});
    	}
    	else {
    		error = err;
    	}});
    	
    	if (error != null){
    		var array = [{ "result": "failed"}];
    		res.json(array);
    	}
    	else {
    		var array = [{ "result": "success"}];
        	res.json(array); 
        }
    }); 
	 
	 
router.post('/register/android', function(req, res) {
    console.log('post: /users/register/android');
	var error=null;
    var db = req.db;
    var deviceToken = req.body.device;
    var city = req.body.city;
    res.set({'Access-Control-Allow-Origin': '*'});
	 
	db.collection('user_device').remove({device:deviceToken}, function(err, result) {
        	if (err == null) {
        		console.log('old device info deleted');
        	
        		var newUser = {
        			'device': deviceToken,
        			'city':city,
        			'type':'android'	
        		}
    			
    			db.collection('user_device').insert(newUser, function(err, result){
        		if (err === null) {
        			console.log('new device info added');
        		}
        		else {
        			error = err;
        		}	
        	});
    	}
    	else {
    		error = err;
    	}});
    	
    	if (error != null){
    		var array = [{ "result": "failed"}];
    		res.json(array);
    	}
    	else {
    		var array = [{ "result": "success"}];
        	res.json(array); 
        }
    }); 
	 
	 

router.get('/testNotification', function(req, res)
{
	var pushTokens = ['<9c4adf5d ac790fbb d5929bd6 016b825e 3cc4c3e7 82debdeb 567c640c 360169d2>'];
	var messageDetails = {
		alert: {
			title: 'AslBekhar',
			body: 'به اصل بخر خوش آمدید'
		},
		payload: {'id': '1522'},
		badge: 0,
		mode: '',
		category: ''
	};
	var options = {'sound': '', 'content-available' : 0};
	console.log("Sending alert with messageDetails " + JSON.stringify(messageDetails));
    apnsComm.pushNotification(pushTokens, messageDetails, options);
    res.send('Notification sent at ' + new Date() + '!');
});

/*
router.get('/business/testPushNotification', function(req, res) {
    console.log('/business/testPushNotification');
	res.set({'Access-Control-Allow-Origin': '*'});
	var db = req.db;
	var error=null;
    
    var pushTokens;
    var messageDetails = {
		badge: 0
	};
	
	pushTokens = ['<7cc86555 74e42db0 74fde08f 6820844e 086ca3b7 96ee33cc 33b95156 81ef87cd>'];

	messageDetails.alert = {
		title: 'AslBekhar',
		body: 'Hello Push Notification'
	};
	
	messageDetails.payload = 'Test Payload';
	messageDetails.mode = 'buyer';
	messageDetails.category = '';
	console.log('Sending active push notification to phone with messageDetails ' + JSON.stringify(messageDetails));
	apnsComm.pushNotification(pushTokens, messageDetails, apnsComm.pushOptions.active);
	
	if (error != null){
    	var array = [{ "result": "failed"}];
    	res.json(array);
    }
    else {
    	var array = [{ "result": "success"}];
        res.json(array); 
    }
    
});
*/


module.exports = router;
