import { RiotLimiter } from "./RiotLimiter";
import { Firestore } from "./Firestore";
import { Endpoint } from "./Endpoint";

export class Summoner extends Endpoint {
  constructor(limiter: RiotLimiter, store: Firestore) {
    super(limiter, store);
  }

  public getSummonerByName = async (summonerName: string, region: string) => {
    return await this.getData({
      region,
      method: "getSummonerByName",
      template: "/lol/summoner/v4/summoners/by-name/{summonerName}",
      params: {
        summonerName,
      },
      collection: "summoners",
      document: `${region}_${summonerName}`,
    });
  }
}
