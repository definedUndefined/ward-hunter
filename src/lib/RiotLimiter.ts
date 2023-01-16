import type { LimiterList, Limiters, LimiterId, LimitOptions, JobOptions, JobDone } from "./RiotLimiter.types";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RiotRequest } from "./RiotRequest";

export class RiotLimiter extends RiotRequest {
  public readonly instanceId = Math.random().toString(36).substring(7);
  private _limiters: Limiters = new Map();

  /**
   * Set the debug mode for the current instance
   * @param debug Boolean to enable or disable debug mode
   * @returns boolean that indicates if the debug mode is enabled or not
   */
  public setDebug = (debug: boolean) => (this._debug = debug);

  /**
   * Gets limiters details for the current instance
   * @returns Map of limiters for the current instance
   */
  public getLimitersDetails = () => {
    const details: Record<string, string[]> = {};

    for (const [limiterId, limiters] of this._limiters) {
      details[limiterId] = [...limiters.keys()];
    }

    return details;
  };

  /**
   * PHP like sleep function
   * @param ms Milliseconds to wait before resolving the promise
   * @returns Promise that resolves after ms milliseconds
   */
  private sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  public schedule = async ({ region, method, template, params }: JobOptions): Promise<JobDone> => {
    this._debug && console.log("[RiotLimiter.schedule]", { region, method, template, params });

    const { success, message, reset } = await this.limit({ region, method });

    this._debug && console.log("[RiotLimiter.schedule]", { success, message, reset });

    if (success) {
      const response = await this.request({ region, template, params });

      //! This block doesn't work because Riot send the status code in the response body
      /**
       * 429 - Too many requests : should not happen but if it does, we should retry
       * so extract the X-Rate-Limit-Type and Retry-After headers and schedule the request again with the retry-after value timeout
       * 403 - Forbidden : throw a new error (Bad API key)
       * 404 - Not found : throw a new error (Bad summoner name)
       * 500 - Internal server error : retry the request after 1s
       * 503 - Service unavailable : retry the request after 1s
       */

      switch (response.status) {
        case 429:
          response.headers.get("X-Rate-Limit-Type") === "service" && (await this.sleep(1000));
          const retryAfter = response.headers.get("Retry-After");
          await this.sleep(retryAfter ? Number(retryAfter) * 1000 : 1000);
          return this.schedule({ region, method, template, params });
        case 403:
          return {
            success: false,
            message: "Error 403 - Forbidden received from Riot API : Please check if your API key is valid",
          };
        case 404:
          return {
            success: false,
            message:
              "Error 404 - Not found received from Riot API : Its seems that the summoner name you provided is not valid",
          };
        case 500:
          await this.sleep(1000);
          return this.schedule({ region, method, template, params });
        case 503:
          await this.sleep(1000);
          return this.schedule({ region, method, template, params });
      }

      return {
        success: true,
        message: "Request sent",
        data: await response.json(),
      };
    }

    if (!success && reset) {
      return {
        success: false,
        message,
        reset,
      };
    }

    const response = await this.request({ region, template, params });

    const limits = this.extractLimits(response.headers);

    this._debug && console.log("[RiotLimiter.schedule]", { limits });

    this.createLimiter({ region, method }, limits);

    return {
      success: true,
      message: "Request sent",
      data: await response.json(),
    };
  };

  /**
   * Limit the number of requests per region and per method
   * @param limiterId Object containing the region and the method to limit
   * @returns Promise that resolves to an object containing a boolean success and a message, and reset UNIX timestamp if the limit has been reached
   */
  private limit = async ({ region, method }: LimiterId) => {
    this._debug && console.log("[RiotLimiter.limit]", { region, method });

    const appLimiters = this.getLimiters({ region });

    if (!appLimiters) {
      return {
        success: false,
        message: "App limiters not found",
      };
    }

    for (const [limiterId, limiter] of appLimiters) {
      const { success, reset } = await limiter.limit(this.instanceId);

      if (!success) {
        return {
          success: false,
          message: `App limit reached for ${limiterId}`,
          reset,
        };
      }
    }

    const mtdLimiters = this.getLimiters({ region, method });

    if (!mtdLimiters) {
      return {
        success: true,
        message: "Method limiters not found",
      };
    }

    for (const [limiterId, limiter] of mtdLimiters) {
      const { success, reset } = await limiter.limit(this.instanceId);

      if (!success) {
        return {
          success: false,
          message: `Method limit reached for ${limiterId}`,
          reset,
        };
      }
    }

    return {
      success: true,
      message: "Limiters passed",
    };
  };

