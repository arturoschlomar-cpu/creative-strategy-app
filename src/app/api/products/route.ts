import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load products'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'scan-url') {
      // Use Gemini to extract product info from URL
      const { url } = body
      if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

      const prompt = `Extract product information from this URL and return a JSON object (no markdown):
URL: ${url}

Return:
{
  "name": "product name",
  "description": "product description",
  "benefits": ["benefit 1", "benefit 2"],
  "features": ["feature 1", "feature 2"],
  "targetAudience": "who this product is for",
  "usp": "unique selling proposition in one sentence"
}

If you cannot access the URL, make educated guesses based on the URL structure and domain name.`

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      let productData
      try {
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
        productData = JSON.parse(cleaned)
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/)
        if (!match) throw new Error('Failed to parse product data')
        productData = JSON.parse(match[0])
      }

      return NextResponse.json({ product: productData })
    }

    // Create product
    const { name, description, benefits, features, targetAudience, usp, websiteUrl } = body
    if (!name) return NextResponse.json({ error: 'Product name required' }, { status: 400 })

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name,
        description,
        benefits: benefits || [],
        features: features || [],
        target_audience: targetAudience,
        usp,
        website_url: websiteUrl,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ product })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ product })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
