export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 py-10">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-silver-500">
        <p className="font-serif italic tracking-[0.15em] text-silver-600 uppercase">
          Callin Watch Care
        </p>
        <p className="mt-3">
          &copy; {new Date().getUTCFullYear()} Callin Watch Care. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
