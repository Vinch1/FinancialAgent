import { Chat } from './components/Chat';

function App() {
  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_32rem),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.16),_transparent_30rem)]" />
      <div className="relative h-full p-3 sm:p-4 lg:p-6">
        <div className="h-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-50 shadow-2xl shadow-slate-950/40">
          <Chat />
        </div>
      </div>
    </div>
  );
}

export default App;
