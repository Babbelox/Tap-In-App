import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { validator } from "@/lib/helpers/validation"
import { interpreter } from "@/lib/helpers/filter_interpreter"
import { centri_gen } from "@/lib/prisma_functions/get_centri"

export async function GET(request: Request) {
  return validator(async (userId) => {
    return interpreter(request, async (count, all) => {
      
      if (all) {
        const campi = await prisma.tabella_campi.findMany({
            where: {disponibile: true},
            take: 20
        })
        const centri = centri_gen(campi)
        return NextResponse.json(centri)
      }
      else if(count){
        const campi_specifici = await prisma.tabella_campi.findMany({
            where: {disponibile: true, numero_persone: count},
            take: 15
        })
        const centri = centri_gen(campi_specifici)
        return NextResponse.json(centri)
      }
      return NextResponse.json({ message: "Parametri non validi" }, { status: 400 })
    })
  })
}