import type { ParticipantDTO } from './ParticipantDTO'
import type { TeamDTO } from './TeamDTO'

export type InfoDTO = {
	gameCreation: number
	gameDuration: number
	gameEndTimestamp: number
	gameId: number
	gameMode: string
	gameName: string
	gameStartTimestamp: number
	gameType: string
	gameVersion: string
	mapId: number
	participants: ParticipantDTO[]
	platformId: string
	queueId: number
	teams: TeamDTO[]
	tournamentCode: string
}