// $ npm install --save express
const express = require('express')
// $ npm install --save body-parser
const bodyParser = require('body-parser')
// $ npm install -- save cors
const cors = require('cors');
// $ npm install --save web-push
const webpush = require('web-push');

const app = express();
const port = 5000;

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors());

// creating a list of clients subscribed
const fakeSubscribersList = [];
const fakeDatabase = [];

// generate your own VAPID Keys with command: 
// $ web-push generate-vapid-keys --json
const vapidKeys = {
    public: "my-public-vapidkey",
    private: "my-private-vapidkey"
};

// refuse GET method
app.get('/', (req, res) => {
    console.warn(`Bad Request: Push notification needs to be used by POST method.`);
    res.status(400).send('Bad Request: Push notification needs to be used by POST method');
});

/**
 *  POST method to accept subscription
 *  :topic <string> route with topic's name where you want to be subscribe
 */ 
app.post('/subscription/:topic', (req, res) => {
    try {
        // verify if topic was informed
        if (req.params.topic) {
            const topic = req.params.topic;
            // create a object of subscription with topic and subscription that was sent by client
            const objSubscription = {
                topic: topic,
                subscription: req.body
            };
            // create a "fingerprint" of subscription object to avoid duplicate entrance
            fingerprint = Buffer.from(JSON.stringify(objSubscription)).toString('base64');
            // verify if the "fingerprint" it's already subscribed
            if (!fakeSubscribersList.includes(fingerprint)) {
                // entry the object to our fake database
                fakeDatabase.push(objSubscription);
                // entry the fingerprint to our list of fingerprints
                fakeSubscribersList.push(fingerprint);
                // write a line at a server console to inform that a new subscription was received
                console.log(`Subscription to topic '${topic}' received from '${req.ip}' | We have ${fakeDatabase.length} active subscriptions.`);
            }
            // send a ok status
            res.status(200).send('OK')
        } else {
            // topic not informed refuse subscription
            res.status(400).send('Bad Request.');
        }
    } catch (err) {
        // some error has occurred, log at server and send a 500 http status
        console.error(err);
        res.status(500).send(err)
    }
});

/**
 * POST method to send notification to a topic specific
 * :topic <string> route with topic's name that will receive the push
 */
app.post('/sendNotification/:topic', (req, res) => {
    try {
        // verify if topic was informed
        if (req.params.topic) {
            const topic = req.params.topic;
            // verify if a title, body and url was informed (the URL must be with https protocol)
            if (req.body.title !== undefined && req.body.body !== undefined && req.body.url !== undefined) {
                // create a notification body
                // more details at https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
                const notificationPayload = {
                    notification: {
                        title: req.body.title,
                        body: req.body.body,
                        icon: 'https://storage.googleapis.com/sales.appinst.io/2016/07/When-Push-Comes-to-Shove-Mobile-Marketing-Through-App-Notifications.png',
                        image: 'https://storage.googleapis.com/sales.appinst.io/2016/07/When-Push-Comes-to-Shove-Mobile-Marketing-Through-App-Notifications.png',
                        data: {
                            url: req.body.url
                        },
                        vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500],
                        actions: [
                            { action: 'openApp', title: 'AutomatizaProvedor' }
                        ],
                        requireInteraction: false,
                        renotify: false
                    }
                };
                // set webpush details, remember URL must be a https URL
                webpush.setVapidDetails(req.body.url, vapidKeys.public, vapidKeys.private);
                // create a list of promisses that will receive the subscriptions inside our fake database
                const promises = [];
                // loop inside our fake database
                fakeDatabase.forEach(objSubscription => {
                    // verify if the subscription make reference to our topics
                    if (objSubscription.topic == topic) {
                        // if yes, push the webpush send notification object to promise list
                        promises.push(
                            webpush.sendNotification(
                                objSubscription.subscription,
                                JSON.stringify(notificationPayload)
                            )
                        );
                    }
                });
                /*
                this way will make our code await until all promises be receveid and then, send a http status 200
                if some subscription is not avaliable anymore, will await until server timeout (I don't like this way)
                Promise.all(promises).then(() => {
                    res.status(200).send({
                        success: true,
                        msg: 'Notification sent to all clients conecteds!'
                    });
                });
                */
                // send all promises within the list in parallel
                Promise.all(promises).then(() => {});
                // return status 200 with JSON value
                res.status(200).send({
                    success: true,
                    msg: `Notification sent to ${promises.length} clients conecteds to topic '${topic}'!`
                });
            } else {
                // some of title, body or url not informed, refuse 
                res.status(400).send({
                    success: false,
                    msg: 'Bad Request.'
                });
            }
        } else {
            // topic not informed refuse notification
            res.status(400).send('Bad Request.');
        }
    } catch(err) {
        next(err);
    }
});

// start the server 
app.listen(port, () => {
    console.log(`WebPush started on port: ${port}`);
});