import logo from "@/assets/logo.png";

interface PDFWatermarkOverlayProps {
  userName: string;
  currentTime: string;
}

export function PDFWatermarkOverlay({ userName, currentTime }: PDFWatermarkOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Big center watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="opacity-[0.08] select-none text-center"
          style={{ transform: "rotate(-30deg)" }}
        >
          <img
            src={logo}
            alt="Spanish logo"
            className="mx-auto h-16 w-auto sm:h-20 md:h-24"
            draggable={false}
          />
          <p className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground whitespace-nowrap">
            {userName}
          </p>
          <p className="text-sm sm:text-base md:text-lg text-foreground mt-1">{currentTime}</p>
          <p className="text-xs sm:text-sm text-foreground mt-1">Solo lectura - Contenido protegido</p>
        </div>
      </div>

      {/* Corner stamps */}
      <div className="absolute top-6 left-6 opacity-[0.05] select-none">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Spanish logo" className="h-6 w-6" draggable={false} />
          <p className="text-sm font-semibold text-foreground">{userName}</p>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 opacity-[0.05] select-none">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{userName}</p>
          <img src={logo} alt="Spanish logo" className="h-6 w-6" draggable={false} />
        </div>
      </div>
    </div>
  );
}
