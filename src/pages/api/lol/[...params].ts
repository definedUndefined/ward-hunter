import type { NextApiRequest, NextApiResponse } from "next";
import { Library } from "@/lib/Library";

const library = new Library();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { params } = req.query;
  const [region, summonerName] = params as string[];

  const rateLimiter = library.getRateLimiter();

  const response = await library.summoner.getSummonerByName(summonerName, region);

  res.status(200).json({
    ...response,
    instanceId: rateLimiter.instanceId,
    limiters: rateLimiter.getLimitersDetails(),
  });
}
