#### 2/1/26; 4:53:19 PM by DW

subscribe.scripting.com

* I made unsubbing work last time, and broke subbing. 

* Made a change, we need to get the mail address from the input box when we're subbing. We were sending undefined as the email address. It broke in the 12/31 change. The only reason that broke is I had to deal with a denial of service attack, so had to add the captcha. It would be so much easier if I could use Substack.

* added subscribe.scripting.com code to the github repo via the build script. Since it can have dealstopping bugs, it's time to include it in the freaking archive. ;-)

#### 12/31/25; 9:44:39 AM by DW

Unsubbing doesn't work, when you click the link in the email, it's supposed to just do it. 

Instead there's an error, possibly caused by the google add-in not having been loaded yet.

So i added a short timeout before calling it, and that worked.

But now there's another problem, apparently on the server side?

* yes it is. it needs the captcha to be valid, and we don't pause to let the user click the captcha, so it's always wrong. 

* so we have to change the flow, when we get a request to unsub we put up a message saying click the button to unsubscribe

* we don't leave room to set the email address, that's part of the request.

* with any luck then it will work.

* this is very difficult software to test, but this is embarrassing. since we added the captcha in august because we were being spammed, no one has been able to unsub this way. probably they did what i would do, if it was too annoying i'd just block it in my email app. but overall that's not good because we get a rep for being spam, which is deserved.

Also the source code for subscribe.scripting.com is in the source.opml file in the repo.

* Look for -- allservers:maine:pagepark:domains:subscribe.scripting.com:

#### 8/21/25; 10:44:24 AM by DW

Adding a captcha to the page because we're being abused.

In maillist.js it now looks for the captcha code in the params and sends them off to google to validate, if it says yes, we send the confirming email, if not, it's an error.

The client side is in subscribe.scripting.com, also included below. We include a bit of code from google in the page, and when the user clicks the subscribe button we ask google what the captcha code is and send it along to the server. 

captchaSecretKey is in config.json on the server.

The "site key" is embedded in the html source of index.html (it's the public key).

#### 8/18/25; 8:52:12 PM by DW -- hand-editing the mail list, it's just a json file

How to hand-edit the mail list.

* On the maine server look in maine/pagepark/domains/maillist2.scripting.com/data/emailPrefs.json.

* Open it in nano.

* Carefully make the change. 

* Save it.

* Restart the server so it reads the changed file.

* In the browser go to subscribe.scripting.com, and subscribe to an account. Confirm the subscription in the email it sends. 

* This will cause emailPrefs.json to be saved to a location on S3, /scripting/davemaillist/emailPrefs.json. You can open it to verify your changes got through in time for the next update. 

#### 4/26/25; 2:38:24 PM by DW

Getting everything off montana server, very old version of pagepark, and i can't change code up there, dropbox is turned off.

For a full map see the first worknote in the scriptingNightlyEmail2 project

