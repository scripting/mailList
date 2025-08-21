const myProductName = "davemaillist", myVersion = "0.4.7"; 

const AWS = require ("aws-sdk");
const utils = require ("daveutils");
const mail = require ("davemail");
const davehttp = require ("davehttp"); 
const fs = require ("fs");

exports.sendConfirmingEmail = sendConfirmingEmail;
exports.confirmEmailCode = confirmEmailCode;
exports.start = start;

var config = {
	fnameStats: "data/stats.json",
	dataFolder: "data/", 
	fnameEmailTemplate: "emailtemplate.html", 
	ctSecsConfirmationTimeout: 30 * 60,
	fnameEmailPrefs: "data/emailPrefs.json", 
	pathPrefsArchive: "data/archive/",
	blogTitle: "Scripting News", 
	confirmSubscribeSubject: "Please confirm your email address",
	confirmUnsubSubject: "Confirm to unsubscribe",
	confirmOperationSubscribe: " your subscription",
	confirmOperationUnsub: "",
	httpPort: 1401,
	flLogToConsole: true, 
	flAllowAccessFromAnywhere: true, 
	flPostEnabled: false
	};
const fnameConfig = "config.json";

var stats = {
	productName: myProductName,
	version: myVersion,
	ctSubscriptions: 0,
	whenLastSubscribe: new Date (0),
	ctStartups: 0,
	whenLastStartup: new Date (0),
	ctHits: 0,
	whenLastHit: new Date (0),
	ctHitsThisRun: 0,
	pendingConfirmations: new Array () 
	};
var flStatsChanged = false;

function statsChanged () {
	flStatsChanged = true;
	}
function addOrRemoveSubscription (obj) {
	var f = config.fnameEmailPrefs, now = new Date ();
	function countSubs (theList) {
		var ct = 0;
		for (var x in theList) {
			if (theList [x].enabled) {
				ct++;
				}
			}
		return (ct);
		}
	utils.sureFilePath (f, function () {
		fs.readFile (f, function (err, data) {
			var theList = new Object ();
			if (!err) {
				try {
					theList = JSON.parse (data);
					}
				catch (err) {
					}
				}
			var key = obj.email.toLowerCase ();
			theList [key] = {
				when: now.toLocaleString (),
				enabled: obj.flSub
				};
			if (obj.email != key) { //it has some uppercase chars
				theList [key].emailActual = obj.email;
				}
			
			stats.ctSubscriptions = countSubs (theList); //8/30/19 by DW
			stats.whenLastSubscribe = now;
			statsChanged ();
			
			fs.writeFile (f, utils.jsonStringify (theList), function (err) {
				});
			
			var farchive = config.pathPrefsArchive + utils.getDatePath (now, false) + ".json"; //11/18/19 by DW
			utils.sureFilePath (farchive, function () {
				fs.writeFile (farchive, utils.jsonStringify (theList), function (err) {
					});
				});
			});
		});
	}
function timeoutEmailConfirmations () { //delete pending confirmations that are too old
	for (var i = stats.pendingConfirmations.length - 1; i >= 0; i--) {
		var obj = stats.pendingConfirmations [i];
		if (utils.secondsSince (obj.when) > config.ctSecsConfirmationTimeout) {
			console.log ("timeoutEmailConfirmations: obj == " + utils.jsonStringify (obj));
			stats.pendingConfirmations.splice (i, 1);
			statsChanged ();
			}
		}
	}
function getRandomPassword (ctchars) { //NPM is refusing the recognize package updates, so I'm replicating code ugh
	var s= "", ch;
	while (s.length < ctchars)  {
		ch = String.fromCharCode (utils.random (33, 122));
		if (utils.isAlpha (ch) || utils.isNumeric (ch)) {
			s += ch;
			}
		}
	return (s.toLowerCase ());
	}
function sendConfirmingEmail (email, urlWebApp, flSub, callback) {
	console.log ("sendConfirmingEmail: email == " + email + ", flSub == " + flSub + ", urlWebApp == " + urlWebApp);
	var magicString = getRandomPassword (10);
	if (utils.endsWith (urlWebApp, "#")) { //delete # at end of url if present
		urlWebApp = utils.stringDelete (urlWebApp, urlWebApp.length, 1); 
		}
	var obj = {
		magicString: magicString,
		urlWebApp: urlWebApp,
		email: email,
		flSub: flSub,
		when: new Date ()
		};
	stats.pendingConfirmations.push (obj);
	statsChanged ();
	console.log ("sendConfirmingEmail: obj == " + utils.jsonStringify (obj));
	var params = {
		title: (flSub) ? config.confirmSubscribeSubject : config.confirmUnsubSubject,
		blogTitle: config.blogTitle,
		operationToConfirm: (flSub) ? config.confirmOperationSubscribe : config.confirmOperationUnsub,
		confirmationUrl: urlWebApp + "?emailConfirmCode=" + encodeURIComponent (magicString)
		};
	fs.readFile (config.fnameEmailTemplate, function (err, emailTemplate) {
		if (err) {
			console.log ("sendConfirmingEmail: err.message == " + err.message);
			}
		else {
			var mailtext = utils.multipleReplaceAll (emailTemplate.toString (), params, false, "[%", "%]");
			mail.send (email, params.title, mailtext, "dave@scripting.com", function (err, data) {
				if (err) {
					callback (err);
					}
				else {
					callback (undefined, obj);
					}
				});
			fs.writeFile ("data/lastmail.html", mailtext, function (err) {
				});
			}
		});
	}
