import UserAvatar from "./UserAvatar";

export default function AvatarCircles({ avatars, className = "" }: { avatars: string[]; className?: string }) {
  if (!avatars.length) return null;
  return <div className={`flex -space-x-3 ${className}`} aria-label="Community members">
    {avatars.slice(0, 6).map((src, index) => <UserAvatar key={`${src}-${index}`} src={src} name="Community member" size="sm" className="ring-2 ring-[#17131f] transition-transform hover:z-10 hover:-translate-y-1" />)}
  </div>;
}
