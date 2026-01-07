import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServiceClient()

  // Direct query to orders table
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(10)

  // Also check transactions to see the order_id
  const { data: transactions, error: txnError } = await supabase
    .from('transactions')
    .select('id, order_id, amount, status')
    .limit(10)

  return NextResponse.json({
    orders: orders || [],
    ordersError,
    transactions: transactions || [],
    txnError,
    ordersCount: orders?.length || 0,
  })
}
