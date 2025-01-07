'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'name' | 'email' | 'created_at' | null;

const CustomTable = () => {
  const [data, setData] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>('/api/users', {
        params: {
          paginate: perPage,
          search: searchTerm || undefined,
          page: currentPage
        }
      });

      const sortedData = [...response.data.data];
      if (sortField && sortDirection) {
        sortedData.sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];
          if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      setData(sortedData);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, perPage, currentPage, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data.map(user => user.id);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕️';
  };

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
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={data.length > 0 && selectedRows.size === data.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th 
                className="p-3 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('name')}
              >
                Name {getSortIcon('name')}
              </th>
              <th 
                className="p-3 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('email')}
              >
                Email {getSortIcon('email')}
              </th>
              <th 
                className="p-3 cursor-pointer hover:text-gray-200"
                onClick={() => handleSort('created_at')}
              >
                Created At {getSortIcon('created_at')}
              </th>
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
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-400">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className="border-t border-gray-700 text-gray-300">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(user.id)}
                      onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                    />
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
          <span className="mr-4">{`${Math.min((currentPage - 1) * perPage + 1, total)}-${
            Math.min(currentPage * perPage, total)
          } of ${total}`}</span>
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