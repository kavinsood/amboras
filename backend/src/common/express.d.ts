export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      storeId: string;
      storeName: string;
      timezone: string;
      currency: string;
    }
  }
}
