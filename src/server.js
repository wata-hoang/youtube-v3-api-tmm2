const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

const Youtube = require('youtube-api');
const readJson = require('r-json');
const fs = require('fs');
const { google } = require('googleapis');

const DIRNAME = "."
const CREDENTIALS = readJson(`${DIRNAME}/client_secrets.json`);
const videoFilePath = './video.MOV';

const oauth = Youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: CREDENTIALS.web.redirect_uris[0]
});

const opn_url = oauth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"]
});
console.log('==============================================================================================');
console.log('Oauth2 URL:', opn_url);

app.get('/oauth2callback', (req, res) => {
    oauth.getToken(req.query.code, (err, token) => {
        if (err) {
            console.error('oauth2callback error', err);
        }
        oauth.setCredentials(token);

        uploadVideo(oauth, 'title', 'description')
    });
});

function uploadVideo(auth, title, description) {
    const service = google.youtube('v3');

    service.videos.insert({
        auth: auth,
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title,
                description,
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en'
            },
            status: {
                privacyStatus: "unlisted"
            },
        },
        media: {
            body: fs.createReadStream(videoFilePath),
        },
    }, function (err, response) {
        if (err) {
            console.error('The API returned an error: ' + err);
            return;
        }
        console.log('The API response:', response.data);
        const id = response.data.id;
        const youtube_url = `https://www.youtube.com/watch?v=${id}`;
        console.log('Video is uploaded successfully to Youtube: URL ', youtube_url);
    });
}





app.get('/', (req, res) => {
    res.status(200).send('hello world');
});
//Server
app.listen(port, () => {
    // const baseUrl = `http://localhost:${port}`;
    // console.log(`Listening on: ${baseUrl}`);
});