import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  Suspense,
  useEffect,
} from "react";
import * as THREE from "three";

type Props = {
  pollution: number;
  forest: number;
  ice: "stable" | "melting" | "critical";
  mode?: "current" | "future";
  size?: number;
  interactive?: boolean;
};

export type EarthGlobeHandle = {
  getCanvas: () => HTMLCanvasElement | null;
};

const TEX = {
  day: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
  night: "https://threejs.org/examples/textures/planets/earth_lights_2048.png",
  normal: "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg",
  specular:
    "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg",
  clouds: "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
};

const earthVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform vec3 sunDirection;
  uniform vec3 tintColor;
  uniform float tintStrength;
  uniform float forestStrength;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(sunDirection);
    float cosSun = dot(normal, sunDir);
    float dayMix = smoothstep(-0.25, 0.35, cosSun);

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb * 3.0;
    float spec = texture2D(specMap, vUv).r;

    // Brighten day side and add ambient fill so dark side isn't pitch black
    vec3 ambient = day * 0.18;
    vec3 litDay = day * (0.55 + max(cosSun, 0.0) * 0.85);
    vec3 color = mix(ambient + night, litDay, dayMix);

    vec3 viewDir = normalize(vViewPosition);
    vec3 halfDir = normalize(sunDir + viewDir);
    float specHighlight = pow(max(dot(normal, halfDir), 0.0), 32.0) * spec * dayMix * 0.8;
    color += vec3(0.7, 0.85, 1.0) * specHighlight;

    color += vec3(0.1, 0.5, 0.25) * forestStrength * dayMix * (1.0 - spec);
    color = mix(color, color * (1.0 - tintStrength * 0.4) + tintColor * tintStrength, tintStrength * dayMix);

    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
    color += vec3(0.35, 0.6, 1.0) * fresnel * 0.28;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmoFragmentShader = /* glsl */ `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.0);
    gl_FragColor = vec4(glowColor, rim * intensity);
  }
`;

// Major world cities — light up on the night side
const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "New York", lat: 40.71, lng: -74.0 },
  { name: "Los Angeles", lat: 34.05, lng: -118.24 },
  { name: "Mexico City", lat: 19.43, lng: -99.13 },
  { name: "São Paulo", lat: -23.55, lng: -46.63 },
  { name: "Buenos Aires", lat: -34.6, lng: -58.38 },
  { name: "London", lat: 51.51, lng: -0.13 },
  { name: "Paris", lat: 48.85, lng: 2.35 },
  { name: "Madrid", lat: 40.42, lng: -3.7 },
  { name: "Cairo", lat: 30.04, lng: 31.24 },
  { name: "Lagos", lat: 6.52, lng: 3.38 },
  { name: "Johannesburg", lat: -26.2, lng: 28.05 },
  { name: "Moscow", lat: 55.75, lng: 37.62 },
  { name: "Istanbul", lat: 41.01, lng: 28.98 },
  { name: "Dubai", lat: 25.2, lng: 55.27 },
  { name: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "Delhi", lat: 28.61, lng: 77.21 },
  { name: "Bangkok", lat: 13.76, lng: 100.5 },
  { name: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "Beijing", lat: 39.9, lng: 116.4 },
  { name: "Shanghai", lat: 31.23, lng: 121.47 },
  { name: "Seoul", lat: 37.57, lng: 126.98 },
  { name: "Tokyo", lat: 35.68, lng: 139.69 },
  { name: "Sydney", lat: -33.87, lng: 151.21 },
  { name: "Jakarta", lat: -6.21, lng: 106.85 },
];

