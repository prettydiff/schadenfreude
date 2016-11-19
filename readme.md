# Uptime Dashboard

## Instructions

### From the terminal
1. `git clone git@ewegithub.sb.karmalab.net:Omega/hackathon-2016.git`
2. `node service.js`

### From the browser
3. Go to https://localhost:9001

If you are in an environment with an unstable network or unreliable services you will need some help.  TCP timeouts will break this simple Node service.  Here is a quick alternative approach:

1. `npm install forever -g`
2. `forever start service.js`
3. Go to https://localhost:9001 in the browser

## Notes

* I am not formatting the data response, because I don't know what your data looks like.  The data comes back in a function called *ajax*.
* Enjoy random background images that stretch to fit the view port by creating a directory named *images* and putting 11 images in there named: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.  Finally uncomment line 974 in the interaction.js file.

Enjoy!
