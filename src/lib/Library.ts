import { RiotLimiter } from "./RiotLimiter";
import { Summoner } from "./Summoner";
import { Firestore } from "./Firestore";

export class Library {
  private limiter = new RiotLimiter();
  private store = new Firestore();
  public summoner = new Summoner(this.limiter, this.store);

  constructor(debug: boolean = false) {
    this.limiter.setDebug(debug);
  }

  public getRateLimiter = () => this.limiter;
}
