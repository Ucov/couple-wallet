import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

  // Use service role to bypass RLS since this is a cron job
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // We want to remind about events happening TOMORROW
    const today = new Date()
    const tomorrow = addDays(today, 1)
    
    // Create UTC boundaries for tomorrow's local date
    // (A simplified approach: just check if the event date string starts with tomorrow's YYYY-MM-DD)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    // 1. Fetch all events for tomorrow
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('date', `${tomorrowStr}T00:00:00.000Z`)
      .lte('date', `${tomorrowStr}T23:59:59.999Z`)

    if (eventsError) throw eventsError
    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events for tomorrow.' })
    }

    let notificationsSent = 0

    // Group events by couple_id to avoid spamming multiple pushes per event
    const eventsByCouple = events.reduce((acc: any, event) => {
      if (!acc[event.couple_id]) acc[event.couple_id] = []
      acc[event.couple_id].push(event)
      return acc
    }, {})

    // 2. Process notifications for each couple
    for (const coupleId of Object.keys(eventsByCouple)) {
      const coupleEvents = eventsByCouple[coupleId]
      
      // Fetch all users in this couple
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('couple_id', coupleId)

      if (!profiles || profiles.length === 0) continue

      const userIds = profiles.map(p => p.id)

      // Fetch push subscriptions for these users
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds)

      if (!subscriptions || subscriptions.length === 0) continue

      // Create payload for tomorrow's events
      const eventTitles = coupleEvents.map((e: any) => e.title).join(', ')
      const payload = JSON.stringify({
        title: '🗓️ Recordatorio de Agenda',
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
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', sub.user_id)
                .contains('subscription_json', { endpoint: sub.subscription_json.endpoint })
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
