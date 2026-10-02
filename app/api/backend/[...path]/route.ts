import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } | Promise<{ path?: string[] }> }
) {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, message: 'GOOGLE_SCRIPT_URL no está configurada en las variables de entorno' },
        { status: 500 }
      )
    }

    const resolvedParams = await params
    const endpoint = (resolvedParams.path || []).join('/')
    
    const { searchParams } = new URL(request.url)
    const targetUrl = new URL(GOOGLE_SCRIPT_URL)
    
    targetUrl.searchParams.set('endpoint', endpoint)
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        targetUrl.searchParams.set(key, value)
      }
    })

    console.log(`[API Bridge GET] Reenviando a: ${targetUrl.toString()}`)

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      next: { revalidate: 15 },
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script respondió con status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API Bridge GET Error]:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Error de conexión con Google Sheets' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path?: string[] } | Promise<{ path?: string[] }> }
) {
  try {
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, message: 'GOOGLE_SCRIPT_URL no está configurada en las variables de entorno' },
        { status: 500 }
      )
    }

    const resolvedParams = await params
    const endpoint = (resolvedParams.path || []).join('/')

    let body = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const payload = {
      ...body,
      endpoint
    }

    console.log(`[API Bridge POST] Reenviando a: ${GOOGLE_SCRIPT_URL} para endpoint: ${endpoint}`)

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`Google Apps Script respondió con status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API Bridge POST Error]:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Error de conexión con Google Sheets' },
      { status: 500 }
    )
  }
}
