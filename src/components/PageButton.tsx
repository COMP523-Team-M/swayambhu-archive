import React from "react";
import { motion } from "framer-motion";
import {
  FiChevronsLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsRight,
} from "react-icons/fi";

interface PageButtonProps {
  howMany: number;
  total: number;
  curPage: number;
  setCurrentPage: (page: number) => void;
}

const PageButton: React.FC<PageButtonProps> = ({
  howMany,
  total,
  curPage,
  setCurrentPage,
}) => {
  const size = 5;
  const totalPage = Math.ceil(total / howMany);
  const nextPage = curPage + 1;
  const prePage = curPage - 1;

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const renderPageButton = (
    pageNum: number | string,
    icon?: React.ReactNode,
  ) => (
    <motion.button
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={() => typeof pageNum === "number" && setCurrentPage(pageNum)}
      className={`flex h-10 min-w-[40px] items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium transition-all duration-200 ${
        typeof pageNum === "number" && curPage === pageNum
          ? "bg-blue-500 text-white shadow-lg dark:bg-blue-600"
          : "bg-white/50 text-slate-700 shadow-sm hover:bg-white/80 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80"
      } ${
        typeof pageNum === "number" && curPage === pageNum
          ? ""
          : "hover:text-blue-500 dark:hover:text-blue-400"
      } `}
      disabled={
        (pageNum === "First" && curPage === 1) ||
        (pageNum === "Last" && curPage === totalPage)
      }
    >
      {icon}
      <span>{pageNum}</span>
    </motion.button>
  );

  const renderPageNumbers = () => {
    const pages = [];

    if (totalPage <= size) {
      for (let i = 1; i <= totalPage; i++) {
        pages.push(renderPageButton(i));
      }
    } else {
      for (
        let i = curPage - Math.floor(size / 2),
          temp = curPage + size - Math.floor(size / 2);
        i < temp;
        i++
      ) {
        if (i <= 0) temp++;
        if (i > 0 && i <= totalPage) {
          pages.push(renderPageButton(i));
        }
      }
    }
    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-4"
    >
      {totalPage > 0 && (
        <>
          {renderPageButton("First", <FiChevronsLeft />)}
          {prePage > 0 && renderPageButton("Prev", <FiChevronLeft />)}
          {renderPageNumbers()}
          {nextPage <= totalPage &&
            renderPageButton("Next", <FiChevronRight />)}
          {renderPageButton("Last", <FiChevronsRight />)}
        </>
      )}
    </motion.div>
  );
};

export default PageButton;
