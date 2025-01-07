import CustomTable from './components/CustomTable';

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>
      <CustomTable />
    </main>
  );
}
