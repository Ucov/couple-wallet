'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type ActionState = { error: string | null, timestamp?: number }

const expenseSchema = z.object({
  amount: z.number().positive('La cantidad debe ser mayor a 0'),
  concept: z.string().min(1, 'El concepto es obligatorio'),
  category_id: z.string().min(1, 'Categoría no válida').optional().nullable(),
  date: z.string().min(1, 'La fecha es obligatoria'),
  is_refundable: z.boolean().optional().default(false),
})

export async function deleteExpenseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Falta el identificador del gasto' }

  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'No autenticado' }

  try {
    await pb.collection('expenses').delete(id)
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    return { 
      error: error.status === 404
        ? 'No se pudo eliminar el gasto (no existe o no tienes permiso)'
        : error.message,
      timestamp: Date.now()
    }
  }

  revalidatePath('/')
  return { error: null, timestamp: Date.now() }
}

export async function updateExpenseAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'No autenticado' }

  const rawData = {
    amount: parseFloat(formData.get('amount') as string),
    concept: formData.get('concept') as string,
    category_id: formData.get('category_id') as string || null,
    date: formData.get('date') as string,
    is_refundable: formData.get('is_refundable') === 'on',
  }

  const validatedFields = expenseSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { amount, concept, category_id, date, is_refundable } = validatedFields.data

  try {
    await pb.collection('expenses').update(id, {
      amount,
      concept,
      category_id,
      date: new Date(date).toISOString(),
      is_refundable,
    })
  } catch (error: any) {
    console.error('Error updating expense:', error)
    return { 
      error: error.status === 404
        ? 'No se pudo actualizar el gasto (no existe o no tienes permiso)'
        : error.message 
    }
  }

  revalidatePath('/')
  redirect('/')
}
