export function Footer() {
  return (
    <footer className="container-max pb-10 pt-10">
      <div className="hr mb-6" />
      <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-white/60 md:flex-row md:text-left">
        <div>© {new Date().getFullYear()} Beam Of Technology</div>
        <div>AI Proposal Generator • RFP → Technical Proposal</div>
      </div>
    </footer>
  );
}
