export default function DashboardPage() {

    return (
  
      <div>
  
        <h1 className="text-3xl font-bold mb-6">
          Admin Dashboard
        </h1>
  
        <div className="grid grid-cols-4 gap-6">
  
          <div className="bg-white p-6 rounded shadow">
            Total Members
            <h2 className="text-2xl font-bold">120</h2>
          </div>
  
          <div className="bg-white p-6 rounded shadow">
            Trainers
            <h2 className="text-2xl font-bold">10</h2>
          </div>
  
          <div className="bg-white p-6 rounded shadow">
            Active Plans
            <h2 className="text-2xl font-bold">85</h2>
          </div>
  
          <div className="bg-white p-6 rounded shadow">
            Monthly Revenue
            <h2 className="text-2xl font-bold">$5000</h2>
          </div>
  
        </div>
  
      </div>
    );
  }