export default function Header() {
  return (
    <header className="w-full bg-slate-50 py-4 shadow-sm m-auto">
      {/* fix padding here */}
      <div className="flex m-auto">
        <div className="flex justify-center items-center text-slate-600">
          {/* <RectangleStackIcon className="w-10 h-10 " /> */}
          <div className="text-bold text-2xl ml-2 ">Kanban</div>
        </div>
        <div></div>
      </div>
    </header>
  );
}
