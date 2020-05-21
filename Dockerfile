# Simple way to run this server at a docker
FROM node:stretch-slim

RUN npm init -y
RUN npm install express --save
RUN npm install --save web-push
RUN npm install --save body-parser
RUN npm install cors --save

COPY src/ src/

WORKDIR /

CMD node /src/server.js >> /var/log/web-push.log

# Building:
#   docker build -t my-web-push-docker:0.0.1 .
# Running
#   docker run -p 5000:5000 my-web-push-docker:0.0.1 &