# slack-timezoner
## Description
This app or bot, will permit a remote slack group arrange a meeting at a certain local time, and communicate the local time of other participants to avoid confusion and daylight saving issues. 

## Technical
The app is built with Node, Express.js, and MongoDB. It should interact with the slack API.
### Slack API Permisions
(fill here later the permitions we're using)

## Goals
### ~~1. The App should communicate with a simple hello world message to slack~~
~~Setup the express app with [express generator](https://expressjs.com/en/starter/generator.html), and have slash command communicate with a POST request that returns a hello world json to slack.~~
### ~~2. The App should have a slash command that returns a dropdown so you can set up your city (this could be changed later)
Use the [slack npm module](https://www.npmjs.com/package/slack) to simplify the workload and the interactions.~~
### 3. Plug in MongoDB with Mongoose to store users. 
Store the user data if the user does not exist, or update data if the user exists. 
### 4. TBD
