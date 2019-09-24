import Discord, { Client, Message } from 'discord.js'
import ServerChecker, { IServer, IServerStatus } from './ServerChecker';

export interface ICheckResult {
	server: IServer,
	status: IServerStatus
}

export default class ARKStatusBot {
	private _client: Client;
	private _servers: IServer[];

	private _cachedResult: ICheckResult[] = undefined;
	private _cachedTimer: number = 0;

	private _channelLock: any = [];

	private defaultCahceTime = 60;

	constructor(token: string, servers: IServer[]) {
		var self: ARKStatusBot = this;
		this._client = new Discord.Client();
		this._servers = servers;

		this._client.login(token);

		this._client.on('ready', () => {
			console.log(`Logged in as ${this._client.user.tag}!`);
		});

		this._client.on('message', async function(msg: Message) {
			if(msg.author.bot) {
				return;
			}

			if(msg.channel.type == "dm") {
				return;
			}

			if(msg.content.toLocaleLowerCase() == '!status') {
				if(self._channelLock[msg.channel.id] == true) {
					msg.reply('Already checking status!');
					return;
				}
				
				try {
					self._channelLock[msg.channel.id] = true;
					let result: ICheckResult[] = []; 
					let isCached: boolean = false;
					if(self._cachedResult == undefined) {
						msg.reply('Checking server...');
						result = await self.checkAll();
		
						self._cachedResult = result;
						self._cachedTimer = self.defaultCahceTime;
					} else {
						result = self._cachedResult;
						isCached = true;
					}
		
					let text = 'Server status ' + (isCached ? '(Cached ' + (self.defaultCahceTime - self._cachedTimer) + ' seconds ago)' : '') + ':';
					//console.log(result);
					result.forEach(res => {
						text += '\n----- ' + res.server.name + ' -----';
						text += '\nStatus: ' + (res.status.online ? 'Online' : 'Offline');
						if(res.status.online) {
							text += '\nName: ' + res.status.result.name;
							text += '\nPlayers: ' + res.status.result.players.length + '/' + res.status.result.maxplayers;
							text += '\nMap: ' + res.status.result.map;
						}
					});
					self._channelLock[msg.channel.id] = false;
					msg.reply(text);
				} catch(err) {
					self._channelLock[msg.channel.id] = false;
				}
			}
		});

		setInterval(()=>{
			if(this._cachedTimer > 0) {
				this._cachedTimer--;
			} else if(this._cachedTimer <= 0 && this._cachedResult != null) {
				this._cachedResult = undefined;
			}
		},1000);
	}

	async checkAll(): Promise<ICheckResult[]> {
		let results: ICheckResult[] = [];
		console.log('Checking all sevrers');

		for(let i: number = 0; i < this._servers.length; i++) {
			console.log('Checking server: ' + this._servers[i].name);
			results.push(await this.checkServer(this._servers[i]));
		}

		return results;
	}

	checkServer(server: IServer) {
		return new Promise<ICheckResult>(async function(resolve, reject) {
			let checkResult = await ServerChecker.checkServer(server);
			resolve({
				server: server,
				status: checkResult
			});
		});
	}
}