function confirmEmailCode (theCode, callback) {
	var flfound = false;
	console.log ("confirmEmailCode: theCode == " + theCode);
	stats.pendingConfirmations.forEach (function (obj) {
		if (obj.magicString == theCode) {
			obj.whenConfirmed = new Date ();
			addOrRemoveSubscription (obj);
			console.log ("confirmEmailCode: obj == " + utils.jsonStringify (obj));
			callback (undefined, obj);
			flfound = true;
			}
		});
	if (!flfound) {
		callback ({message: "The code is not valid or has expired."});
		}
	}

function handleHttpRequest (theRequest) {
	var params = theRequest.params;
	
	stats.ctHits++;
	stats.ctHitsThisRun++;
	stats.whenLastHit = new Date ();
	statsChanged ();
	
	function returnData (jstruct) {
		if (jstruct === undefined) {
			jstruct = {};
			}
		theRequest.httpReturn (200, "application/json", utils.jsonStringify (jstruct));
		}
	function returnNotFound () {
		theRequest.httpReturn (404, "text/plain", "Not found.");
		}
	function returnError (jstruct) {
		console.log ("returnError: jstruct == " + utils.jsonStringify (jstruct));
		theRequest.httpReturn (500, "application/json", utils.jsonStringify (jstruct));
		}
	function httpReturn (err, jstruct) {
		if (err) {
			returnError (err);
			}
		else {
			returnData (jstruct);
			}
		}
	function returnStats () {
		var briefStats = new Object ();
		utils.copyScalars (stats, briefStats);
		returnData (briefStats);
		}
	switch (theRequest.method) {
		case "GET":
			switch (theRequest.lowerpath) {
				case "/":
					confirmEmailCode (params.emailConfirmCode, httpReturn);
					return (true);
				case "/confirmemail": 
					sendConfirmingEmail (params.email, params.urlwebapp, utils.getBoolean (params.subscribe), httpReturn);
					return (true); 
				case "/confirmemailcode": 
					confirmEmailCode (params.code, httpReturn);
					return (true); 
				}
		}
	return (false); //we didn't handle it
	}
function readConfig (callback) {
	utils.sureFilePath (fnameConfig, function () {
		fs.readFile (fnameConfig, function (err, data) {
			if (!err) {
				try {
					var jstruct = JSON.parse (data.toString ());
					for (var x in jstruct) {
						config [x] = jstruct [x];
						}
					}
				catch (err) {
					console.log ("readConfig: err == " + err.message);
					}
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
function readStats (callback) {
	utils.sureFilePath (config.fnameStats, function () {
		fs.readFile (config.fnameStats, function (err, data) {
			if (!err) {
				try {
					var jstruct = JSON.parse (data.toString ());
					for (var x in jstruct) {
						stats [x] = jstruct [x];
						}
					}
				catch (err) {
					}
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
function writeStats (callback) {
	utils.sureFilePath (config.fnameStats, function () {
		fs.writeFile (config.fnameStats, utils.jsonStringify (stats), function (err) {
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
function everyMinute () {
	}
function everySecond () {
	timeoutEmailConfirmations ();
	if (flStatsChanged) {
		flStatsChanged = false;
		writeStats ();
		}
	}
function start (configParam, callback) {
	console.log ("\n" + myProductName + " v" + myVersion + "\n");
	readConfig (function () {
		if (configParam !== undefined) {
			for (x in configParam) {
				config [x] = configParam [x];
				}
			}
		console.log (myProductName + ".start: config == " + utils.jsonStringify (config));
		readStats (function () {
			stats.productName = myProductName;
			stats.version = myVersion;
			stats.whenLastStartup = new Date ();
			stats.ctStartups++;
			stats.ctHitsThisRun = 0;
			statsChanged ();
			
			var httpConfig = {
				port: config.httpPort,
				flLogToConsole: config.flLogToConsole,
				flAllowAccessFromAnywhere: config.flAllowAccessFromAnywhere,
				flPostEnabled: config.flPostEnabled
				};
			davehttp.start (httpConfig, handleHttpRequest);
			setInterval (everySecond, 1000); 
			utils.runEveryMinute (everyMinute);
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
