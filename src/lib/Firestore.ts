import { cert, initializeApp, getApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export class Firestore {
  private db: FirebaseFirestore.Firestore;
  private app: App;

  constructor() {
    if (!process.env.NEXT_FIREBASE_PROJECT_ID)
      throw new Error("It seems like NEXT_FIREBASE_PROJECT_ID is not defined in .env.local");
    if (!process.env.NEXT_FIREBASE_PRIVATE_KEY)
      throw new Error("It seems like NEXT_FIREBASE_PRIVATE_KEY is not defined in .env.local");
    if (!process.env.NEXT_FIREBASE_CLIENT_EMAIL)
      throw new Error("It seems like NEXT_FIREBASE_CLIENT_EMAIL is not defined in .env.local");

    const firebaseConfig = {
      projectId: process.env.NEXT_FIREBASE_PROJECT_ID,
      privateKey: process.env.NEXT_FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.NEXT_FIREBASE_CLIENT_EMAIL,
    };

    try {
      this.app = initializeApp({
        credential: cert(firebaseConfig),
      });
    } catch (error) {
      this.app = getApp();
    }

    this.db = getFirestore(this.app);
  }

  getDatabase = () => this.db;
}
