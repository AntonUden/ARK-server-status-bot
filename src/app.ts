import ARKStatusBot from './ARKStatusBot';
import { IServer } from './ServerChecker';

const config: any = require('../config.json');
var servers: IServer[] = [];

for(let i: number = 0; i < config.servers.length; i++) {
	servers.push(config.servers[i]);
}

const bot = new ARKStatusBot(config.discord_token, servers);