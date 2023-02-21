## Performance

The server is hosted by Cloudflare Worker which means heavy load shouldn't be an issue. However, if many requests are made in a short period of time for data that isn't cached, the API that is being used to fetch the data might block the requests. At the moment, there aren't enough users for this to be a problem.