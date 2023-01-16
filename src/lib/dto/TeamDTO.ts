import type { BanDTO } from './BanDTO'
import type { ObjectivesDTO } from './ObjectivesDTO'

export type TeamDTO = {
	bans: BanDTO[]
	objectives: ObjectivesDTO
	teamId: number
	win: boolean
}