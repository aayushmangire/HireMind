import { HandwritingSvg } from "@/components/ui/handwriting-svg";

export default function DemoHandwriting() {
  return (
    <div className="flex min-h-[320px] w-full flex-col items-center justify-center p-6">
      <HandwritingSvg
        duration={1.5}
        pauseDelay={1.5}
        className="text-[#141414]"
      />
    </div>
  );
}
