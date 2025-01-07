"use client";

import axios from "axios";
import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: User[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

const CustomTable = () => {
  const [data, setData] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://api.razzakfashion.com/?paginate=${perPage}&search=${searchTerm}`
      );
      const result: ApiResponse = await response.data;
      setData(result.data);
      setTotal(result.total);
      setCurrentPage(result.current_page);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, perPage, currentPage]);

  return (
    <div className="w-full p-4">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search area"
          className="w-full max-w-md p-2 border border-gray-300 rounded bg-transparent text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="p-3">
                <input type="checkbox" className="mr-2" />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Created At</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : (
              data.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-700 text-gray-300"
                >
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button className="text-blue-500 mr-2">Edit</button>
                    <button className="text-red-500">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center text-gray-400">
        <div className="flex items-center">
          <span className="mr-2">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="bg-transparent border border-gray-700 rounded p-1"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
        <div className="flex items-center">
          <span className="mr-4">{`${
            (currentPage - 1) * perPage + 1
          }-${Math.min(currentPage * perPage, total)} of ${total}`}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 mx-1 disabled:opacity-50"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage * perPage >= total}
            className="p-1 mx-1 disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTable;
