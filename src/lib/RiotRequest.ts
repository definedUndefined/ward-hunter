import type { JobOptions } from "./RiotLimiter.types";
import fetch from "isomorphic-fetch";

export abstract class RiotRequest {
  protected baseUrl = "https://{region}.api.riotgames.com";
  private _apiKey: string | undefined;
  protected _debug = false;

  /**
   * Set the debug mode for the current instance
   * @abstract
   */
  abstract setDebug: (debug: boolean) => void;

  /**
   * Set the Riot API Key for the current instance
   * @param apiKey Riot API Key
   * @returns the current api key
   */
  public setApiKey = (apiKey: string) => (this._apiKey = apiKey);

  /**
   * Generates a URL from the template and params
   * @param templateInfo Template info for the request
   * @returns the resolved URL
   */
  public resolveUrl = ({ region, template, params }: Omit<JobOptions, "method">) => {
    this._debug && console.log("[RiotRequest.resolveUrl]", { region, template, params });
    
    const endpoint = template.replace(/{\s*\w+\s*}/g, (match) => {
      const key = match.replace(/\s/g, "").slice(1, -1);
      if (!params || !params[key]) {
        throw new Error(`Missing param ${key} for template ${template}`);
      }
      return params[key];
    });

    return this.baseUrl.replace("{region}", region) + endpoint;
  }

  /**
   * Send a request to the Riot API
   * @param templateInfo Template info for the request 
   * @returns Response from the Riot API
   */
  public request = async ({ region, template, params }: Omit<JobOptions, "method">) => {
    const url = this.resolveUrl({ region, template, params });

    this._debug && console.log("[RiotRequest.request]", { url });

    return await fetch(url, {
      headers: {
        "X-Riot-Token": this._apiKey ?? process.env.NEXT_PUBLIC_RIOT_API_KEY!,
      },
    });
  }
}
