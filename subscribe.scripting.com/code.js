var myProductName = "subscribeScriptingCom", myVersion = "0.6.1";

const urlMailListServer = "https://maillist2.scripting.com/";

var globals = {
	flUnsub: false, //12/31/25 by DW
	emailAddress: undefined,
	};

function sendConfirmingEmail (email, flSubscribe, callback) {
	var paramtable = {
		email: email,
		urlwebapp: stringNthField (window.location.href, "?", 1),
		subscribe: flSubscribe,
		captcharesponse: grecaptcha.getResponse () //8/21/25 by DW
		}
	console.log ("sendConfirmingEmail: paramtable == " + jsonStringify (paramtable));
	var url = urlMailListServer + "confirmemail?" + twBuildParamList (paramtable, false);
	$.ajax ({
		type: "GET",
		url: url,
		success: function (data) {
			callback (undefined, data);
			},
		error: function (status, something, otherthing) { 
			var err = JSON.parse (status.responseText);
			console.log ("sendConfirmingEmail: err == " + jsonStringify (err));
			callback (err);
			},
		dataType: "json"
		});
	}
function confirmEmailCode (theCode, callback) {
	var paramtable = {
		code: theCode
		}
	var url = urlMailListServer + "confirmemailcode?" + twBuildParamList (paramtable);
	$.ajax ({
		type: "GET",
		url: url,
		success: function (data) {
			callback (undefined, data);
			},
		error: function (status, something, otherthing) { 
			var err = JSON.parse (status.responseText);
			console.log ("confirmEmailCode: err == " + jsonStringify (err));
			callback (err);
			},
		dataType: "json"
		});
	}
function confirmButtonClick () {
	const flSubscribe = !globals.flUnsub;
	
	var emailAddress; //2/1/26 by DW
	if (flSubscribe) { //2/1/26 by DW
		emailAddress = $("#idEmailAddress").val ();
		}
	else {
		emailAddress = globals.emailAddress; //unsubbing, the address came in this way
		}
	emailAddress = trimWhitespace (emailAddress);
	console.log ("confirmButtonClick: emailAddress == " + emailAddress);
	
	sendConfirmingEmail (emailAddress, flSubscribe, function (err, data) {
		var theAlert;
		if (err) {
			theAlert = "Couldn't send the confirmation because there was an error: " + err.message;
			}
		else {
			theAlert = "A confirmation email has been sent.";
			}
		alertDialog (theAlert);
		});
	}
function getURLParameter (name) {
	return (decodeURI ((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]));
	}
function checkEmailConfirmParams () {
	var theCode = getURLParameter ("emailConfirmCode");
	if (theCode != "null") {
		console.log ("checkEmailConfirmParams: theCode == " + theCode);
		confirmEmailCode (theCode, function (err, data) {
			var theAlert;
			if (err) {
				theAlert = "Couldn't confirm the subscription because there was an error: " + err.message;
				}
			else {
				if (data.flSub) {
					theAlert = "Thanks for subscribing!";
					}
				else {
					theAlert = "Unsubscribed.";
					}
				}
			alertDialog (theAlert, function () {
				window.location.href = "http://scripting.com/"; //redirect
				});
			});
		}
	}
function checkEmailUnsub () { 
	var unsub = getURLParameter ("unsub");
	if (unsub == "true") {
		globals.flUnsub = true; //12/31/25 by DW
		$("#idEmailAddress").css ("display", "none");
		$("#tdInput").css ("display", "none");
		$("#idConfirmButton").attr ("value", "Unsub");
		globals.emailAddress = getURLParameter ("email");
		}
	}
function getPrefsFromServer (callback) {
	twGetFile (fnamePrefs, true, true, function (err, data) {
		if (!err) {
			var jstruct = JSON.parse (data.filedata);
			for (var x in jstruct) {
				appPrefs [x] = jstruct [x];
				}
			console.log ("getPrefsFromServer: appPrefs == " + jsonStringify (appPrefs));
			}
		if (callback !== undefined) {
			callback ();
			}
		});
	}
function savePrefsOnServer (callback) {
	appPrefs.ctPrefsSaves++;
	appPrefs.whenLastPrefsSave = new Date ();
	twUploadFile (fnamePrefs, jsonStringify (appPrefs), "application/json", true, function (data) {
		if (callback !== undefined) {
			callback ();
			}
		});
	}

function connectToTwitter () {
	twConnectToTwitter ();
	}
function prefsChanged () {
	flPrefsChanged = true;
	}
function everySecond () {
	if (flPrefsChanged) {
		flPrefsChanged = false;
		savePrefsOnServer ();
		}
	}
function startup () {
	console.log ("startup: myVersion == " + myVersion);
	checkEmailConfirmParams (); //redirects if they're there -- 8/17/19 by DW
	checkEmailUnsub (); //8/20/19 by DW
	hitCounter (); //12/31/25 by DW 
	}
