// GET che prende campi che hanno almeno una disponibilità per il giorno dopo
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authConfig"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toZonedTime} from "date-fns-tz"
import { startOfDay, addDays } from "date-fns"

export default function Minuti(date: Date){

    const date_minuti = date.getHours() * 60 + date.getMinutes()

    return date_minuti
}

export async function GET(){
    const ZONE_TIME = "Europe/Rome"
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json(
            { message: "Utente non autenticato" },
            { status: 401 }
        )
    }

    // L'utente è loggato

    try {
        const giorno_adesso = toZonedTime(new Date(), ZONE_TIME)
        const giorno_settimana_domani = (giorno_adesso.getDay() + 1) % 7 // 0-6
        const giorno_settimana_db = giorno_settimana_domani === 0 ? 7 : giorno_settimana_domani 
        const domani = startOfDay(addDays(giorno_adesso, 1))

        const campi_doma = await prisma.tabella_campi.findMany({
            where:{
                disponibile: true,
                numero_persone: 5,
                orari_regolari:{
                    some:{
                        giorno_settimana: giorno_settimana_db,
                    }
                }
            },
            include: {
                orari_regolari:{
                    where:{giorno_settimana: giorno_settimana_db},
                    select:{
                        giorno_settimana: true,
                        ora_apertura: true,
                        ora_chiusura: true
                    }
                },
                prenotazioni_attive:{
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

        // Verifichiamo che questi campi abbiano una disponibilità

        const campi_con_slot = campi_doma.filter(campo=>{
            const orario = campo.orari_regolari[0]
            const ora_apertura = orario.ora_apertura
            const ora_chiusura = orario.ora_chiusura

            //Calcoliamo quante ore ci sono in una giornata lavorativa di un campo

            const ora_apertura_min = ora_apertura.getHours() * 60 + ora_apertura.getMinutes()

            // Ora prendiamo le prenotazioni e ordiniamole per ora, non è detto che Prisma le dia in orario corretto
            const prenotazioni = campo.prenotazioni_attive.sort((a, b) =>  Minuti(a.ora_inizio) - Minuti(b.ora_inizio))
            
            if(prenotazioni.length === 0)
                return true

            let cursor = ora_apertura_min

            for (const slot of prenotazioni){
                if(Minuti(slot.ora_inizio) === cursor){
                    cursor = Minuti(slot.ora_fine)
                }
                else{
                    return true
                }
            }

            if(Minuti(ora_chiusura) - cursor >= 60)
                return true

            return false
        })

        if(campi_con_slot.length === 0){
            return NextResponse.json(
                {message: "Nessun campo disponibile domani"},
                {status: 200}
            )
        }
        else
            return NextResponse.json(
                {message: "Campi trovati", campi_con_slot},
                {status: 200}
            )
    }
    catch {
        return NextResponse.json(
            {message: "Errore prisma"},
            {status: 500}
        )
    }
}