// Funzione che fa GET specifici rispetto a varie cose

import prisma from "@/lib/prisma"
// Funzione che prende campi DISPONIBILI a 5

export async function GET(request: Request){

    const campo = await prisma.tabella_campi.findMany()
}