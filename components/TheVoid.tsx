import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Text, Trail } from '@react-three/drei';
import { AppRoute } from '../types';
import * as THREE from 'three';

// Define R3F elements as any to bypass IntrinsicElements check failures
const Group: any = 'group';
const Mesh: any = 'mesh';
const BoxGeometry: any = 'boxGeometry';
const MeshStandardMaterial: any = 'meshStandardMaterial';
const AmbientLight: any = 'ambientLight';
const PointLight: any = 'pointLight';
const GridHelper: any = 'gridHelper';
const Fog: any = 'fog';

interface TheVoidProps {
  onNavigate: (route: AppRoute) => void;
  activeRoute: AppRoute;
}

interface MonolithProps {
  position: [number, number, number];
  route: AppRoute;
  label: string;
  isActive: boolean;
  onClick: (route: AppRoute) => void;
}

const Monolith: React.FC<MonolithProps> = ({ 
  position, 
  route, 
  label, 
  isActive, 
  onClick 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      // Pulse scale if active
      if (isActive) {
          meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
          meshRef.current.scale.y = 3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
          meshRef.current.scale.z = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      } else {
          meshRef.current.scale.lerp(new THREE.Vector3(1, 3, 1), 0.1);
      }
    }
  });

  return (
    <Group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Trail width={2} length={4} color={isActive ? "#E53E3E" : "#333"} attenuation={(t) => t * t}>
            <Mesh
              ref={meshRef}
              onClick={(e: any) => { e.stopPropagation(); onClick(route); }}
              onPointerOver={() => setHover(true)}
              onPointerOut={() => setHover(false)}
            >
              <BoxGeometry args={[1, 3, 1]} />
              <MeshStandardMaterial 
                color={isActive ? "#E53E3E" : hovered ? "#555" : "#111"} 
                emissive={isActive ? "#E53E3E" : "#000"}
                emissiveIntensity={isActive ? 2 : 0}
                metalness={0.8}
                roughness={0.2}
                wireframe={!isActive && !hovered}
              />
            </Mesh>
        </Trail>
        
        <Text
          position={[0, -2.5, 0]}
          fontSize={0.3}
          color={isActive ? "#E53E3E" : hovered ? "#fff" : "#666"}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
          {label.toUpperCase()}
        </Text>
      </Float>
    </Group>
  );
};

const Scene = ({ onNavigate, activeRoute }: TheVoidProps) => {
  // Navigation Nodes positioned in 3D space
  const nodes = [
    { route: AppRoute.DASHBOARD, label: "Command", pos: [0, 0, 0] },
    { route: AppRoute.RESUME_FORGE, label: "Resume Forge", pos: [-4, 1, -2] },
    { route: AppRoute.SYSTEM_ARCHITECT, label: "Architect", pos: [4, 1, -2] },
    { route: AppRoute.CAREER_PATHFINDER, label: "Pathfinder", pos: [-6, -2, -5] },
    { route: AppRoute.APPLICATION_TRACKER, label: "Tracker", pos: [6, -2, -5] },
    { route: AppRoute.CHRONO_LAPSE, label: "Chrono", pos: [0, 3, -8] },
    { route: AppRoute.THE_TRIBUNAL, label: "Tribunal", pos: [0, -3, -8] },
  ];

  return (
    <>
      <AmbientLight intensity={0.2} />
      <PointLight position={[10, 10, 10]} intensity={1.5} color="#E53E3E" />
      <PointLight position={[-10, -10, -10]} intensity={0.5} color="#444" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Background Grid Floor */}
      <GridHelper args={[100, 100, 0x333333, 0x111111]} position={[0, -10, 0]} />
      <GridHelper args={[100, 100, 0x333333, 0x111111]} position={[0, 10, 0]} rotation={[Math.PI, 0, 0]} />

      {nodes.map((node, i) => (
        <Monolith
          key={i}
          position={node.pos as [number, number, number]}
          route={node.route}
          label={node.label}
          isActive={activeRoute === node.route}
          onClick={onNavigate}
        />
      ))}
    </>
  );
};

const TheVoid: React.FC<TheVoidProps> = (props) => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
        {/* We allow pointer events on canvas to interact with meshes, but the div itself is passive */}
        <div className="w-full h-full pointer-events-auto">
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
                <Scene {...props} />
                <Fog attach="fog" args={['#050505', 5, 30]} />
            </Canvas>
        </div>
    </div>
  );
};

export default TheVoid;