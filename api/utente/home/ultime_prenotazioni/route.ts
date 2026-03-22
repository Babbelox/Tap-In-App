import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { validator } from "@/lib/helpers/validation"
import { centri_gen } from "@/lib/prisma_functions/get_centri"
import type { tabella_campi as Campo } from "@prisma/client"

export async function GET() {
  return validator(async (user_id) => {
    const pren_last = await prisma.storico_prenotazioni.findMany({
      where: { id_utente: user_id },
      include: { tabella_campi: true },
      orderBy: { data_avvenuta_prenotazione: "desc" },
      take: 20
    })

    if (pren_last.length === 0) {
      return NextResponse.json(
        { message: "Nessuna prenotazione trovata" },
        { status: 200 }
      )
    }

    const campi_map = new Map<number, Campo>()

    for (const prenotazione of pren_last) {
      const id = prenotazione.id_campo_sportivo
      if (!campi_map.has(id)) {
        campi_map.set(id, prenotazione.tabella_campi)
      }
      if (campi_map.size === 5) break
    }

    const campi = Array.from(campi_map.values())
    const centri = await centri_gen(campi)

    return NextResponse.json(
      { campi, centri },
      { status: 200 }
    )
  })
}