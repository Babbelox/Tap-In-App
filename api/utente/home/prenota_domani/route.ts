import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toZonedTime } from "date-fns-tz"
import { startOfDay, addDays } from "date-fns"
import { validator } from "@/lib/helpers/validation"
import { interpreter } from "@/lib/helpers/filter_interpreter"
import { centri_gen } from "@/lib/prisma_functions/get_centri"

function minuti(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export async function GET(request: Request) {
  return validator(async (_userId) => {
    return interpreter(request, async (numero_persone, tutti) => {
      const ZONE_TIME = "Europe/Rome"

      const giorno_adesso = toZonedTime(new Date(), ZONE_TIME)
      const giorno_settimana_domani = (giorno_adesso.getDay() + 1) % 7
      const giorno_settimana_db = giorno_settimana_domani === 0 ? 7 : giorno_settimana_domani
      const domani = startOfDay(addDays(giorno_adesso, 1))

      const campi_domani = await prisma.tabella_campi.findMany({
        where: {
          disponibile: true,
          ...(tutti || numero_persone === null ? {} : { numero_persone: numero_persone }),
          orari_regolari: {
            some: { giorno_settimana: giorno_settimana_db }
          }
        },
        include: {
          orari_regolari: {
            where: { giorno_settimana: giorno_settimana_db },
            select: {
              giorno_settimana: true,
              ora_apertura: true,
              ora_chiusura: true
            }
          },
          prenotazioni_attive: {
            where: {
              data_campettata: {
                gte: domani,
                lt: addDays(domani, 1)
              }
            }
          }
        },
        take: 30
      })

      const campi_con_slot = campi_domani.filter(campo => {
        const orario = campo.orari_regolari[0]
        const ora_apertura_min = minuti(orario.ora_apertura)
        const ora_chiusura_min = minuti(orario.ora_chiusura)

        const prenotazioni = campo.prenotazioni_attive
          .sort((a, b) => minuti(a.ora_inizio) - minuti(b.ora_inizio))

        if (prenotazioni.length === 0) return true

        let cursor = ora_apertura_min

        for (const slot of prenotazioni) {
          if (minuti(slot.ora_inizio) === cursor) {
            cursor = minuti(slot.ora_fine)
          } else {
            return true
          }
        }

        return ora_chiusura_min - cursor >= 60
      })

      if (campi_con_slot.length === 0) {
        return NextResponse.json(
          { message: "Nessun campo disponibile domani" },
          { status: 200 }
        )
      }

      const centri = await centri_gen(campi_con_slot)

      return NextResponse.json(
        { message: "Campi trovati", centri },
        { status: 200 }
      )
    })
  })
}