import z from "zod";

export const req_validation = z.object({
    numero_persone : z.int() || z.null()
})