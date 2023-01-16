import type { Duration } from "@upstash/ratelimit/types/duration";
import type { Ratelimit } from "@upstash/ratelimit";

export type LimiterList = Map<string, Ratelimit>;

export type Limiters = Map<string, LimiterList>;

export type LimiterId = {
  region: string;
  method?: string;
};

export type LimitOptions = {
  tokens: number;
  window: Duration;
};

export type JobOptions = {
  region: string;
  method: string;
  template: string;
  params?: Record<string, any>;
};

export type JobDone = {
  success: boolean;
  message: string;
  data?: any;
  reset?: number;
};