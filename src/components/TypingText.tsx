import { useEffect, useState } from "react";

export default function TypingText({
  text,
  speed = 18,
  className,
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <p className={className}>
      {shown}
      {shown.length < text.length && (
        <span className="ml-0.5 inline-block h-4 w-[2px] bg-primary animate-blink align-middle" />
      )}
    </p>
  );
}
