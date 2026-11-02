import { ParticipantApp } from '@/components/participant/ParticipantApp'
import { getParticipantData } from '@/lib/content'
import { getCurrentMember } from '@/lib/currentMember'

export default async function ParticipantePage() {
  const member = await getCurrentMember()
  return <ParticipantApp member={member} data={member ? await getParticipantData(member) : null} />
}
