// Funzione che fa GET specifici rispetto a varie cose

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
// Funzione che prende campi DISPONIBILI a 5

export async function GET(request: Request){

    try {
        
        const campo = await prisma.tabella_campi.findMany({
        where: {disponibile: true, numero_persone: 5},
        take: 15
    })

        if(campo.length === 0){
            return NextResponse.json(
                {message: "nessun campo disponibile"},
                {status: 500}
            )
        }
 
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