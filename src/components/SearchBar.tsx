import { FiSearch } from "react-icons/fi";

export default function SearchBar() {
  return (
    <>
      <form className="mx-auto w-4/5">
        <div className="flex items-center text-gray-400 focus-within:text-gray-600">
          <FiSearch className="pointer-events-none absolute ml-3 h-5 w-5 transition-all duration-300" />
          <input
            type="text"
            name="search"
            placeholder="Search..."
            autoComplete="off"
            className="w-full rounded-3xl px-3 py-2 pl-10 pr-3 shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </form>
    </>
  );
}
