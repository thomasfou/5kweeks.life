export default function Logo() {
  return (
    <a
      href="/"
      className="flex items-center gap-2.5 text-white no-underline"
      aria-label="5k Weeks home"
    >
      <img
        src="/favicon.svg"
        alt=""
        width={30}
        height={30}
        className="h-[30px] w-[30px] rounded-lg"
      />
      <span className="text-[17px] font-semibold tracking-tight">5k Weeks</span>
    </a>
  );
}
