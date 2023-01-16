import type { LeagueItemDTO } from './LeagueItemDTO'

export type LeagueListDTO = {
	leagueId: string
	entries: LeagueItemDTO[]
	tier: string
	name: string
	queue: string
}
