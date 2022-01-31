# Minecraft Server Status - Discord Bot

A Discord bot that shows the status of a Minecraft server (online/offline & player-count). Also prints more information to the Discord chat with the `/mcstatus` command.


## Setup

- Requires [node.js](https://nodejs.org) >=16
- Create a `config.json` file with the following properties:
  - `bot_token` - Discord bot's token
  - `client_id` - Discord bot's OAuth client id
  - `mcserver_address` - the address of the Minecraft server. default: `localhost`
  - `mcserver_port` - default: `25565`
  - `polling_interval` - default: `10000`
- `npm install`

## Operation

Keep the bot running with `npm start`.

## Development

`npm run dev`. The Discord bot will restart automatically when files are changed.
