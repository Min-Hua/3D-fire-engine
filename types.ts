
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
  // Fire Simulation Properties
  isFireActive: boolean;
  fireStrength: number; // 1 to 10
  fireHealth: number;   // 0 to 100
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
