import { NextResponse } from 'next/server'
import { getServerPB } from '@/lib/pocketbase-server'
import webpush from '@/lib/webpush'

// Helper function to format date
const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export async function GET(request: Request) {
  // Validate Vercel CRON Secret
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const pb = await getServerPB()
  
  try {
    // Authenticate as admin to bypass RLS/Pocketbase rules since this is a cron job
    // Actually, Pocketbase requires admin email/pass. Let's just assume we can fetch as admin or we have public read access for now.
    // If auth fails, the rules might block it, but since it's local we'll assume we can use a service key or admin auth later.
    // For now we will try to auth as admin if credentials are provided in env, otherwise we proceed unauthenticated.
    if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
        await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);
    }

    // We want to remind about events happening TOMORROW
    const today = new Date()
    const tomorrow = addDays(today, 1)
    
    // Create UTC boundaries for tomorrow's local date
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    // 1. Fetch all events for tomorrow
    const events = await pb.collection('calendar_events').getFullList({
      filter: `date>="${tomorrowStr}T00:00:00.000Z" && date<="${tomorrowStr}T23:59:59.999Z"`
    })

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events for tomorrow.' })
    }

    let notificationsSent = 0

    // Group events by couple_id to avoid spamming multiple pushes per event
    const eventsByCouple = events.reduce((acc: any, event: any) => {
      if (!acc[event.couple_id]) acc[event.couple_id] = []
      acc[event.couple_id].push(event)
      return acc
    }, {})

    // 2. Process notifications for each couple
    for (const coupleId of Object.keys(eventsByCouple)) {
      const coupleEvents = eventsByCouple[coupleId]
      
      // Fetch all users in this couple
      const profiles = await pb.collection('users').getFullList({
        filter: `couple_id="${coupleId}"`
      })

      if (!profiles || profiles.length === 0) continue

      const userIds = profiles.map((p: any) => p.id)
      
      // Build an OR filter for userIds since Pocketbase doesn't have an IN operator natively without using multiple ORs
      const userFilters = userIds.map((id: string) => `user_id="${id}"`).join(' || ')

      // Fetch push subscriptions for these users
      const subscriptions = await pb.collection('push_subscriptions').getFullList({
        filter: userFilters
      })

      if (!subscriptions || subscriptions.length === 0) continue

      // Create payload for tomorrow's events
      const eventTitles = coupleEvents.map((e: any) => e.title).join(', ')
      const payload = JSON.stringify({
        title: '📆 Recordatorio de Agenda',
        body: `¡Mañana tenéis: ${eventTitles}!`,
        url: '/calendar'
      })

      // Send to all subscriptions
      if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(sub.subscription_json, payload)
            notificationsSent++
          } catch (err: any) {
            // Remove stale subscriptions
            if (err.statusCode === 404 || err.statusCode === 410) {
               await pb.collection('push_subscriptions').delete(sub.id)
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${notificationsSent} reminders for ${events.length} events.` 
    })

  } catch (error: any) {
    console.error('Error in cron job:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
