export function CloudDivider({ flip = false, color = "white" }: { flip?: boolean; color?: string }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full h-12 sm:h-16 ${flip ? "rotate-180" : ""}`}
    >
      <path
        fill={color}
        d="M0,40 C80,80 160,0 240,40 C320,80 400,0 480,40 C560,80 640,0 720,40 C800,80 880,0 960,40 C1040,80 1120,0 1200,40 C1280,80 1360,0 1440,40 L1440,80 L0,80 Z"
      />
    </svg>
  );
}