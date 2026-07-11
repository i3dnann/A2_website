export default function AvatarCircles({ avatars, className = "" }: { avatars: string[]; className?: string }) {
  if (!avatars.length) return null;
  return <div className={`flex -space-x-3 ${className}`} aria-label="Community members">
    {avatars.slice(0, 6).map((src, index) => <img key={`${src}-${index}`} src={src} alt="Community member avatar" loading="lazy" decoding="async" className="h-9 w-9 shrink-0 rounded-full border border-orange-300/25 object-cover ring-2 ring-[#17131f] transition-transform hover:z-10 hover:-translate-y-1" />)}
  </div>;
}
