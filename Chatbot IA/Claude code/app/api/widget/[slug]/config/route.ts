import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: artisan, error } = await supabase
    .from('artisans')
    .select('company_name, widget_color, widget_bot_name, widget_welcome_message, trade')
    .eq('public_slug', slug)
    .single()

  if (error || !artisan) {
    return NextResponse.json({ error: 'Artisan not found' }, {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  return NextResponse.json({
    company_name: artisan.company_name,
    color: artisan.widget_color,
    bot_name: artisan.widget_bot_name,
    welcome_message: artisan.widget_welcome_message,
    trade: artisan.trade,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