  /**
   * Create the limiters for the region and the method
   * @param limiterId Object containing the region and the method to limit
   * @param limits Object containing the limits to apply for the region and the method (retieved from the response headers)
   * @returns Object containing a boolean success and a message
   */
  public createLimiter = ({ region, method }: LimiterId, limits: ReturnType<typeof this.extractLimits>) => {
    this._debug && console.log("[RiotLimiter.createLimiter]", { region, method, limits });

    if (this.getLimiters({ region }) || this.getLimiters({ region, method })) {
      return {
        success: false,
        message: "Limiter already exists",
      };
    }

    const appLimiters: LimiterList | undefined = limits.appRateLimit?.reduce((map, { tokens, window }) => {
      const limiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(tokens, window),
        ephemeralCache: new Map<string, number>(),
      });

      const limiterId = this.getLimiterId({ tokens, window });

      map.set(limiterId, limiter);

      return map;
    }, new Map());

    this._debug && console.log("[RiotLimiter.createLimiter]", { appLimiters });

    if (appLimiters) {
      const appLimitersId = this.getLimiterId({ region });
      this._limiters.set(appLimitersId, appLimiters);
    }

    const mtdLimiters: LimiterList | undefined = limits.methodRateLimit?.reduce((map, { tokens, window }) => {
      const limiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(tokens, window),
        ephemeralCache: new Map<string, number>(),
      });

      const limiterId = this.getLimiterId({ tokens, window });

      map.set(limiterId, limiter);

      return map;
    }, new Map());

    this._debug && console.log("[RiotLimiter.createLimiter]", { mtdLimiters });

    if (mtdLimiters) {
      const mtdLimitersId = this.getLimiterId({ region, method });
      this._limiters.set(mtdLimitersId, mtdLimiters);
    }

    return {
      success: true,
      message: "Limiter created",
    };
  };

  /**
   * Retrieve the limiters for the region and the method
   * @param limiterId Object containing the region and the method of the limiters to retrieve
   * @returns Object containing the limiters for the region and the method if they exist
   */
  public getLimiters = ({ region, method }: LimiterId): LimiterList | undefined => {
    const id = this.getLimiterId({ region, method });
    return this._limiters.get(id);
  };

  /**
   * Generates an id for the limiter based on the identifiers
   * @param identifiers Object containing identifiers of the limiter to generate the id for
   * @returns generated id for the limiter
   */
  public getLimiterId = (identifiers: Record<string, any>) => {
    return (
      "@RateLimiter|" +
      Object.entries(identifiers)
        .filter(([key, value]) => value !== undefined) // Remove undefined values for optional parameters
        .map(([key, value]) => `${key}:${value}`)
        .join("|")
    );
  };

  /**
   * Extracts Riot API limits from the response headers
   * @param headers headers of the response
   * @returns Object containing the limits for the current region and method
   */
  public extractLimits = (headers: Headers) => {
    const identifiers = {
      appRateLimit: "X-App-Rate-Limit",
      appRateLimitCount: "X-App-Rate-Limit-Count",
      methodRateLimit: "X-Method-Rate-Limit",
      methodRateLimitCount: "X-Method-Rate-Limit-Count",
      serviceRateLimit: "X-Service-Rate-Limit",
      serviceRateLimitCount: "X-Service-Rate-Limit-Count",
    };

    //? I don't know if it's a good practice to declare a type in a function, but it's more readable like this
    type LimitType = keyof typeof identifiers;

    const limitsList = {} as Record<LimitType, LimitOptions[] | undefined>;

    for (const [key, identifier] of Object.entries(identifiers)) {
      const strLimits = headers.get(identifier);

      const limits = strLimits?.split(",").map((limit) => {
        const [tokens, window] = limit.split(":");
        return {
          tokens: Number(tokens),
          window: `${window} s`,
        } as LimitOptions;
      });

      if (limits) {
        limitsList[key as LimitType] = limits;
      }
    }

    this._debug && console.log("[RiotLimiter.extractLimits]", { limitsList });

    return limitsList;
  };
}
