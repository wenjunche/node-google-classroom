/**
 * @license
 * Copyright Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'googletoken.json';

class Calendar {

  connect() {
    return new Promise((res, rej) => {
      // Load client secrets from a local file.
      fs.readFile('credentials-calendar.json', (err, content) => {
        if (err) {
           console.log('Error loading client secret file:', err);
           rej(err);
        } else {
          // Authorize a client with credentials, then call the Google Classroom API.
          this.authorize(JSON.parse(content)).then(() => res()).catch(err => rej(err));
        }
      });
    })
  }

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
  authorize(credentials) {
    return new Promise((res, rej) => {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      this.oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) { 
          this.getNewToken().then(() => res()).catch(err => rej(err));
        } else {
          this.oAuth2Client.setCredentials(JSON.parse(token));
          res();
        }
      });
    });
  }

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
 getNewToken() {
  return new Promise((res, rej) => {
      const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      this.oAuth2Client.getToken(code, (err, token) => {
        if (err) { 
          console.error('Error retrieving access token', err);
          rej(err);
        } else {
          this.oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) { 
              console.error(err);
              rej(err);
            } else {
              console.log('Token stored to', TOKEN_PATH);
              res();
            }
          });
        }
      });
    });
  });
}

/**
 * Lists the first 10 courses the user has access to.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
 listUpcomingEvents() {
  return new Promise((res, rej) => {
   const calendar = google.calendar({version: 'v3', auth: this.oAuth2Client});
      calendar.calendarList.list().then(d => {
          const items = d.data.items;
          console.log('items ', items.length);
          items.forEach(d => {
              console.log(d.id, d.summary);
          })
      });

      calendar.events.list({
        calendarId: 'ivc33hni8s323rmohn5opnj7ls@group.calendar.google.com',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, response) => {
          if (err) { 
            console.log('The API returned an error: ' + err);
            rej(err);
          } else {
            const items = response.data.items;
            if (items.length) {
              console.log(`Upcoming ${items.length} events:`);
              const events = [];
              items.map((item, i) => {
                const start = item.start.dateTime || item.start.date;
                const end = item.end.dateTime || item.end.date;
                console.log(JSON.stringify(item));
                events.push({summary: item.summary, location: item.location, start, end})
              });
              res(events);
            } else {
              console.log('No upcoming events found.');
              res([])
            }
        }
      });      
    });
  }
}

module.exports = Calendar;