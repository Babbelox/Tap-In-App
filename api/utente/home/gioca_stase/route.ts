import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { validator } from "@/lib/helpers/validation"
import { interpreter } from "@/lib/helpers/filter_interpreter"
import { centri_gen } from "@/lib/prisma_functions/get_centri"

export async function GET(request: Request) {
  return validator(async (_userId) => {
    return interpreter(request, async (numero_persone, tutti) => {
      const ZONE_TIME = "Europe/Rome"

      const ora_italia = toZonedTime(new Date(), ZONE_TIME)
      const ora_italia_UTC = fromZonedTime(ora_italia, ZONE_TIME)
      const giorno_settimana_js = ora_italia.getDay()
      const giorno_settimana_db = giorno_settimana_js === 0 ? 7 : giorno_settimana_js

      const campi_stasera = await prisma.tabella_campi.findMany({
        where: {
          disponibile: true,
          ...(tutti || numero_persone === null ? {} : { numero_persone: numero_persone }),  // ← filtro condizionale
          orari_regolari: {
            some: {
              giorno_settimana: giorno_settimana_db,
              ora_apertura: { lte: ora_italia_UTC },
              ora_chiusura: { gt: ora_italia_UTC },
            },
          },
        },
        include: {
          orari_regolari: {
            where: { giorno_settimana: giorno_settimana_db }
          },
          prenotazioni_attive: {
            where: {
              data_campettata: { gte: ora_italia_UTC }
            }
          }
        },
        take: 50
      })

      const campi_con_slot = campi_stasera.filter(campo => {
        const orario = campo.orari_regolari[0]
        const prenotazioni = campo.prenotazioni_attive

        const chiusura = orario.ora_chiusura.getUTCHours() * 60 + orario.ora_chiusura.getUTCMinutes()
        const ora_attuale = ora_italia_UTC.getUTCHours() * 60 + ora_italia_UTC.getUTCMinutes()

        if (chiusura - ora_attuale < 60) return false

        const occupati = prenotazioni
          .map(p => ({
            inizio: p.data_campettata.getUTCHours() * 60 + p.data_campettata.getUTCMinutes(),
            fine: p.ora_fine.getUTCHours() * 60 + p.ora_fine.getUTCMinutes(),
          }))
          .filter(p => p.fine > ora_attuale)
          .sort((a, b) => a.inizio - b.inizio)

        let cursor = ora_attuale
        for (const slot of occupati) {
          if (slot.inizio - cursor >= 60) return true
          cursor = slot.fine
        }

        return chiusura - cursor >= 60
      })

      if (campi_con_slot.length === 0) {
        return NextResponse.json(
          { message: "Nessun campo disponibile stasera" },
          { status: 200 }
        )
      }

      const centri = centri_gen(campi_con_slot)
      return NextResponse.json(
        { message: "Centri trovati", centri },
        { status: 200 }
      )
    })
  })
}