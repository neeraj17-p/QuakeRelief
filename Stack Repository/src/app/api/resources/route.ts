import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      orderBy: { type: 'asc' }
    })
    return NextResponse.json(resources)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, currentLoad, status } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const resource = await db.resource.update({
      where: { id },
      data: {
        ...(currentLoad !== undefined ? { currentLoad } : {}),
        ...(status ? { status } : {}),
      }
    })
    return NextResponse.json(resource)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}