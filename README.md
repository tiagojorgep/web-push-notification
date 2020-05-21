# Web Push Notifications
To future references, contain a easy way to build a WEB-PUSH Notification server.<br />
We can subscribe to a topic into this server and send notifications to all connected clients.

## Dependencies

To create this simple server, we need [Node.js](https://nodejs.org/) and [web-push](https://www.npmjs.com/package/web-push/) package.

## First things first...

After you have downloaded and installed [Node.js](https://nodejs.org/), download [web-push](https://www.npmjs.com/package/web-push/) as a global package using [npm](https://www.npmjs.com/).

```node
$ npm install web-push -g
```

Then, generate our VAPID key

```node
$ web-push generate-vapid-keys --json
```

The result of this action will be something like below:

```json
{
  "publicKey": "BNyZFIhiLQK2gluOmnHDVuAxk9lvsrPFMnIY4WYULR44Bx3XBPi8kiY8kZoxXklYHfhw5ivyWclF4KTAPLkul6M",
  "privateKey": "XoVqP2R98I_5MjI5l8iqtZrCd54h0ASAXho91k81hDQ"
}
```

Each web-push server needs to have your own VAPID Key, copy this result and save in somewhere, we will need them later.

## Clone this project

Clone the project and download all dependencies.

```bash
$ cd web-push-notification
$ git clone https://github.com/tiagojorgep/web-push-notification.git .
$ npm install
```

## Edit server code

Open the file `src/server.js` in your preferred editor and at line 25 replace the VAPID KEY object with keys generated before.

```javascript
const vapidKeys = {
    public: "my-public-vapidkey",
    private: "my-private-vapidkey"
};
```

## Running the server

Now we are able to run our server just running the code below:

```bash
$ node src/server.js
```

The exit of this command will be:

```bash
WebPush started on port: 5000
```

Now our server are ready to receive subscriptions and send notifications to subscripted clients.

## Subscripting and sending notification to a topic

Assuming that you are running the server at your machine and you don't changed the port tha our server is listening, the address to our server will be `http://localhost:5000`.


### Subscripting
To subscribe to a new topic like for example `foo` you will send a subscription post to:

```bash
http://localhost:5000/subscription/foo
```

A simple example using Angular 9 is right below.

### Sending notification
To send a notification to a topic like for example `foo`, you will send a POST like below:

```bash
POST /sendNotification/foo HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
	"title": "My Notification Title",
	"body": "My notification body.",
	"url": "https://example.com"
}
```

## Simple client example with Angular 9

This example requires Service Worker added to your Angular project, to see more visit [Angular Service Worker](https://angular.io/guide/service-worker-intro).

Create a new service:
```bash
$ ng g s services/web-push
```
Replace the content of file `services\web-push.service.ts` with the code below:
```javascript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WebPushService {

  readonly WEB_PUSH_SERVER = 'http://localhost:5000/subscription';

  constructor(
    private http: HttpClient
  ) { }

  public sendSubscriptionToTheServer(topic: string, subscription: PushSubscription) {
    const webpushURL = `${this.WEB_PUSH_SERVER}/${topic}`;
    return this.http.post(webpushURL, subscription);
  }
}
```
At your `app.component.ts` do:
```javascript
...
import { WebPushService } from './services/web-push.service'; // <- import our service 
...

export class AppComponent implements OnInit {
    readonly VAPID_PUBLIC_KEY = 'my-public-vapidkey';

    constructor(
        ...
        private webpush: WebPushService,
        private swPush: SwPush
        ...
    ) { }

    ...
    // my stuffs
    ...

    ngOnInit(): void {
        if (this.swPush.isEnabled) { // <-- this is a function of service worker
            console.log('swPush enabled!');
            this.swPush.requestSubscription({
              serverPublicKey: this.VAPID_PUBLIC_KEY,
            })
            .then(subscription => {
              // send subscription to the server
              console.log('Subscribing to push service...');
              // subscribing to "foo" topic
              this.webpush.sendSubscriptionToTheServer('foo', subscription).subscribe();
            })
            .catch(console.error);
        } else {
              console.warn('swPush disabled!');
        }
    }
}
```

Build the project with opption --prod (push with service worker works just in production mode)

```bash
$ ng build --prod
```

Run a local web server with http-server:
```bash
$ npm install http-server
$ http-server dist/my-angular-project -p 1000
```

Open your browser at `http://localhost:1000`.

A solicitation to accept notifications will appear, ALLOW!

With any program or web page that allows you to send POST method, send a POST to:
```bash
POST /sendNotification/foo HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
	"title": "My Notification Title",
	"body": "My notification body.",
	"url": "https://example.com"
}
```

That's it! If you did all steps successfully, a push notification will appear at you screen.

-- Author: [@tiagojorgep](https://github.com/tiagojorgep)<br>
-- Linkedin: https://www.linkedin.com/in/tiagojorgep/