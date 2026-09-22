import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MPU6050Data } from '../types/telemetry';
import { Compass, RotateCw } from 'lucide-react';

interface CanSat3DOrientationProps {
  mpuData: MPU6050Data;
}

export const CanSat3DOrientation: React.FC<CanSat3DOrientationProps> = ({ mpuData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canSatMeshRef = useRef<THREE.Group | null>(null);

  // Compute estimated pitch and roll from accelerometer
  // pitch = atan2(accelX, sqrt(accelY^2 + accelZ^2))
  // roll = atan2(accelY, sqrt(accelX^2 + accelZ^2))
  const pitchRad = Math.atan2(mpuData.accelX, Math.sqrt(mpuData.accelY * mpuData.accelY + mpuData.accelZ * mpuData.accelZ));
  const rollRad = Math.atan2(mpuData.accelY, Math.sqrt(mpuData.accelX * mpuData.accelX + mpuData.accelZ * mpuData.accelZ));
  const pitchDeg = Math.round((pitchRad * 180) / Math.PI);
  const rollDeg = Math.round((rollRad * 180) / Math.PI);
  const gyroZDeg = Math.round(mpuData.gyroZ);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 300;
    const height = mountRef.current.clientHeight || 260;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xaa00ff, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 5. CanSat 3D Model Group (Cylinder Body + Parachute Ring + Solar Panels)
    const canSatGroup = new THREE.Group();

    // Metallic CanSat Cylinder Body (0.66L soda can proportions)
    const canGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.2, 32);
    const canMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x0f172a,
    });
    const canMesh = new THREE.Mesh(canGeometry, canMaterial);
    canSatGroup.add(canMesh);

    // Outer Neon Ring Accents
    const ringGeo = new THREE.TorusGeometry(0.82, 0.04, 16, 32);
    const ringMatTop = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ringMeshTop = new THREE.Mesh(ringGeo, ringMatTop);
    ringMeshTop.rotation.x = Math.PI / 2;
    ringMeshTop.position.y = 0.8;
    canSatGroup.add(ringMeshTop);

    const ringMatBottom = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const ringMeshBottom = new THREE.Mesh(ringGeo, ringMatBottom);
    ringMeshBottom.rotation.x = Math.PI / 2;
    ringMeshBottom.position.y = -0.8;
    canSatGroup.add(ringMeshBottom);

    // ESP32-CAM lens box on side
    const lensGeo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, 0.3, 0.85);
    canSatGroup.add(lensMesh);

    // Add Axes Helper / Grid Ring below
    const gridHelper = new THREE.PolarGridHelper(3, 8, 8, 64, 0x334155, 0x1e293b);
    gridHelper.position.y = -1.6;
    scene.add(gridHelper);

    scene.add(canSatGroup);
    canSatMeshRef.current = canSatGroup;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smoothly interpolate rotation angles
      if (canSatMeshRef.current) {
        canSatMeshRef.current.rotation.x = pitchRad;
        canSatMeshRef.current.rotation.z = -rollRad;
        canSatMeshRef.current.rotation.y += (mpuData.gyroZ * 0.002);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Mesh Rotation when mpuData changes
  useEffect(() => {
    if (canSatMeshRef.current) {
      canSatMeshRef.current.rotation.x = pitchRad;
      canSatMeshRef.current.rotation.z = -rollRad;
    }
  }, [pitchRad, rollRad]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
            <RotateCw className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            Orientación 3D en Tiempo Real
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            MPU6050
          </span>
        </div>

        {/* 3D WebGL Canvas View */}
        <div ref={mountRef} className="w-full h-52 relative rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden flex items-center justify-center">
          <div className="absolute top-2 left-2 pointer-events-none text-[10px] font-mono text-slate-500">
            X-AXIS (PITCH) / Y-AXIS (ROLL) / Z-AXIS (YAW)
          </div>
        </div>
      </div>

      {/* Orientation Angles Readout */}
      <div className="grid grid-cols-3 gap-2 mt-4 font-mono text-xs text-center">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">PITCH (Inclinación)</span>
          <span className="font-bold text-cyan-300 text-sm">{pitchDeg}°</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">ROLL (Balanceo)</span>
          <span className="font-bold text-blue-300 text-sm">{rollDeg}°</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">YAW VEL (Giro Z)</span>
          <span className="font-bold text-purple-300 text-sm">{gyroZDeg}°/s</span>
        </div>
      </div>
    </div>
  );
};
