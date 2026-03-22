import type {
  centri_sportivi as CentroSportivo,
  chiusure_straordinarie as ChiusuraStraordinaria,
  orari_regolari as OrarioRegolare,
  prenotazioni_attive as PrenotazioneAttiva,
  proprietari as Proprietario,
  storico_pagamenti as StoricoPagamenti,
  storico_prenotazioni as StoricoPrenotazioni,
  tabella_campi as Campo,
  utenti as Utente,
  preferiti as Preferito,
} from "@prisma/client"

export type {
  CentroSportivo,
  ChiusuraStraordinaria,
  OrarioRegolare,
  PrenotazioneAttiva,
  Proprietario,
  StoricoPagamenti,
  StoricoPrenotazioni,
  Campo,
  Utente,
  Preferito,
}

export type CampoConDettagli = Campo & {
  orari_regolari: OrarioRegolare[]
  prenotazioni_attive: PrenotazioneAttiva[]
  chiusure_straordinarie: ChiusuraStraordinaria[]
  storico_prenotazioni: StoricoPrenotazioni[]
  preferiti: Preferito[]
  centri_sportivi: CentroSportivo
}

export type CentroConDettagli = CentroSportivo & {
  tabella_campi: Campo[]
  proprietari: Proprietario
}

export type PrenotazioneAttivaConDettagli = PrenotazioneAttiva & {
  tabella_campi: Campo
  utenti: Utente
  storico_pagamenti: StoricoPagamenti[]
}

export type StoricoPrenotazioniConDettagli = StoricoPrenotazioni & {
  tabella_campi: Campo
}

export type StoricoPagamentiConDettagli = StoricoPagamenti & {
  prenotazioni_attive: PrenotazioneAttiva
}

export type UtenteConDettagli = Utente & {
  prenotazioni_attive: PrenotazioneAttiva[]
  preferiti: Preferito[]
}

export type ProprietarioConDettagli = Proprietario & {
  centri_sportivi: CentroSportivo[]
}

export type PreferitoConDettagli = Preferito & {
  tabella_campi: Campo
  utenti: Utente
}

export type ChiusuraStraordinariaConDettagli = ChiusuraStraordinaria & {
  tabella_campi: Campo
}

export type OrarioRegolareConDettagli = OrarioRegolare & {
  tabella_campi: Campo
}

export type CentroConCampiCompleti = CentroSportivo & {
  tabella_campi: CampoConDettagli[]
  proprietari: Proprietario
}

export type UtenteConPrenotazioniComplete = Utente & {
  prenotazioni_attive: PrenotazioneAttivaConDettagli[]
  preferiti: PreferitoConDettagli[]
}