
export interface TruckConfig {
  bodyColor: string;
  ladderLength: number;
  ladderAngle: number;
  isLadderDeployed: boolean;
  wheelType: 'offroad' | 'street';
  cabStyle: 'standard' | 'extended';
  sirenActive: boolean;
  outriggersExtended: boolean;
  wheelCount: number;
  cannonYaw: number;
  cannonPitch: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