function latLngToVec3(lat: number, lng: number, radius = 1.005): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function makePinTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,240,180,1)");
  g.addColorStop(0.22, "rgba(255,200,90,0.95)");
  g.addColorStop(0.55, "rgba(255,140,40,0.4)");
  g.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function CityPins({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const pinTexture = useMemo(() => makePinTexture(), []);
  const positions = useMemo(
    () => CITIES.map((c) => latLngToVec3(c.lat, c.lng, 1.008)),
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const parent = groupRef.current.parent;
    const localSun = sunDirection.clone();
    if (parent) {
      const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
      localSun.transformDirection(inv);
    }
    groupRef.current.children.forEach((child, i) => {
      const sprite = child as THREE.Sprite;
      const pos = positions[i];
      const dot = pos.clone().normalize().dot(localSun);
      const nightFactor = THREE.MathUtils.clamp(-dot * 1.6 + 0.1, 0, 1);
      const pulse = 0.7 + Math.sin(t * 2.2 + i * 1.3) * 0.3;
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.opacity = nightFactor * pulse;
      const scale = 0.035 + nightFactor * 0.03 * pulse;
      sprite.scale.set(scale, scale, scale);
    });
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <sprite key={i} position={[p.x, p.y, p.z]}>
          <spriteMaterial
            map={pinTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

function EarthMesh({ pollution, forest, ice, mode = "current" }: Props) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, normalMap, specMap, cloudsMap] = useLoader(
    THREE.TextureLoader,
    [TEX.day, TEX.night, TEX.normal, TEX.specular, TEX.clouds],
    // ensure crossOrigin is set so canvas is not tainted and toDataURL() works
    (loader) => {
      try {
        // TextureLoader has setCrossOrigin in some builds; defensively set image.crossOrigin too
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const l = loader as any;
        if (typeof l.setCrossOrigin === "function")
          l.setCrossOrigin("anonymous");
        // also set on the manager's item callback to ensure images use anonymous where available
        l.manager?.setURLModifier?.((url: string) => url);
        /* eslint-enable @typescript-eslint/no-explicit-any */
      } catch {
        /* ignore */
      }
    },
  );

  useEffect(() => {
    [dayMap, nightMap, cloudsMap].forEach((t) => {
      if (t) t.colorSpace = THREE.SRGBColorSpace;
    });
    [dayMap, nightMap, normalMap, specMap, cloudsMap].forEach((t) => {
      if (t) t.anisotropy = 8;
    });
  }, [dayMap, nightMap, normalMap, specMap, cloudsMap]);

  const tintColor = useMemo(
    () =>
      mode === "future"
        ? new THREE.Color("#ff4530")
        : new THREE.Color("#c47a2e"),
    [mode],
  );
  const tintStrength =
    mode === "future" ? 0.45 : Math.max(0, (pollution - 30) / 110);
  const forestStrength = Math.max(0, (forest - 50) / 130);

  const atmoColor = useMemo(() => {
    const clean = new THREE.Color("#5ab8ff");
    const dirty = new THREE.Color("#ff9a3c");
    const future = new THREE.Color("#ff5050");
    const base = mode === "future" ? future : dirty;
    return clean.clone().lerp(base, Math.min(1, pollution / 100));
  }, [pollution, mode]);

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      specMap: { value: specMap },
      sunDirection: { value: new THREE.Vector3(0.6, 0.4, 0.9).normalize() },
      tintColor: { value: tintColor.clone() },
      tintStrength: { value: tintStrength },
      forestStrength: { value: forestStrength },
    }),
    [dayMap, nightMap, specMap, tintColor, tintStrength, forestStrength],
  );

  const atmoUniforms = useMemo(
    () => ({
      glowColor: { value: atmoColor.clone() },
      intensity: { value: 1.4 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    atmoUniforms.glowColor.value.copy(atmoColor);
  }, [atmoColor, atmoUniforms]);

  const iceStrength = ice === "critical" ? 0.15 : ice === "melting" ? 0.55 : 1;

  const sunDirection = useMemo(
    () => new THREE.Vector3(0.6, 0.4, 0.9).normalize(),
    [],
  );
  const earthGroupRef = useRef<THREE.Group>(null);
  const cloudsGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (earthGroupRef.current) earthGroupRef.current.rotation.y += delta * 0.05;
    if (cloudsGroupRef.current)
      cloudsGroupRef.current.rotation.y += delta * 0.07;
  });

  return (
    <group rotation={[0, 0, 0.41]}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 2, 4]} intensity={1.2} />

      {/* Rotating Earth + city pins (so pins stay anchored to land) */}
      <group ref={earthGroupRef}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[1, 128, 128]} />
          <shaderMaterial
            vertexShader={earthVertexShader}
            fragmentShader={earthFragmentShader}
            uniforms={earthUniforms}
          />
        </mesh>

        <mesh scale={1.002}>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            uniforms={{ uStrength: { value: iceStrength } }}
            vertexShader={`
              varying float vY;
              void main(){
                vY = position.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying float vY;
              uniform float uStrength;
              void main(){
                float polar = smoothstep(0.78, 0.98, abs(vY));
                gl_FragColor = vec4(0.95, 0.98, 1.0, polar * 0.6 * uStrength);
              }
            `}
          />
        </mesh>

        <CityPins sunDirection={sunDirection} />
      </group>

      {/* Clouds drift slightly faster — own rotation group */}
      <group ref={cloudsGroupRef}>
        <mesh ref={cloudsRef} scale={1.014}>
          <sphereGeometry args={[1, 96, 96]} />
          <meshPhongMaterial
            map={cloudsMap}
            transparent
            opacity={Math.max(0.3, 0.78 - pollution / 280)}
            depthWrite={false}
          />
        </mesh>
      </group>

      <mesh scale={1.08}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={atmoFragmentShader}
          uniforms={atmoUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh scale={1.32}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={atmoColor}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

const EarthGlobe = forwardRef<EarthGlobeHandle, Props>(
  function EarthGlobe(props, ref) {
    const { size = 420, interactive = true } = props;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    return (
      <div
        style={{ width: size, height: size }}
        className="relative mx-auto overflow-hidden rounded-full"
      >
        <Canvas
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            borderRadius: "50%",
          }}
          camera={{ position: [0, 0, 3.2], fov: 38 }}
          dpr={[1, 2]}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            canvasRef.current = gl.domElement;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <Suspense fallback={null}>
            <Stars
              radius={60}
              depth={40}
              count={3000}
              factor={3}
              fade
              speed={0.25}
            />
            <EarthMesh {...props} />
          </Suspense>
          {interactive && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.45}
            />
          )}
        </Canvas>
      </div>
    );
  },
);

export default EarthGlobe;
