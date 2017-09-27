/***
*	This code uses the GitHub graphQL API to query for all pull requests from a specified organization (currently 'lodash')
*	Since the API only allows 100 object responses per query, we need to maintain pointers to 'paginate' through the query 
* 	results, both for the repos and pull requests. Once all pull requests have been retrieved, the 'complete' function is called.
***/


var client = require('./GraphQLClient');

/** User authentication token **/
var token = '8639a0bd1bf3034e358f4aa75076219b0b5accb6';

//Base queries used to contact API
var queryReposBase = '{ organization(login:"lodash"){ repositories(first:100 after:"%x"){ totalCount edges { node { ';
var queryPullRequestsBase = 'pullRequests (first:100 after:"%y") { totalCount pageInfo{ endCursor } edges { node { author { login } databaseId merged mergedAt } } } } } pageInfo{ endCursor } } } }'

//Replace base query with empty strings (no pointers yet)
var newQuery = queryReposBase.replace('after:"%x"', '') + queryPullRequestsBase.replace('after:"%y"', '');
var request = client.makeRequest(newQuery, token, main);

/**
* Main program loop to retrieve all PullRequests from all Repos
**/
function main(response) {
	
	var allRepos = new Array();
	var allPullRequests = new Array();
	//Store current query
	var repoQuery = queryReposBase.replace('after:"%x"', '');
	var totalPRCount;
	//Begin looping through repositories
	getRepositories(response);
	
	/**
	* Using a GitHub graphQL response, go through each repository, saving to memory.
	* Then, query all pull requests for each repo set.
	**/
	function getRepositories(response) {
		var repos = getReposFromResponse(response);
		//Keep track of all repositories as we move through
		allRepos = allRepos.concat(repos.edges);
		
		//If there are still more repositories, continue querying
		if (allRepos.length < repos.totalCount) {
			
			//Query all pull requests
			getAllPullRequests(repoQuery, response);
			
			//Update cursor with new Repo end point
			var endCursor = repos.pageInfo.endCursor;
			var newQuery = queryReposBase.replace('%x', endCursor) + queryPullRequestsBase.replace('after:"%y"', '');
			
			//Query again with new cursor
			executeBoundQueryRequest(newQuery,token,getRepositories);
			
			repoQuery = queryReposBase.replace('%x', endCursor);
			
		//If there aren't any more repositories, we are done
		} else {
			setTotalPRCount(allRepos);
			
			//Still need to retrieve the last pull request set.
			getAllPullRequests(repoQuery, response);
		}
	}
	
	/**
	* Using a current set of repos, save all PullRequests to memory.
	**/
	function getAllPullRequests(query, response) {
		
		var repos = getReposFromResponse(response);

		//Loop through all repositories
		repos.edges.forEach( function(element,index) {
			
			var allRepoPullRequests = new Array();
			//Use closure to keep track of current index
			getPullRequests(response);
			
			/**
			* Given the current repository (using index), load all PullRequests into memory.
			**/
			function getPullRequests(response) {
				
				var pullRequests = getAllPullRequestsFromRepo(response,index);
				allRepoPullRequests = allRepoPullRequests.concat(pullRequests.edges);
				
				//If there are still more pull requests, continue querying.
				if (allRepoPullRequests.length < pullRequests.totalCount) {
					
					//Update pull request cursor
					var endCursor = pullRequests.pageInfo.endCursor;
					var newQuery = query + queryPullRequestsBase.replace('%y', endCursor);
					
					//Query again with new cursor
					executeBoundQueryRequest(newQuery,token,getPullRequests);
					
				//At this point, we have exhausted all pull requests for this repo
				} else {
					//Save to master PR array
					allPullRequests = allPullRequests.concat(allRepoPullRequests);
					
					//If we have reached the full count, then we are finished.
					if (totalPRCount && (allPullRequests.length === totalPRCount)) {
						complete(allPullRequests);
					}
				}
			}
			
		});
	}
	
	/**
	* Since Node.js is async, we need to know how many total PR we have before 
	* we know we are finished. This is called after we know how many repos we have.
	**/ 
	function setTotalPRCount(allRepos) {
		var totalCount = 0;
		
		//Loop through all repos and get total count of pull requests from each
		allRepos.forEach( function(element,index) {
			var pullRequestCount = element.node.pullRequests.totalCount;
			totalCount += pullRequestCount;
			
		});
		totalPRCount = totalCount;
	}

	
	/**
	* Convenience function to get repositories from a graphQL JSON response
	*/ 
	function getReposFromResponse(response) {
		return response.data.organization.repositories;
	}
	
	/**
	* convenience function to get a set of pull requests from a graphQL response
	**/
	function getAllPullRequestsFromRepo(response, index) {
		return response.data.organization.repositories.edges[index].node.pullRequests;
	}
	
	/**
	* This function forces binding the current scope to the function to prevent any async weirdness
	**/
	function executeBoundQueryRequest(query, token, callback) {
		var execute = client.makeRequest;
		var boundExecute = execute.bind(client);
		boundExecute(query,token,callback);
	}
	
	/**
	* Final callback function to allow further parsing
	**/
	function complete(pullRequests) {
		console.log(pullRequests.length);
	}


}

