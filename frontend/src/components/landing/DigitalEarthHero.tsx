import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Major global cybersecurity telemetry coordinates [lat, lon, label, severity]
const CYBER_NODES = [
  { lat: 37.7749, lon: -122.4194, label: 'San Francisco', severity: 'normal' },
  { lat: 40.7128, lon: -74.0060, label: 'New York', severity: 'warning' },
  { lat: 51.5074, lon: -0.1278, label: 'London', severity: 'normal' },
  { lat: 50.1109, lon: 8.6821, label: 'Frankfurt', severity: 'threat' },
  { lat: 35.6762, lon: 139.6503, label: 'Tokyo', severity: 'threat' },
  { lat: 1.3521, lon: 103.8198, label: 'Singapore', severity: 'normal' },
  { lat: -33.8688, lon: 151.2093, label: 'Sydney', severity: 'normal' },
  { lat: 25.2048, lon: 55.2708, label: 'Dubai', severity: 'warning' },
  { lat: 28.6139, lon: 77.2090, label: 'New Delhi', severity: 'normal' },
  { lat: -23.5505, lon: -46.6333, label: 'São Paulo', severity: 'normal' },
  { lat: 59.3293, lon: 18.0686, label: 'Stockholm', severity: 'normal' },
  { lat: 31.2304, lon: 121.4737, label: 'Shanghai', severity: 'threat' },
];

// Helper to convert Lat/Lon to 3D Cartesian Coordinates on Sphere of radius R
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Check if a given lat/lon lands roughly on Earth's landmasses
function isLandmass(lat: number, lon: number): boolean {
  // Approximate continental land boxes to create recognizable continent clusters
  // North America
  if (lat >= 15 && lat <= 70 && lon >= -165 && lon <= -55) return true;
  // South America
  if (lat >= -55 && lat <= 12 && lon >= -82 && lon <= -35) return true;
  // Europe
  if (lat >= 36 && lat <= 70 && lon >= -10 && lon <= 40) return true;
  // Africa
  if (lat >= -35 && lat <= 36 && lon >= -18 && lon <= 50) return true;
  // Asia
  if (lat >= 10 && lat <= 75 && lon >= 40 && lon <= 150) return true;
  // Australia
  if (lat >= -40 && lat <= -10 && lon >= 112 && lon <= 154) return true;
  // Japan / Maritime East Asia
  if (lat >= 24 && lat <= 46 && lon >= 120 && lon <= 146) return true;
  // Scandinavia / UK
  if (lat >= 50 && lat <= 70 && lon >= -10 && lon <= 30) return true;
  return false;
}

