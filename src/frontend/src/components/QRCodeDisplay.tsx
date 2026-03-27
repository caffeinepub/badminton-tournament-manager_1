// Simple QR code display using Google Charts API
interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 128 }: QRCodeDisplayProps) {
  const encodedValue = encodeURIComponent(value);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&bgcolor=ffffff&color=000000&format=png`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
