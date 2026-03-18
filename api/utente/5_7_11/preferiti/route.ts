import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authConfig"
// Funzione che prende campi DISPONIBILI a 5

export async function GET(request: Request){

    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json(
            { message: "Utente non autenticato" },
            { status: 401 }
        )
    }
    
    const id_utente = session.user.id

    try {
        
        const preferiti = await prisma.preferiti.findMany({
        where: {id_utente: parseInt(id_utente)},
        take: 15
    })

        if(preferiti.length === 0){
            return NextResponse.json(
                {message: "Nessun campo preferito"},
                {status: 200}
            )
        }

        // Restiuiamo proprio i campi preferiti

        const campo = await prisma.tabella_campi.findMany({
            where: {
                id_campo: {
                    in: preferiti.map(p => p.id_campo)
                }
            }
        })
        
        return NextResponse.json(
            {message: "campi trovati", campo},
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

export async function POST(request: Request){
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json(
            { message: "Utente non autenticato" },
            { status: 401 }
        )
    }
    
    const id_utente = session.user.id

    try {

        const { id_campo } = await request.json()

        if (!id_campo) {
            return NextResponse.json(
                { message: "ID campo mancante" },
                { status: 400 }
            )
        }

        const preferito = await prisma.preferiti.create({
            data: {
                id_utente: parseInt(id_utente),
                id_campo: parseInt(id_campo)
            }
        })

        return NextResponse.json(
            { message: "Campo aggiunto ai preferiti", preferito },
            { status: 201 }
        )
    }

    catch {
        return NextResponse.json(
            { message: "Errore prisma"},
            { status: 500 }
        )
    }
}