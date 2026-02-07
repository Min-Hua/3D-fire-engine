
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
  // Driving Properties
  isDriveMode: boolean;
  speed: number;
  heading: number;
  position: { x: number; y: number; z: number };
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
