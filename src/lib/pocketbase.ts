import PocketBase from 'pocketbase';

// Singleton instance to be used across client components
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://192.168.1.11:8090');
