import { tabella_campi as Campo, centri_sportivi as Centri } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function centri_gen(campi: Campo[]): Promise<Centri[]> {
  const ids_centri = [...new Set(campi.map(c => c.id_centro_sportivo))]

  const centri = await prisma.centri_sportivi.findMany({
    where: {
      id_centro_sportivo: {
        in: ids_centri
      }
    }
  })

  return centri
}