export const DigitalEarthHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Create a circular glowing sprite for particles
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(52, 211, 153, 0.9)'); // Emerald
      gradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.5)'); // Teal
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const particleTexture = createParticleTexture();

    // Master Globe Group
    // Positioned lower so it rises up from the bottom of the viewport
    const globeRadius = 3.6;
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, -2.4, 0); // Partially submerged under the fold
    globeGroup.rotation.x = 0.28; // Tilted towards the viewer
    globeGroup.rotation.z = -0.12;
    scene.add(globeGroup);

    // -------------------------------------------------------------
    // 1. Digital Earth Point Cloud Particles (Land + Lat-Lon Grid)
    // -------------------------------------------------------------
    const particleCount = 5500;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    const colorEmerald = new THREE.Color('#34D399');
    const colorTeal = new THREE.Color('#2DD4BF');
    const colorCyan = new THREE.Color('#38BDF8');
    const colorDim = new THREE.Color('#134E4A'); // Deep teal for background grid

    let pIdx = 0;
    // Golden spiral distribution on sphere
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Convert x,y,z back to lat/lon to check landmass
      const lat = Math.asin(y) * (180 / Math.PI);
      const lon = Math.atan2(z, -x) * (180 / Math.PI) - 180;

      const isLand = isLandmass(lat, lon);

      particlePositions[pIdx * 3] = x * globeRadius;
      particlePositions[pIdx * 3 + 1] = y * globeRadius;
      particlePositions[pIdx * 3 + 2] = z * globeRadius;

      if (isLand) {
        // Bright emerald/teal on continents
        const mixRatio = Math.random();
        const c = mixRatio > 0.6 ? colorCyan : mixRatio > 0.3 ? colorEmerald : colorTeal;
        particleColors[pIdx * 3] = c.r;
        particleColors[pIdx * 3 + 1] = c.g;
        particleColors[pIdx * 3 + 2] = c.b;
        particleSizes[pIdx] = 0.055 + Math.random() * 0.035;
      } else {
        // Dimmer subtle grid points over oceans to preserve spherical structure
        particleColors[pIdx * 3] = colorDim.r * 0.5;
        particleColors[pIdx * 3 + 1] = colorDim.g * 0.5;
        particleColors[pIdx * 3 + 2] = colorDim.b * 0.5;
        particleSizes[pIdx] = 0.025;
      }

      pIdx++;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.065,
      map: particleTexture || undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const earthPoints = new THREE.Points(particleGeometry, particleMaterial);
    globeGroup.add(earthPoints);

    // -------------------------------------------------------------
    // 2. Atmospheric Rim Glow (Layered Fresnel Shader Glow)
    // -------------------------------------------------------------
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        // Fresnel factor: bright at silhouette rim, transparent in center
        float intensity = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.8);
        vec3 glowColor = vec3(0.08, 0.85, 0.65); // Vibrant Emerald-Teal
        gl_FragColor = vec4(glowColor, intensity * 0.75);
      }
    `;

    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.025, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // Inner soft haze
    const innerHazeGeo = new THREE.SphereGeometry(globeRadius * 0.985, 32, 32);
    const innerHazeMat = new THREE.MeshBasicMaterial({
      color: 0x064e3b, // Deep emerald dark base
      transparent: true,
      opacity: 0.35,
    });
    const innerHaze = new THREE.Mesh(innerHazeGeo, innerHazeMat);
    globeGroup.add(innerHaze);

    // -------------------------------------------------------------
    // 3. Cyber Telemetry Nodes & Threat Beacons
    // -------------------------------------------------------------
    const nodeVectors: THREE.Vector3[] = [];
    const nodeGroup = new THREE.Group();
    globeGroup.add(nodeGroup);

    const pulsingBeacons: { mesh: THREE.Mesh; baseScale: number; pulseSpeed: number; color: string }[] = [];

    CYBER_NODES.forEach((node) => {
      const pos = latLonToVector3(node.lat, node.lon, globeRadius * 1.01);
      nodeVectors.push(pos);

      // Node dot
      const nodeColor =
        node.severity === 'threat'
          ? 0xfb7185 // Critical Rose
          : node.severity === 'warning'
            ? 0xfbbf24 // Warning Amber
            : 0x34d399; // Emerald

      const nodeDotGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const nodeDotMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        transparent: true,
        opacity: 0.95,
      });
      const nodeDot = new THREE.Mesh(nodeDotGeo, nodeDotMat);
      nodeDot.position.copy(pos);
      nodeGroup.add(nodeDot);

      // Outer pulsing ring
      const ringGeo = new THREE.RingGeometry(0.045, 0.085, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, -2.4, 0)); // Orient flat against sphere surface
      nodeGroup.add(ringMesh);

      pulsingBeacons.push({
        mesh: ringMesh,
        baseScale: 1,
        pulseSpeed: node.severity === 'threat' ? 4 : 2,
        color: String(nodeColor),
      });
    });

    // -------------------------------------------------------------
    // 4. Interconnected Great-Circle Arcs & Moving Data Packets
    // -------------------------------------------------------------
    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);

    // Build curved arcs between selected cyber centers
    const arcPairs = [
      [0, 1], // SF -> NY
      [1, 2], // NY -> London
      [2, 3], // London -> Frankfurt
      [3, 4], // Frankfurt -> Tokyo
      [4, 5], // Tokyo -> Singapore
      [5, 6], // Singapore -> Sydney
      [2, 7], // London -> Dubai
      [7, 8], // Dubai -> New Delhi
      [8, 5], // New Delhi -> Singapore
      [1, 9], // NY -> São Paulo
      [3, 10], // Frankfurt -> Stockholm
      [4, 11], // Tokyo -> Shanghai
      [0, 4], // SF -> Tokyo
    ];

    const dataPackets: { curve: THREE.CatmullRomCurve3; mesh: THREE.Mesh; speed: number; offset: number }[] = [];

    arcPairs.forEach(([idxA, idxB]) => {
      const vA = nodeVectors[idxA];
      const vB = nodeVectors[idxB];
      if (!vA || !vB) return;

      // Calculate midpoint elevated above globe surface to create arch
      const distance = vA.distanceTo(vB);
      const mid = new THREE.Vector3().addVectors(vA, vB).multiplyScalar(0.5);
      const elevation = globeRadius + distance * 0.28;
      mid.normalize().multiplyScalar(elevation);

      const curve = new THREE.CatmullRomCurve3([vA, mid, vB]);

      // Draw faint curve line
      const points = curve.getPoints(36);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x2dd4bf, // Teal
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(curveGeo, curveMat);
      arcsGroup.add(line);

      // Animated glowing data packet
      const packetGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const packetMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8, // Electric cyan data pulse
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const packet = new THREE.Mesh(packetGeo, packetMat);
      arcsGroup.add(packet);

      dataPackets.push({
        curve,
        mesh: packet,
        speed: 0.15 + Math.random() * 0.1,
        offset: Math.random(),
      });
    });

    // -------------------------------------------------------------
    // 5. Ambient Deep-Space Floating Dust Particles
    // -------------------------------------------------------------
    const spaceDustCount = 220;
    const dustPositions = new Float32Array(spaceDustCount * 3);
    for (let i = 0; i < spaceDustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 16;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      size: 0.035,
      color: 0x34d399,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const spaceDust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(spaceDust);

    // -------------------------------------------------------------
    // 6. Interactive Mouse Parallax & Continuous Animation Loop
    // -------------------------------------------------------------
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = x * 0.18;
      targetMouseY = y * 0.12;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Continuous slow rotation in a natural direction
      if (!prefersReducedMotion) {
        globeGroup.rotation.y += 0.0016;

        // Mouse Parallax with smooth lerp damping
        currentMouseX += (targetMouseX - currentMouseX) * 0.04;
        currentMouseY += (targetMouseY - currentMouseY) * 0.04;

        globeGroup.position.x = currentMouseX * 0.6;
        globeGroup.position.y = -2.4 + currentMouseY * 0.4;
      }

      // Animate pulsing cyber threat beacons
      pulsingBeacons.forEach((beacon, i) => {
        const pulse = Math.sin(elapsedTime * beacon.pulseSpeed + i) * 0.4 + 1;
        beacon.mesh.scale.set(pulse, pulse, 1);
        (beacon.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 - (pulse - 1) * 0.5;
      });

      // Animate moving data packets along curves
      dataPackets.forEach((dp) => {
        const t = (elapsedTime * dp.speed + dp.offset) % 1;
        const pt = dp.curve.getPointAt(t);
        dp.mesh.position.copy(pt);
      });

      // Subtle drift of ambient space dust
      spaceDust.rotation.y = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // 7. Responsive Resize Observer
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;

      // Adjust camera distance on smaller screens so the majestic globe fits
      if (width < 640) {
        camera.position.z = 8.8;
        globeGroup.position.y = -2.6;
      } else if (width < 1024) {
        camera.position.z = 8.0;
        globeGroup.position.y = -2.5;
      } else {
        camera.position.z = 7.5;
        globeGroup.position.y = -2.4;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Initial sizing
    handleResize();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      // Clean Three.js memory allocations
      particleGeometry.dispose();
      particleMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      innerHazeGeo.dispose();
      innerHazeMat.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Volumetric Radial Emerald Haze behind the globe */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-t from-[#10B981]/15 via-[#2DD4BF]/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Bottom fade mask to seamlessly blend into next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#080E1E] via-[#080E1E]/60 to-transparent pointer-events-none" />
    </div>
  );
};
