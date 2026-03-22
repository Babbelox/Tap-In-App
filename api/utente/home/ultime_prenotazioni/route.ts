import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authConfig"

type Campo = {
    id_campo: number
    nome_campo: string | null
    prezzo_ora_standard: number
    id_centro_sportivo: number
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json(
            { message: "Utente non autenticato" },
            { status: 401 }
        )
    }

    const user_id = parseInt(session.user.id)

    try {
        const pren_last = await prisma.storico_prenotazioni.findMany({
            where: {
                id_utente: user_id,
            },
            include: {
                tabella_campi: true
            },
            orderBy: {
                data_avvenuta_prenotazione: "desc"
            },
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
                campi_map.set(id, {
                    id_campo: id,
                    nome_campo: prenotazione.tabella_campi.nome_campo,
                    prezzo_ora_standard: prenotazione.tabella_campi.prezzo_ora_standard.toNumber(),
                    id_centro_sportivo: prenotazione.tabella_campi.id_centro_sportivo,
                })
            }
            if (campi_map.size === 5) break
        }

        return NextResponse.json(
            Array.from(campi_map.values()),
            { status: 200 }
        )

    } catch {
        return NextResponse.json(
            { message: "Errore interno del server" },
            { status: 500 }
        )
    }
}