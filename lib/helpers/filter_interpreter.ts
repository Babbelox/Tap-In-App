import { NextResponse } from "next/server";
import { req_validation } from "../zod_schemas/schmas";

export async function interpreter(richiesta: Request, handler: (num: number, tutte: boolean) => Promise<NextResponse>) {
    const body = await richiesta.json()       
    const parsed = req_validation.safeParse(body)
  
    if(!parsed.success)
        return NextResponse.json(
            {message: "Richiesta mal formata"},
            {status: 400}
    )
    const tutti = parsed.data.tutte

    if(tutti){
        const numero_persone = 0
        return await handler (numero_persone, tutti)
    }
    const numero_persone = parsed.data.numero_persone


  
  
}