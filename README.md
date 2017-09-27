GitHub pull request tool. 

This code uses the GitHub graphQL API to query for all pull requests from a specified organization (currently 'lodash').
Since the API only allows 100 object responses per query, we need to maintain pointers to 'paginate' through the query results, both for the repos and pull requests. Once all pull requests have been retrieved, the 'complete' function is called.

GraphQLClient is responsible for making HTTP requests to the GitHub GraphQL API, and GetPullRequests is responsible for making the original queries and parsing them.