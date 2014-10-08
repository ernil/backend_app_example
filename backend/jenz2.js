var http = require('http');
var port = parseInt(process.env.PORT,10);
var request = require("request");

var MongoClient = require('mongodb').MongoClient
   , format = require('util').format;


function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};




var server = http.createServer(function (req, res) {
	
	if (req.method == 'POST') {
		
		
		// fetch my settings, cache for 15 min
		request("http://staging.innomdc.com/v1/companies/203/buckets/mondify-with-alchemy/apps/alchemy/settings?app_key=ksdf239", function(error, response, body) {
		

			var settings = JSON.parse(body);
			var alchemyKey = settings["alchemy_key"];
			var entitiesToExtract = settings["entities"];
			
			
		}
		
	        console.log("POST");
	        var body = '';
	        req.on('data', function (data) {
	            body += data;

	        });
	        req.on('end', function () {
				console.log("received from stream: " + body);
				
				// parsing the profile to get URL and Profile ID
				var url = JSON.parse(body)['filledRule']['fieldSets'][0]['fields'][0]['value'];
				var profileId = JSON.parse(body)['filledRule']['fieldSets'][0]['fields'][1]['value'];
				
	            console.log("URL visited: " + url);
				console.log("Profile ID: " + profileId);
	
	
				// making the entity extraction call
				request("http://access.alchemyapi.com/calls/url/URLGetRankedNamedEntities?apikey=b158f532d03460bcaed7e88e80f0a07930f80ae2&url=" + url + "&outputMode=json", function(error, response, body) {

				var parsed = JSON.parse(body);

				var interests = [];
				for(var i=0;i<parsed.entities.length;i++){
					e = parsed.entities[i];
					if(e.type="FieldTerminology") interests.push(e.text);
					if(interests.length>=3) break;

				}

				console.log("interests: " + interests);
				
				
				// getting the profile to check current interests
				request("http://staging.innomdc.com/v1/companies/203/buckets/mondify-with-alchemy/profiles/" + profileId + "?app_key=ksdf239", function(error, response, body) {
				

					var receivedProfile = JSON.parse(body).profile;
				
					console.log("Received profile object: " + receivedProfile);
				
					var currentInterests;
				
					if(receivedProfile.attributes && receivedProfile.attributes[0] && receivedProfile.attributes[0].data.mai)
						currentInterests = receivedProfile.attributes[0].data.mai;
					else
						currentInterests = [];
				
						console.log("current interests: " + currentInterests);

				
				

					var newInterests = arrayUnique(currentInterests.concat(interests));
				
					console.log("merged interests: " + newInterests);
				
				
					// making the call to Profile API
					var attr = {};
					attr.collectApp = "dc9369b6-d437-4967-a94f-2995766cc79e";
					attr.section = "derived-data";
					attr.data = {"mai":newInterests};

					var a = {};
					a.id= profileId;
					a.attributes = [];
					a.attributes.push(attr);


					request.post({
				  		headers: {'content-type' : 'application/json'},
				  		url:     'http://staging.innomdc.com/v1/companies/203/buckets/mondify-with-alchemy/profiles/' + profileId + '?app_key=ksdf239',
				  		body:    JSON.stringify(a)
					}, function(error, response, body){
				  //console.log(body);
						});
				
					});
				

				});
	
	
	        });
	        res.writeHead(200, {'Content-Type': 'text/html'});
	        res.end('post received');
	    }
	else
	    {
	        console.log("GET");

	
			request("http://staging.innomdc.com/v1/companies/203/buckets/mondify-with-alchemy/profiles/x14yvps00dnku1a7e6kic0h0urgnwxce?app_key=ksdf239", function(error, response, body) {
			

				var receivedProfile = JSON.parse(body).profile;
				
				if(receivedProfile.attributes && receivedProfile.attributes[0] && receivedProfile.attributes[0].data.mai)
					currentInterests = receivedProfile.attributes[0].data.mai;
				else
					currentInterests = [];
			
				
  				res.writeHead(200, {'Content-Type': 'text/plain'});

				res.end('Serve ad based on interests: ' + currentInterests);
				
				//res.end('Running! (Environment variables: ' + process.env.VCAP_SERVICES + ')');
			});

} // end GET case

});

server.listen(port, '0.0.0.0');


