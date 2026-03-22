import { NextResponse } from "next/server"
import { req_validation } from "../zod_schemas/schmas"

export async function interpreter(
  richiesta: Request,
  handler: (count: number | null, all: boolean) => Promise<NextResponse>
) {
  let body
  try {
    body = await richiesta.json()
  } catch {
    return NextResponse.json({ message: "Body non valido" }, { status: 400 })
  }

  const parsed = req_validation.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Richiesta mal formata" }, { status: 400 })
  }

  const all = parsed.data.tutte // --- Tutti i tipi di campi
  const count = all ? null : parsed.data.numero_persone // --- Numero di persone nel campo

  return await handler(count, all)
}