#### 8/18/25; 8:52:12 PM by DW

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

