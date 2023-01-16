import { Firestore } from "./Firestore";
import { RiotLimiter } from "./RiotLimiter";
import type { JobOptions } from "./RiotLimiter.types";

type EndpointOptions = JobOptions & {
  collection: string;
  document: string;
};

export class Endpoint {
  private limiter: RiotLimiter;
  private store: Firestore;

  constructor(limiter: RiotLimiter, store: Firestore) {
    this.limiter = limiter;
    this.store = store;
  }

  public getData = async ({ region, method, template, params, collection, document }: EndpointOptions) => {
    const collectionRef = this.store.getDatabase().collection(collection);
    const docRef = collectionRef.doc(document);
    const doc = await docRef.get();
    const cache = doc.data();

    if (cache) {
      // TODO : check revision date stored in cache to see if we need to update it
      return {
        success: true,
        source: "cache",
        message: "Data found in cache",
        data: cache,
      };
    }

    const response = await this.limiter.schedule({
      region,
      method,
      template,
      params,
    });

    if (response.success) {
      await this.store
        .getDatabase()
        .collection(collection)
        .doc(document)
        .set(response.data)
        .catch((error) => {
          return {
            ...response,
            source: "riot",
            store: { success: false, message: error.message },
          };
        });

      return {
        ...response,
        source: "riot",
        store: {
          success: true,
          message: `Data for document ${document} in collection ${collection} was successfully written to Firestore!`,
        },
      };
    }

    return { ...response, source: "riot" };
  };
}
