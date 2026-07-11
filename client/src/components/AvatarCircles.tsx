import UserAvatar from "./UserAvatar";

export default function AvatarCircles({ avatars, className = "" }: { avatars: string[]; className?: string }) {
  return <div className={`flex -space-x-3 ${className}`} aria-label="Community members">
    {(avatars.length ? avatars.slice(0, 6) : ["Gotham", "Roleplay", "City", "Community"]).map((value, index) => <UserAvatar key={`${value}-${index}`} src={avatars.length ? value : undefined} name={avatars.length ? "Community member" : value} size="sm" className="ring-2 ring-[#17131f] transition-transform hover:z-10 hover:-translate-y-1" />)}
  </div>;
}
