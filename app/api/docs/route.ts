import { NextResponse } from 'next/server';
import { spec } from '@/api/utils/swagger';

export async function GET() {
  return NextResponse.json(spec);
}
