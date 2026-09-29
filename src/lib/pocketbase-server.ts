import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

// Helper to get a server-side instance if needed in server components/actions
export async function getServerPB() {
  const pbServer = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://192.168.1.11:8090');
  pbServer.autoCancellation(false);
  
  try {
    const cookieStore = await cookies();
    const pbAuth = cookieStore.get('pb_auth');
    if (pbAuth) {
      const data = JSON.parse(pbAuth.value);
      pbServer.authStore.save(data.token, data.record || data.model);
    }
  } catch (e) {
    // silently fail if cookies() cannot be called
  }
  
  return pbServer;
}
