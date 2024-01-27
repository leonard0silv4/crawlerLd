import { Pagination } from "flowbite-react";

interface PaginationProps {
  currPage: number;
  totalPages: number;
  setPage: (p: number) => void;
}

const Pages = ({ currPage, totalPages, setPage }: PaginationProps) => {
  const onPageChange = (page: number) => {
    setPage(page);
  };

  return (
    <div className="flex mt-6 overflow-x-auto sm:justify-center">
      <Pagination
        currentPage={currPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        previousLabel="Anterior"
        nextLabel="Proximo"
      />
    </div>
  );
};

export default Pages;
