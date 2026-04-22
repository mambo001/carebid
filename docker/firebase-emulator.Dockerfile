FROM node:20-alpine

RUN npm install -g firebase-tools@13.35.1

WORKDIR /workspace

CMD ["firebase", "emulators:start", "--project", "carebid-local", "--only", "auth,ui"]
