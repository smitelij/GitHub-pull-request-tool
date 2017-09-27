
/**
* GraphQL request class
**/
module.exports = {

	/**
	* Add necessary options and headers
	**/
	makeRequest: function(query, token, callback) {
	
		var request = require('request');

		token = 'bearer ' + token;
		var queryJSON = {'query': query};

		var options = {
			'url': 'https://api.github.com/graphql',
			'json':true,
			'body': queryJSON,
			'headers': {
			  'Authorization': token,
			  'User-Agent': 'GraphQL Request',
			}
		};

		/**
		* Post HTTP
		**/
		request.post(
			options,
			postRequest
		);
		
		/**
		* receive results of HTTP
		**/ 
		function postRequest(error, response, body) {
			if (!error && response.statusCode == 200) {
				callback(body);
			} else {
				console.log('Unable to receive response.')
				console.log('Error: ' + error);
				console.log('Status Message: ' + response.statusMessage);
			}
		}
	}
	
}
