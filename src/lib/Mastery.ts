import { RiotLimiter } from "./RiotLimiter";
import { Firestore } from "./Firestore";
import { Endpoint } from "./Endpoint";

export class Mastery extends Endpoint {
  constructor(limiter: RiotLimiter, store: Firestore) {
    super(limiter, store);
  }

  /**
   * Get all champion mastery entries sorted by number of champion points descending
   * @param summonerId summoner id
   * @param region region
   * @returns champion mastery entries
   */
  public getMasteryBySummonerId = async (summonerId: string, region: string) => {
    return await this.getData({
      region,
      method: "getMasteryBySummonerId",
      template: "/lol/champion-mastery/v4/champion-masteries/by-summoner/{summonerId}",
      params: {
        summonerId,
      },
      collection: "champion-mastery",
      document: `${region}_${summonerId}`,
    });
  };

  /**
   * Get a champion mastery by player ID and champion ID.
   * @param summonerId summoner id
   * @param championId champion id
   * @param region region
   * @returns champion mastery entry
   * @note use getMasteryBySummonerId to get all champion mastery entries
   * we should see if the limits for this endpoint can allow us to get all champion mastery entries
   */
  public getMasteryBySummonerIdAndChampionId = async (summonerId: string, championId: string, region: string) => {
    const res = await this.getMasteryBySummonerId(summonerId, region);

    return res.data.find((mastery: any) => mastery.championId === championId);
  };
}
