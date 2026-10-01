import { getServerPB } from '@/lib/pocketbase-server'
import webpush from '@/lib/webpush'

export async function sendPushToPartner(coupleId: string, currentUserId: string, title: string, body: string, url: string = '/') {
  try {
    const pb = await getServerPB()

    // Buscar a la pareja
    let partnerProfile;
    try {
      partnerProfile = await pb.collection('users').getFirstListItem(`couple_id="${coupleId}" && id!="${currentUserId}"`)
    } catch(e) {}

    if (!partnerProfile) return

    // Buscar todas sus suscripciones
    let subscriptions: any[] = []
    try {
      subscriptions = await pb.collection('push_subscriptions').getFullList({ filter: `user_id="${partnerProfile.id}"` })
    } catch(e) {}

    if (!subscriptions || subscriptions.length === 0) return

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/icon-192x192.png'
    })

    // Enviar a todas las suscripciones de la pareja (ej: móvil y PC)
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription_json as any, payload)
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await pb.collection('push_subscriptions').delete(sub.id)
        } else {
          console.error('Error al enviar push:', error)
        }
      }
    }
  } catch (err) {
    // Never let push notifications crash the caller
    console.error('sendPushToPartner failed silently:', err)
  }
}
