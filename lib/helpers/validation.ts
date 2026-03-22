// Funzione chiave di tutto il sito, verifica 
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authConfig"

export async function validator(
  handler: (userId: number) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 401 })
  }

  const userId = parseInt(session.user.id)
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Sessione non valida" }, { status: 401 })
  }

  try {
    return await handler(userId)
  } catch (error) {
    console.error("[validator]", error)
    return NextResponse.json({ message: "Errore interno server" }, { status: 500 })
  }
}