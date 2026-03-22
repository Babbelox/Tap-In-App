import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { validator } from "@/lib/helpers/validation"
import { centri_gen } from "@/lib/prisma_functions/get_centri"

export async function GET(request: Request) {
  return validator(async (user_id) => {
    
    const preferiti = await prisma.preferiti.findMany({
      where: { id_utente: user_id },
      include: { tabella_campi: true }  
    })

    const campi = preferiti.map(p => p.tabella_campi)

    const centri = await centri_gen(campi)

    return NextResponse.json(centri)
  })
}