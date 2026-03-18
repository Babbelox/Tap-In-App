// Funzione GET che prende 15 centri sportivi a 5 con disponibilità oggi

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authConfig"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

export async function GET() {
    const numero_persone = 5 //MODIFICA NELLE API!!!!
    const ZONE_TIME = "Europe/Rome"
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json(
            { message: "Utente non autenticato" },
            { status: 401 }
        )
    }

    try {
        const ora_italia = toZonedTime(new Date(), ZONE_TIME)
        const ora_italia_UTC = fromZonedTime(ora_italia, ZONE_TIME)
        const giorno_settimana_js = ora_italia.getDay()
        const giorno_settimana_db = giorno_settimana_js === 0 ? 7 : giorno_settimana_js

        const campi_stase = await prisma.tabella_campi.findMany({
            where: {
                disponibile: true,
                numero_persone: 5,
                orari_regolari: {
                    some: {
                        giorno_settimana: giorno_settimana_db,
                        ora_apertura: {
                            lte: ora_italia_UTC,
                        },
                        ora_chiusura: {
                            gt: ora_italia_UTC,
                        },
                    },
                }
            },
            include: {
                orari_regolari:{
                    where:{giorno_settimana: giorno_settimana_db}
                },
                prenotazioni_attive:{
                    where: {
                        data_campettata:{
                            gte: ora_italia_UTC, // Non metto less than tanto il giorno deve essere lo stesso
                        }
                    }
                }

            },
            take: 50
        })

        const campi_con_slot = campi_stase.filter(campo => {
            const orario = campo.orari_regolari[0]
            const prenotazioni = campo.prenotazioni_attive

            // Chiusura in minuti
            const chiusura = orario.ora_chiusura.getUTCHours() * 60 + orario.ora_chiusura.getUTCMinutes()
    
            // Ora attuale in minuti
            const ora_attuale = ora_italia_UTC.getUTCHours() * 60 + ora_italia_UTC.getUTCMinutes()

            // Minuti disponibili da adesso alla chiusura
            const minuti_rimasti = chiusura - ora_attuale
            if (minuti_rimasti < 60) return false // campo già chiuso

            // C'è uno Slot da almeno 60 minuti?

            const occupati = prenotazioni.map(p => ({
                inizio: p.data_campettata.getUTCHours() * 60 + p.data_campettata.getUTCMinutes(),
                fine: p.ora_fine.getUTCHours() * 60 + p.ora_fine.getUTCMinutes(),
            }))
            .filter(p => p.fine > ora_attuale)
            .sort((a, b) => a.inizio - b.inizio)

            let cursor = ora_attuale

            for (const slot of occupati){
                if(slot.inizio - cursor >= 60)
                    return true
                cursor = slot.fine
            }
            
            if (chiusura - cursor >= 60) return true

            return false
        
    })


        if (campi_con_slot.length === 0) {
            return NextResponse.json(
                { message: "Nessun campo disponibile stasera" },
                { status: 200 }
            )
        }

        return NextResponse.json(
            { message: "Campi trovati", campi_con_slot },
            { status: 200 }
        )
    } catch {
        return NextResponse.json(
            { message: "Errore prisma" },
            { status: 500 }
        )
    }
}