'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { saveSubscription, deleteSubscription } from '@/app/profile/actions'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationsClient({ coupleId }: { coupleId: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg)
        reg.pushManager.getSubscription().then(sub => {
          if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
            setSubscription(sub)
            setIsSubscribed(true)
          }
        })
      })
    } else {
      setIsSupported(false)
    }
  }, [])

  const subscribeButtonOnClick = () => {
    if (!isSupported) {
      toast.error('Las notificaciones push no están soportadas en este navegador o dispositivo.')
      return
    }

    if (!registration) {
      toast.error('Esperando a que el Service Worker se instale... Si estás en iPhone, añade la app a la pantalla de inicio primero.')
      return
    }

    startTransition(async () => {
      try {
        if (isSubscribed && subscription) {
          await subscription.unsubscribe()
          await deleteSubscription(subscription.endpoint)
          setSubscription(null)
          setIsSubscribed(false)
          toast.success('Notificaciones desactivadas')
        } else {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (!vapidKey) {
            toast.error('Faltan las claves de seguridad. Tienes que configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY en tu archivo .env.local')
            return
          }

          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          })
          
          await saveSubscription(JSON.parse(JSON.stringify(sub)))
          setSubscription(sub)
          setIsSubscribed(true)
          toast.success('Notificaciones activadas')
        }
      } catch (e: any) {
        if (Notification.permission === 'denied') {
          toast.error('Permiso denegado. Actívalo en los ajustes de tu navegador/sistema.')
        } else {
          toast.error('Error al suscribirse: ' + e.message)
        }
      }
    })
  }

  if (!isSupported) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isSubscribed ? 'bg-emerald-950 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}`}>
          {isSubscribed ? <Bell size={24} /> : <BellOff size={24} />}
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100">Notificaciones Push</h3>
          <p className="text-sm text-zinc-500">{isSubscribed ? 'Activadas en este dispositivo' : 'Desactivadas'}</p>
        </div>
      </div>
      
      <button 
        onClick={subscribeButtonOnClick}
        disabled={isPending}
        className={`px-4 py-2 rounded-full font-semibold transition-all ${
          isSubscribed 
            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        } disabled:opacity-50`}
      >
        {isPending ? <Loader2 size={18} className="animate-spin" /> : (isSubscribed ? 'Desactivar' : 'Activar')}
      </button>
    </div>
  )
}
