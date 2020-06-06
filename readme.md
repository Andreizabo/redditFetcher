# Reddit Fetcher  
Reddit Fetcher is an app that allows automatically downloading memes from Reddit at a modifiable rate and storing them on a local database.  
## How it works  
Every 10 minutes the app tries to download the top 10 memes on reddit, from the "/memes" subreddit. It verifies whether an image with the same details already exists for every meme, and if it doesn't it will store it locally with a custom generated name and add it to the database.  
  
All values are easily modifiable, including the subreddit the app downloads from.  
## Paths  
The "/memes" path provides the 10 latest downloaded memes from the database. There's a page system implemented, so accessing the next page will show the next 10 memes, until there are no more memes to show. Page navigation is done through the 2 buttons on the left and right.
  
The "/memes/id/*number*" path will only show one meme, the meme that has its database ID equal to *number*.  
## Languages & Technologies  
The whole app is written in [node.js](https://github.com/nodejs/node) and it uses [express](https://www.npmjs.com/package/express).   
## License  
[MIT](https://github.com/Andreizabo/redditFetcher/blob/master/LICENSE)
